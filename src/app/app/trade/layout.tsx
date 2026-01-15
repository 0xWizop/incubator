import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Trade Crypto - Real-time Charts & Instant Swaps',
    description: 'Trade any cryptocurrency with real-time TradingView charts, technical indicators, and instant DEX swaps. Best prices across Solana, Ethereum, Base & Arbitrum.',
    keywords: [
        'crypto trading',
        'trade crypto',
        'dex trading',
        'swap crypto',
        'trading charts',
        'crypto charts',
        'buy crypto',
        'sell crypto',
        'defi trading',
    ],
    openGraph: {
        title: 'Trade Crypto - Live Charts & Swaps | Incubator',
        description: 'Trade any cryptocurrency with real-time charts and instant DEX swaps. Best prices across all chains.',
    },
};

export default function TradeLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return children;
}
