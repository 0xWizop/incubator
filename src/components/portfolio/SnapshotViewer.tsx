'use client';

import { useState, useEffect } from 'react';
import { Calendar, TrendingUp, TrendingDown, DollarSign, Clock, RefreshCw } from 'lucide-react';
import { clsx } from 'clsx';
import { usePortfolioStore } from '@/store';
import { useCurrency } from '@/hooks/useCurrency';
import { usePreferences } from '@/hooks/usePreferences';
import { format } from 'date-fns';
import type { PortfolioSnapshot } from '@/types';

interface SnapshotViewerProps {
    userId: string;
    onClose?: () => void;
}

export function SnapshotViewer({ userId, onClose }: SnapshotViewerProps) {
    const {
        snapshots,
        currentSnapshot,
        selectedDate,
        isLoading,
        error,
        loadSnapshots,
        getSnapshotForDate,
        selectDate,
    } = usePortfolioStore();

    const { formatCurrency } = useCurrency();
    const { hideBalances } = usePreferences();
    const [selectedSnapshotDate, setSelectedSnapshotDate] = useState<Date | null>(null);

    // Load snapshots on mount
    useEffect(() => {
        loadSnapshots(userId);
    }, [userId]);

    // Get available snapshot dates for date picker
    const snapshotDates = snapshots.map(s => s.timestamp);

    const handleDateSelect = async (date: Date) => {
        setSelectedSnapshotDate(date);
        selectDate(date);
        await getSnapshotForDate(userId, date);
    };

    const handleReset = () => {
        setSelectedSnapshotDate(null);
        selectDate(null);
    };

    // Calculate portfolio change
    const latestSnapshot = snapshots[0];
    const portfolioChange = currentSnapshot && latestSnapshot && currentSnapshot.id !== latestSnapshot.id
        ? ((latestSnapshot.totalValueUsd - currentSnapshot.totalValueUsd) / currentSnapshot.totalValueUsd) * 100
        : 0;

    return (
        <div className="flex flex-col h-full bg-[var(--background)] text-white">
            {/* Header */}
            <div className="px-6 py-4 border-b border-[var(--border)]">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-bold">Portfolio History</h2>
                        <p className="text-sm text-[var(--foreground-muted)] mt-1">
                            View your portfolio at any point in time
                        </p>
                    </div>
                    {onClose && (
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-[var(--background-tertiary)] rounded-lg transition-colors"
                        >
                            ×
                        </button>
                    )}
                </div>
            </div>

            {/* Date Selector */}
            <div className="px-6 py-4 border-b border-[var(--border)] bg-[var(--background-secondary)]">
                <div className="flex items-center gap-4">
                    <Calendar className="w-5 h-5 text-[var(--primary)]" />
                    <div className="flex-1">
                        <label className="text-sm font-medium text-[var(--foreground-muted)]">
                            Select Date
                        </label>
                        <div className="flex items-center gap-2 mt-2">
                            <select
                                value={selectedSnapshotDate?.toISOString() || ''}
                                onChange={(e) => {
                                    if (e.target.value) {
                                        handleDateSelect(new Date(e.target.value));
                                    }
                                }}
                                className="flex-1 px-3 py-2 bg-[var(--background-tertiary)] border border-[var(--border)] rounded-lg text-sm focus:border focus:border-[var(--border-hover)] focus:outline-none"
                            >
                                <option value="">Select a snapshot date...</option>
                                {snapshotDates.map((date, idx) => (
                                    <option key={idx} value={date.toISOString()}>
                                        {format(date, 'MMM d, yyyy h:mm a')}
                                    </option>
                                ))}
                            </select>
                            {selectedSnapshotDate && (
                                <button
                                    onClick={handleReset}
                                    className="px-3 py-2 bg-[var(--background-tertiary)] hover:bg-[var(--background-tertiary)]/80 border border-[var(--border)] rounded-lg text-sm transition-colors"
                                >
                                    Reset
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-12">
                        <RefreshCw className="w-8 h-8 animate-spin text-[var(--primary)]" />
                        <p className="text-sm text-[var(--foreground-muted)] mt-3">
                            Loading snapshots...
                        </p>
                    </div>
                ) : error ? (
                    <div className="flex flex-col items-center justify-center py-12">
                        <div className="p-3 bg-[var(--accent-red)]/10 border border-[var(--accent-red)]/30 rounded-lg">
                            <p className="text-[var(--accent-red)] text-sm">{error}</p>
                        </div>
                    </div>
                ) : !currentSnapshot ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                        <Clock className="w-12 h-12 text-[var(--foreground-muted)] mb-3" />
                        <p className="text-[var(--foreground-muted)]">
                            {snapshots.length === 0
                                ? 'No snapshots available yet'
                                : 'Select a date to view your portfolio'}
                        </p>
                        {snapshots.length === 0 && (
                            <p className="text-xs text-[var(--foreground-muted)] mt-2">
                                Snapshots are captured automatically each day
                            </p>
                        )}
                    </div>
                ) : (
                    <div className="space-y-6">
                        {/* Snapshot Info */}
                        <div className="p-4 bg-[var(--background-secondary)] border border-[var(--border)] rounded-xl">
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <p className="text-xs text-[var(--foreground-muted)]">
                                        Snapshot from
                                    </p>
                                    <p className="font-semibold mt-1">
                                        {format(currentSnapshot.timestamp, 'MMMM d, yyyy')}
                                    </p>
                                    <p className="text-xs text-[var(--foreground-muted)] mt-0.5">
                                        {format(currentSnapshot.timestamp, 'h:mm a')}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs text-[var(--foreground-muted)]">
                                        Total Value
                                    </p>
                                    <p className="text-2xl font-bold mt-1">
                                        {hideBalances
                                            ? '*****'
                                            : formatCurrency(currentSnapshot.totalValueUsd).formatted}
                                    </p>
                                    {portfolioChange !== 0 && (
                                        <div className={clsx(
                                            'flex items-center gap-1 mt-1 text-sm',
                                            portfolioChange > 0 ? 'text-[var(--accent-green)]' : 'text-[var(--accent-red)]'
                                        )}>
                                            {portfolioChange > 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                                            <span>{Math.abs(portfolioChange).toFixed(2)}% since then</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Holdings List */}
                        <div>
                            <h3 className="text-sm font-medium text-[var(--foreground-muted)] mb-3">
                                Holdings ({currentSnapshot.holdings.length})
                            </h3>
                            <div className="space-y-2">
                                {currentSnapshot.holdings.length === 0 ? (
                                    <p className="text-center text-[var(--foreground-muted)] py-8 text-sm">
                                        No holdings in this snapshot
                                    </p>
                                ) : (
                                    currentSnapshot.holdings.map((holding, idx) => (
                                        <div
                                            key={idx}
                                            className="flex items-center gap-3 p-3 bg-[var(--background-secondary)] hover:bg-[var(--background-tertiary)] border border-[var(--border)] rounded-xl transition-colors"
                                        >
                                            {/* Token Icon */}
                                            {holding.logo ? (
                                                <img
                                                    src={holding.logo}
                                                    alt={holding.symbol}
                                                    className="w-10 h-10 rounded-full bg-[var(--background-tertiary)]"
                                                />
                                            ) : (
                                                <div className="w-10 h-10 rounded-full bg-[var(--background-tertiary)] flex items-center justify-center">
                                                    <DollarSign className="w-5 h-5" />
                                                </div>
                                            )}

                                            {/* Token Info */}
                                            <div className="flex-1 min-w-0">
                                                <p className=" font-medium">{holding.symbol}</p>
                                                <p className="text-xs text-[var(--foreground-muted)] truncate">
                                                    {holding.name}
                                                </p>
                                            </div>

                                            {/* Balance & Value */}
                                            <div className="text-right">
                                                <p className="font-semibold">
                                                    {hideBalances
                                                        ? '*****'
                                                        : formatCurrency(holding.valueUsd).formatted}
                                                </p>
                                                <p className="text-xs text-[var(--foreground-muted)] font-mono">
                                                    {hideBalances
                                                        ? '*****'
                                                        : parseFloat(holding.balance).toLocaleString(undefined, {
                                                            maximumFractionDigits: 6,
                                                        })}
                                                </p>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
