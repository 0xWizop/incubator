import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Crypto Watchlist & Price Alerts',
    description: 'Create custom watchlists and set price alerts for your favorite cryptocurrencies. Get notified when tokens hit your target prices across all chains.',
    keywords: [
        'crypto watchlist',
        'price alerts',
        'crypto alerts',
        'token watchlist',
        'crypto notifications',
        'price tracker',
    ],
    openGraph: {
        title: 'Crypto Watchlist & Price Alerts | Incubator',
        description: 'Create custom watchlists and set price alerts for your favorite cryptocurrencies.',
    },
};

export default function WatchlistsLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return children;
}
