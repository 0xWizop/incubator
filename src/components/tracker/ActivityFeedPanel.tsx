'use client';

import { useState } from 'react';
import { Activity, X, ChevronRight, ArrowUpRight, ArrowDownRight, Filter } from 'lucide-react';
import { clsx } from 'clsx';
import { formatDistanceToNow } from 'date-fns';
import { WalletActivity, TrackedWallet, ChainId } from '@/types';

interface ActivityFeedPanelProps {
    isOpen: boolean;
    onClose: () => void;
    activities: WalletActivity[];
    wallets: TrackedWallet[];
}

// EVM chains only
const CHAIN_COLORS: Record<string, string> = {
    ethereum: '#627EEA',
    base: '#0052FF',
    arbitrum: '#28A0F0',
};

export function ActivityFeedPanel({ isOpen, onClose, activities, wallets }: ActivityFeedPanelProps) {
    const [filterWallet, setFilterWallet] = useState<string | 'all'>('all');

    // Use only real activities passed from parent
    const filteredActivities = filterWallet === 'all'
        ? activities
        : activities.filter(a => a.walletId === filterWallet);

    const getWalletName = (walletId: string) => {
        return wallets.find(w => w.id === walletId)?.name || 'Unknown';
    };

    const getWalletChain = (walletId: string): string => {
        return wallets.find(w => w.id === walletId)?.chainId || 'ethereum';
    };

    return (
        <>
            {/* Backdrop */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/40 z-40 lg:hidden"
                    onClick={onClose}
                />
            )}

            {/* Panel */}
            <div className={clsx(
                'fixed right-0 top-0 h-full bg-[var(--background)] border-l border-[var(--border)] z-50 transition-transform duration-300 flex flex-col',
                'w-[320px] lg:w-[360px]',
                isOpen ? 'translate-x-0' : 'translate-x-full'
            )}>
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-[var(--border)]">
                    <div className="flex items-center gap-2">
                        <Activity className="w-5 h-5 text-[var(--primary)]" />
                        <h2 className="font-bold">Activity Feed</h2>
                        {filteredActivities.length > 0 && (
                            <span className="px-2 py-0.5 bg-[var(--primary)]/20 text-[var(--primary)] text-xs font-medium rounded-full">
                                {filteredActivities.length}
                            </span>
                        )}
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 hover:bg-[var(--background-tertiary)] rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Filter */}
                <div className="p-3 border-b border-[var(--border)]">
                    <div className="relative">
                        <select
                            value={filterWallet}
                            onChange={(e) => setFilterWallet(e.target.value)}
                            className="w-full appearance-none px-3 py-2 pr-8 bg-[var(--background-secondary)] border border-[var(--border)] rounded-lg text-sm focus:outline-none focus:border-[var(--primary)]"
                        >
                            <option value="all">All Wallets</option>
                            {wallets.map(w => (
                                <option key={w.id} value={w.id}>{w.name}</option>
                            ))}
                        </select>
                        <Filter className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--foreground-muted)] pointer-events-none" />
                    </div>
                </div>

                {/* Activity List */}
                <div className="flex-1 overflow-y-auto">
                    {filteredActivities.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-[var(--foreground-muted)] p-6">
                            <Activity className="w-12 h-12 mb-3 opacity-20" />
                            <p className="text-sm font-medium">No activity yet</p>
                            <p className="text-xs mt-1 text-center opacity-60">
                                Activity from tracked wallets will appear here when Alchemy detects transactions
                            </p>
                        </div>
                    ) : (
                        <div className="divide-y divide-[var(--border)]/50">
                            {filteredActivities.map((activity) => (
                                <ActivityItem
                                    key={activity.id}
                                    activity={activity}
                                    walletName={getWalletName(activity.walletId)}
                                    chainColor={CHAIN_COLORS[getWalletChain(activity.walletId)] || '#627EEA'}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}

function ActivityItem({
    activity,
    walletName,
    chainColor,
}: {
    activity: WalletActivity;
    walletName: string;
    chainColor: string;
}) {
    const isBuy = activity.type === 'buy' || (activity.type === 'swap' && activity.tokenOut);
    const token = isBuy ? activity.tokenOut : activity.tokenIn;
    const timeAgo = formatDistanceToNow(activity.timestamp, { addSuffix: true });

    return (
        <div className="p-3 hover:bg-[var(--background-secondary)] transition-colors group">
            <div className="flex items-start gap-3">
                {/* Action Icon */}
                <div className={clsx(
                    'w-8 h-8 rounded-lg flex items-center justify-center shrink-0',
                    isBuy ? 'bg-[var(--accent-green)]/10' : 'bg-[var(--accent-red)]/10'
                )}>
                    {isBuy ? (
                        <ArrowDownRight className="w-4 h-4 text-[var(--accent-green)]" />
                    ) : (
                        <ArrowUpRight className="w-4 h-4 text-[var(--accent-red)]" />
                    )}
                </div>

                <div className="flex-1 min-w-0">
                    {/* Wallet Name */}
                    <div className="flex items-center gap-2 mb-1">
                        <span
                            className="w-2 h-2 rounded-full shrink-0"
                            style={{ backgroundColor: chainColor }}
                        />
                        <span className="text-xs font-medium truncate">{walletName}</span>
                        <span className="text-[10px] text-[var(--foreground-muted)]">{timeAgo}</span>
                    </div>

                    {/* Action */}
                    <p className="text-sm">
                        <span className={isBuy ? 'text-[var(--accent-green)]' : 'text-[var(--accent-red)]'}>
                            {isBuy ? 'Bought' : 'Sold'}
                        </span>
                        {' '}
                        <span className="font-medium">{token?.symbol || 'Token'}</span>
                    </p>

                    {/* Amount */}
                    <p className="text-xs text-[var(--foreground-muted)]">
                        ${activity.totalUsd.toLocaleString()}
                    </p>
                </div>

                {/* View */}
                <button className="p-1.5 opacity-0 group-hover:opacity-100 hover:bg-[var(--background-tertiary)] rounded-lg transition-all">
                    <ChevronRight className="w-4 h-4 text-[var(--foreground-muted)]" />
                </button>
            </div>
        </div>
    );
}
