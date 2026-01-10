'use client';

import { create } from 'zustand';
import { PortfolioSnapshot, ChainId } from '@/types';
import {
    createSnapshot,
    getSnapshots,
    getLatestSnapshot,
    getSnapshotAtDate,
    deleteOldSnapshots,
} from '@/lib/firebase/collections-extended';

interface PortfolioState {
    // State
    snapshots: PortfolioSnapshot[];
    selectedDate: Date | null;
    currentSnapshot: PortfolioSnapshot | null;
    isLoading: boolean;
    error: string | null;

    // Actions
    loadSnapshots: (userId: string, startDate?: Date, endDate?: Date) => Promise<void>;
    captureSnapshot: (
        userId: string,
        walletAddress: string,
        chainId: ChainId,
        holdings: any[]
    ) => Promise<boolean>;
    selectDate: (date: Date | null) => void;
    getSnapshotForDate: (userId: string, date: Date, chainId?: ChainId) => Promise<void>;
    getLatest: (userId: string, chainId?: ChainId) => Promise<void>;
    cleanup: (userId: string, daysToKeep?: number) => Promise<number>;
    reset: () => void;
}

export const usePortfolioStore = create<PortfolioState>()((set, get) => ({
    // Initial state
    snapshots: [],
    selectedDate: null,
    currentSnapshot: null,
    isLoading: false,
    error: null,

    // Load snapshots for a user
    loadSnapshots: async (userId, startDate?, endDate?) => {
        set({ isLoading: true, error: null });
        try {
            const snapshots = await getSnapshots(userId, 90, startDate, endDate);
            set({
                snapshots,
                isLoading: false,
            });
        } catch (error: any) {
            set({
                error: error.message || 'Failed to load snapshots',
                isLoading: false,
            });
        }
    },

    // Capture a new snapshot
    captureSnapshot: async (userId, walletAddress, chainId, holdings) => {
        set({ isLoading: true, error: null });
        try {
            const snapshot = await createSnapshot(userId, walletAddress, chainId, holdings);

            if (!snapshot) {
                set({
                    error: 'Failed to capture snapshot',
                    isLoading: false,
                });
                return false;
            }

            // Add to snapshots list
            set({
                snapshots: [snapshot, ...get().snapshots],
                currentSnapshot: snapshot,
                isLoading: false,
            });

            return true;
        } catch (error: any) {
            set({
                error: error.message || 'Failed to capture snapshot',
                isLoading: false,
            });
            return false;
        }
    },

    // Select a date for viewing
    selectDate: (date) => {
        set({ selectedDate: date });
    },

    // Get snapshot for a specific date
    getSnapshotForDate: async (userId, date, chainId?) => {
        set({ isLoading: true, error: null });
        try {
            const snapshot = await getSnapshotAtDate(userId, date, chainId);
            set({
                currentSnapshot: snapshot,
                selectedDate: date,
                isLoading: false,
            });
        } catch (error: any) {
            set({
                error: error.message || 'Failed to get snapshot',
                isLoading: false,
            });
        }
    },

    // Get latest snapshot
    getLatest: async (userId, chainId?) => {
        set({ isLoading: true, error: null });
        try {
            const snapshot = await getLatestSnapshot(userId, chainId);
            set({
                currentSnapshot: snapshot,
                isLoading: false,
            });
        } catch (error: any) {
            set({
                error: error.message || 'Failed to get latest snapshot',
                isLoading: false,
            });
        }
    },

    // Cleanup old snapshots
    cleanup: async (userId, daysToKeep = 90) => {
        try {
            const deleted = await deleteOldSnapshots(userId, daysToKeep);

            // Refresh snapshots after cleanup
            await get().loadSnapshots(userId);

            return deleted;
        } catch (error) {
            console.error('Error cleaning up snapshots:', error);
            return 0;
        }
    },

    // Reset state
    reset: () => {
        set({
            snapshots: [],
            selectedDate: null,
            currentSnapshot: null,
            isLoading: false,
            error: null,
        });
    },
}));
