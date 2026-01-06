'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/store';
import { TokenPair, ChainId } from '@/types';
import { searchPairs, getTrendingTokens } from '@/lib/services/dexscreener';
import {
    Search,
    TrendingUp,
    TrendingDown,
    ArrowUpRight,
    RefreshCw,
    Sparkles,
    Flame,
    ChevronUp,
    ChevronDown,
    Filter,
} from 'lucide-react';
import { clsx } from 'clsx';
import { formatNumber, formatPrice } from '@/lib/utils/format';

type SortField = 'price' | 'change' | 'volume' | 'liquidity' | 'txns';
type SortDir = 'asc' | 'desc';
type ChainFilter = 'all' | ChainId;

// Chain config for filter UI
const CHAIN_OPTIONS: { id: ChainFilter; name: string; logo: string; color: string }[] = [
    { id: 'all', name: 'All Chains', logo: '', color: '#F7931A' },
    { id: 'solana', name: 'Solana', logo: 'https://i.imgur.com/xp7PYKk.png', color: '#9945FF' },
    { id: 'ethereum', name: 'Ethereum', logo: 'https://i.imgur.com/NKQlhQj.png', color: '#627EEA' },
    { id: 'base', name: 'Base', logo: 'https://i.imgur.com/zn5hpMs.png', color: '#0052FF' },
    { id: 'arbitrum', name: 'Arbitrum', logo: 'https://i.imgur.com/jmOXWlA.png', color: '#28a0f0' },
];

import { Suspense } from 'react';

// Wrapper for Suspense
export default function ScreenerPage() {
    return (
        <Suspense fallback={<ScreenerSkeleton />}>
            <ScreenerContent />
        </Suspense>
    );
}

function ScreenerSkeleton() {
    return <div className="p-6 flex justify-center"><div className="loading-spinner" /></div>;
}

function ScreenerContent() {
    const { selectedChains } = useAppStore();
    const [tokens, setTokens] = useState<TokenPair[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [tab, setTab] = useState<'trending' | 'gainers' | 'losers' | 'volume'>('trending');
    const [currentPage, setCurrentPage] = useState(1);
    const [sortField, setSortField] = useState<SortField>('volume');
    const [sortDir, setSortDir] = useState<SortDir>('desc');
    const [chainFilter, setChainFilter] = useState<ChainFilter>('all');
    const [totalCount, setTotalCount] = useState(0);
    const [isCached, setIsCached] = useState(false);
    const itemsPerPage = 50;

    const handleSort = (field: SortField) => {
        if (sortField === field) {
            setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDir('desc');
        }
    };

    const fetchTokens = useCallback(async () => {
        setLoading(true);
        try {
            // Fetch from enhanced dexscreener service with client-side caching
            const chainsToFetch = selectedChains.length > 0
                ? selectedChains
                : ['ethereum', 'base', 'arbitrum', 'solana'] as ChainId[];

            const pairs = await getTrendingTokens(chainsToFetch);
            setTotalCount(pairs.length);
            setIsCached(false); // Service handles caching internally

            let sortedPairs = [...pairs];

            // Apply sorting based on tab
            if (tab === 'gainers') {
                sortedPairs = sortedPairs
                    .filter(p => p.priceChange.h24 > 0)
                    .sort((a, b) => b.priceChange.h24 - a.priceChange.h24);
            } else if (tab === 'losers') {
                sortedPairs = sortedPairs
                    .filter(p => p.priceChange.h24 < 0)
                    .sort((a, b) => a.priceChange.h24 - b.priceChange.h24);
            } else if (tab === 'volume') {
                sortedPairs.sort((a, b) => b.volume24h - a.volume24h);
            }

            setTokens(sortedPairs);
            setCurrentPage(1);
        } catch (error) {
            console.error('Error fetching tokens:', error);
        } finally {
            setLoading(false);
        }
    }, [selectedChains, tab]);

    useEffect(() => {
        fetchTokens();
    }, [fetchTokens]);

    async function handleSearch() {
        if (!searchQuery.trim()) {
            fetchTokens();
            return;
        }

        setLoading(true);
        try {
            const pairs = await searchPairs(searchQuery);
            const filtered = selectedChains.length > 0
                ? pairs.filter(p => selectedChains.includes(p.chainId))
                : pairs;
            setTokens(filtered);
            setCurrentPage(1);
        } catch (error) {
            console.error('Error searching:', error);
        } finally {
            setLoading(false);
        }
    }

    // Apply chain filter first
    const filteredTokens = chainFilter === 'all'
        ? tokens
        : tokens.filter(t => t.chainId === chainFilter);

    // Sort tokens based on current sort field and direction
    const sortedTokens = [...filteredTokens].sort((a, b) => {
        let aVal = 0, bVal = 0;
        switch (sortField) {
            case 'price': aVal = a.priceUsd; bVal = b.priceUsd; break;
            case 'change': aVal = a.priceChange.h24; bVal = b.priceChange.h24; break;
            case 'volume': aVal = a.volume24h; bVal = b.volume24h; break;
            case 'liquidity': aVal = a.liquidity; bVal = b.liquidity; break;
            case 'txns': aVal = a.txns24h.buys + a.txns24h.sells; bVal = b.txns24h.buys + b.txns24h.sells; break;
        }
        return sortDir === 'asc' ? aVal - bVal : bVal - aVal;
    });

    // Pagination logic
    const totalPages = Math.ceil(sortedTokens.length / itemsPerPage);
    const paginatedTokens = sortedTokens.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    return (
        <div className="p-0 sm:p-6">
            {/* Header */}
            <div className="mb-4 sm:mb-6 px-3 sm:px-0 pt-3 sm:pt-0">
                <h1 className="text-lg sm:text-2xl font-bold mb-1 sm:mb-2 flex items-center gap-2">
                    <Flame className="w-5 h-5 sm:w-6 sm:h-6 text-[var(--accent-yellow)]" />
                    Token Screener
                    {totalCount > 0 && (
                        <span className="text-xs sm:text-sm font-normal text-[var(--foreground-muted)] ml-2">
                            ({totalCount} tokens{isCached && ' • cached'})
                        </span>
                    )}
                </h1>
                <p className="hidden sm:block text-xs sm:text-base text-[var(--foreground-muted)]">
                    Discover trending tokens across all chains
                </p>
            </div>

            {/* Search and Refresh */}
            <div className="flex items-center gap-2 sm:gap-4 mb-3 sm:mb-6 px-3 sm:px-0">
                <div className="relative flex-1">
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--foreground-muted)]">
                        <Search className="w-4 h-4" />
                    </div>
                    <input
                        type="text"
                        placeholder="Search token..."
                        className="w-full bg-[var(--background-tertiary)] border border-[var(--border)] rounded-lg text-base sm:text-sm py-2 pl-3 pr-9 outline-none focus:border-[var(--primary)] transition-colors"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    />
                </div>
                <button onClick={handleSearch} className="hidden lg:flex btn btn-secondary text-sm py-2">
                    <Search className="w-4 h-4" />
                    <span>Search</span>
                </button>
                <button
                    onClick={fetchTokens}
                    className="p-2 rounded-lg hover:bg-[var(--background-tertiary)] transition-colors"
                    disabled={loading}
                >
                    <RefreshCw className={clsx('w-4 h-4', loading && 'animate-spin')} />
                </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 sm:gap-2 mb-2 sm:mb-6 overflow-x-auto px-3 sm:px-0 scrollbar-thin relative z-10">
                <TabButton
                    active={tab === 'trending'}
                    onClick={() => setTab('trending')}
                    icon={Sparkles}
                    label="Trending"
                />
                <TabButton
                    active={tab === 'gainers'}
                    onClick={() => setTab('gainers')}
                    icon={TrendingUp}
                    label="Gainers"
                />
                <TabButton
                    active={tab === 'losers'}
                    onClick={() => setTab('losers')}
                    icon={TrendingDown}
                    label="Losers"
                />
                <TabButton
                    active={tab === 'volume'}
                    onClick={() => setTab('volume')}
                    icon={Flame}
                    label="Volume"
                />
            </div>

            {/* Chain Filter */}
            <div className="flex items-center gap-1.5 sm:gap-2 mb-2 sm:mb-4 px-3 sm:px-0 overflow-x-auto scrollbar-thin">
                <Filter className="w-3 h-3 sm:w-4 sm:h-4 text-[var(--foreground-muted)] flex-shrink-0" />
                {CHAIN_OPTIONS.map((chain) => (
                    <button
                        key={chain.id}
                        onClick={() => {
                            setChainFilter(chain.id);
                            setCurrentPage(1);
                        }}
                        className={clsx(
                            'flex items-center gap-1 px-2 py-1 sm:px-3 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-medium transition-all flex-shrink-0 border',
                            chainFilter === chain.id
                                ? 'border-[var(--primary)] bg-[var(--primary)]/10 text-[var(--primary)]'
                                : 'border-[var(--border)] text-[var(--foreground-muted)] hover:border-[var(--border-hover)] hover:text-[var(--foreground)]'
                        )}
                    >
                        {chain.logo && (
                            <img src={chain.logo} alt={chain.name} className="w-3 h-3 sm:w-4 sm:h-4 rounded-full" />
                        )}
                        <span className="hidden sm:inline">{chain.name}</span>
                        <span className="sm:hidden">{chain.id === 'all' ? 'All' : chain.name.slice(0, 3)}</span>
                    </button>
                ))}
            </div>

            {/* Token table */}
            <div className="overflow-hidden p-0 mx-0 w-full bg-transparent border-0 rounded-none sm:bg-[var(--background-secondary)] sm:border sm:border-[var(--border)] sm:rounded-lg sm:shadow-sm">
                <div className="overflow-x-auto">
                    <table className="table w-full text-xs sm:text-sm">
                        <thead>
                            <tr>
                                <th className="w-[40px] text-left pl-3 sm:pl-4">#</th>
                                <th className="text-left pl-2">Token</th>
                                <th
                                    className="text-left cursor-pointer hover:text-[var(--primary)] transition-colors"
                                    onClick={() => handleSort('price')}
                                >
                                    <span className="inline-flex items-center gap-1">
                                        Price
                                        {sortField === 'price' && (sortDir === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
                                    </span>
                                </th>
                                <th
                                    className="text-left cursor-pointer hover:text-[var(--primary)] transition-colors"
                                    onClick={() => handleSort('change')}
                                >
                                    <span className="inline-flex items-center gap-1">
                                        24h
                                        {sortField === 'change' && (sortDir === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
                                    </span>
                                </th>
                                <th
                                    className="text-left hidden sm:table-cell cursor-pointer hover:text-[var(--primary)] transition-colors"
                                    onClick={() => handleSort('volume')}
                                >
                                    <span className="inline-flex items-center gap-1">
                                        Volume
                                        {sortField === 'volume' && (sortDir === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
                                    </span>
                                </th>
                                <th
                                    className="text-left hidden md:table-cell cursor-pointer hover:text-[var(--primary)] transition-colors"
                                    onClick={() => handleSort('liquidity')}
                                >
                                    <span className="inline-flex items-center gap-1">
                                        Liquidity
                                        {sortField === 'liquidity' && (sortDir === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
                                    </span>
                                </th>
                                <th
                                    className="text-left hidden lg:table-cell cursor-pointer hover:text-[var(--primary)] transition-colors pr-2"
                                    onClick={() => handleSort('txns')}
                                >
                                    <span className="inline-flex items-center gap-1">
                                        Txns
                                        {sortField === 'txns' && (sortDir === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
                                    </span>
                                </th>
                                <th className="w-[40px]"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                Array.from({ length: 10 }).map((_, i) => (
                                    <tr key={i}>
                                        <td colSpan={9}>
                                            <div className="skeleton h-10 w-full" />
                                        </td>
                                    </tr>
                                ))
                            ) : paginatedTokens.length === 0 ? (
                                <tr>
                                    <td colSpan={9} className="text-center py-16 text-[var(--foreground-muted)]">
                                        No tokens found. Try adjusting your filters or search.
                                    </td>
                                </tr>
                            ) : (
                                paginatedTokens.map((token, index) => (
                                    <TokenRow
                                        key={`${token.chainId}-${token.pairAddress}`}
                                        token={token}
                                        index={(currentPage - 1) * itemsPerPage + index + 1}
                                    />
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {!loading && sortedTokens.length > 0 && (
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-2 p-3 sm:p-4 border-t border-[var(--border)]">
                        <p className="text-xs sm:text-sm text-[var(--foreground-muted)]">
                            <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span>-
                            <span className="font-medium">{Math.min(currentPage * itemsPerPage, sortedTokens.length)}</span> of{' '}
                            <span className="font-medium">{sortedTokens.length}</span>
                        </p>
                        <div className="flex items-center gap-2">
                            <button
                                className="btn btn-secondary px-3 py-1.5 text-xs sm:text-sm"
                                disabled={currentPage === 1}
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            >
                                Prev
                            </button>
                            <span className="text-xs sm:text-sm text-[var(--foreground-muted)] px-2">
                                Page {currentPage} of {totalPages}
                            </span>
                            <button
                                className="btn btn-secondary px-3 py-1.5 text-xs sm:text-sm"
                                disabled={currentPage === totalPages}
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

function TabButton({
    active,
    onClick,
    icon: Icon,
    label,
}: {
    active: boolean;
    onClick: () => void;
    icon: React.ElementType;
    label: string;
}) {
    return (
        <button
            onClick={onClick}
            className={clsx(
                'flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 rounded-lg sm:rounded-xl font-medium text-xs sm:text-sm whitespace-nowrap transition-all flex-shrink-0',
                active
                    ? 'bg-[var(--primary)]/10 text-[var(--primary)]'
                    : 'text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:bg-[var(--background-tertiary)]'
            )}
        >
            <Icon className="w-3 h-3 sm:w-4 sm:h-4" />
            {label}
        </button>
    );
}

function TokenRow({ token, index }: { token: TokenPair; index: number }) {
    const priceChange = token.priceChange.h24;
    const isPositive = priceChange >= 0;

    const router = useRouter();

    return (
        <tr
            onClick={() => router.push(`/app/trade?chain=${token.chainId}&pair=${token.pairAddress}`)}
            className="hover:bg-[var(--background-tertiary)] transition-colors border-none group cursor-pointer"
        >
            <td className="text-[var(--foreground-muted)] font-medium pl-3 sm:pl-4 text-xs">{index}</td>
            <td className="pl-2">
                <div className="flex items-center gap-2">
                    <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full overflow-hidden bg-[var(--background-tertiary)] flex-shrink-0">
                        {token.logo || token.baseToken.logo ? (
                            <img
                                src={token.logo || token.baseToken.logo}
                                alt={token.baseToken.symbol}
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-[8px] sm:text-[10px] font-bold">
                                {token.baseToken.symbol.slice(0, 2)}
                            </div>
                        )}
                    </div>
                    <div className="min-w-0">
                        <div className="flex items-center gap-1">
                            <p className="font-bold text-xs sm:text-sm truncate">{token.baseToken.symbol}</p>
                            <img
                                src={
                                    token.chainId === 'ethereum' ? 'https://i.imgur.com/NKQlhQj.png' :
                                        token.chainId === 'base' ? 'https://i.imgur.com/zn5hpMs.png' :
                                            token.chainId === 'arbitrum' ? 'https://i.imgur.com/jmOXWlA.png' :
                                                'https://i.imgur.com/xp7PYKk.png'
                                }
                                alt={token.chainId}
                                className="w-3 h-3 rounded-full"
                            />
                        </div>
                        <p className="text-[10px] text-[var(--foreground-muted)] truncate max-w-[80px] sm:max-w-[120px]">
                            {token.baseToken.name}
                        </p>
                    </div>
                </div>
            </td>
            <td className="text-left font-mono text-xs sm:text-sm">
                ${formatPrice(token.priceUsd)}
            </td>
            <td className={clsx('text-left font-mono text-xs sm:text-sm', isPositive ? 'price-up' : 'price-down')}>
                {isPositive ? '+' : ''}{priceChange.toFixed(1)}%
            </td>
            <td className="text-left font-mono text-xs sm:text-sm hidden sm:table-cell">
                ${formatNumber(token.volume24h)}
            </td>
            <td className="text-left font-mono text-xs sm:text-sm hidden md:table-cell">
                ${formatNumber(token.liquidity)}
            </td>
            <td className="text-left text-xs hidden lg:table-cell">
                <span className="price-up">{token.txns24h.buys}</span>
                <span className="text-[var(--foreground-muted)]">/</span>
                <span className="price-down">{token.txns24h.sells}</span>
            </td>
            <td className="pr-2 sm:pr-4">
                <div
                    className="btn btn-ghost btn-sm p-1 sm:p-2 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
                >
                    <ArrowUpRight className="w-3 h-3 sm:w-4 sm:h-4 text-[var(--primary)]" />
                </div>
            </td>
        </tr>
    );
}

