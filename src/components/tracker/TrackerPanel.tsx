'use client';

import { useState } from 'react';
import { Eye, Plus, X, Trash2, Zap, ZapOff, ExternalLink, BellRing, BellOff } from 'lucide-react';
import { clsx } from 'clsx';
import { formatDistanceToNow } from 'date-fns';
import { useWalletTracker } from '@/hooks/useWalletTracker';
import { AddWalletModal } from './AddWalletModal';
import { TrackedWallet } from '@/types';

const CHAIN_LOGOS: Record<string, string> = {
    ethereum: 'https://i.imgur.com/NKQlhQj.png',
    base: 'https://i.imgur.com/zn5hpMs.png',
    arbitrum: 'https://i.imgur.com/jmOXWlA.png',
    solana: 'https://i.imgur.com/xp7PYKk.png',
};

export function TrackerPanel({ onClose }: { onClose?: () => void }) {
    const { wallets, activities, isLoading, addWallet, removeWallet, updateWallet } = useWalletTracker();
    const [showAddModal, setShowAddModal] = useState(false);

    return (
        <div className="flex flex-col h-full bg-[var(--background)]">
            {/* Header */}
            <div className="flex items-center justify-between p-3 border-b border-[var(--border)] bg-[var(--background-secondary)]">
                <div className="flex items-center gap-2">
                    <Eye className="w-4 h-4 text-[var(--primary)]" />
                    <span className="text-sm font-bold">Wallet Tracker</span>
                    <span className="text-xs text-[var(--foreground-muted)]">({wallets.length}/10)</span>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="p-1.5 rounded-lg bg-[var(--primary)] text-black hover:opacity-90 transition-colors"
                        title="Add Wallet"
                    >
                        <Plus className="w-4 h-4" />
                    </button>
                    {onClose && (
                        <button
                            onClick={onClose}
                            className="p-1.5 rounded-lg hover:bg-[var(--background-tertiary)] transition-colors"
                            title="Close"
                        >
                            <X className="w-4 h-4 text-[var(--foreground-muted)]" />
                        </button>
                    )}
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
                {isLoading ? (
                    // Loading
                    <div className="p-4 space-y-3">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-20 bg-[var(--background-tertiary)] rounded-lg animate-pulse" />
                        ))}
                    </div>
                ) : wallets.length === 0 ? (
                    // Empty state
                    <div className="flex flex-col items-center justify-center p-8 text-center text-[var(--foreground-muted)]">
                        <Eye className="w-12 h-12 mb-3 opacity-30" />
                        <p className="text-sm font-medium">No wallets tracked</p>
                        <p className="text-xs mt-1">Add a wallet to monitor its activity</p>
                        <button
                            onClick={() => setShowAddModal(true)}
                            className="mt-4 px-4 py-2 bg-[var(--primary)] text-black text-sm font-medium rounded-lg hover:opacity-90 transition-colors"
                        >
                            Add Wallet
                        </button>
                    </div>
                ) : (
                    // Wallet list
                    <div className="divide-y divide-[var(--border)]">
                        {wallets.map(wallet => (
                            <WalletCard
                                key={wallet.id}
                                wallet={wallet}
                                onRemove={() => removeWallet(wallet.id)}
                                onToggleNotify={() => updateWallet(wallet.id, { notifyOnActivity: !wallet.notifyOnActivity })}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Add Modal */}
            <AddWalletModal
                isOpen={showAddModal}
                onClose={() => setShowAddModal(false)}
                onAdd={addWallet}
            />
        </div>
    );
}

function WalletCard({
    wallet,
    onRemove,
    onToggleNotify,
}: {
    wallet: TrackedWallet;
    onRemove: () => void;
    onToggleNotify: () => void;
}) {
    const [showActions, setShowActions] = useState(false);

    const shortenAddress = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`;

    return (
        <div
            className="p-3 hover:bg-[var(--background-tertiary)]/50 transition-colors"
            onMouseEnter={() => setShowActions(true)}
            onMouseLeave={() => setShowActions(false)}
        >
            <div className="flex items-start gap-3">
                {/* Chain logo */}
                <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0">
                    <img src={CHAIN_LOGOS[wallet.chainId]} alt={wallet.chainId} className="w-full h-full object-cover" />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <span className="font-medium text-sm truncate">{wallet.name}</span>
                        {wallet.notifyOnActivity ? (
                            <BellRing className="w-3.5 h-3.5 text-[var(--primary)]" />
                        ) : (
                            <BellOff className="w-3.5 h-3.5 text-[var(--foreground-muted)]/50" />
                        )}
                    </div>
                    <p className="text-xs font-mono text-[var(--foreground-muted)]">
                        {shortenAddress(wallet.address)}
                    </p>
                    {wallet.lastActivityAt && (
                        <p className="text-[10px] text-[var(--foreground-muted)] mt-0.5">
                            Last activity: {formatDistanceToNow(wallet.lastActivityAt, { addSuffix: true })}
                        </p>
                    )}
                </div>

                {/* Actions */}
                <div className={clsx(
                    'flex items-center gap-1 transition-opacity',
                    showActions ? 'opacity-100' : 'opacity-0'
                )}>
                    <button
                        onClick={onToggleNotify}
                        className="p-1.5 rounded-lg hover:bg-[var(--background-tertiary)] transition-colors"
                        title={wallet.notifyOnActivity ? 'Disable notifications' : 'Enable notifications'}
                    >
                        {wallet.notifyOnActivity ? (
                            <BellOff className="w-4 h-4 text-[var(--foreground-muted)]" />
                        ) : (
                            <BellRing className="w-4 h-4 text-[var(--foreground-muted)]" />
                        )}
                    </button>
                    <a
                        href={`/app/explorer/detail?type=address&id=${wallet.address}&chain=${wallet.chainId}`}
                        className="p-1.5 rounded-lg hover:bg-[var(--background-tertiary)] transition-colors"
                        title="View in explorer"
                    >
                        <ExternalLink className="w-4 h-4 text-[var(--foreground-muted)]" />
                    </a>
                    <button
                        onClick={onRemove}
                        className="p-1.5 rounded-lg hover:bg-[var(--accent-red)]/10 transition-colors"
                        title="Remove"
                    >
                        <Trash2 className="w-4 h-4 text-[var(--accent-red)]" />
                    </button>
                </div>
            </div>
        </div>
    );
}
