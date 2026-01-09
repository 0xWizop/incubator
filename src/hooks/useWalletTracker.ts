'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { TrackedWallet, WalletActivity, ChainId } from '@/types';
import {
    getTrackedWallets,
    addTrackedWallet as addTrackedWalletDb,
    deleteTrackedWallet as deleteTrackedWalletDb,
    updateTrackedWallet as updateTrackedWalletDb,
} from '@/lib/firebase/collections';

const POLL_INTERVAL = 60000; // Check every 60 seconds
const ACTIVITY_STORAGE_KEY = 'wallet_tracker_activity';

// Get wallet activity from DexScreener
async function fetchWalletActivity(
    address: string,
    chainId: ChainId
): Promise<WalletActivity[]> {
    try {
        // DexScreener doesn't have a direct wallet endpoint, 
        // so we'll use a workaround with the profile API
        // For now, return mock data - in production, use Alchemy or similar
        return [];
    } catch (error) {
        console.error('Error fetching wallet activity:', error);
        return [];
    }
}

// Show browser notification
function showWalletNotification(wallet: TrackedWallet, activity: WalletActivity) {
    if (typeof window === 'undefined') return;
    if (!('Notification' in window)) return;
    if (Notification.permission !== 'granted') return;

    const actionText = activity.type === 'buy' || activity.type === 'swap'
        ? `bought ${activity.tokenOut?.symbol || 'token'}`
        : `sold ${activity.tokenIn?.symbol || 'token'}`;

    const notification = new Notification(`🔔 ${wallet.name} Activity`, {
        body: `${wallet.name} ${actionText} for $${activity.totalUsd.toLocaleString()}`,
        icon: '/icon.png',
        tag: `wallet-${activity.hash}`,
        requireInteraction: false,
    });

    notification.onclick = () => {
        window.focus();
        notification.close();
    };

    setTimeout(() => notification.close(), 10000);
}

interface WalletTrackerState {
    wallets: TrackedWallet[];
    activities: WalletActivity[];
    isLoading: boolean;
    error: string | null;
}

export function useWalletTracker() {
    const { firebaseUser } = useAuth();
    const [state, setState] = useState<WalletTrackerState>({
        wallets: [],
        activities: [],
        isLoading: true,
        error: null,
    });
    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const lastSeenHashesRef = useRef<Set<string>>(new Set());

    // Load wallets from Firestore
    const loadWallets = useCallback(async () => {
        if (!firebaseUser?.uid) {
            setState(s => ({ ...s, wallets: [], isLoading: false }));
            return;
        }

        try {
            const wallets = await getTrackedWallets(firebaseUser.uid);
            setState(s => ({ ...s, wallets, isLoading: false }));
        } catch (error) {
            console.error('Error loading tracked wallets:', error);
            setState(s => ({ ...s, error: 'Failed to load wallets', isLoading: false }));
        }
    }, [firebaseUser?.uid]);

    // Add a new wallet
    const addWallet = useCallback(async (
        address: string,
        name: string,
        chainId: ChainId,
        notifyOnActivity = true
    ) => {
        if (!firebaseUser?.uid) return null;

        const result = await addTrackedWalletDb(firebaseUser.uid, {
            address,
            name,
            chainId,
            notifyOnActivity,
        });

        if (result) {
            setState(s => ({ ...s, wallets: [result, ...s.wallets] }));
        }

        return result;
    }, [firebaseUser?.uid]);

    // Remove a wallet
    const removeWallet = useCallback(async (walletId: string) => {
        const success = await deleteTrackedWalletDb(walletId);
        if (success) {
            setState(s => ({ ...s, wallets: s.wallets.filter(w => w.id !== walletId) }));
        }
        return success;
    }, []);

    // Update wallet
    const updateWallet = useCallback(async (
        walletId: string,
        updates: { name?: string; isActive?: boolean; notifyOnActivity?: boolean }
    ) => {
        const success = await updateTrackedWalletDb(walletId, updates);
        if (success) {
            setState(s => ({
                ...s,
                wallets: s.wallets.map(w => w.id === walletId ? { ...w, ...updates } : w)
            }));
        }
        return success;
    }, []);

    // Check for new activity
    const checkActivity = useCallback(async () => {
        const activeWallets = state.wallets.filter(w => w.isActive);
        if (activeWallets.length === 0) return;

        const allActivities: WalletActivity[] = [];

        for (const wallet of activeWallets) {
            const activities = await fetchWalletActivity(wallet.address, wallet.chainId);

            // Check for new activities
            for (const activity of activities) {
                if (!lastSeenHashesRef.current.has(activity.hash)) {
                    lastSeenHashesRef.current.add(activity.hash);
                    allActivities.push(activity);

                    // Show notification if enabled AND activity is a swap/trade
                    // Explicitly ignore vanilla transfers (send/receive) for notifications
                    if (wallet.notifyOnActivity && ['swap', 'buy', 'sell'].includes(activity.type)) {
                        showWalletNotification(wallet, activity);
                    }
                }
            }
        }

        if (allActivities.length > 0) {
            setState(s => ({
                ...s,
                activities: [...allActivities, ...s.activities].slice(0, 50) // Keep last 50
            }));
            console.log(`👁️ ${allActivities.length} new wallet activity detected`);
        }
    }, [state.wallets]);

    // Load on mount
    useEffect(() => {
        loadWallets();
    }, [loadWallets]);

    // Poll for activity
    useEffect(() => {
        if (state.wallets.length > 0) {
            checkActivity();
            intervalRef.current = setInterval(checkActivity, POLL_INTERVAL);
        }

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, [state.wallets, checkActivity]);

    // Request notification permission
    useEffect(() => {
        if (typeof window !== 'undefined' && 'Notification' in window) {
            if (Notification.permission === 'default') {
                Notification.requestPermission();
            }
        }
    }, []);

    return {
        ...state,
        addWallet,
        removeWallet,
        updateWallet,
        refresh: loadWallets,
    };
}
