'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { ChainId, Block, Transaction } from '@/types';
import * as alchemyService from '@/lib/services/alchemy';
import * as solanaService from '@/lib/services/solana';
import {
    Box,
    ArrowRightLeft,
    ArrowLeft,
    RefreshCw,
    ArrowRight,
    ChevronLeft,
    ChevronRight,
} from 'lucide-react';
import { clsx } from 'clsx';
import { TimeAgo } from '@/components/ui/TimeAgo';

// Chain configuration
const CHAIN_CONFIG: Record<string, { name: string; logo: string; color: string; nativeSymbol: string }> = {
    solana: { name: 'Solana', logo: 'https://i.imgur.com/xp7PYKk.png', color: '#9945FF', nativeSymbol: 'SOL' },
    ethereum: { name: 'Ethereum', logo: 'https://i.imgur.com/NKQlhQj.png', color: '#627EEA', nativeSymbol: 'ETH' },
    base: { name: 'Base', logo: 'https://i.imgur.com/zn5hpMs.png', color: '#0052FF', nativeSymbol: 'ETH' },
    arbitrum: { name: 'Arbitrum', logo: 'https://i.imgur.com/jmOXWlA.png', color: '#28a0f0', nativeSymbol: 'ETH' },
};

const VALID_CHAINS = ['solana', 'ethereum', 'base', 'arbitrum'];

interface ChainExplorerClientProps {
    chain: string;
}

export default function ChainExplorerClient({ chain }: ChainExplorerClientProps) {
    const chainId = VALID_CHAINS.includes(chain) ? (chain as ChainId) : null;
    const chainConfig = chainId ? CHAIN_CONFIG[chainId] : null;

    const [blocks, setBlocks] = useState<Block[]>([]);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [latestBlockNumber, setLatestBlockNumber] = useState<number>(0);
    const blocksPerPage = 20;

    const fetchData = useCallback(async (page: number = 1) => {
        if (!chainId) return;

        setLoading(true);
        try {
            let fetchedBlocks: Block[] = [];
            let fetchedTxs: Transaction[] = [];

            if (chainId === 'solana') {
                // Solana: fetch recent blocks
                fetchedBlocks = await solanaService.getLatestBlocks(blocksPerPage);
                fetchedTxs = await solanaService.getLatestTransactions(10);
                if (fetchedBlocks.length > 0) {
                    setLatestBlockNumber(fetchedBlocks[0].number);
                }
            } else {
                // EVM chains: fetch blocks starting from latest or paginated
                const latestNum = await alchemyService.getLatestBlockNumber(chainId);
                setLatestBlockNumber(latestNum);

                // Calculate which blocks to fetch based on page
                const startBlock = latestNum - (page - 1) * blocksPerPage;
                const blockNumbers = Array.from(
                    { length: blocksPerPage },
                    (_, i) => startBlock - i
                ).filter(n => n > 0);

                const blockPromises = blockNumbers.map(num =>
                    alchemyService.getBlock(chainId, num)
                );
                const blockResults = await Promise.all(blockPromises);
                fetchedBlocks = blockResults.filter((b): b is Block => b !== null);

                // Get recent transactions
                fetchedTxs = await alchemyService.getLatestTransactions(chainId, 10);
            }

            setBlocks(fetchedBlocks);
            setTransactions(fetchedTxs);
        } catch (error) {
            console.error('Error fetching chain data:', error);
        } finally {
            setLoading(false);
        }
    }, [chainId]);

    useEffect(() => {
        fetchData(currentPage);
    }, [fetchData, currentPage]);

    if (!chainId || !chainConfig) {
        return (
            <div className="p-6 text-center">
                <p className="text-[var(--foreground-muted)] mb-4">Invalid chain selected</p>
                <Link href="/app/explorer/" className="btn btn-primary">
                    <ArrowLeft className="w-4 h-4" />
                    Back to Explorer
                </Link>
            </div>
        );
    }

    const totalPages = chainId === 'solana' ? 1 : Math.min(50, Math.ceil(latestBlockNumber / blocksPerPage));

    return (
        <div className="p-2 sm:p-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-4">
                    <Link
                        href="/app/explorer/"
                        className="p-2 rounded-lg hover:bg-[var(--background-tertiary)] transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5 text-[var(--foreground-muted)]" />
                    </Link>
                    <div className="flex items-center gap-3">
                        <div
                            className="w-12 h-12 rounded-xl flex items-center justify-center"
                            style={{ backgroundColor: `${chainConfig.color}20` }}
                        >
                            <img
                                src={chainConfig.logo}
                                alt={chainConfig.name}
                                className="w-8 h-8 rounded-full"
                            />
                        </div>
                        <div>
                            <h1 className="text-xl sm:text-2xl font-bold">{chainConfig.name} Explorer</h1>
                            <p className="text-sm text-[var(--foreground-muted)]">
                                Latest Block: <span className="font-mono text-[var(--primary)]">
                                    {latestBlockNumber.toLocaleString()}
                                </span>
                            </p>
                        </div>
                    </div>
                </div>
                <button
                    onClick={() => fetchData(currentPage)}
                    className="btn btn-secondary"
                    disabled={loading}
                >
                    <RefreshCw className={clsx('w-4 h-4', loading && 'animate-spin')} />
                    Refresh
                </button>
            </div>

            {/* Main Content Grid */}
            <div className="grid lg:grid-cols-3 gap-6">
                {/* Blocks Section - Takes 2 columns */}
                <div className="lg:col-span-2 card p-0 flex flex-col">
                    <div className="flex items-center justify-between p-4 border-b border-[var(--border)]">
                        <h2 className="font-bold flex items-center gap-2">
                            <Box className="w-5 h-5 text-[var(--primary)]" />
                            Blocks
                        </h2>
                        <span className="text-xs text-[var(--foreground-muted)]">
                            Page {currentPage} of {totalPages}
                        </span>
                    </div>

                    <div className="flex-1 overflow-auto">
                        {loading ? (
                            <div className="p-8 text-center text-[var(--foreground-muted)]">
                                Loading blocks...
                            </div>
                        ) : (
                            <table className="table w-full text-sm">
                                <thead>
                                    <tr>
                                        <th className="text-left pl-4">Block</th>
                                        <th className="text-left">Age</th>
                                        <th className="text-left hidden sm:table-cell">Txns</th>
                                        <th className="text-left hidden md:table-cell">Miner/Validator</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {blocks.map((block) => (
                                        <tr key={block.number} className="hover:bg-[var(--background-tertiary)]">
                                            <td className="pl-4">
                                                <Link
                                                    href={`/app/explorer/detail/?type=block&id=${block.number}&chain=${chainId}`}
                                                    className="font-mono text-[var(--primary)] hover:underline"
                                                >
                                                    {block.number.toLocaleString()}
                                                </Link>
                                            </td>
                                            <td className="text-[var(--foreground-muted)]">
                                                <TimeAgo timestamp={block.timestamp} />
                                            </td>
                                            <td className="hidden sm:table-cell">{block.transactions}</td>
                                            <td className="font-mono text-xs hidden md:table-cell">
                                                {block.miner ? `${block.miner.slice(0, 8)}...${block.miner.slice(-6)}` : '-'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-center gap-2 p-4 border-t border-[var(--border)]">
                            <button
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1 || loading}
                                className="btn btn-secondary px-3 py-1.5 text-sm"
                            >
                                <ChevronLeft className="w-4 h-4" />
                                Prev
                            </button>
                            <span className="text-sm text-[var(--foreground-muted)] px-4">
                                {currentPage} / {totalPages}
                            </span>
                            <button
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages || loading}
                                className="btn btn-secondary px-3 py-1.5 text-sm"
                            >
                                Next
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    )}
                </div>

                {/* Recent Transactions - Takes 1 column */}
                <div className="card p-0 flex flex-col max-h-[600px]">
                    <div className="flex items-center justify-between p-4 border-b border-[var(--border)]">
                        <h2 className="font-bold flex items-center gap-2">
                            <ArrowRightLeft className="w-5 h-5 text-[var(--primary)]" />
                            Recent Txns
                        </h2>
                    </div>

                    <div className="flex-1 overflow-auto">
                        {loading ? (
                            <div className="p-8 text-center text-[var(--foreground-muted)]">
                                Loading transactions...
                            </div>
                        ) : transactions.length === 0 ? (
                            <div className="p-8 text-center text-[var(--foreground-muted)]">
                                No recent transactions
                            </div>
                        ) : (
                            <div className="divide-y divide-[var(--border)]">
                                {transactions.map((tx) => (
                                    <Link
                                        key={tx.hash}
                                        href={`/app/explorer/detail/?type=tx&id=${tx.hash}&chain=${chainId}`}
                                        className="block p-3 hover:bg-[var(--background-tertiary)] transition-colors"
                                    >
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="font-mono text-xs text-[var(--primary)] truncate max-w-[150px]">
                                                {tx.hash.slice(0, 10)}...{tx.hash.slice(-6)}
                                            </span>
                                            <span className="text-[10px] text-[var(--foreground-muted)]">
                                                <TimeAgo timestamp={tx.timestamp} />
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between text-[10px] text-[var(--foreground-muted)]">
                                            <div className="flex items-center gap-1 font-mono">
                                                <span>{tx.from.slice(0, 6)}...</span>
                                                <ArrowRight className="w-2.5 h-2.5" />
                                                <span>{tx.to ? tx.to.slice(0, 6) + '...' : 'Contract'}</span>
                                            </div>
                                            <span className="font-mono text-[var(--foreground)]">
                                                {parseFloat(tx.value).toFixed(4)} {chainConfig.nativeSymbol}
                                            </span>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
