'use client';

import { useState, useEffect } from 'react';
import {
    Eye, Plus, Filter, Copy, X, BellRing, BellOff, Lock, Sparkles,
    Activity, TrendingUp, ArrowUpRight, ExternalLink, Wallet,
    MoreHorizontal, Trash2
} from 'lucide-react';
import { useWalletTracker } from '@/hooks/useWalletTracker';
import { AddWalletModal, ActivityFeedPanel } from '@/components/tracker';
import { TrackedWallet, ChainId, CopySettings } from '@/types';
import { clsx } from 'clsx';
import { formatDistanceToNow } from 'date-fns';
import * as firebase from '@/lib/firebase';
import * as alchemy from '@/lib/services/alchemy';
import { useAuth } from '@/context/AuthContext';
import { useSubscription } from '@/hooks/useSubscription';
import Link from 'next/link';

// EVM chains only (Alchemy supported)
const CHAIN_CONFIG: Record<string, { logo: string; name: string; color: string }> = {
    ethereum: { logo: 'https://i.imgur.com/NKQlhQj.png', name: 'Ethereum', color: '#627EEA' },
    base: { logo: 'https://i.imgur.com/zn5hpMs.png', name: 'Base', color: '#0052FF' },
    arbitrum: { logo: 'https://i.imgur.com/jmOXWlA.png', name: 'Arbitrum', color: '#28A0F0' },
};

export default function TrackerPage() {
    const { wallets, activities, isLoading, addWallet, removeWallet, updateWallet } = useWalletTracker();
    const [showAddModal, setShowAddModal] = useState(false);
    const [showActivityPanel, setShowActivityPanel] = useState(false);
    const [selectedChain, setSelectedChain] = useState<ChainId | 'all'>('all');
    const [copySettingsWallet, setCopySettingsWallet] = useState<TrackedWallet | null>(null);
    const { maxTrackedWallets, isPro, isBetaTester, isAdmin } = useSubscription();

    const hasFullAccess = isPro || isBetaTester || isAdmin;
    const walletsAtLimit = !hasFullAccess && wallets.length >= maxTrackedWallets;

    const filteredWallets = selectedChain === 'all'
        ? wallets
        : wallets.filter(w => w.chainId === selectedChain);

    const handleAddClick = () => {
        if (walletsAtLimit) return;
        setShowAddModal(true);
    };

    return (
        <div className="h-full flex flex-col">
            {/* Header */}
            <div className="p-4 border-b border-[var(--border)] bg-[var(--background)]">
                {/* Title Row */}
                <div className="flex items-center justify-between mb-3 sm:mb-0">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-[var(--primary)]/10 rounded-xl">
                            <Eye className="w-5 h-5 text-[var(--primary)]" />
                        </div>
                        <div>
                            <h1 className="text-lg font-bold">Wallet Tracker</h1>
                            <p className="text-xs text-[var(--foreground-muted)]">
                                Monitor & copy trades
                                {!hasFullAccess && (
                                    <span className={clsx(
                                        "ml-2 px-1.5 py-0.5 rounded text-[10px] font-medium",
                                        walletsAtLimit
                                            ? "bg-[var(--accent-red)]/20 text-[var(--accent-red)]"
                                            : "bg-[var(--background-tertiary)] text-[var(--foreground-muted)]"
                                    )}>
                                        {wallets.length}/{maxTrackedWallets}
                                    </span>
                                )}
                            </p>
                        </div>
                    </div>

                    {/* Desktop Add Button */}
                    <div className="hidden sm:block">
                        {walletsAtLimit ? (
                            <Link
                                href="/#pricing"
                                className="flex items-center gap-1.5 px-4 py-1.5 bg-[var(--primary)] text-black text-xs font-bold rounded-lg hover:opacity-90 transition-all"
                            >
                                <Sparkles className="w-3.5 h-3.5" />
                                Upgrade
                            </Link>
                        ) : (
                            <button
                                onClick={handleAddClick}
                                className="flex items-center gap-1.5 px-4 py-1.5 bg-[var(--primary)] text-black text-xs font-bold rounded-lg hover:opacity-90 transition-all"
                            >
                                <Plus className="w-3.5 h-3.5" />
                                Track
                            </button>
                        )}
                    </div>
                </div>

                {/* Actions Row - Stack on mobile */}
                <div className="flex items-center gap-2 flex-wrap">
                    {/* Activity Panel Toggle */}
                    <button
                        onClick={() => setShowActivityPanel(true)}
                        className="relative flex items-center gap-1.5 px-3 py-1.5 bg-[var(--background-secondary)] border border-[var(--border)] rounded-lg text-xs font-medium hover:border-[var(--primary)] transition-colors"
                    >
                        <Activity className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Activity</span>
                        {activities.length > 0 && (
                            <span className="absolute -top-1 -right-1 w-4 h-4 bg-[var(--primary)] text-black text-[10px] font-bold rounded-full flex items-center justify-center">
                                {activities.length}
                            </span>
                        )}
                    </button>

                    {/* Chain Filter */}
                    <div className="relative">
                        <select
                            value={selectedChain}
                            onChange={(e) => setSelectedChain(e.target.value as ChainId | 'all')}
                            className="appearance-none px-3 py-1.5 pr-7 rounded-lg text-xs font-medium bg-[var(--background-secondary)] border border-[var(--border)] hover:border-[var(--primary)] focus:border-[var(--primary)] outline-none cursor-pointer transition-colors"
                        >
                            <option value="all">All Chains</option>
                            <option value="ethereum">Ethereum</option>
                            <option value="base">Base</option>
                            <option value="arbitrum">Arbitrum</option>
                        </select>
                        <Filter className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-[var(--foreground-muted)] pointer-events-none" />
                    </div>

                    {/* Mobile Add Button */}
                    <div className="sm:hidden ml-auto">
                        {walletsAtLimit ? (
                            <Link
                                href="/#pricing"
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--primary)] text-black text-xs font-bold rounded-lg hover:opacity-90 transition-all"
                            >
                                <Sparkles className="w-3.5 h-3.5" />
                                Upgrade
                            </Link>
                        ) : (
                            <button
                                onClick={handleAddClick}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--primary)] text-black text-xs font-bold rounded-lg hover:opacity-90 transition-all"
                            >
                                <Plus className="w-3.5 h-3.5" />
                                Track
                            </button>
                        )}
                    </div>
                </div>

                {/* Upgrade Banner */}
                {walletsAtLimit && (
                    <div className="mt-3 p-3 rounded-xl bg-gradient-to-r from-[var(--primary)]/10 to-[var(--accent-purple)]/10 border border-[var(--primary)]/20 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Lock className="w-4 h-4 text-[var(--primary)]" />
                            <p className="text-xs">
                                <span className="font-medium">Limit reached.</span>
                                <span className="text-[var(--foreground-muted)]"> Upgrade to track unlimited wallets.</span>
                            </p>
                        </div>
                        <Link
                            href="/#pricing"
                            className="px-3 py-1.5 bg-[var(--primary)] text-black text-xs font-bold rounded-lg hover:opacity-90"
                        >
                            Go Pro
                        </Link>
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4">
                {isLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-48 bg-[var(--background-secondary)] rounded-2xl animate-pulse" />
                        ))}
                    </div>
                ) : filteredWallets.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                        <div className="w-20 h-20 rounded-2xl bg-[var(--background-secondary)] flex items-center justify-center mb-6">
                            <Wallet className="w-10 h-10 text-[var(--foreground-muted)] opacity-40" />
                        </div>
                        <h2 className="text-lg font-bold mb-2">No wallets tracked</h2>
                        <p className="text-sm text-[var(--foreground-muted)] mb-6 max-w-sm">
                            Add a wallet address to monitor its trading activity and get notified on new trades.
                        </p>
                        <button
                            onClick={() => setShowAddModal(true)}
                            className="px-6 py-3 bg-[var(--primary)] text-black font-bold rounded-xl hover:opacity-90 transition-all flex items-center gap-2"
                        >
                            <Plus className="w-4 h-4" />
                            Track Your First Wallet
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
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

            {/* Activity Feed Panel */}
            <ActivityFeedPanel
                isOpen={showActivityPanel}
                onClose={() => setShowActivityPanel(false)}
                activities={activities}
                wallets={wallets}
            />

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
    const [stats, setStats] = useState<alchemy.WalletStats | null>(null);
    const [isLoadingStats, setIsLoadingStats] = useState(true);
    const { firebaseUser } = useAuth();
    const chainConfig = CHAIN_CONFIG[wallet.chainId] || CHAIN_CONFIG.ethereum;

    // Fetch real wallet stats from Alchemy
    useEffect(() => {
        async function fetchStats() {
            setIsLoadingStats(true);
            try {
                const walletStats = await alchemy.getWalletStats(wallet.chainId, wallet.address);
                setStats(walletStats);
            } catch (error) {
                console.error('Error fetching wallet stats:', error);
            } finally {
                setIsLoadingStats(false);
            }
        }
        fetchStats();
    }, [wallet.chainId, wallet.address]);

    useEffect(() => {
        async function checkCopyStatus() {
            if (firebaseUser) {
                const isFollowing = await firebase.isFollowingTrader(firebaseUser.uid, wallet.id);
                setIsCopying(isFollowing);
            }
        }
        checkCopyStatus();
    }, [firebaseUser, wallet.id]);

    const shortenAddress = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`;

    return (
        <div className={clsx(
            "relative p-4 bg-[var(--background-secondary)] border rounded-2xl transition-all group hover:shadow-lg",
            isCopying
                ? "border-[var(--primary)]/50 shadow-[0_0_20px_rgba(255,176,0,0.1)]"
                : "border-[var(--border)] hover:border-[var(--border-hover)]",
            stats && stats.activityCount > 0 && "ring-1 ring-[var(--accent-green)]/30"
        )}>
            {/* Active Indicator */}
            {stats && stats.activityCount > 0 && (
                <div className="absolute top-3 right-3 flex items-center gap-1.5">
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--accent-green)] opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--accent-green)]"></span>
                    </span>
                    <span className="text-[10px] text-[var(--accent-green)] font-medium">Active</span>
                </div>
            )}

            {/* Header */}
            <div className="flex items-start gap-3 mb-4">
                <div className="relative">
                    <div
                        className="w-12 h-12 rounded-xl overflow-hidden border-2"
                        style={{ borderColor: chainConfig.color }}
                    >
                        <img src={chainConfig.logo} alt={wallet.chainId} className="w-full h-full object-cover" />
                    </div>
                    {isCopying && (
                        <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-[var(--primary)] rounded-full flex items-center justify-center">
                            <Copy className="w-3 h-3 text-black" />
                        </div>
                    )}
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <h3 className="font-bold truncate">{wallet.name}</h3>
                        {isCopying && (
                            <span className="px-1.5 py-0.5 bg-[var(--primary)]/20 text-[var(--primary)] text-[10px] font-bold rounded">
                                COPY
                            </span>
                        )}
                    </div>
                    <button
                        onClick={() => navigator.clipboard.writeText(wallet.address)}
                        className="text-xs font-mono text-[var(--foreground-muted)] hover:text-[var(--primary)] transition-colors"
                    >
                        {shortenAddress(wallet.address)}
                    </button>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-2 mb-4 p-3 bg-[var(--background-tertiary)] rounded-xl">
                <div className="text-center">
                    <p className="text-[10px] text-[var(--foreground-muted)] mb-0.5">Balance</p>
                    {isLoadingStats ? (
                        <div className="h-5 w-16 mx-auto bg-[var(--background)] rounded animate-pulse" />
                    ) : (
                        <p className="text-sm font-bold">${(stats?.balance || 0).toLocaleString()}</p>
                    )}
                </div>
                <div className="text-center border-l border-[var(--border)]">
                    <p className="text-[10px] text-[var(--foreground-muted)] mb-0.5">24h Activity</p>
                    {isLoadingStats ? (
                        <div className="h-5 w-8 mx-auto bg-[var(--background)] rounded animate-pulse" />
                    ) : (
                        <p className="text-sm font-bold">{stats?.activityCount || 0}</p>
                    )}
                </div>
            </div>

            {/* Recent Tokens */}
            {stats && stats.recentTokens && stats.recentTokens.length > 0 && (
                <div className="flex items-center gap-2 mb-4">
                    <span className="text-[10px] text-[var(--foreground-muted)]">Recent:</span>
                    <div className="flex gap-1 flex-wrap">
                        {stats.recentTokens.map(token => (
                            <span
                                key={token}
                                className="px-2 py-0.5 bg-[var(--background)] border border-[var(--border)] rounded text-[10px] font-medium"
                            >
                                {token}
                            </span>
                        ))}
                    </div>
                </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-2">
                <button
                    onClick={onOpenCopySettings}
                    className={clsx(
                        "flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all",
                        isCopying
                            ? "bg-[var(--primary)] text-black"
                            : "bg-[var(--background-tertiary)] hover:bg-[var(--background)] border border-[var(--border)]"
                    )}
                >
                    <Copy className="w-3.5 h-3.5" />
                    {isCopying ? 'Settings' : 'Copy Trades'}
                </button>

                <button
                    onClick={onToggleNotify}
                    className={clsx(
                        'p-2 rounded-lg transition-all',
                        wallet.notifyOnActivity
                            ? 'bg-[var(--primary)]/20 text-[var(--primary)]'
                            : 'bg-[var(--background-tertiary)] text-[var(--foreground-muted)] hover:text-[var(--foreground)]'
                    )}
                    title={wallet.notifyOnActivity ? 'Notifications On' : 'Notifications Off'}
                >
                    {wallet.notifyOnActivity ? <BellRing className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
                </button>

                <a
                    href={`/app/explorer/detail?address=${wallet.address}&chain=${wallet.chainId}`}
                    className="p-2 rounded-lg bg-[var(--background-tertiary)] text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-all"
                    title="View in Explorer"
                >
                    <ExternalLink className="w-4 h-4" />
                </a>

                <button
                    onClick={onRemove}
                    className="p-2 rounded-lg bg-[var(--accent-red)]/10 text-[var(--accent-red)] hover:bg-[var(--accent-red)]/20 transition-all opacity-0 group-hover:opacity-100"
                    title="Remove wallet"
                >
                    <Trash2 className="w-4 h-4" />
                </button>
            </div>

            {/* Last Activity */}
            <p className="mt-3 pt-3 border-t border-[var(--border)] text-[10px] text-[var(--foreground-muted)]">
                {wallet.lastActivityAt
                    ? `Last activity: ${formatDistanceToNow(wallet.lastActivityAt, { addSuffix: true })}`
                    : 'No recent activity'
                }
            </p>
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
    const chainConfig = CHAIN_CONFIG[wallet.chainId] || CHAIN_CONFIG.ethereum;

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
                        <div
                            className="w-10 h-10 rounded-xl overflow-hidden border-2"
                            style={{ borderColor: chainConfig.color }}
                        >
                            <img src={chainConfig.logo} alt={wallet.chainId} className="w-full h-full object-cover" />
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
                        <div className="p-4 rounded-xl bg-[var(--primary)]/10 border border-[var(--primary)]/20 text-center">
                            <Copy className="w-8 h-8 text-[var(--primary)] mx-auto mb-2" />
                            <p className="text-sm font-medium text-[var(--primary)]">Currently Copying</p>
                            <p className="text-xs text-[var(--foreground-muted)] mt-1">
                                You'll receive notifications when this wallet makes trades
                            </p>
                        </div>
                    ) : (
                        <>
                            <div>
                                <label className="text-xs text-[var(--foreground-muted)] mb-1.5 block">Max Per Trade (USD)</label>
                                <input
                                    type="number"
                                    value={settings.maxAmountPerTrade}
                                    onChange={(e) => setSettings({ ...settings, maxAmountPerTrade: Number(e.target.value) })}
                                    className="w-full px-3 py-2.5 bg-[var(--background-secondary)] border border-[var(--border)] rounded-xl text-sm focus:outline-none focus:border-[var(--primary)]"
                                />
                            </div>

                            <div>
                                <label className="text-xs text-[var(--foreground-muted)] mb-1.5 block">Copy Ratio</label>
                                <select
                                    value={settings.copyRatio}
                                    onChange={(e) => setSettings({ ...settings, copyRatio: Number(e.target.value) })}
                                    className="w-full px-3 py-2.5 bg-[var(--background-secondary)] border border-[var(--border)] rounded-xl text-sm focus:outline-none focus:border-[var(--primary)]"
                                >
                                    <option value={0.1}>10% of their trade</option>
                                    <option value={0.25}>25% of their trade</option>
                                    <option value={0.5}>50% of their trade</option>
                                    <option value={1}>100% (Mirror)</option>
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs text-[var(--foreground-muted)] mb-1.5 block">Min Trade (USD)</label>
                                    <input
                                        type="number"
                                        value={settings.minTradeSize}
                                        onChange={(e) => setSettings({ ...settings, minTradeSize: Number(e.target.value) })}
                                        className="w-full px-3 py-2.5 bg-[var(--background-secondary)] border border-[var(--border)] rounded-xl text-sm focus:outline-none focus:border-[var(--primary)]"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-[var(--foreground-muted)] mb-1.5 block">Stop Loss %</label>
                                    <input
                                        type="number"
                                        value={settings.stopLossPercent}
                                        onChange={(e) => setSettings({ ...settings, stopLossPercent: Number(e.target.value) })}
                                        className="w-full px-3 py-2.5 bg-[var(--background-secondary)] border border-[var(--border)] rounded-xl text-sm focus:outline-none focus:border-[var(--primary)]"
                                    />
                                </div>
                            </div>
                        </>
                    )}

                    {/* Info */}
                    <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
                        <p className="text-xs text-amber-200/80">
                            <strong className="text-amber-500">How it works:</strong> When this wallet trades, you'll get a notification with a "Copy Trade" button. Trades are manual, not automatic.
                        </p>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-[var(--border)] flex gap-3">
                    {isFollowing ? (
                        <>
                            <button
                                onClick={onClose}
                                className="flex-1 py-2.5 bg-[var(--background-tertiary)] rounded-xl text-sm font-medium hover:bg-[var(--background)] transition-colors"
                            >
                                Close
                            </button>
                            <button
                                onClick={handleStopCopying}
                                disabled={loading}
                                className="flex-1 py-2.5 bg-[var(--accent-red)]/20 text-[var(--accent-red)] rounded-xl text-sm font-medium hover:bg-[var(--accent-red)]/30 disabled:opacity-50 transition-colors"
                            >
                                {loading ? 'Stopping...' : 'Stop Copying'}
                            </button>
                        </>
                    ) : (
                        <>
                            <button
                                onClick={onClose}
                                className="flex-1 py-2.5 bg-[var(--background-tertiary)] rounded-xl text-sm font-medium hover:bg-[var(--background)] transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleStartCopying}
                                disabled={loading || !firebaseUser}
                                className="flex-1 py-2.5 bg-[var(--primary)] text-black rounded-xl text-sm font-bold hover:opacity-90 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
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
