'use client';

import { useState } from 'react';
import { Eye, Plus, Search, Filter } from 'lucide-react';
import { useWalletTracker } from '@/hooks/useWalletTracker';
import { AddWalletModal } from '@/components/tracker';
import { TrackedWallet, ChainId } from '@/types';
import { clsx } from 'clsx';
import { formatDistanceToNow } from 'date-fns';

const CHAIN_LOGOS: Record<string, string> = {
    ethereum: 'https://i.imgur.com/NKQlhQj.png',
    base: 'https://i.imgur.com/zn5hpMs.png',
    arbitrum: 'https://i.imgur.com/jmOXWlA.png',
    solana: 'https://i.imgur.com/xp7PYKk.png',
};

export default function TrackerPage() {
    const { wallets, activities, isLoading, addWallet, removeWallet, updateWallet } = useWalletTracker();
    const [showAddModal, setShowAddModal] = useState(false);
    const [selectedChain, setSelectedChain] = useState<ChainId | 'all'>('all');

    const filteredWallets = selectedChain === 'all'
        ? wallets
        : wallets.filter(w => w.chainId === selectedChain);

    return (
        <div className="h-full flex flex-col">
            {/* Header */}
            <div className="p-4 border-b border-[var(--border)]">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h1 className="text-2xl font-bold flex items-center gap-2">
                            <Eye className="w-6 h-6 text-[var(--primary)]" />
                            Wallet Tracker
                        </h1>
                        <p className="text-sm text-[var(--foreground-muted)] mt-1">
                            Monitor any wallet for trades and activity
                        </p>
                    </div>
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-[var(--primary)] text-black font-medium rounded-lg hover:opacity-90 transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                        Add Wallet
                    </button>
                </div>

                {/* Chain Filter */}
                <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-[var(--foreground-muted)]" />
                    <button
                        onClick={() => setSelectedChain('all')}
                        className={clsx(
                            'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                            selectedChain === 'all'
                                ? 'bg-[var(--primary)] text-black'
                                : 'bg-[var(--background-tertiary)] hover:bg-[var(--background)]'
                        )}
                    >
                        All Chains
                    </button>
                    {Object.entries(CHAIN_LOGOS).map(([id, logo]) => (
                        <button
                            key={id}
                            onClick={() => setSelectedChain(id as ChainId)}
                            className={clsx(
                                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                                selectedChain === id
                                    ? 'bg-[var(--primary)] text-black'
                                    : 'bg-[var(--background-tertiary)] hover:bg-[var(--background)]'
                            )}
                        >
                            <img src={logo} alt={id} className="w-4 h-4 rounded-full" />
                            <span className="capitalize">{id}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4">
                {isLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-32 bg-[var(--background-secondary)] rounded-xl animate-pulse" />
                        ))}
                    </div>
                ) : filteredWallets.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center text-[var(--foreground-muted)]">
                        <Eye className="w-16 h-16 mb-4 opacity-30" />
                        <p className="text-lg font-medium">No wallets tracked</p>
                        <p className="text-sm mt-1">Add a wallet to start monitoring its activity</p>
                        <button
                            onClick={() => setShowAddModal(true)}
                            className="mt-6 px-6 py-3 bg-[var(--primary)] text-black font-medium rounded-lg hover:opacity-90 transition-colors"
                        >
                            Track Your First Wallet
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredWallets.map(wallet => (
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
    const shortenAddress = (addr: string) => `${addr.slice(0, 8)}...${addr.slice(-6)}`;

    return (
        <div className="p-4 bg-[var(--background-secondary)] border border-[var(--border)] rounded-xl hover:border-[var(--border-hover)] transition-all group">
            <div className="flex items-start gap-3 mb-3">
                <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0">
                    <img src={CHAIN_LOGOS[wallet.chainId]} alt={wallet.chainId} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                    <h3 className="font-bold truncate">{wallet.name}</h3>
                    <p className="text-xs font-mono text-[var(--foreground-muted)]">
                        {shortenAddress(wallet.address)}
                    </p>
                </div>
            </div>

            <div className="flex items-center justify-between text-xs text-[var(--foreground-muted)]">
                <span>
                    {wallet.lastActivityAt
                        ? `Last: ${formatDistanceToNow(wallet.lastActivityAt, { addSuffix: true })}`
                        : 'No activity yet'
                    }
                </span>
                <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                        onClick={onToggleNotify}
                        className={clsx(
                            'px-2 py-1 rounded text-[10px] font-medium transition-colors',
                            wallet.notifyOnActivity
                                ? 'bg-[var(--primary)]/20 text-[var(--primary)]'
                                : 'bg-[var(--background-tertiary)]'
                        )}
                    >
                        {wallet.notifyOnActivity ? '🔔 On' : '🔕 Off'}
                    </button>
                    <button
                        onClick={onRemove}
                        className="px-2 py-1 rounded bg-[var(--accent-red)]/10 text-[var(--accent-red)] text-[10px] font-medium hover:bg-[var(--accent-red)]/20 transition-colors"
                    >
                        Remove
                    </button>
                </div>
            </div>

            <a
                href={`/app/explorer/detail?address=${wallet.address}&chain=${wallet.chainId}`}
                className="block mt-3 text-center py-2 bg-[var(--background-tertiary)] rounded-lg text-xs font-medium hover:bg-[var(--background)] transition-colors"
            >
                View in Explorer →
            </a>
        </div>
    );
}
