'use client';

import { ScreenerFilters as FilterState } from '@/lib/services/screener';
import { ChainId } from '@/types';
import { clsx } from 'clsx';
import { Filter, Flame, Sparkles, RefreshCw } from 'lucide-react';

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
    const updateFilter = (key: keyof FilterState, value: any) => {
        onChange({ ...filters, [key]: value });
    };

    return (
        <div className="flex items-center gap-3 flex-wrap">
            {/* Mode Toggle */}
            <div className="flex bg-[var(--background-tertiary)] p-0.5 border border-[var(--border)]">
                <button
                    onClick={() => onModeChange('trending')}
                    className={clsx(
                        'flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium transition-all whitespace-nowrap',
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
                        'flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium transition-all whitespace-nowrap',
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
                        'flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium transition-all whitespace-nowrap',
                        mode === 'new'
                            ? 'bg-[var(--background-secondary)] text-[var(--foreground)] shadow-sm'
                            : 'text-[var(--foreground-muted)] hover:text-[var(--foreground)]'
                    )}
                >
                    <Sparkles className="w-3.5 h-3.5 text-[var(--accent-blue)]" />
                    New Pairs
                </button>
            </div>

            {/* Divider */}
            <div className="h-6 w-px bg-[var(--border)] hidden sm:block" />

            {/* Advanced Filters - Compact inline */}
            <div className="flex items-center gap-2 flex-wrap">
                <div className="flex items-center gap-1.5 text-[var(--foreground-muted)] text-xs">
                    <Filter className="w-3.5 h-3.5" />
                </div>

                <div className="flex items-center gap-1">
                    <span className="text-[10px] uppercase text-[var(--foreground-muted)]">Liq:</span>
                    <div className="relative">
                        <span className="absolute left-1.5 top-1/2 -translate-y-1/2 text-[var(--foreground-muted)] text-[10px]">$</span>
                        <input
                            type="number"
                            value={filters.minLiquidity || ''}
                            onChange={(e) => updateFilter('minLiquidity', e.target.value ? Number(e.target.value) : undefined)}
                            placeholder="0"
                            className="w-20 bg-[var(--background-tertiary)] border border-[var(--border)] rounded py-1 pl-4 pr-1 text-xs focus:border-[var(--primary)] outline-none"
                        />
                    </div>
                </div>

                <div className="flex items-center gap-1">
                    <span className="text-[10px] uppercase text-[var(--foreground-muted)]">Vol:</span>
                    <div className="relative">
                        <span className="absolute left-1.5 top-1/2 -translate-y-1/2 text-[var(--foreground-muted)] text-[10px]">$</span>
                        <input
                            type="number"
                            value={filters.minVolume || ''}
                            onChange={(e) => updateFilter('minVolume', e.target.value ? Number(e.target.value) : undefined)}
                            placeholder="0"
                            className="w-20 bg-[var(--background-tertiary)] border border-[var(--border)] rounded py-1 pl-4 pr-1 text-xs focus:border-[var(--primary)] outline-none"
                        />
                    </div>
                </div>

                <div className="flex items-center gap-1">
                    <span className="text-[10px] uppercase text-[var(--foreground-muted)]">FDV:</span>
                    <div className="relative">
                        <span className="absolute left-1.5 top-1/2 -translate-y-1/2 text-[var(--foreground-muted)] text-[10px]">$</span>
                        <input
                            type="number"
                            value={filters.minFdv || ''}
                            onChange={(e) => updateFilter('minFdv', e.target.value ? Number(e.target.value) : undefined)}
                            placeholder="Min"
                            className="w-16 bg-[var(--background-tertiary)] border border-[var(--border)] rounded py-1 pl-4 pr-1 text-xs focus:border-[var(--primary)] outline-none"
                        />
                    </div>
                    <span className="text-[var(--foreground-muted)] text-xs">-</span>
                    <div className="relative">
                        <span className="absolute left-1.5 top-1/2 -translate-y-1/2 text-[var(--foreground-muted)] text-[10px]">$</span>
                        <input
                            type="number"
                            value={filters.maxFdv || ''}
                            onChange={(e) => updateFilter('maxFdv', e.target.value ? Number(e.target.value) : undefined)}
                            placeholder="Max"
                            className="w-16 bg-[var(--background-tertiary)] border border-[var(--border)] rounded py-1 pl-4 pr-1 text-xs focus:border-[var(--primary)] outline-none"
                        />
                    </div>
                </div>
            </div>

            {/* Spacer to push chain selector and refresh to the right */}
            <div className="flex-1" />

            {/* Chain Selector */}
            <div className="flex items-center gap-1.5">
                {CHAIN_OPTIONS.map((chain) => (
                    <button
                        key={chain.id}
                        onClick={() => updateFilter('chain', chain.id)}
                        className={clsx(
                            'flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-medium border transition-all',
                            filters.chain === chain.id
                                ? 'bg-[var(--primary)]/10 border-[var(--primary)] text-[var(--primary)]'
                                : 'bg-[var(--background-tertiary)] border-[var(--border)] text-[var(--foreground-muted)] hover:border-[var(--border-hover)]'
                        )}
                    >
                        {chain.logo && <img src={chain.logo} alt={chain.name} className="w-3.5 h-3.5 rounded-full" />}
                        {chain.name}
                    </button>
                ))}
            </div>

            {/* Refresh Button */}
            {onRefresh && (
                <button
                    onClick={onRefresh}
                    className="p-1.5 rounded-lg hover:bg-[var(--background-tertiary)] transition-colors text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
                    title="Refresh"
                    disabled={isLoading}
                >
                    <RefreshCw className={clsx('w-4 h-4', isLoading && 'animate-spin')} />
                </button>
            )}
        </div>
    );
}
