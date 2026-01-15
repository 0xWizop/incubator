'use client';

import { useState, useEffect } from 'react';
import { Eye, Plus, Search, Filter, Copy, Settings, X, ChevronDown, BellRing, BellOff, Lock, Sparkles } from 'lucide-react';
import { useWalletTracker } from '@/hooks/useWalletTracker';
import { AddWalletModal } from '@/components/tracker';
import { TrackedWallet, ChainId, CopySettings } from '@/types';
import { clsx } from 'clsx';
import { formatDistanceToNow } from 'date-fns';
import * as firebase from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { useSubscription } from '@/hooks/useSubscription';
import Link from 'next/link';

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
    const [copySettingsWallet, setCopySettingsWallet] = useState<TrackedWallet | null>(null);
    const { maxTrackedWallets, isPro, isBetaTester, isAdmin } = useSubscription();

    const hasFullAccess = isPro || isBetaTester || isAdmin;
    const walletsAtLimit = !hasFullAccess && wallets.length >= maxTrackedWallets;

    const filteredWallets = selectedChain === 'all'
        ? wallets
        : wallets.filter(w => w.chainId === selectedChain);

    const handleAddClick = () => {
        if (walletsAtLimit) {
            // Don't open modal, they need to upgrade
            return;
        }
        setShowAddModal(true);
    };

    return (
        <div className="h-full flex flex-col">
            {/* Header */}
            <div className="p-3 sm:p-4 border-b border-[var(--border)]">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-lg sm:text-xl font-bold flex items-center gap-2">
                            <Eye className="w-5 h-5 text-[var(--primary)]" />
                            Wallet Tracker
                        </h1>
                        <p className="text-xs text-[var(--foreground-muted)] mt-0.5 flex items-center gap-2">
                            Monitor & copy wallet trades
                            {!hasFullAccess && (
                                <span className={clsx(
                                    "px-1.5 py-0.5 rounded text-[10px] font-medium",
                                    walletsAtLimit
                                        ? "bg-[var(--accent-red)]/20 text-[var(--accent-red)]"
                                        : "bg-[var(--background-tertiary)] text-[var(--foreground-muted)]"
                                )}>
                                    {wallets.length}/{maxTrackedWallets} wallets
                                </span>
                            )}
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        {/* Chain Filter Dropdown */}
                        <div className="relative">
                            <select
                                value={selectedChain}
                                onChange={(e) => setSelectedChain(e.target.value as ChainId | 'all')}
                                className="appearance-none px-3 py-1.5 pr-7 rounded-lg text-xs font-medium bg-[var(--background-tertiary)] border border-[var(--border)] focus:border-[var(--primary)] outline-none cursor-pointer"
                            >
                                <option value="all">All</option>
                                <option value="ethereum">ETH</option>
                                <option value="base">Base</option>
                                <option value="arbitrum">ARB</option>
                                <option value="solana">SOL</option>
                            </select>
                            <Filter className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-[var(--foreground-muted)] pointer-events-none" />
                        </div>

                        {walletsAtLimit ? (
                            <Link
                                href="/#pricing"
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--primary)] text-black text-xs font-medium rounded-lg hover:opacity-90 transition-colors"
                            >
                                <Sparkles className="w-3.5 h-3.5" />
                                Upgrade
                            </Link>
                        ) : (
                            <button
                                onClick={handleAddClick}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--primary)] text-black text-xs font-medium rounded-lg hover:opacity-90 transition-colors"
                            >
                                <Plus className="w-3.5 h-3.5" />
                                Add
                            </button>
                        )}
                    </div>
                </div>

                {/* Upgrade banner when at limit */}
                {walletsAtLimit && (
                    <div className="mt-3 p-3 rounded-lg bg-[var(--primary)]/10 border border-[var(--primary)]/20 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Lock className="w-4 h-4 text-[var(--primary)]" />
                            <p className="text-xs text-[var(--foreground)]">
                                You've reached your limit of {maxTrackedWallets} tracked wallets.
                            </p>
                        </div>
                        <Link
                            href="/#pricing"
                            className="px-3 py-1.5 bg-[var(--primary)] text-black text-xs font-bold rounded-lg hover:opacity-90"
                        >
                            Upgrade to Pro
                        </Link>
                    </div>
                )}
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
                                onOpenCopySettings={() => setCopySettingsWallet(wallet)}
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

            {/* Copy Settings Modal */}
            {copySettingsWallet && (
                <CopySettingsModal
                    wallet={copySettingsWallet}
                    onClose={() => setCopySettingsWallet(null)}
                />
            )}
        </div>
    );
}

function WalletCard({
    wallet,
    onRemove,
    onToggleNotify,
    onOpenCopySettings,
}: {
    wallet: TrackedWallet;
    onRemove: () => void;
    onToggleNotify: () => void;
    onOpenCopySettings: () => void;
}) {
    const [isCopying, setIsCopying] = useState(false);
    const { firebaseUser } = useAuth();

    // Check if user is copying this wallet
    useEffect(() => {
        async function checkCopyStatus() {
            if (firebaseUser) {
                const isFollowing = await firebase.isFollowingTrader(firebaseUser.uid, wallet.id);
                setIsCopying(isFollowing);
            }
        }
        checkCopyStatus();
    }, [firebaseUser, wallet.id]);

    const shortenAddress = (addr: string) => `${addr.slice(0, 8)}...${addr.slice(-6)}`;

    return (
        <div className={clsx(
            "p-4 bg-[var(--background-secondary)] border rounded-xl hover:border-[var(--border-hover)] transition-all group",
            isCopying ? "border-[var(--primary)]/50" : "border-[var(--border)]"
        )}>
            <div className="flex items-start gap-3 mb-3">
                <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 relative">
                    <img src={CHAIN_LOGOS[wallet.chainId]} alt={wallet.chainId} className="w-full h-full object-cover" />
                    {isCopying && (
                        <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-[var(--primary)] rounded-full flex items-center justify-center">
                            <Copy className="w-2.5 h-2.5 text-black" />
                        </div>
                    )}
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <h3 className="font-bold truncate">{wallet.name}</h3>
                        {isCopying && (
                            <span className="px-1.5 py-0.5 bg-[var(--primary)]/20 text-[var(--primary)] text-[10px] font-medium rounded">
                                COPYING
                            </span>
                        )}
                    </div>
                    <p className="text-xs font-mono text-[var(--foreground-muted)]">
                        {shortenAddress(wallet.address)}
                    </p>
                </div>
            </div>

            {/* Action Buttons Row */}
            <div className="flex items-center gap-2 mb-3">
                <button
                    onClick={onOpenCopySettings}
                    className={clsx(
                        "flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors",
                        isCopying
                            ? "bg-[var(--primary)]/20 text-[var(--primary)] hover:bg-[var(--primary)]/30"
                            : "bg-[var(--background-tertiary)] hover:bg-[var(--background)] text-[var(--foreground)]"
                    )}
                >
                    <Copy className="w-3.5 h-3.5" />
                    {isCopying ? 'Copy Settings' : 'Copy Trades'}
                </button>
                <button
                    onClick={onToggleNotify}
                    className={clsx(
                        'px-3 py-2 rounded-lg text-xs font-medium transition-colors flex items-center justify-center',
                        wallet.notifyOnActivity
                            ? 'bg-[var(--primary)]/20 text-[var(--primary)]'
                            : 'bg-[var(--background-tertiary)] text-[var(--foreground-muted)]'
                    )}
                    title={wallet.notifyOnActivity ? 'Notifications On' : 'Notifications Off'}
                >
                    {wallet.notifyOnActivity ? (
                        <BellRing className="w-3.5 h-3.5" />
                    ) : (
                        <BellOff className="w-3.5 h-3.5" />
                    )}
                </button>
            </div>

            <div className="flex items-center justify-between text-xs text-[var(--foreground-muted)]">
                <span>
                    {wallet.lastActivityAt
                        ? `Last: ${formatDistanceToNow(wallet.lastActivityAt, { addSuffix: true })}`
                        : 'No activity yet'
                    }
                </span>
                <button
                    onClick={onRemove}
                    className="px-2 py-1 rounded bg-[var(--accent-red)]/10 text-[var(--accent-red)] text-[10px] font-medium hover:bg-[var(--accent-red)]/20 transition-colors opacity-0 group-hover:opacity-100"
                >
                    Remove
                </button>
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

function CopySettingsModal({ wallet, onClose }: { wallet: TrackedWallet; onClose: () => void }) {
    const { firebaseUser } = useAuth();
    const [isFollowing, setIsFollowing] = useState(false);
    const [loading, setLoading] = useState(false);
    const [settings, setSettings] = useState<CopySettings>({
        isActive: true,
        maxAmountPerTrade: 100,
        copyRatio: 0.25,
        minTradeSize: 50,
        stopLossPercent: 20,
    });

    useEffect(() => {
        async function checkStatus() {
            if (firebaseUser) {
                const following = await firebase.isFollowingTrader(firebaseUser.uid, wallet.id);
                setIsFollowing(following);
            }
        }
        checkStatus();
    }, [firebaseUser, wallet.id]);

    async function handleStartCopying() {
        if (!firebaseUser) return;
        setLoading(true);
        try {
            await firebase.followTrader(firebaseUser.uid, wallet.id, settings);
            setIsFollowing(true);
        } catch (error) {
            console.error('Failed to start copying:', error);
        } finally {
            setLoading(false);
        }
    }

    async function handleStopCopying() {
        if (!firebaseUser) return;
        setLoading(true);
        try {
            await firebase.unfollowTrader(firebaseUser.uid, wallet.id);
            setIsFollowing(false);
            onClose();
        } catch (error) {
            console.error('Failed to stop copying:', error);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-[var(--background)] border border-[var(--border)] rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-[var(--border)]">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full overflow-hidden">
                            <img src={CHAIN_LOGOS[wallet.chainId]} alt={wallet.chainId} className="w-full h-full object-cover" />
                        </div>
                        <div>
                            <h3 className="font-bold">{wallet.name}</h3>
                            <p className="text-xs text-[var(--foreground-muted)] font-mono">
                                {wallet.address.slice(0, 8)}...{wallet.address.slice(-6)}
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-[var(--background-tertiary)] rounded-lg">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-4 space-y-4">
                    {isFollowing ? (
                        <div className="p-3 rounded-lg bg-[var(--primary)]/10 border border-[var(--primary)]/20 text-center">
                            <Copy className="w-6 h-6 text-[var(--primary)] mx-auto mb-2" />
                            <p className="text-sm font-medium text-[var(--primary)]">Currently Copying</p>
                            <p className="text-xs text-[var(--foreground-muted)] mt-1">
                                You'll receive notifications when this wallet makes trades
                            </p>
                        </div>
                    ) : (
                        <>
                            <div>
                                <label className="text-xs text-[var(--foreground-muted)] mb-1 block">Max Amount Per Trade (USD)</label>
                                <input
                                    type="number"
                                    value={settings.maxAmountPerTrade}
                                    onChange={(e) => setSettings({ ...settings, maxAmountPerTrade: Number(e.target.value) })}
                                    className="w-full px-3 py-2 bg-[var(--background-secondary)] border border-[var(--border)] rounded-lg text-sm focus:outline-none focus:border-[var(--primary)]"
                                />
                            </div>

                            <div>
                                <label className="text-xs text-[var(--foreground-muted)] mb-1 block">Copy Ratio</label>
                                <select
                                    value={settings.copyRatio}
                                    onChange={(e) => setSettings({ ...settings, copyRatio: Number(e.target.value) })}
                                    className="w-full px-3 py-2 bg-[var(--background-secondary)] border border-[var(--border)] rounded-lg text-sm focus:outline-none focus:border-[var(--primary)]"
                                >
                                    <option value={0.1}>10% of their trade</option>
                                    <option value={0.25}>25% of their trade</option>
                                    <option value={0.5}>50% of their trade</option>
                                    <option value={1}>100% (Mirror exactly)</option>
                                </select>
                            </div>

                            <div>
                                <label className="text-xs text-[var(--foreground-muted)] mb-1 block">Min Trade Size (USD)</label>
                                <input
                                    type="number"
                                    value={settings.minTradeSize}
                                    onChange={(e) => setSettings({ ...settings, minTradeSize: Number(e.target.value) })}
                                    className="w-full px-3 py-2 bg-[var(--background-secondary)] border border-[var(--border)] rounded-lg text-sm focus:outline-none focus:border-[var(--primary)]"
                                />
                                <p className="text-[10px] text-[var(--foreground-muted)] mt-1">Skip trades smaller than this</p>
                            </div>

                            <div>
                                <label className="text-xs text-[var(--foreground-muted)] mb-1 block">Stop Loss (%)</label>
                                <input
                                    type="number"
                                    value={settings.stopLossPercent}
                                    onChange={(e) => setSettings({ ...settings, stopLossPercent: Number(e.target.value) })}
                                    className="w-full px-3 py-2 bg-[var(--background-secondary)] border border-[var(--border)] rounded-lg text-sm focus:outline-none focus:border-[var(--primary)]"
                                />
                                <p className="text-[10px] text-[var(--foreground-muted)] mt-1">Stop copying if total loss exceeds this %</p>
                            </div>
                        </>
                    )}

                    {/* Warning */}
                    <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                        <p className="text-xs text-amber-200/80">
                            <strong className="text-amber-500">How it works:</strong> When this wallet makes a trade, you'll receive a notification with a quick "Copy Trade" button. Trades are not executed automatically.
                        </p>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-[var(--border)] flex gap-3">
                    {isFollowing ? (
                        <>
                            <button
                                onClick={onClose}
                                className="flex-1 py-2.5 bg-[var(--background-tertiary)] rounded-lg text-sm font-medium hover:bg-[var(--background)] transition-colors"
                            >
                                Close
                            </button>
                            <button
                                onClick={handleStopCopying}
                                disabled={loading}
                                className="flex-1 py-2.5 bg-[var(--accent-red)]/20 text-[var(--accent-red)] rounded-lg text-sm font-medium hover:bg-[var(--accent-red)]/30 transition-colors disabled:opacity-50"
                            >
                                {loading ? 'Stopping...' : 'Stop Copying'}
                            </button>
                        </>
                    ) : (
                        <>
                            <button
                                onClick={onClose}
                                className="flex-1 py-2.5 bg-[var(--background-tertiary)] rounded-lg text-sm font-medium hover:bg-[var(--background)] transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleStartCopying}
                                disabled={loading || !firebaseUser}
                                className="flex-1 py-2.5 bg-[var(--primary)] text-black rounded-lg text-sm font-bold hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                <Copy className="w-4 h-4" />
                                {loading ? 'Starting...' : 'Start Copying'}
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
