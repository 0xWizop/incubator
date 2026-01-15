import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Crypto Token Screener - Find Trending Coins',
    description: 'Discover trending cryptocurrencies across Solana, Ethereum, Base & Arbitrum. Real-time prices, volume, liquidity, and 24h changes. Find the next 100x token.',
    keywords: [
        'crypto screener',
        'token scanner',
        'trending crypto',
        'defi tokens',
        'solana tokens',
        'ethereum tokens',
        'new crypto coins',
        'crypto gainers',
        'crypto losers',
    ],
    openGraph: {
        title: 'Crypto Token Screener - Find Trending Coins | Incubator',
        description: 'Discover trending cryptocurrencies across Solana, Ethereum, Base & Arbitrum. Real-time prices, volume, and liquidity data.',
    },
};

export default function ScreenerLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return children;
}
