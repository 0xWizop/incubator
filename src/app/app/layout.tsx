'use client';

import { ReactNode, useEffect } from 'react';
import { Sidebar, Header, BottomTabNav } from '@/components/layout';
import { useAuth } from '@/context/AuthContext';
import { useWatchlistStore } from '@/store';
import { useAlertMonitor } from '@/hooks/useAlertMonitor';

export default function AppLayout({
    children,
}: {
    children: ReactNode;
}) {
    const { firebaseUser } = useAuth();
    const { initialize, isInitialized } = useWatchlistStore();

    // Enable price alert monitoring
    useAlertMonitor();

    // Initialize watchlist store globally when user is authenticated
    useEffect(() => {
        // Only initialize if not already done or if user changes
        if (firebaseUser?.uid) {
            // Always re-initialize for authenticated users to ensure data is fresh
            initialize(firebaseUser.uid);
        } else if (!isInitialized) {
            // Initialize with localStorage for guests
            initialize();
        }
    }, [firebaseUser?.uid]);

    return (
        <div className="flex h-screen overflow-hidden">
            {/* Sidebar */}
            <Sidebar />

            {/* Main content area - offset for sidebar on desktop */}
            <div className="flex-1 flex flex-col min-w-0 lg:ml-64">
                {/* Header */}
                <Header />

                {/* Page content - pages must handle their own scrolling */}
                <main className="flex-1 overflow-hidden bg-[var(--background)] pb-16 lg:pb-0">
                    {children}
                </main>
            </div>

            {/* Mobile bottom navigation */}
            <BottomTabNav />
        </div>
    );
}
