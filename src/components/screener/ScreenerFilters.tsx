'use client';

import { useState } from 'react';

import { ScreenerFilters as FilterState } from '@/lib/services/screener';
import { ChainId } from '@/types';
import { clsx } from 'clsx';
import { Filter, Flame, Sparkles, RefreshCw, X } from 'lucide-react';

interface ScreenerFiltersProps {
    filters: FilterState;
    onChange: (filters: FilterState) => void;
    mode: 'trending' | 'volume' | 'new';
    onModeChange: (mode: 'trending' | 'volume' | 'new') => void;
    onRefresh?: () => void;
    isLoading?: boolean;
}

const CHAIN_OPTIONS: { id: ChainId | 'all'; name: string; logo?: string }[] = [
    { id: 'all', name: 'All Chains' },
    { id: 'solana', name: 'Solana', logo: 'https://i.imgur.com/xp7PYKk.png' },
    { id: 'base', name: 'Base', logo: 'https://i.imgur.com/zn5hpMs.png' },
];

export function ScreenerFilters({ filters, onChange, mode, onModeChange, onRefresh, isLoading }: ScreenerFiltersProps) {
    const [showFilters, setShowFilters] = useState(false);

    const updateFilter = (key: keyof FilterState, value: any) => {
        onChange({ ...filters, [key]: value });
    };

    return (
        <>
            <div className="flex flex-col gap-2">
                {/* Top Toolbar */}
                <div className="flex items-center justify-between gap-2 overflow-x-auto no-scrollbar">

                    {/* Mode Toggle - Scrollable on mobile */}
                    <div className="flex bg-[var(--background-tertiary)] p-1 border border-[var(--border)] rounded-lg shrink-0 h-10 items-center">
                        <button
                            onClick={() => onModeChange('trending')}
                            className={clsx(
                                'flex items-center gap-1.5 px-3 h-full text-xs font-semibold transition-all whitespace-nowrap rounded font-bold uppercase',
                                mode === 'trending'
                                    ? 'bg-[var(--background-secondary)] text-[var(--foreground)] shadow-sm'
                                    : 'text-[var(--foreground-muted)] hover:text-[var(--foreground)]'
                            )}
                        >
                            <Flame className="w-3.5 h-3.5 text-[var(--accent-orange)]" />
                            Trending
                        </button>
                        <button
                            onClick={() => onModeChange('volume')}
                            className={clsx(
                                'flex items-center gap-1.5 px-3 h-full text-xs font-semibold transition-all whitespace-nowrap rounded font-bold uppercase',
                                mode === 'volume'
                                    ? 'bg-[var(--background-secondary)] text-[var(--foreground)] shadow-sm'
                                    : 'text-[var(--foreground-muted)] hover:text-[var(--foreground)]'
                            )}
                        >
                            <div className="w-3.5 h-3.5 rounded-full border-2 border-[var(--accent-green)]/60" />
                            Top Volume
                        </button>
                        <button
                            onClick={() => onModeChange('new')}
                            className={clsx(
                                'flex items-center gap-1.5 px-3 h-full text-xs font-semibold transition-all whitespace-nowrap rounded font-bold uppercase',
                                mode === 'new'
                                    ? 'bg-[var(--background-secondary)] text-[var(--foreground)] shadow-sm'
                                    : 'text-[var(--foreground-muted)] hover:text-[var(--foreground)]'
                            )}
                        >
                            <Sparkles className="w-3.5 h-3.5 text-[var(--accent-blue)]" />
                            New Pairs
                        </button>
                    </div>

                    <div className="flex-1" />

                    {/* Mobile Actions */}
                    <div className="flex items-center gap-2">
                        {/* Chain Selector */}
                        <div className="flex items-center bg-[var(--background-tertiary)] border border-[var(--border)] rounded-lg p-1 h-10 overflow-hidden">
                            {CHAIN_OPTIONS.map((chain) => {
                                if (filters.chain !== chain.id && filters.chain !== 'all' && chain.id !== 'all') return null;
                                return (
                                    <button
                                        key={chain.id}
                                        onClick={() => updateFilter('chain', chain.id)}
                                        className={clsx(
                                            'h-full px-3 min-w-[40px] rounded-md transition-all flex items-center justify-center shrink-0',
                                            filters.chain === chain.id
                                                ? 'bg-[var(--background-secondary)] text-[var(--primary)] shadow-sm'
                                                : 'text-[var(--foreground-muted)] hover:text-[var(--foreground)]'
                                        )}
                                        title={chain.name}
                                    >
                                        {chain.id === 'all' ? (
                                            <span className="text-[10px] font-bold">ALL</span>
                                        ) : (
                                            <img src={chain.logo} alt={chain.name} className="w-5 h-5 rounded-full object-cover shrink-0" />
                                        )}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Filter Button */}
                        <button
                            onClick={() => setShowFilters(true)}
                            className={clsx(
                                "w-10 h-10 flex items-center justify-center rounded-lg border transition-colors",
                                showFilters
                                    ? "bg-[var(--primary)]/10 border-[var(--primary)] text-[var(--primary)]"
                                    : "bg-[var(--background-tertiary)] border-[var(--border)] text-[var(--foreground-muted)]"
                            )}
                        >
                            <Filter className="w-5 h-5" />
                        </button>

                        {/* Refresh */}
                        {onRefresh && (
                            <button
                                onClick={onRefresh}
                                className="w-10 h-10 flex items-center justify-center rounded-lg bg-[var(--background-tertiary)] border border-[var(--border)] text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
                                disabled={isLoading}
                            >
                                <RefreshCw className={clsx('w-5 h-5', isLoading && 'animate-spin')} />
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Full Screen Filter Modal */}
            {showFilters && (
                <div className="fixed inset-0 z-[100] bg-[var(--background)] flex flex-col animate-in fade-in slide-in-from-bottom-10 sm:hidden">
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b border-[var(--border)]">
                        <h2 className="text-lg font-bold">Filters</h2>
                        <button
                            onClick={() => setShowFilters(false)}
                            className="p-2 -mr-2 text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    {/* Filter Content */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-6">

                        {/* Chain Selection (Full) */}
                        <div className="space-y-3">
                            <label className="text-sm font-medium text-[var(--foreground-muted)] uppercase tracking-wider">Chain</label>
                            <div className="grid grid-cols-2 gap-3">
                                {CHAIN_OPTIONS.map((chain) => (
                                    <button
                                        key={chain.id}
                                        onClick={() => updateFilter('chain', chain.id)}
                                        className={clsx(
                                            'flex items-center gap-3 p-3 rounded-xl border transition-all text-left',
                                            filters.chain === chain.id
                                                ? 'bg-[var(--primary)]/10 border-[var(--primary)] text-[var(--primary)]'
                                                : 'bg-[var(--background-tertiary)] border-[var(--border)] text-[var(--foreground-muted)]'
                                        )}
                                    >
                                        {chain.logo ? (
                                            <img src={chain.logo} alt={chain.name} className="w-6 h-6 rounded-full object-cover shrink-0" />
                                        ) : (
                                            <div className="w-6 h-6 rounded-full bg-[var(--background)] border border-[var(--border)] flex items-center justify-center text-[10px] font-bold shrink-0">ALL</div>
                                        )}
                                        <span className="font-semibold">{chain.name}</span>
                                        {filters.chain === chain.id && <div className="ml-auto w-2 h-2 rounded-full bg-[var(--primary)]" />}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Metrics Filters */}
                        <div className="space-y-4">
                            <label className="text-sm font-medium text-[var(--foreground-muted)] uppercase tracking-wider">Metrics</label>

                            <div className="space-y-4 bg-[var(--background-tertiary)]/50 p-4 rounded-xl border border-[var(--border)]">
                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-[var(--foreground-muted)]">Min Liquidity</span>
                                    </div>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--foreground-muted)]">$</span>
                                        <input
                                            type="number"
                                            value={filters.minLiquidity || ''}
                                            onChange={(e) => updateFilter('minLiquidity', e.target.value ? Number(e.target.value) : undefined)}
                                            placeholder="0"
                                            className="w-full bg-[var(--background)] border border-[var(--border)] rounded-lg py-3 pl-8 pr-4 text-base focus:border-[var(--primary)] outline-none"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-[var(--foreground-muted)]">Min Volume (24h)</span>
                                    </div>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--foreground-muted)]">$</span>
                                        <input
                                            type="number"
                                            value={filters.minVolume || ''}
                                            onChange={(e) => updateFilter('minVolume', e.target.value ? Number(e.target.value) : undefined)}
                                            placeholder="0"
                                            className="w-full bg-[var(--background)] border border-[var(--border)] rounded-lg py-3 pl-8 pr-4 text-base focus:border-[var(--primary)] outline-none"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-[var(--foreground-muted)]">FDV Range</span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="relative">
                                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--foreground-muted)]">$</span>
                                            <input
                                                type="number"
                                                value={filters.minFdv || ''}
                                                onChange={(e) => updateFilter('minFdv', e.target.value ? Number(e.target.value) : undefined)}
                                                placeholder="Min"
                                                className="w-full bg-[var(--background)] border border-[var(--border)] rounded-lg py-3 pl-8 pr-2 text-base focus:border-[var(--primary)] outline-none"
                                            />
                                        </div>
                                        <div className="relative">
                                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--foreground-muted)]">$</span>
                                            <input
                                                type="number"
                                                value={filters.maxFdv || ''}
                                                onChange={(e) => updateFilter('maxFdv', e.target.value ? Number(e.target.value) : undefined)}
                                                placeholder="Max"
                                                className="w-full bg-[var(--background)] border border-[var(--border)] rounded-lg py-3 pl-8 pr-2 text-base focus:border-[var(--primary)] outline-none"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="p-4 border-t border-[var(--border)] bg-[var(--background-secondary)] safe-area-bottom">
                        <button
                            onClick={() => setShowFilters(false)}
                            className="w-full py-4 bg-[var(--primary)] text-black font-bold rounded-xl active:scale-[0.98] transition-transform"
                        >
                            Apply Filters
                        </button>
                    </div>
                </div>
            )}

            {/* Desktop Collapsible Filters (Hidden on Mobile) */}
            {showFilters && (
                <div className="hidden sm:flex items-center gap-2 flex-wrap bg-[var(--background-tertiary)]/30 p-2 rounded-lg border border-[var(--border)] animate-in fade-in slide-in-from-top-2">
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                        <span className="text-[10px] uppercase text-[var(--foreground-muted)] w-8">Liq:</span>
                        <div className="relative flex-1">
                            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[var(--foreground-muted)] text-[10px]">$</span>
                            <input
                                type="number"
                                value={filters.minLiquidity || ''}
                                onChange={(e) => updateFilter('minLiquidity', e.target.value ? Number(e.target.value) : undefined)}
                                placeholder="Min Liq"
                                className="w-full sm:w-24 bg-[var(--background)] border border-[var(--border)] rounded py-1.5 pl-5 pr-2 text-xs focus:border-[var(--primary)] outline-none"
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto">
                        <span className="text-[10px] uppercase text-[var(--foreground-muted)] w-8">Vol:</span>
                        <div className="relative flex-1">
                            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[var(--foreground-muted)] text-[10px]">$</span>
                            <input
                                type="number"
                                value={filters.minVolume || ''}
                                onChange={(e) => updateFilter('minVolume', e.target.value ? Number(e.target.value) : undefined)}
                                placeholder="Min Vol"
                                className="w-full sm:w-24 bg-[var(--background)] border border-[var(--border)] rounded py-1.5 pl-5 pr-2 text-xs focus:border-[var(--primary)] outline-none"
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto">
                        <span className="text-[10px] uppercase text-[var(--foreground-muted)] w-8">FDV:</span>
                        <div className="flex items-center gap-2 flex-1">
                            <input
                                type="number"
                                value={filters.minFdv || ''}
                                onChange={(e) => updateFilter('minFdv', e.target.value ? Number(e.target.value) : undefined)}
                                placeholder="Min"
                                className="w-full sm:w-20 bg-[var(--background)] border border-[var(--border)] rounded py-1.5 px-2 text-xs focus:border-[var(--primary)] outline-none"
                            />
                            <span className="text-[var(--foreground-muted)]">-</span>
                            <input
                                type="number"
                                value={filters.maxFdv || ''}
                                onChange={(e) => updateFilter('maxFdv', e.target.value ? Number(e.target.value) : undefined)}
                                placeholder="Max"
                                className="w-full sm:w-20 bg-[var(--background)] border border-[var(--border)] rounded py-1.5 px-2 text-xs focus:border-[var(--primary)] outline-none"
                            />
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
