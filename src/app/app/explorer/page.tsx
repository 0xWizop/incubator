'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/store';
import { Block, Transaction, ChainId } from '@/types';
import * as alchemyService from '@/lib/services/alchemy';
import * as solanaService from '@/lib/services/solana';
import {
    Compass,
    Box,
    ArrowRightLeft,
    Search,
    RefreshCw,
    ExternalLink,
    Clock,
    Layers,
    ArrowRight,
} from 'lucide-react';
import { clsx } from 'clsx';
import { formatDistanceToNow } from 'date-fns';
import { TimeAgo } from '@/components/ui/TimeAgo';
import { useCryptoPrices } from '@/hooks/useCryptoPrices';
import { formatCurrency } from '@/lib/utils/format';

import { Suspense } from 'react';
import { LoadingSpinner } from '@/components/ui/Loading';

export default function ExplorerPage() {
    return (
        <Suspense fallback={<LoadingSpinner fullHeight size="lg" text="Loading explorer..." />}>
            <ExplorerContent />
        </Suspense>
    );
}

function ExplorerContent() {
    const router = useRouter();
    const { getPriceForChain } = useCryptoPrices();
    const { selectedChains } = useAppStore();
    const [blocks, setBlocks] = useState<Block[]>([]);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    // Search Dropdown State
    const [showDropdown, setShowDropdown] = useState(false);
    const [searchResults, setSearchResults] = useState<{ chain: ChainId; block: number }[]>([]);
    const [latestHeights, setLatestHeights] = useState<Record<ChainId, number>>({
        ethereum: 0,
        base: 0,
        arbitrum: 0,
        solana: 0
    });

    const [activeTab, setActiveTab] = useState<'blocks' | 'transactions'>('blocks');

    const fetchData = useCallback(async (isBackground = false) => {
        // Prevent fetches if no chains selected
        if (selectedChains.length === 0) {
            setBlocks([]);
            setTransactions([]);
            setLoading(false);
            return;
        }

        if (!isBackground) {
            setLoading(true);
        }

        try {
            const blockPromises: Promise<Block[]>[] = [];
            const txPromises: Promise<Transaction[]>[] = [];

            for (const chain of selectedChains) {
                if (chain === 'solana') {
                    blockPromises.push(solanaService.getLatestBlocks(3));
                    txPromises.push(solanaService.getLatestTransactions(5));
                } else {
                    // EVM Chains
                    // We get the latest block first
                    blockPromises.push(
                        alchemyService.getLatestBlockNumber(chain).then(async (num) => {
                            // Fetch last 3 blocks
                            const results = await Promise.all([
                                alchemyService.getBlock(chain, num),
                                alchemyService.getBlock(chain, num - 1),
                                alchemyService.getBlock(chain, num - 2)
                            ]);
                            return results.filter((b): b is Block => b !== null);
                        })
                    );
                    txPromises.push(alchemyService.getLatestTransactions(chain, 5));
                }
            }

            // Update latest heights for search validation
            const newHeights = { ...latestHeights };

            // Wait for BOTH Blocks and Transactions to resolve
            const [blockResults, txResults] = await Promise.all([
                Promise.all(blockPromises),
                Promise.all(txPromises)
            ]);

            // Process Blocks
            const flattenedBlocks: Block[] = blockResults.flat();

            // Capture latest heights
            flattenedBlocks.forEach(b => {
                if (b.number > (newHeights[b.chainId] || 0)) {
                    newHeights[b.chainId] = b.number;
                }
            });
            setLatestHeights(newHeights);

            // Sort by timestamp desc
            flattenedBlocks.sort((a, b) => b.timestamp - a.timestamp);

            // Process Transactions
            const flattenedTxs = txResults.flat();
            flattenedTxs.sort((a, b) => b.timestamp - a.timestamp);

            // Update State Simultaneously
            setBlocks(flattenedBlocks);
            setTransactions(flattenedTxs);

        } catch (error) {
            console.error('Error fetching explorer data:', error);
        } finally {
            setLoading(false);
        }
    }, [selectedChains]);

    useEffect(() => {
        fetchData(false); // Initial load
        const interval = setInterval(() => fetchData(true), 10000); // 10s refresh (Background)
        return () => clearInterval(interval);
    }, [fetchData]);

    // Live Search Validation
    useEffect(() => {
        const query = searchQuery.trim();
        if (!query || !/^\d+$/.test(query)) {
            setSearchResults([]);
            setShowDropdown(false);
            return;
        }

        const blockNum = parseInt(query);
        const results: { chain: ChainId; block: number }[] = [];

        selectedChains.forEach(chain => {
            // If we have a known height and the query is within range (or if height is 0/unknown, we allow it optimistically or wait)
            // Ideally we check if blockNum <= latestHeights[chain]. 
            // Solana blocks are huge (200M+), EVM are lower.
            const height = latestHeights[chain];
            if (height > 0 && blockNum <= height) {
                results.push({ chain, block: blockNum });
            } else if (chain === 'solana' && blockNum > 1000000) {
                // Basic heuristic for Solana if we missed the height update or want to be generous
                results.push({ chain, block: blockNum });
            }
        });

        setSearchResults(results);
        setShowDropdown(results.length > 0);
    }, [searchQuery, selectedChains, latestHeights]);


    function handleSearch(item?: { chain: ChainId; block: number }) {
        if (item) {
            router.push(`/app/explorer/detail/?type=block&id=${item.block}&chain=${item.chain}`);
            setShowDropdown(false);
            return;
        }

        const query = searchQuery.trim();
        if (!query) return;

        // Block number (pure numeric) - Default to first valid chain if not clicked
        if (/^\d+$/.test(query)) {
            if (searchResults.length > 0) {
                router.push(`/app/explorer/detail/?type=block&id=${searchResults[0].block}&chain=${searchResults[0].chain}`);
            } else {
                // Fallback if no specific chain found valid (unlikely with our logic, but maybe for really old blocks)
                // Just send to first selected chain as a guess
                const defaultChain = selectedChains[0] || 'ethereum';
                router.push(`/app/explorer/detail/?type=block&id=${query}&chain=${defaultChain}`);
            }
            setShowDropdown(false);
            return;
        }

        // TX hash (0x + 64 hex chars for EVM)
        if (/^0x[a-fA-F0-9]{64}$/.test(query)) {
            router.push(`/app/explorer/detail/?type=tx&id=${query}`);
            setShowDropdown(false);
            return;
        }

        // Address (0x + 40 hex chars for EVM)
        if (/^0x[a-fA-F0-9]{40}$/.test(query)) {
            router.push(`/app/explorer/detail/?type=address&id=${query}`);
            setShowDropdown(false);
            return;
        }

        // Solana signature (base58, 87-88 chars)
        if (query.length >= 43 && query.length <= 88 && !query.startsWith('0x')) {
            router.push(`/app/explorer/detail/?type=tx&id=${query}`);
            setShowDropdown(false);
            return;
        }

        // Solana address (base58, 32-44 chars)
        if (query.length >= 32 && query.length <= 44 && !query.startsWith('0x')) {
            router.push(`/app/explorer/detail/?type=address&id=${query}`);
            setShowDropdown(false);
            return;
        }

        // Unknown format - try as address by default
        router.push(`/app/explorer/detail/?type=address&id=${query}`);
        setShowDropdown(false);
    }

    const chainColors: Record<ChainId, string> = {
        solana: 'var(--chain-solana)',
        ethereum: 'var(--chain-ethereum)',
        base: 'var(--chain-base)',
        arbitrum: 'var(--chain-arbitrum)',
    };

    return (
        <div className="h-full overflow-y-auto p-2 sm:p-6 max-w-7xl mx-auto overflow-x-hidden w-full pb-24 lg:pb-6">
            {/* Header */}
            <div className="flex items-center justify-between gap-2 sm:gap-4 mb-2 sm:mb-4">
                <div>
                    <h1 className="text-lg sm:text-2xl font-bold flex items-center gap-2">
                        <Compass className="w-5 h-5 sm:w-6 sm:h-6 text-[var(--primary)]" />
                        Explorer
                    </h1>
                    <p className="text-xs sm:text-base text-[var(--foreground-muted)]">
                        Live blocks and transactions
                    </p>
                </div>

                {/* Desktop Refresh Button */}
                <button
                    onClick={() => fetchData(false)}
                    className="hidden lg:flex btn btn-secondary text-sm py-2"
                    disabled={loading}
                >
                    <RefreshCw className={clsx('w-4 h-4', loading && 'animate-spin')} />
                    Refresh
                </button>

                {/* Mobile Refresh Button (Icon Only) */}
                <button
                    onClick={() => fetchData(false)}
                    className="lg:hidden p-2 text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
                    disabled={loading}
                >
                    <RefreshCw className={clsx('w-5 h-5', loading && 'animate-spin')} />
                </button>
            </div>

            {/* Global Search */}
            <div className="card mb-2 sm:mb-4 p-1 z-30 overflow-visible relative">
                <div className="flex gap-2 p-1 relative">
                    <div className="relative flex-1">
                        <input
                            type="text"
                            placeholder="Search tx hash, block, address..."
                            className="input input-no-icon border-0 bg-transparent focus:shadow-none text-base sm:text-sm w-full"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                            onFocus={() => { if (searchResults.length > 0) setShowDropdown(true); }}
                            onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
                        />
                    </div>
                    <button
                        onClick={() => handleSearch()}
                        className="px-4 sm:px-8 py-2 sm:py-2.5 rounded-xl bg-[var(--primary)] text-black font-bold text-sm hover:opacity-90 transition-all shadow-[0_0_15px_var(--primary-glow)]"
                    >
                        Search
                    </button>
                </div>

                {/* Results Dropdown - Full width relative to card, with spacing */}
                {showDropdown && (
                    <div className="absolute top-full mt-3 -left-1 -right-1 bg-[var(--background-secondary)] border border-[var(--border)] rounded-xl shadow-2xl py-2 max-h-80 overflow-y-auto z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                        <div className="px-4 py-2 text-[10px] font-bold text-[var(--foreground-muted)] uppercase tracking-wider flex items-center justify-between">
                            <span>Block Results</span>
                            <span className="text-[9px] bg-[var(--background-tertiary)] px-1.5 py-0.5 rounded text-[var(--foreground-muted)]">Select to view</span>
                        </div>
                        <div className="h-px bg-[var(--border)] mx-2 mb-1 opacity-50" />
                        {searchResults.map((result) => (
                            <button
                                key={`${result.chain}-${result.block}`}
                                onClick={() => handleSearch(result)}
                                className="w-full text-left px-4 py-3 hover:bg-[var(--background-tertiary)] flex items-center justify-between group transition-all duration-150 border-l-2 border-transparent hover:border-[var(--primary)]"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="relative">
                                        <img
                                            src={chainColors[result.chain] && chainColors[result.chain].includes('http') ? chainColors[result.chain] :
                                                result.chain === 'ethereum' ? 'https://i.imgur.com/NKQlhQj.png' :
                                                    result.chain === 'base' ? 'https://i.imgur.com/zn5hpMs.png' :
                                                        result.chain === 'arbitrum' ? 'https://i.imgur.com/jmOXWlA.png' :
                                                            'https://i.imgur.com/xp7PYKk.png'
                                            }
                                            alt={result.chain}
                                            className="w-6 h-6 rounded-full ring-2 ring-[var(--background-secondary)] group-hover:ring-[var(--background-tertiary)] transition-colors"
                                        />
                                    </div>
                                    <div>
                                        <span className="font-mono text-sm font-bold block leading-none mb-1">
                                            Block #{result.block.toLocaleString()}
                                        </span>
                                        <span className="text-[10px] text-[var(--foreground-muted)] capitalize block leading-none">
                                            {result.chain} Network
                                        </span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="p-1.5 rounded-full bg-[var(--background)] border border-[var(--border)] group-hover:border-[var(--primary)] group-hover:text-[var(--primary)] transition-colors">
                                        <ArrowRightLeft className="w-3.5 h-3.5 text-[var(--foreground-muted)] group-hover:text-[var(--primary)]" />
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>
                )}
            </div>



            {/* Overview Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4 mb-2 sm:mb-4">
                {
                    selectedChains.map((chainId) => {
                        const latestBlock = blocks.find(b => b.chainId === chainId)?.number;
                        return (
                            <Link
                                key={chainId}
                                href={`/app/explorer/${chainId}/`}
                                className="card relative overflow-hidden group p-2.5 sm:p-4 hover:border-[var(--primary)] transition-colors cursor-pointer"
                            >
                                <div
                                    className="absolute top-0 right-0 w-8 sm:w-16 h-8 sm:h-16 opacity-10 rounded-bl-full transition-transform group-hover:scale-110"
                                    style={{ backgroundColor: chainColors[chainId] }}
                                />
                                <div className="flex items-center gap-1.5 sm:gap-2 mb-1 sm:mb-2">
                                    <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full overflow-hidden bg-[var(--background-tertiary)]">
                                        <img
                                            src={
                                                chainId === 'ethereum' ? 'https://i.imgur.com/NKQlhQj.png' :
                                                    chainId === 'base' ? 'https://i.imgur.com/zn5hpMs.png' :
                                                        chainId === 'arbitrum' ? 'https://i.imgur.com/jmOXWlA.png' :
                                                            'https://i.imgur.com/xp7PYKk.png'
                                            }
                                            alt={chainId}
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                    <span className="text-xs sm:text-sm font-bold capitalize tracking-wide">{chainId}</span>
                                </div>
                                <p className="text-sm sm:text-xl font-mono font-bold">
                                    {latestBlock?.toLocaleString() || '...'}
                                </p>
                                <p className="text-[10px] sm:text-xs text-[var(--foreground-muted)] mt-0.5 sm:mt-1">Latest Block</p>
                            </Link>
                        );
                    })
                }
            </div >

            {/* Main Content Area - Stack on mobile */}
            <div className="grid lg:grid-cols-2 gap-3 sm:gap-6">

                {/* Latest Blocks */}
                <div className="rounded-xl border border-[var(--border)] bg-[var(--background-secondary)] flex flex-col h-[250px] sm:h-[400px] lg:h-[500px] p-0 overflow-hidden">
                    <div className="flex items-center justify-between p-2 sm:p-3 border-b border-[var(--border)]">
                        <h2 className="font-bold text-sm sm:text-base flex items-center gap-2">
                            <Box className="w-4 h-4 sm:w-5 sm:h-5 text-[var(--primary)]" />
                            Latest Blocks
                        </h2>
                    </div>
                    <div className="flex-1 overflow-y-auto overflow-x-hidden">
                        {loading && blocks.length === 0 ? (
                            <div className="divide-y divide-[var(--border)]">
                                {[...Array(8)].map((_, i) => (
                                    <div key={i} className="px-4 py-3 animate-pulse">
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="flex items-center gap-2">
                                                <div className="w-6 h-6 rounded-full bg-[var(--background-tertiary)]" />
                                                <div className="h-4 w-16 bg-[var(--background-tertiary)] rounded" />
                                            </div>
                                            <div className="h-3 w-12 bg-[var(--background-tertiary)] rounded" />
                                        </div>
                                        <div className="flex justify-between items-center pl-8">
                                            <div className="h-3 w-20 bg-[var(--background-tertiary)] rounded" />
                                            <div className="h-3 w-24 bg-[var(--background-tertiary)] rounded" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="divide-y divide-[var(--border)]">
                                {blocks.map((block) => (
                                    <Link
                                        key={`${block.chainId}-${block.number}`}
                                        href={`/app/explorer/detail/?type=block&id=${block.number}&chain=${block.chainId}`}
                                        className="block px-2 py-2 sm:px-4 sm:py-3 hover:bg-[var(--background-tertiary)] transition-colors cursor-pointer"
                                    >
                                        <div className="flex justify-between items-start mb-1">
                                            <div className="flex items-center gap-2">
                                                <div className="p-1.5 rounded-full bg-[var(--background-secondary)] border border-[var(--border)]">
                                                    <Box className="w-3 h-3 text-[var(--foreground-muted)]" />
                                                </div>
                                                <span className="text-sm font-mono text-[var(--primary)] font-bold">
                                                    {block.number}
                                                </span>
                                            </div>
                                            <div className="text-[10px] sm:text-xs text-[var(--foreground-muted)] flex items-center gap-1">
                                                <Clock className="w-3 h-3" />
                                                <TimeAgo timestamp={block.timestamp} />
                                            </div>
                                        </div>

                                        <div className="flex justify-between items-center pl-8 text-[10px] sm:text-xs text-[var(--foreground-muted)]">
                                            <div className="flex items-center gap-1.5">
                                                <img
                                                    src={
                                                        block.chainId === 'ethereum' ? 'https://i.imgur.com/NKQlhQj.png' :
                                                            block.chainId === 'base' ? 'https://i.imgur.com/zn5hpMs.png' :
                                                                block.chainId === 'arbitrum' ? 'https://i.imgur.com/jmOXWlA.png' :
                                                                    'https://i.imgur.com/xp7PYKk.png'
                                                    }
                                                    alt={block.chainId}
                                                    className="w-3 h-3 rounded-full"
                                                />
                                                <span className="capitalize">{block.chainId}</span>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <span>{block.transactions} txns</span>
                                                {block.miner && <span className="font-mono hidden sm:inline">{block.miner.slice(0, 6)}...</span>}
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>
                    <Link href={`/app/explorer/${selectedChains[0] || 'ethereum'}/`} className="p-2 sm:p-3 text-center text-xs sm:text-sm text-[var(--foreground-muted)] hover:text-[var(--primary)] border-t border-[var(--border)]">
                        View All Blocks
                    </Link>
                </div>

                {/* Latest Transactions */}
                <div className="rounded-xl border border-[var(--border)] bg-[var(--background-secondary)] flex flex-col h-[250px] sm:h-[400px] lg:h-[500px] p-0 overflow-hidden">
                    <div className="flex items-center justify-between p-2 sm:p-3 border-b border-[var(--border)]">
                        <h2 className="font-bold text-sm sm:text-base flex items-center gap-2">
                            <ArrowRightLeft className="w-4 h-4 sm:w-5 sm:h-5 text-[var(--primary)]" />
                            Latest Transactions
                        </h2>
                    </div>
                    <div className="flex-1 overflow-y-auto overflow-x-hidden">
                        {loading && transactions.length === 0 ? (
                            <div className="divide-y divide-[var(--border)]">
                                {[...Array(8)].map((_, i) => (
                                    <div key={i} className="px-4 py-3 animate-pulse">
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="flex items-center gap-2 w-2/3">
                                                <div className="w-6 h-6 rounded-full bg-[var(--background-tertiary)] shrink-0" />
                                                <div className="h-4 w-full bg-[var(--background-tertiary)] rounded" />
                                            </div>
                                            <div className="h-3 w-12 bg-[var(--background-tertiary)] rounded ml-2" />
                                        </div>
                                        <div className="flex justify-between items-center pl-8">
                                            <div className="h-3 w-24 bg-[var(--background-tertiary)] rounded" />
                                            <div className="h-3 w-32 bg-[var(--background-tertiary)] rounded" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="divide-y divide-[var(--border)]">
                                {transactions.map((tx) => (
                                    <Link
                                        key={`${tx.chainId}-${tx.hash}`}
                                        href={`/app/explorer/detail/?type=tx&id=${tx.hash}&chain=${tx.chainId}`}
                                        className="block px-2 py-2 sm:px-4 sm:py-3 hover:bg-[var(--background-tertiary)] transition-colors cursor-pointer"
                                    >
                                        <div className="flex justify-between items-start mb-1">
                                            <div className="flex items-center gap-2 max-w-[70%]">
                                                <div className="p-1.5 rounded-full bg-[var(--background-secondary)] border border-[var(--border)] shrink-0">
                                                    <Layers className="w-3 h-3 text-[var(--foreground-muted)]" />
                                                </div>
                                                <span className="font-mono text-xs sm:text-sm text-[var(--primary)] truncate">
                                                    {tx.hash}
                                                </span>
                                            </div>
                                            <div className="text-[10px] sm:text-xs text-[var(--foreground-muted)] whitespace-nowrap ml-2 text-right">
                                                <div className="font-mono text-[var(--primary)]">
                                                    {parseFloat(tx.value).toFixed(4)} {tx.chainId === 'solana' ? 'SOL' : 'ETH'}
                                                    {(() => {
                                                        const price = getPriceForChain(tx.chainId);
                                                        const value = parseFloat(tx.value);
                                                        if (!price || isNaN(value)) return null;
                                                        return <span className="text-[var(--foreground-muted)] ml-1.5">(~{formatCurrency(value * price)})</span>;
                                                    })()}
                                                </div>
                                                <div className="mt-0.5">
                                                    <TimeAgo timestamp={tx.timestamp} />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex justify-between items-center pl-8 text-[10px] sm:text-xs text-[var(--foreground-muted)]">
                                            <div className="flex items-center gap-3">
                                                <div className="flex items-center gap-1.5">
                                                    <img
                                                        src={
                                                            tx.chainId === 'ethereum' ? 'https://i.imgur.com/NKQlhQj.png' :
                                                                tx.chainId === 'base' ? 'https://i.imgur.com/zn5hpMs.png' :
                                                                    tx.chainId === 'arbitrum' ? 'https://i.imgur.com/jmOXWlA.png' :
                                                                        'https://i.imgur.com/xp7PYKk.png'
                                                        }
                                                        alt={tx.chainId}
                                                        className="w-3 h-3 rounded-full"
                                                    />
                                                    <span className="capitalize">{tx.chainId}</span>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    {/* Value moved to top right */}
                                                </div>
                                                <div className="flex items-center gap-1 font-mono">
                                                    <span>{tx.from.slice(0, 4)}...</span>
                                                    <ArrowRight className="w-2.5 h-2.5" />
                                                    <span>{tx.to ? tx.to.slice(0, 4) + '...' : 'Contract'}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>
                    <Link href={`/app/explorer/${selectedChains[0] || 'ethereum'}/`} className="p-2 sm:p-3 text-center text-xs sm:text-sm text-[var(--foreground-muted)] hover:text-[var(--primary)] border-t border-[var(--border)]">
                        View All Transactions
                    </Link>
                </div>
            </div>
        </div >
    );
}
