import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Crypto Market Heatmap - Visualize Market Trends',
    description: 'Interactive crypto market heatmap showing real-time performance of top cryptocurrencies and sectors. Identify market trends at a glance across all chains.',
    keywords: [
        'crypto heatmap',
        'market heatmap',
        'crypto sectors',
        'market visualization',
        'crypto performance',
        'bitcoin heatmap',
        'altcoin heatmap',
        'defi heatmap',
    ],
    openGraph: {
        title: 'Crypto Market Heatmap | Incubator Protocol',
        description: 'Interactive crypto market heatmap showing real-time performance of top cryptocurrencies and sectors.',
    },
};

export default function HeatmapLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return children;
}
