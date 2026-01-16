'use client';

import { useState, useEffect } from 'react';
import {
    TrendingUp,
    TrendingDown,
    DollarSign,
    Activity,
    BarChart3,
    PieChart,
    ArrowUpRight,
    ArrowDownRight,
    Wallet,
    User as UserIcon,
    FileText,
    Download,
} from 'lucide-react';
import { clsx } from 'clsx';
import { useAppStore } from '@/store';
import * as firebase from '@/lib/firebase';
import { User, Trade, ChainId } from '@/types';
import { useAuth } from '@/context/AuthContext';

import { useWalletStore } from '@/store/walletStore';
import { useWallet } from '@/hooks/useWallet';
import { ConnectPrompt } from '@/components/ui/ConnectPrompt';
import { TransactionHistory } from '@/components/tax';

import { Suspense } from 'react';

import { LoadingSpinner } from '@/components/ui/Loading';
import { PnLCalculator } from '@/components/dashboard/PnLCalculator';

export default function DashboardPage() {
    return (
        <Suspense fallback={<LoadingSpinner fullHeight size="lg" text="Loading dashboard..." />}>
            <DashboardContent />
        </Suspense>
    );
}

function DashboardContent() {
    const { address, isConnected, connect } = useWallet();
    const { firebaseUser, user: authUser } = useAuth();
    const [user, setUser] = useState<User | null>(null);
    const [trades, setTrades] = useState<Trade[]>([]);
    const [loading, setLoading] = useState(false);
    const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d' | 'all'>('7d');
    const [showTaxModal, setShowTaxModal] = useState(false);

    // Get display name from auth or wallet
    const displayName = firebaseUser?.displayName || (address ? `${address.slice(0, 6)}...${address.slice(-4)}` : 'Trader');

    useEffect(() => {
        if (isConnected && address) {
            loadUserData(address);
        } else if (firebaseUser) {
            // Load data by Firebase UID if no wallet connected
            loadUserData(firebaseUser.uid);
        }
    }, [isConnected, address, firebaseUser]);

    async function loadUserData(addr: string) {
        setLoading(true);
        try {
            const userData = await firebase.getUser(addr);
            if (userData) {
                setUser(userData);
                const userTrades = await firebase.getUserTrades(addr);
                setTrades(userTrades);
            }
        } catch (error) {
            console.error('Error loading user data:', error);
        } finally {
            setLoading(false);
        }
    }

    // Calculate stats from trades
    const totalVolume = trades.reduce((acc, t) => acc + t.amountInUsd, 0);
    const totalTrades = trades.length;
    // Mock PnL since we don't track exit price yet fully
    const totalPnL = 0;

    if (loading) {
        return <LoadingSpinner fullHeight size="lg" text="Syncing portfolio data..." />;
    }

    return (
        <div className="h-full overflow-y-auto overscroll-contain">
            <div className="px-4 py-4 sm:px-6 sm:py-6 max-w-7xl mx-auto pb-24 lg:pb-6">
                {/* Header - Clean and minimal */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">Dashboard</h1>
                        <p className="text-sm text-[var(--foreground-muted)] mt-0.5">
                            {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : 'Connect wallet to view stats'}
                        </p>
                    </div>
                    <div className="flex items-center gap-1 text-xs sm:text-sm">
                        {(['24h', '7d', '30d', 'all'] as const).map((range) => (
                            <button
                                key={range}
                                onClick={() => setTimeRange(range)}
                                className={clsx(
                                    'px-3 py-1.5 rounded-md font-medium transition-all',
                                    timeRange === range
                                        ? 'bg-[var(--primary)] text-white'
                                        : 'text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:bg-[var(--background-tertiary)]'
                                )}
                            >
                                {range === 'all' ? 'All' : range}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Stats Grid - Clean cards */}
                <div className="grid grid-cols-3 gap-3 sm:gap-4 mb-6">
                    <div className="bg-[var(--background-secondary)] border border-[var(--border)] rounded-xl p-4 hover:border-[var(--border-hover)] transition-colors">
                        <div className="flex items-center gap-2 mb-3">
                            <div className="p-1.5 rounded-lg bg-[var(--accent-green)]/10">
                                <TrendingUp className="w-4 h-4 text-[var(--accent-green)]" />
                            </div>
                            <span className="text-xs sm:text-sm text-[var(--foreground-muted)]">Total P&L</span>
                        </div>
                        <p className="text-lg sm:text-2xl font-semibold text-[var(--accent-green)]">
                            +${totalPnL.toFixed(2)}
                        </p>
                        <p className="text-xs text-[var(--foreground-muted)] mt-1 hidden sm:block">
                            <span className="text-[var(--accent-green)]">+0.0%</span> vs last period
                        </p>
                    </div>

                    <div className="bg-[var(--background-secondary)] border border-[var(--border)] rounded-xl p-4 hover:border-[var(--border-hover)] transition-colors">
                        <div className="flex items-center gap-2 mb-3">
                            <div className="p-1.5 rounded-lg bg-[var(--primary)]/10">
                                <Activity className="w-4 h-4 text-[var(--primary)]" />
                            </div>
                            <span className="text-xs sm:text-sm text-[var(--foreground-muted)]">Volume</span>
                        </div>
                        <p className="text-lg sm:text-2xl font-semibold">
                            ${totalVolume.toLocaleString()}
                        </p>
                        <p className="text-xs text-[var(--foreground-muted)] mt-1 hidden sm:block">
                            {totalTrades} trades
                        </p>
                    </div>

                    <div className="bg-[var(--background-secondary)] border border-[var(--border)] rounded-xl p-4 hover:border-[var(--border-hover)] transition-colors">
                        <div className="flex items-center gap-2 mb-3">
                            <div className="p-1.5 rounded-lg bg-[var(--accent-purple)]/10">
                                <BarChart3 className="w-4 h-4 text-[var(--accent-purple)]" />
                            </div>
                            <span className="text-xs sm:text-sm text-[var(--foreground-muted)]">Avg Trade</span>
                        </div>
                        <p className="text-lg sm:text-2xl font-semibold">
                            ${totalTrades > 0 ? (totalVolume / totalTrades).toFixed(0) : '0'}
                        </p>
                    </div>
                </div>

                {/* Tax Export - Inline minimal */}
                <div className="flex items-center justify-between py-3 px-4 mb-6 bg-[var(--background-secondary)] border border-[var(--border)] rounded-xl">
                    <div className="flex items-center gap-3">
                        <FileText className="w-4 h-4 text-[var(--foreground-muted)]" />
                        <div>
                            <p className="text-sm font-medium">Tax Reports</p>
                            <p className="text-xs text-[var(--foreground-muted)]">Export transaction history</p>
                        </div>
                    </div>
                    <button
                        onClick={() => isConnected ? setShowTaxModal(true) : connect()}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg bg-[var(--background-tertiary)] hover:bg-[var(--background)] border border-[var(--border)] transition-all"
                    >
                        <Download className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">{isConnected ? 'Export' : 'Connect'}</span>
                    </button>
                </div>

                {/* Main Content Grid */}
                <div className="grid lg:grid-cols-3 gap-4 sm:gap-6">
                    {/* Recent Trades */}
                    <div className="lg:col-span-2 bg-[var(--background-secondary)] border border-[var(--border)] rounded-xl p-4 sm:p-5">
                        <h2 className="text-sm sm:text-base font-semibold mb-4">Recent Swaps</h2>

                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="text-xs text-[var(--foreground-muted)]">
                                        <th className="text-left pb-3 font-medium">Time</th>
                                        <th className="text-left pb-3 font-medium">Pair</th>
                                        <th className="text-right pb-3 font-medium">In</th>
                                        <th className="text-right pb-3 font-medium">Out</th>
                                        <th className="text-right pb-3 font-medium hidden sm:table-cell">Tx</th>
                                    </tr>
                                </thead>
                                <tbody className="text-sm">
                                    {!isConnected ? (
                                        <tr>
                                            <td colSpan={5} className="py-12">
                                                <ConnectPrompt message="Connect wallet to see your trading history" onConnect={connect} />
                                            </td>
                                        </tr>
                                    ) : trades.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="text-center py-12 text-[var(--foreground-muted)]">
                                                No trades yet. Start trading!
                                            </td>
                                        </tr>
                                    ) : (
                                        trades.slice(0, 10).map((trade, i) => (
                                            <tr
                                                key={trade.id}
                                                className={clsx(
                                                    "hover:bg-[var(--background-tertiary)] transition-colors",
                                                    i < trades.length - 1 && "border-b border-[var(--border)]/50"
                                                )}
                                            >
                                                <td className="py-3 text-[var(--foreground-muted)] text-xs">
                                                    {new Date(trade.timestamp).toLocaleDateString()}
                                                </td>
                                                <td className="py-3 font-medium text-xs">
                                                    {trade.tokenIn.slice(0, 4)} → {trade.tokenOut.slice(0, 4)}
                                                </td>
                                                <td className="py-3 text-right font-mono text-xs">
                                                    {parseFloat(trade.amountIn).toFixed(2)}
                                                </td>
                                                <td className="py-3 text-right font-mono text-xs">
                                                    {parseFloat(trade.amountOut).toFixed(2)}
                                                </td>
                                                <td className="py-3 text-right hidden sm:table-cell">
                                                    <a href="#" className="text-[var(--primary)] hover:underline text-xs font-mono">
                                                        {trade.txHash.slice(0, 6)}...
                                                    </a>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Right Sidebar */}
                    <div className="lg:col-span-1 flex flex-col gap-4">
                        <div className="bg-[var(--background-secondary)] border border-[var(--border)] rounded-xl overflow-hidden">
                            <PnLCalculator />
                        </div>
                    </div>
                </div>
            </div>

            {/* Tax Export Modal */}
            {showTaxModal && (
                <TransactionHistory onClose={() => setShowTaxModal(false)} />
            )}
        </div>
    );
}
