import { Suspense } from 'react';
import ChainExplorerClient from '@/components/explorer/ChainExplorerClient';

const VALID_CHAINS = ['solana', 'ethereum', 'base', 'arbitrum'];

export function generateStaticParams() {
    return VALID_CHAINS.map((chain) => ({ chain }));
}

interface PageProps {
    params: Promise<{ chain: string }>;
}

export default async function ChainExplorerPage({ params }: PageProps) {
    const { chain } = await params;

    return (
        <Suspense fallback={<div className="p-6 text-center">Loading chain explorer...</div>}>
            <ChainExplorerClient chain={chain} />
        </Suspense>
    );
}
