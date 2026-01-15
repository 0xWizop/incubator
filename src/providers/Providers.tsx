'use client';

import { ReactNode } from 'react';
import { WalletProvider } from '@/context/WalletProvider';
import { AuthProvider } from '@/context/AuthContext';
import { Toaster } from 'sonner';

import { ThemeProvider as NextThemesProvider } from 'next-themes';

interface ProvidersProps {
    children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
    return (
        <NextThemesProvider attribute="data-theme" defaultTheme="dark" enableSystem={false}>
            <AuthProvider>
                <WalletProvider>
                    {children}
                    <Toaster richColors position="bottom-right" theme="dark" />
                </WalletProvider>
            </AuthProvider>
        </NextThemesProvider>
    );
}
