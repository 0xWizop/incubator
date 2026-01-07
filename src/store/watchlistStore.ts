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
const STORAGE_KEY = 'incubator_watchlist';

const saveToStorage = (watchlists: Watchlist[]) => {
    if (typeof window === 'undefined') return;
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(watchlists));
    } catch (e) {
        console.error('Failed to save watchlist locally:', e);
    }
};

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
    initialize: (userId?: string) => Promise<void>;
    reset: () => void;

    // Watchlist actions
    toggleFavorite: (userId: string | undefined, token: Omit<WatchlistToken, 'addedAt'>) => Promise<void>;
    isFavorited: (pairAddress: string) => boolean;
    addToken: (userId: string | undefined, listId: string, token: Omit<WatchlistToken, 'addedAt'>) => Promise<void>;
    removeToken: (userId: string | undefined, listId: string, pairAddress: string) => Promise<void>;
    createList: (userId: string | undefined, name: string) => Promise<void>;
    deleteList: (userId: string | undefined, listId: string) => Promise<void>;
    setActiveWatchlist: (listId: string) => void;

    // Alert actions
    addAlert: (userId: string | undefined, alert: Omit<PriceAlert, 'id' | 'userId' | 'triggered' | 'createdAt'>) => Promise<void>;
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

    // Initialize from Firebase or LocalStorage
    initialize: async (userId?: string) => {
        // Always allow re-initialization if switching from guest to user or vice versa, 
        // but simple check:
        // if (get().isInitialized && userId) return; 

        set({ isLoading: true });
        try {
            if (userId) {
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
            } else {
                // Load from local storage
                if (typeof window !== 'undefined') {
                    const stored = localStorage.getItem(STORAGE_KEY);
                    let watchlists: Watchlist[] = [];
                    if (stored) {
                        try {
                            watchlists = JSON.parse(stored);
                        } catch (e) {
                            console.error('Failed to parse local watchlist:', e);
                        }
                    }

                    // Ensure default favorites list exists
                    if (!watchlists.find(w => w.id === DEFAULT_FAVORITES_ID)) {
                        watchlists.push({
                            id: DEFAULT_FAVORITES_ID,
                            name: 'Favorites',
                            tokens: [],
                            createdAt: new Date(), // Mock FieldValue
                            updatedAt: new Date(),
                        } as any);
                    }

                    set({
                        watchlists,
                        alerts: [], // Alerts only work with auth for now
                        isInitialized: true,
                        isLoading: false,
                    });
                }
            }
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
    // Toggle favorite status
    toggleFavorite: async (userId: string | undefined, token: Omit<WatchlistToken, 'addedAt'>) => {
        const { watchlists } = get();
        const favorites = watchlists.find(w => w.id === DEFAULT_FAVORITES_ID);
        const isCurrentlyFavorited = favorites?.tokens.some(t => t.pairAddress === token.pairAddress);

        // Optimistic update
        if (isCurrentlyFavorited) {
            const newWatchlists = watchlists.map(w =>
                w.id === DEFAULT_FAVORITES_ID
                    ? { ...w, tokens: w.tokens.filter(t => t.pairAddress !== token.pairAddress) }
                    : w
            );
            set({ watchlists: newWatchlists });

            if (userId) {
                await removeFromWatchlist(userId, DEFAULT_FAVORITES_ID, token.pairAddress);
            } else {
                saveToStorage(newWatchlists);
            }
        } else {
            const newToken = { ...token, addedAt: new Date() };
            const newWatchlists = watchlists.map(w =>
                w.id === DEFAULT_FAVORITES_ID
                    ? { ...w, tokens: [...w.tokens, newToken] }
                    : w
            );
            set({ watchlists: newWatchlists });

            if (userId) {
                await addToWatchlist(userId, DEFAULT_FAVORITES_ID, token);
            } else {
                saveToStorage(newWatchlists);
            }
        }
    },

    // Check if token is favorited
    isFavorited: (pairAddress: string) => {
        const { watchlists } = get();
        const favorites = watchlists.find(w => w.id === DEFAULT_FAVORITES_ID);
        return favorites?.tokens.some(t => t.pairAddress === pairAddress) || false;
    },

    // Add token to a specific watchlist
    // Add token to a specific watchlist
    addToken: async (userId: string | undefined, listId: string, token: Omit<WatchlistToken, 'addedAt'>) => {
        const { watchlists } = get();
        const newToken = { ...token, addedAt: new Date() };

        // Optimistic update
        const newWatchlists = watchlists.map(w =>
            w.id === listId
                ? { ...w, tokens: [...w.tokens, newToken] }
                : w
        );
        set({ watchlists: newWatchlists });

        if (userId) {
            await addToWatchlist(userId, listId, token);
        } else {
            saveToStorage(newWatchlists);
        }
    },

    // Remove token from watchlist
    // Remove token from watchlist
    removeToken: async (userId: string | undefined, listId: string, pairAddress: string) => {
        const { watchlists } = get();

        // Optimistic update
        const newWatchlists = watchlists.map(w =>
            w.id === listId
                ? { ...w, tokens: w.tokens.filter(t => t.pairAddress !== pairAddress) }
                : w
        );
        set({ watchlists: newWatchlists });

        if (userId) {
            await removeFromWatchlist(userId, listId, pairAddress);
        } else {
            saveToStorage(newWatchlists);
        }
    },

    // Create new watchlist
    createList: async (userId: string | undefined, name: string) => {
        if (!userId) return; // Only support authenticated users for now
        const result = await createWatchlistDb(userId, name);
        if (result) {
            set({ watchlists: [...get().watchlists, result] });
        }
    },

    // Delete watchlist
    deleteList: async (userId: string | undefined, listId: string) => {
        if (listId === DEFAULT_FAVORITES_ID) return;

        const { watchlists, activeWatchlistId } = get();

        // Optimistic update
        set({
            watchlists: watchlists.filter(w => w.id !== listId),
            activeWatchlistId: activeWatchlistId === listId ? DEFAULT_FAVORITES_ID : activeWatchlistId,
        });

        if (userId) {
            await deleteWatchlistDb(userId, listId);
        } else {
            saveToStorage(get().watchlists);
        }
    },

    // Set active watchlist
    setActiveWatchlist: (listId: string) => {
        set({ activeWatchlistId: listId });
    },

    // Add price alert
    addAlert: async (userId: string | undefined, alert: Omit<PriceAlert, 'id' | 'userId' | 'triggered' | 'createdAt'>) => {
        if (!userId) return; // Alerts require auth
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
