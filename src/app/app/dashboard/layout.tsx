import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Trading Dashboard - Portfolio Analytics & P&L',
    description: 'Track your crypto trading performance with advanced P&L analytics, volume statistics, and trade history. Export transactions for tax reporting.',
    keywords: [
        'crypto dashboard',
        'trading dashboard',
        'portfolio tracker',
        'pnl tracker',
        'crypto analytics',
        'trade history',
        'crypto tax report',
    ],
    openGraph: {
        title: 'Trading Dashboard | Incubator Protocol',
        description: 'Track your crypto trading performance with advanced P&L analytics and portfolio tracking.',
    },
};

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return children;
}
