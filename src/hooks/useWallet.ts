'use client';

import { useWalletStore } from '@/store/walletStore';

/**
 * Shared wallet hook for accessing wallet state and actions
 * Use this instead of defining local useWallet functions in each page
 */
export function useWallet() {
    const { activeWallet, isUnlocked, openModal } = useWalletStore();

    return {
        address: activeWallet?.address || null,
        isConnected: isUnlocked && !!activeWallet,
        connect: () => openModal(),
    };
}
