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
} from 'lucide-react';
import { clsx } from 'clsx';
import { useAppStore } from '@/store';
import * as firebase from '@/lib/firebase';
import { User, Trade, ChainId } from '@/types';
import { useAuth } from '@/context/AuthContext';

import { useWalletStore } from '@/store/walletStore';

// Use real wallet store
function useWallet() {
    const { activeWallet, isUnlocked, openModal } = useWalletStore();
    return {
        address: activeWallet?.address || null,
        isConnected: isUnlocked && !!activeWallet,
        connect: () => openModal(),
    };
}

import { Suspense } from 'react';

export default function DashboardPage() {
    return (
        <Suspense fallback={<div className="p-6 flex justify-center"><div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" /></div>}>
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

    // Connect Wallet Prompt component for sections
    const ConnectPrompt = ({ message }: { message?: string }) => (
        <div className="flex flex-col items-center justify-center py-8 text-center">
            <Wallet className="w-8 h-8 text-[var(--foreground-muted)] mb-3" />
            <p className="text-[var(--foreground-muted)] mb-4">{message || 'Connect wallet to view your data'}</p>
            <button
                onClick={connect}
                className="px-6 py-2.5 rounded-xl bg-[var(--primary)] text-black font-bold text-sm hover:opacity-90 transition-all shadow-[0_0_15px_var(--primary-glow)]"
            >
                Connect Wallet
            </button>
        </div>
    );

    return (
        <div className="px-4 py-3 sm:p-6 max-w-7xl mx-auto pb-24 lg:pb-6 overflow-x-hidden">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 mb-4 sm:mb-8">
                <div>
                    <h1 className="text-lg sm:text-xl font-semibold">Trading Dashboard</h1>
                    <p className="text-xs sm:text-sm text-[var(--foreground-muted)]">
                        Performance analytics for {address?.slice(0, 6)}...{address?.slice(-4)}
                    </p>
                </div>

                <div className="flex items-center gap-1 bg-[var(--background-secondary)] p-0.5 sm:p-1 rounded-lg border border-[var(--border)] overflow-x-auto">
                    {(['24h', '7d', '30d', 'all'] as const).map((range) => (
                        <button
                            key={range}
                            onClick={() => setTimeRange(range)}
                            className={clsx(
                                'px-2 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium rounded-lg transition-all whitespace-nowrap',
                                timeRange === range
                                    ? 'bg-[var(--primary)] text-white shadow-sm'
                                    : 'text-[var(--foreground-muted)] hover:text-[var(--foreground)]'
                            )}
                        >
                            {range === 'all' ? 'All' : range.toUpperCase()}
                        </button>
                    ))}
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-4 sm:mb-6">
                <div className="card card-glow p-2.5 sm:p-4">
                    <div className="flex items-center justify-between mb-1.5 sm:mb-2">
                        <span className="text-[0.65rem] sm:text-sm text-[var(--foreground-muted)]">Total P&L</span>
                        <div className="p-1 sm:p-1.5 rounded-lg bg-[var(--accent-green)]/10">
                            <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 text-[var(--accent-green)]" />
                        </div>
                    </div>
                    <p className="text-sm sm:text-lg font-bold text-[var(--accent-green)]">
                        +${totalPnL.toFixed(2)}
                    </p>
                    <div className="mt-1 text-[0.6rem] sm:text-xs hidden sm:block">
                        <span className="text-[var(--accent-green)] font-medium">+0.0%</span>
                        <span className="text-[var(--foreground-muted)] ml-1">vs last</span>
                    </div>
                </div>

                <div className="card card-glow p-2.5 sm:p-4">
                    <div className="flex items-center justify-between mb-1.5 sm:mb-2">
                        <span className="text-[0.65rem] sm:text-sm text-[var(--foreground-muted)]">Volume</span>
                        <div className="p-1 sm:p-1.5 rounded-lg bg-[var(--primary)]/10">
                            <Activity className="w-3 h-3 sm:w-4 sm:h-4 text-[var(--primary)]" />
                        </div>
                    </div>
                    <p className="text-sm sm:text-lg font-bold">
                        ${totalVolume.toLocaleString()}
                    </p>
                    <div className="mt-1 text-[0.6rem] sm:text-xs text-[var(--foreground-muted)] hidden sm:block">
                        Across {totalTrades} trades
                    </div>
                </div>

                <div className="card card-glow p-2.5 sm:p-4">
                    <div className="flex items-center justify-between mb-1.5 sm:mb-2">
                        <span className="text-[0.65rem] sm:text-sm text-[var(--foreground-muted)]">Avg Trade</span>
                        <div className="p-1 sm:p-1.5 rounded-lg bg-[var(--accent-purple)]/10">
                            <BarChart3 className="w-3 h-3 sm:w-4 sm:h-4 text-[var(--accent-purple)]" />
                        </div>
                    </div>
                    <p className="text-sm sm:text-lg font-bold">
                        ${totalTrades > 0 ? (totalVolume / totalTrades).toFixed(2) : '0.00'}
                    </p>
                </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-3 sm:gap-6">
                {/* Recent Trades Table */}
                <div className="lg:col-span-2 card p-3 sm:p-6">
                    <div className="flex items-center justify-between mb-3 sm:mb-6">
                        <h2 className="font-semibold text-sm sm:text-base">Recent Swaps</h2>
                    </div>
                    <div className="overflow-x-auto -mx-3 sm:mx-0 px-3 sm:px-0">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Time</th>
                                    <th>Pair</th>
                                    <th className="text-right">Amount In</th>
                                    <th className="text-right">Amount Out</th>
                                    <th className="text-right">Tx Hash</th>
                                </tr>
                            </thead>
                            <tbody>
                                {!isConnected ? (
                                    <tr>
                                        <td colSpan={5}>
                                            <ConnectPrompt message="Connect wallet to see your trading history" />
                                        </td>
                                    </tr>
                                ) : trades.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="text-center py-12 text-[var(--foreground-muted)]">
                                            No trades found yet. Start trading!
                                        </td>
                                    </tr>
                                ) : (
                                    trades.map((trade) => (
                                        <tr key={trade.id}>
                                            <td className="text-[var(--foreground-muted)]">
                                                {new Date(trade.timestamp).toLocaleDateString()}
                                            </td>
                                            <td className="font-medium">
                                                {trade.tokenIn} → {trade.tokenOut}
                                            </td>
                                            <td className="text-right font-bold">
                                                {parseFloat(trade.amountIn).toFixed(4)}
                                            </td>
                                            <td className="text-right font-bold">
                                                {parseFloat(trade.amountOut).toFixed(4)}
                                            </td>
                                            <td className="text-right">
                                                <a href="#" className="text-[var(--primary)] hover:underline text-xs">
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

                {/* Chain Breakdown */}
                <div className="card p-3 sm:p-6">
                    <h2 className="font-bold text-sm sm:text-lg mb-3 sm:mb-6 flex items-center gap-2">
                        <PieChart className="w-4 h-4 sm:w-5 sm:h-5 text-[var(--foreground-muted)]" />
                        Volume by Chain
                    </h2>
                    <div className="flex items-center justify-center h-24 sm:h-40 text-[var(--foreground-muted)] italic text-xs sm:text-sm">
                        Chart coming soon
                    </div>
                </div>
            </div>
        </div>
    );
}
