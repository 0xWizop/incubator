'use client';

import { ReactNode } from 'react';
import { Sidebar, Header, BottomTabNav } from '@/components/layout';

export default function AppLayout({
    children,
}: {
    children: ReactNode;
}) {
    return (
        <div className="flex h-screen overflow-hidden">
            {/* Sidebar */}
            <Sidebar />

            {/* Main content area - offset for sidebar on desktop */}
            <div className="flex-1 flex flex-col min-w-0 lg:ml-64">
                {/* Header */}
                <Header />

                {/* Page content - add padding bottom on mobile for bottom nav */}
                <main className="flex-1 overflow-y-auto overflow-x-hidden overscroll-contain bg-[var(--background)] pb-16 lg:pb-0">
                    {children}
                </main>
            </div>

            {/* Mobile bottom navigation */}
            <BottomTabNav />
        </div>
    );
}
