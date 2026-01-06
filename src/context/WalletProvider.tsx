'use client';

import { ReactNode, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import { WalletModal } from '@/components/wallet';
import { useWalletStore } from '@/store/walletStore';
import { useAuth } from './AuthContext';
import { addWalletToUser } from '@/lib/firebase/collections';

interface WalletProviderProps {
    children: ReactNode;
}

function WalletInitializer() {
    useEffect(() => {
        // Initialize wallet state on mount
        useWalletStore.getState().initialize();
    }, []);

    return null;
}

function WalletLinker() {
    const { user } = useAuth();
    const { activeWallet } = useWalletStore();

    useEffect(() => {
        if (user && activeWallet) {
            addWalletToUser(user.address, activeWallet.address);
        }
    }, [user, activeWallet]);

    return null;
}

export function WalletProvider({ children }: WalletProviderProps) {
    const [queryClient] = useState(() => new QueryClient());

    return (
        <QueryClientProvider client={queryClient}>
            <WalletInitializer />
            <WalletLinker />
            {children}
            <WalletModal />
        </QueryClientProvider>
    );
}
