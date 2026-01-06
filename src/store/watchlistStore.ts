'use client';

import { create } from 'zustand';
import { Watchlist, WatchlistToken, PriceAlert, ChainId } from '@/types';
import {
    getWatchlists,
    addToWatchlist,
    removeFromWatchlist,
    createWatchlist as createWatchlistDb,
    deleteWatchlist as deleteWatchlistDb,
    getAlerts,
    createAlert as createAlertDb,
    deleteAlert as deleteAlertDb,
} from '@/lib/firebase/collections';

const DEFAULT_FAVORITES_ID = 'favorites';

interface WatchlistState {
    // State
    watchlists: Watchlist[];
    alerts: PriceAlert[];
    isLoading: boolean;
    isInitialized: boolean;
    activeWatchlistId: string;
    isPanelOpen: boolean;
    activeTab: 'favorites' | 'watchlists' | 'alerts';

    // Actions
    initialize: (userId: string) => Promise<void>;
    reset: () => void;

    // Watchlist actions
    toggleFavorite: (userId: string, token: Omit<WatchlistToken, 'addedAt'>) => Promise<void>;
    isFavorited: (pairAddress: string) => boolean;
    addToken: (userId: string, listId: string, token: Omit<WatchlistToken, 'addedAt'>) => Promise<void>;
    removeToken: (userId: string, listId: string, pairAddress: string) => Promise<void>;
    createList: (userId: string, name: string) => Promise<void>;
    deleteList: (userId: string, listId: string) => Promise<void>;
    setActiveWatchlist: (listId: string) => void;

    // Alert actions
    addAlert: (userId: string, alert: Omit<PriceAlert, 'id' | 'userId' | 'triggered' | 'createdAt'>) => Promise<void>;
    removeAlert: (alertId: string) => Promise<void>;

    // Panel controls
    openPanel: (tab?: 'favorites' | 'watchlists' | 'alerts') => void;
    closePanel: () => void;
    setActiveTab: (tab: 'favorites' | 'watchlists' | 'alerts') => void;
}

export const useWatchlistStore = create<WatchlistState>()((set, get) => ({
    // Initial state
    watchlists: [],
    alerts: [],
    isLoading: false,
    isInitialized: false,
    activeWatchlistId: DEFAULT_FAVORITES_ID,
    isPanelOpen: false,
    activeTab: 'favorites',

    // Initialize from Firebase
    initialize: async (userId: string) => {
        if (get().isInitialized) return;

        set({ isLoading: true });
        try {
            const [watchlists, alerts] = await Promise.all([
                getWatchlists(userId),
                getAlerts(userId),
            ]);

            set({
                watchlists,
                alerts,
                isInitialized: true,
                isLoading: false,
            });
        } catch (error) {
            console.error('Error initializing watchlist store:', error);
            set({ isLoading: false });
        }
    },

    // Reset state on logout
    reset: () => {
        set({
            watchlists: [],
            alerts: [],
            isLoading: false,
            isInitialized: false,
            activeWatchlistId: DEFAULT_FAVORITES_ID,
            isPanelOpen: false,
            activeTab: 'favorites',
        });
    },

    // Toggle favorite status
    toggleFavorite: async (userId: string, token: Omit<WatchlistToken, 'addedAt'>) => {
        const { watchlists } = get();
        const favorites = watchlists.find(w => w.id === DEFAULT_FAVORITES_ID);
        const isCurrentlyFavorited = favorites?.tokens.some(t => t.pairAddress === token.pairAddress);

        // Optimistic update
        if (isCurrentlyFavorited) {
            set({
                watchlists: watchlists.map(w =>
                    w.id === DEFAULT_FAVORITES_ID
                        ? { ...w, tokens: w.tokens.filter(t => t.pairAddress !== token.pairAddress) }
                        : w
                ),
            });
            await removeFromWatchlist(userId, DEFAULT_FAVORITES_ID, token.pairAddress);
        } else {
            const newToken = { ...token, addedAt: new Date() };
            set({
                watchlists: watchlists.map(w =>
                    w.id === DEFAULT_FAVORITES_ID
                        ? { ...w, tokens: [...w.tokens, newToken] }
                        : w
                ),
            });
            await addToWatchlist(userId, DEFAULT_FAVORITES_ID, token);
        }
    },

    // Check if token is favorited
    isFavorited: (pairAddress: string) => {
        const { watchlists } = get();
        const favorites = watchlists.find(w => w.id === DEFAULT_FAVORITES_ID);
        return favorites?.tokens.some(t => t.pairAddress === pairAddress) || false;
    },

    // Add token to a specific watchlist
    addToken: async (userId: string, listId: string, token: Omit<WatchlistToken, 'addedAt'>) => {
        const { watchlists } = get();
        const newToken = { ...token, addedAt: new Date() };

        // Optimistic update
        set({
            watchlists: watchlists.map(w =>
                w.id === listId
                    ? { ...w, tokens: [...w.tokens, newToken] }
                    : w
            ),
        });

        await addToWatchlist(userId, listId, token);
    },

    // Remove token from watchlist
    removeToken: async (userId: string, listId: string, pairAddress: string) => {
        const { watchlists } = get();

        // Optimistic update
        set({
            watchlists: watchlists.map(w =>
                w.id === listId
                    ? { ...w, tokens: w.tokens.filter(t => t.pairAddress !== pairAddress) }
                    : w
            ),
        });

        await removeFromWatchlist(userId, listId, pairAddress);
    },

    // Create new watchlist
    createList: async (userId: string, name: string) => {
        const result = await createWatchlistDb(userId, name);
        if (result) {
            set({ watchlists: [...get().watchlists, result] });
        }
    },

    // Delete watchlist
    deleteList: async (userId: string, listId: string) => {
        if (listId === DEFAULT_FAVORITES_ID) return;

        const { watchlists, activeWatchlistId } = get();

        // Optimistic update
        set({
            watchlists: watchlists.filter(w => w.id !== listId),
            activeWatchlistId: activeWatchlistId === listId ? DEFAULT_FAVORITES_ID : activeWatchlistId,
        });

        await deleteWatchlistDb(userId, listId);
    },

    // Set active watchlist
    setActiveWatchlist: (listId: string) => {
        set({ activeWatchlistId: listId });
    },

    // Add price alert
    addAlert: async (userId: string, alert: Omit<PriceAlert, 'id' | 'userId' | 'triggered' | 'createdAt'>) => {
        const result = await createAlertDb(userId, alert);
        if (result) {
            set({ alerts: [result, ...get().alerts] });
        }
    },

    // Remove alert
    removeAlert: async (alertId: string) => {
        const { alerts } = get();

        // Optimistic update
        set({ alerts: alerts.filter(a => a.id !== alertId) });

        await deleteAlertDb(alertId);
    },

    // Panel controls
    openPanel: (tab = 'favorites') => {
        set({ isPanelOpen: true, activeTab: tab });
    },

    closePanel: () => {
        set({ isPanelOpen: false });
    },

    setActiveTab: (tab) => {
        set({ activeTab: tab });
    },
}));
