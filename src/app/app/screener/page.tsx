'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useWatchlistStore } from '@/store';
import { TokenPair, ChainId } from '@/types';
import { getTopPools, getNewPools, getTrendingPools, ScreenerFilters as FilterState } from '@/lib/services/screener';
import { ScreenerFilters } from '@/components/screener/ScreenerFilters';
import {
    ArrowUpRight,
    ChevronUp,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    Star,
} from 'lucide-react';
import { clsx } from 'clsx';
import { formatNumber, formatPrice } from '@/lib/utils/format';

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

type SortField = 'price' | 'change' | 'volume' | 'liquidity' | 'fdv' | 'txns' | 'created';
type SortDir = 'asc' | 'desc';

function ScreenerContent() {
    const { firebaseUser } = useAuth();
    const { toggleFavorite, isFavorited, initialize, isInitialized } = useWatchlistStore();
    const router = useRouter();

    const [tokens, setTokens] = useState<TokenPair[]>([]);
    const [loading, setLoading] = useState(true);
    const [mode, setMode] = useState<'trending' | 'volume' | 'new'>('trending');
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const ITEMS_PER_PAGE = 50;

    // Filters state
    const [filters, setFilters] = useState<FilterState>({
        chain: 'all',
    });

    // Sort state
    const [sortField, setSortField] = useState<SortField>('volume');
    const [sortDir, setSortDir] = useState<SortDir>('desc');

    // Initialize watchlist
    useEffect(() => {
        if (firebaseUser?.uid && !isInitialized) {
            initialize(firebaseUser.uid);
        }
    }, [firebaseUser?.uid, isInitialized, initialize]);

    // Handle sort click
    const handleSort = (field: SortField) => {
        if (sortField === field) {
            setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDir('desc');
        }
    };

    // Fetch data
    const fetchTokens = useCallback(async (isLoadMore = false) => {
        if (!isLoadMore) setLoading(true);

        try {
            const chainsToFetch: ('base' | 'solana')[] = filters.chain === 'all'
                ? ['base', 'solana']
                : [filters.chain as 'base' | 'solana'];

            // Map modes to correct API functions
            // trending -> getTrendingPools (Specific endpoint)
            // volume -> getTopPools (General /pools endpoint, supports deep pagination)
            // new -> getNewPools
            let fetchFn;
            if (mode === 'trending') fetchFn = getTrendingPools;
            else if (mode === 'volume') fetchFn = getTopPools;
            else fetchFn = getNewPools;

            const nextPage = isLoadMore ? page + 1 : 1;

            // Fetch from selected chains
            const promises = chainsToFetch.map(chain => fetchFn(chain, nextPage));
            const results = await Promise.all(promises);
            const newTokens = results.flat();

            if (isLoadMore) {
                setTokens(prev => [...prev, ...newTokens]);
                setPage(nextPage);
            } else {
                setTokens(newTokens);
                setPage(1);
            }

            // If we got results, assume there might be more (simple heuristic for now)
            // For rigorous pagination, we'd check if results.length < requested_limit per chain
            setHasMore(newTokens.length > 0);

        } catch (error) {
            console.error('Error fetching tokens:', error);
        } finally {
            setLoading(false);
        }
    }, [filters.chain, mode, page]);

    // Initial fetch and reset on filter change
    useEffect(() => {
        fetchTokens(false);
    }, [filters.chain, mode]);


    // Apply client-side filtering and sorting
    const filteredTokens = tokens.filter(t => {
        if (filters.minLiquidity && t.liquidity < filters.minLiquidity) return false;
        if (filters.minVolume && t.volume24h < filters.minVolume) return false;
        if (filters.minFdv && (t.fdv || 0) < filters.minFdv) return false;
        if (filters.maxFdv && (t.fdv || 0) > filters.maxFdv) return false;
        return true;
    });

    const sortedTokens = [...filteredTokens].sort((a, b) => {
        let aVal = 0, bVal = 0;
        switch (sortField) {
            case 'price': aVal = a.priceUsd; bVal = b.priceUsd; break;
            case 'change': aVal = a.priceChange.h24; bVal = b.priceChange.h24; break;
            case 'volume': aVal = a.volume24h; bVal = b.volume24h; break;
            case 'liquidity': aVal = a.liquidity; bVal = b.liquidity; break;
            case 'fdv': aVal = a.fdv || 0; bVal = b.fdv || 0; break;
            case 'txns': aVal = (a.txns24h.buys + a.txns24h.sells); bVal = (b.txns24h.buys + b.txns24h.sells); break;
            case 'created': aVal = new Date(a.createdAt || 0).getTime(); bVal = new Date(b.createdAt || 0).getTime(); break;
        }
        return sortDir === 'asc' ? aVal - bVal : bVal - aVal;
    });

    // Paginate tokens client-side
    const totalPages = Math.ceil(sortedTokens.length / ITEMS_PER_PAGE);
    const paginatedTokens = sortedTokens.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

    return (
        <div className="h-full overflow-y-auto overscroll-contain bg-[var(--background)]">
            <div className="w-full pb-20 lg:pb-0">

                {/* Single Row Toolbar - Mode Toggle, Filters, Chain Selector, Refresh */}
                <div className="px-4 sm:px-6 py-2 bg-[var(--background-secondary)] border-b border-[var(--border)]">
                    <ScreenerFilters
                        filters={filters}
                        onChange={setFilters}
                        mode={mode}
                        onModeChange={setMode}
                        onRefresh={() => fetchTokens(false)}
                        isLoading={loading}
                    />
                </div>

                {/* Full Width Table - Square edges */}
                <div className="w-full">
                    <div className="overflow-x-auto min-h-[400px]">
                        <table className="table w-full text-sm">
                            <colgroup>
                                <col style={{ width: '4%' }} />
                                <col style={{ width: '22%' }} />
                                <col style={{ width: '10%' }} />
                                <col style={{ width: '8%' }} />
                                <col style={{ width: '11%' }} />
                                <col style={{ width: '11%' }} />
                                <col style={{ width: '11%' }} />
                                <col className="hidden lg:table-column" style={{ width: '11%' }} />
                                <col style={{ width: '12%' }} />
                            </colgroup>
                            <thead className="bg-[var(--background-tertiary)]/50 text-[var(--foreground-muted)] text-xs uppercase font-semibold border-b border-[var(--border)]">
                                <tr>
                                    <th className="py-3 pl-4 md:pl-6 text-left">#</th>
                                    <th className="py-3 pl-2 text-left">Token</th>
                                    <th className="py-3 pr-12 text-right cursor-pointer hover:text-[var(--primary)]" onClick={() => handleSort('price')}>
                                        Price {sortField === 'price' && (sortDir === 'asc' ? '↑' : '↓')}
                                    </th>
                                    <th className="py-3 pr-12 text-right cursor-pointer hover:text-[var(--primary)]" onClick={() => handleSort('change')}>
                                        24h % {sortField === 'change' && (sortDir === 'asc' ? '↑' : '↓')}
                                    </th>
                                    <th className="py-3 pr-12 text-right cursor-pointer hover:text-[var(--primary)]" onClick={() => handleSort('liquidity')}>
                                        Liquidity {sortField === 'liquidity' && (sortDir === 'asc' ? '↑' : '↓')}
                                    </th>
                                    <th className="py-3 pr-12 text-right cursor-pointer hover:text-[var(--primary)]" onClick={() => handleSort('volume')}>
                                        Vol 24h {sortField === 'volume' && (sortDir === 'asc' ? '↑' : '↓')}
                                    </th>
                                    <th className="py-3 pr-12 text-right cursor-pointer hover:text-[var(--primary)]" onClick={() => handleSort('fdv')}>
                                        FDV {sortField === 'fdv' && (sortDir === 'asc' ? '↑' : '↓')}
                                    </th>
                                    <th className="py-3 pr-12 text-right hidden lg:table-cell cursor-pointer hover:text-[var(--primary)]" onClick={() => handleSort('txns')}>
                                        Txns {sortField === 'txns' && (sortDir === 'asc' ? '↑' : '↓')}
                                    </th>
                                    <th className="py-3 pr-4 md:pr-6"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[var(--border)]">
                                {loading && filteredTokens.length === 0 ? (
                                    Array.from({ length: 10 }).map((_, i) => (
                                        <tr key={i} className="animate-pulse">
                                            <td colSpan={9} className="py-4">
                                                <div className="h-8 bg-[var(--background-tertiary)] rounded-lg mx-4" />
                                            </td>
                                        </tr>
                                    ))
                                ) : paginatedTokens.length === 0 ? (
                                    <tr>
                                        <td colSpan={9} className="text-center py-20 text-[var(--foreground-muted)]">
                                            No tokens found matching your filters.
                                        </td>
                                    </tr>
                                ) : (
                                    paginatedTokens.map((token, index) => (
                                        <TokenRow
                                            key={`${token.chainId}-${token.pairAddress}`}
                                            token={token}
                                            index={(page - 1) * ITEMS_PER_PAGE + index + 1}
                                            isFavorited={isFavorited(token.pairAddress)}
                                            onToggleFavorite={() => toggleFavorite(firebaseUser?.uid, {
                                                address: token.baseToken.address,
                                                pairAddress: token.pairAddress,
                                                chainId: token.chainId,
                                                symbol: token.baseToken.symbol,
                                                name: token.baseToken.name,
                                                logo: token.baseToken.logo,
                                            })}
                                        />
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {!loading && sortedTokens.length > 0 && totalPages > 1 && (
                        <div className="px-4 py-4 flex items-center justify-between border-t border-[var(--border)] bg-[var(--background-secondary)]">
                            <div className="text-sm text-[var(--foreground-muted)]">
                                Showing {(page - 1) * ITEMS_PER_PAGE + 1} - {Math.min(page * ITEMS_PER_PAGE, sortedTokens.length)} of {sortedTokens.length} tokens
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                    disabled={page === 1}
                                    className={clsx(
                                        "flex items-center gap-1 px-3 py-1.5 text-sm font-medium border border-[var(--border)] transition-all",
                                        page === 1
                                            ? "text-[var(--foreground-muted)] cursor-not-allowed opacity-50"
                                            : "bg-[var(--background-tertiary)] hover:bg-[var(--primary)] hover:text-black hover:border-[var(--primary)]"
                                    )}
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                    Previous
                                </button>
                                <span className="px-3 py-1.5 text-sm font-mono bg-[var(--background-tertiary)] border border-[var(--border)]">
                                    {page} / {totalPages}
                                </span>
                                <button
                                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                    disabled={page === totalPages}
                                    className={clsx(
                                        "flex items-center gap-1 px-3 py-1.5 text-sm font-medium border border-[var(--border)] transition-all",
                                        page === totalPages
                                            ? "text-[var(--foreground-muted)] cursor-not-allowed opacity-50"
                                            : "bg-[var(--background-tertiary)] hover:bg-[var(--primary)] hover:text-black hover:border-[var(--primary)]"
                                    )}
                                >
                                    Next
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Load More for fetching additional data from API */}
                    {!loading && hasMore && sortedTokens.length > 0 && page === totalPages && (
                        <div className="p-4 flex justify-center border-t border-[var(--border)]">
                            <button
                                onClick={() => {
                                    fetchTokens(true);
                                    setPage(1); // Reset to page 1 when loading more
                                }}
                                className="px-6 py-2 bg-[var(--background-tertiary)] hover:bg-[var(--primary)] hover:text-black border border-[var(--border)] text-sm font-medium transition-all"
                            >
                                Load More Tokens
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function TokenRow({ token, index, isFavorited, onToggleFavorite }: { token: TokenPair; index: number; isFavorited?: boolean; onToggleFavorite?: () => void }) {
    const router = useRouter();
    const routerPush = (e: React.MouseEvent) => {
        // Prevent row click if clicking interactive elements
        if ((e.target as HTMLElement).closest('button')) return;
        router.push(`/app/trade?chain=${token.chainId}&pair=${token.pairAddress}`);
    };

    return (
        <tr onClick={routerPush} className="group hover:bg-[var(--background-tertiary)]/50 transition-colors cursor-pointer">
            <td className="py-3 pl-4 md:pl-6 text-[var(--foreground-muted)] font-mono text-xs w-10">{index}</td>
            <td className="py-3 pl-2">
                <div className="flex items-center gap-3">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onToggleFavorite?.();
                        }}
                        className={clsx(
                            'hover:scale-110 transition-transform',
                            isFavorited ? 'text-[var(--accent-yellow)]' : 'text-[var(--foreground-muted)] hover:text-[var(--accent-yellow)]'
                        )}
                    >
                        <Star className="w-4 h-4" fill={isFavorited ? 'currentColor' : 'none'} />
                    </button>
                    <div className="relative">
                        {token.logo || token.baseToken.logo ? (
                            <img
                                src={token.logo || token.baseToken.logo}
                                className="w-8 h-8 rounded-full bg-[var(--background-tertiary)] object-cover shrink-0"
                                alt={token.baseToken.symbol}
                                onError={(e) => {
                                    // Hide the image and show fallback
                                    e.currentTarget.style.display = 'none';
                                    const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                                    if (fallback) fallback.style.display = 'flex';
                                }}
                            />
                        ) : null}
                        <div
                            className="w-8 h-8 rounded-full bg-[var(--background-tertiary)] flex items-center justify-center text-sm font-bold text-[var(--foreground)] shrink-0"
                            style={{ display: token.logo || token.baseToken.logo ? 'none' : 'flex' }}
                        >
                            {token.baseToken.symbol.charAt(0).toUpperCase()}
                        </div>
                        <img
                            src={token.chainId === 'solana'
                                ? "https://i.imgur.com/xp7PYKk.png"
                                : "https://i.imgur.com/zn5hpMs.png"}
                            className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border border-[var(--background-secondary)] shrink-0"
                            alt={token.chainId}
                        />
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                            <span className="font-bold text-sm tracking-tight truncate">{token.baseToken.symbol}</span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--background-tertiary)] text-[var(--foreground-muted)] font-mono shrink-0">
                                / {token.quoteToken.symbol}
                            </span>
                        </div>
                        <div className="text-[10px] text-[var(--foreground-muted)] truncate">
                            {token.baseToken.name}
                        </div>
                    </div>
                </div>
            </td>
            <td className="py-3 pr-12 text-right font-mono text-sm">
                ${formatPrice(token.priceUsd)}
            </td>
            <td className={clsx("py-3 pr-12 text-right font-mono text-sm", token.priceChange.h24 >= 0 ? "text-[var(--accent-green)]" : "text-[var(--accent-red)]")}>
                {token.priceChange.h24 > 0 ? '+' : ''}{token.priceChange.h24.toFixed(1)}%
            </td>
            <td className="py-3 pr-12 text-right font-mono text-sm text-[var(--foreground-muted)]">
                ${formatNumber(token.liquidity)}
            </td>
            <td className="py-3 pr-12 text-right font-mono text-sm">
                ${formatNumber(token.volume24h)}
            </td>
            <td className="py-3 pr-12 text-right font-mono text-sm text-[var(--foreground-muted)]">
                ${formatNumber(token.fdv || 0)}
            </td>
            <td className="py-3 pr-12 text-right font-mono text-sm hidden lg:table-cell">
                <span className="text-[var(--accent-green)]">{token.txns24h.buys}</span>
                <span className="text-[var(--foreground-muted)] mx-1">/</span>
                <span className="text-[var(--accent-red)]">{token.txns24h.sells}</span>
            </td>
            <td className="py-3 pr-4 md:pr-6">
                <ArrowUpRight className="w-4 h-4 text-[var(--foreground-muted)] group-hover:text-[var(--primary)] transition-colors opacity-0 group-hover:opacity-100" />
            </td>
        </tr >
    );
}

