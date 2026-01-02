'use client';

import { ReactNode, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import { WalletModal } from '@/components/wallet';
import { useWalletStore } from '@/store/walletStore';

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

export function WalletProvider({ children }: WalletProviderProps) {
    const [queryClient] = useState(() => new QueryClient());

    return (
        <QueryClientProvider client={queryClient}>
            <WalletInitializer />
            {children}
            <WalletModal />
        </QueryClientProvider>
    );
}
