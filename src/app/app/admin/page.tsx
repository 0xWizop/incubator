'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    Users,
    Shield,
    TrendingUp,
    Crown,
    Search,
    UserCheck,
    UserX,
    Star,
    Ban,
    Check,
    RefreshCw,
    ChevronDown,
    Award,
    Sparkles,
    BarChart3,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import * as admin from '@/lib/firebase/admin';
import type { User, UserRole } from '@/types';

export default function AdminDashboard() {
    const { firebaseUser } = useAuth();
    const router = useRouter();

    const [isAuthorized, setIsAuthorized] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [stats, setStats] = useState<{
        totalUsers: number;
        proSubscribers: number;
        betaTesters: number;
        activeToday: number;
        totalVolume: number;
    } | null>(null);

    const [users, setUsers] = useState<User[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [tab, setTab] = useState<'all' | 'beta' | 'blacklist'>('all');

    // Check admin authorization
    useEffect(() => {
        if (!firebaseUser) {
            setIsLoading(false);
            return;
        }

        // Check if user is an admin
        const isAdmin = admin.isAdminWallet(firebaseUser.uid);
        setIsAuthorized(isAdmin);
        setIsLoading(false);

        if (isAdmin) {
            loadData();
        }
    }, [firebaseUser]);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const [statsData, usersData] = await Promise.all([
                admin.getPlatformStats(),
                admin.getAllUsers(50),
            ]);
            setStats(statsData);
            setUsers(usersData.users);
        } catch (error) {
            console.error('Error loading admin data:', error);
        }
        setIsLoading(false);
    };

    const handleSearch = async () => {
        if (!searchQuery.trim()) {
            loadData();
            return;
        }

        setIsSearching(true);
        try {
            const results = await admin.searchUsers(searchQuery);
            setUsers(results);
        } catch (error) {
            console.error('Error searching:', error);
        }
        setIsSearching(false);
    };

    const handleGrantBeta = async (userId: string) => {
        const success = await admin.grantBetaRewards(userId);
        if (success) {
            loadData();
        }
    };

    const handleRevokeBeta = async (userId: string) => {
        const success = await admin.revokeBetaRewards(userId);
        if (success) {
            loadData();
        }
    };

    const handleBlacklist = async (userId: string) => {
        const success = await admin.blacklistWallet(userId);
        if (success) {
            loadData();
        }
    };

    const handleWhitelist = async (userId: string) => {
        const success = await admin.whitelistWallet(userId);
        if (success) {
            loadData();
        }
    };

    const loadBetaTesters = async () => {
        setIsLoading(true);
        const betaUsers = await admin.getBetaTesters();
        setUsers(betaUsers);
        setIsLoading(false);
    };

    const loadBlacklisted = async () => {
        setIsLoading(true);
        const blacklisted = await admin.getBlacklistedWallets();
        setUsers(blacklisted);
        setIsLoading(false);
    };

    // Not authorized view
    if (!isLoading && !isAuthorized) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
                <div className="text-center p-8">
                    <Shield className="w-16 h-16 text-red-500 mx-auto mb-4" />
                    <h1 className="text-2xl font-bold text-white mb-2">Access Denied</h1>
                    <p className="text-[var(--foreground-muted)]">
                        Your wallet is not authorized to access the admin dashboard.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[var(--background)] p-4 lg:p-8 overflow-auto">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                            <Shield className="w-7 h-7 text-[var(--primary)]" />
                            Admin Dashboard
                        </h1>
                        <p className="text-[var(--foreground-muted)] text-sm mt-1">
                            Manage users, subscriptions, and platform settings
                        </p>
                    </div>
                    <button
                        onClick={loadData}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--background-secondary)] border border-[var(--border)] text-sm hover:bg-[var(--background-tertiary)] transition-colors"
                    >
                        <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                        Refresh
                    </button>
                </div>

                {/* Stats Cards */}
                {stats && (
                    <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
                        <StatCard
                            icon={Users}
                            label="Total Users"
                            value={stats.totalUsers.toLocaleString()}
                            color="var(--primary)"
                        />
                        <StatCard
                            icon={Sparkles}
                            label="Pro Subscribers"
                            value={stats.proSubscribers.toLocaleString()}
                            color="#FFD700"
                        />
                        <StatCard
                            icon={Award}
                            label="Beta Testers"
                            value={stats.betaTesters.toLocaleString()}
                            color="#B9F2FF"
                        />
                        <StatCard
                            icon={TrendingUp}
                            label="Active Today"
                            value={stats.activeToday.toLocaleString()}
                            color="#22c55e"
                        />
                        <StatCard
                            icon={BarChart3}
                            label="Total Volume"
                            value={`$${(stats.totalVolume / 1000000).toFixed(2)}M`}
                            color="#8b5cf6"
                        />
                    </div>
                )}

                {/* Tabs & Search */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 mb-6">
                    {/* Tabs */}
                    <div className="flex rounded-lg bg-[var(--background-secondary)] border border-[var(--border)] p-1">
                        <TabButton
                            active={tab === 'all'}
                            onClick={() => { setTab('all'); loadData(); }}
                            label="All Users"
                        />
                        <TabButton
                            active={tab === 'beta'}
                            onClick={() => { setTab('beta'); loadBetaTesters(); }}
                            label="Beta Testers"
                        />
                        <TabButton
                            active={tab === 'blacklist'}
                            onClick={() => { setTab('blacklist'); loadBlacklisted(); }}
                            label="Blacklisted"
                        />
                    </div>

                    {/* Search */}
                    <div className="flex-1 flex gap-2">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--foreground-muted)]" />
                            <input
                                type="text"
                                placeholder="Search by wallet address..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-[var(--background-secondary)] border border-[var(--border)] text-sm focus:outline-none focus:border-[var(--primary)]"
                            />
                        </div>
                        <button
                            onClick={handleSearch}
                            className="px-4 py-2 rounded-lg bg-[var(--primary)] text-black font-medium text-sm"
                        >
                            Search
                        </button>
                    </div>
                </div>

                {/* Users Table */}
                <div className="rounded-xl border border-[var(--border)] bg-[var(--background-secondary)] overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-[var(--border)] bg-[var(--background-tertiary)]">
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-[var(--foreground-muted)] uppercase tracking-wider">
                                        Wallet
                                    </th>
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-[var(--foreground-muted)] uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th className="text-right px-4 py-3 text-xs font-semibold text-[var(--foreground-muted)] uppercase tracking-wider">
                                        Volume
                                    </th>
                                    <th className="text-right px-4 py-3 text-xs font-semibold text-[var(--foreground-muted)] uppercase tracking-wider">
                                        Last Active
                                    </th>
                                    <th className="text-right px-4 py-3 text-xs font-semibold text-[var(--foreground-muted)] uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {isLoading ? (
                                    <tr>
                                        <td colSpan={5} className="px-4 py-8 text-center">
                                            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-[var(--foreground-muted)]" />
                                        </td>
                                    </tr>
                                ) : users.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-4 py-8 text-center text-[var(--foreground-muted)]">
                                            No users found
                                        </td>
                                    </tr>
                                ) : (
                                    users.map((user) => (
                                        <UserRow
                                            key={user.address}
                                            user={user}
                                            onGrantBeta={() => handleGrantBeta(user.address)}
                                            onRevokeBeta={() => handleRevokeBeta(user.address)}
                                            onBlacklist={() => handleBlacklist(user.address)}
                                            onWhitelist={() => handleWhitelist(user.address)}
                                        />
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Stat Card Component
function StatCard({ icon: Icon, label, value, color }: {
    icon: any;
    label: string;
    value: string;
    color: string;
}) {
    return (
        <div className="p-4 rounded-xl bg-[var(--background-secondary)] border border-[var(--border)]">
            <Icon className="w-5 h-5 mb-2" style={{ color }} />
            <p className="text-2xl font-bold text-white">{value}</p>
            <p className="text-xs text-[var(--foreground-muted)]">{label}</p>
        </div>
    );
}

// Tab Button Component
function TabButton({ active, onClick, label }: {
    active: boolean;
    onClick: () => void;
    label: string;
}) {
    return (
        <button
            onClick={onClick}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${active
                    ? 'bg-[var(--primary)] text-black'
                    : 'text-[var(--foreground-muted)] hover:text-white'
                }`}
        >
            {label}
        </button>
    );
}

// User Row Component
function UserRow({ user, onGrantBeta, onRevokeBeta, onBlacklist, onWhitelist }: {
    user: User;
    onGrantBeta: () => void;
    onRevokeBeta: () => void;
    onBlacklist: () => void;
    onWhitelist: () => void;
}) {
    const [showActions, setShowActions] = useState(false);
    const isBeta = user.flags?.isBetaTester;
    const isBlacklisted = user.flags?.isBlacklisted;
    const isPro = user.subscription?.tier === 'pro' && user.subscription?.status === 'active';

    return (
        <tr className="border-b border-[var(--border)] hover:bg-[var(--background-tertiary)] transition-colors">
            <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                    <code className="text-sm font-mono text-white">
                        {user.address.slice(0, 6)}...{user.address.slice(-4)}
                    </code>
                    {user.displayName && (
                        <span className="text-xs text-[var(--foreground-muted)]">
                            ({user.displayName})
                        </span>
                    )}
                </div>
            </td>
            <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                    {isBeta && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-400 text-[10px] font-bold">
                            <Crown className="w-3 h-3" />
                            BETA
                        </span>
                    )}
                    {isPro && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 text-[10px] font-bold">
                            <Sparkles className="w-3 h-3" />
                            PRO
                        </span>
                    )}
                    {isBlacklisted && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 text-[10px] font-bold">
                            <Ban className="w-3 h-3" />
                            BLOCKED
                        </span>
                    )}
                    {!isBeta && !isPro && !isBlacklisted && (
                        <span className="text-xs text-[var(--foreground-muted)]">Free</span>
                    )}
                </div>
            </td>
            <td className="px-4 py-3 text-right">
                <span className="text-sm font-medium text-white">
                    ${user.totalVolume.toLocaleString()}
                </span>
            </td>
            <td className="px-4 py-3 text-right">
                <span className="text-sm text-[var(--foreground-muted)]">
                    {new Date(user.lastActive).toLocaleDateString()}
                </span>
            </td>
            <td className="px-4 py-3 text-right">
                <div className="relative">
                    <button
                        onClick={() => setShowActions(!showActions)}
                        className="px-3 py-1.5 rounded-lg bg-[var(--background-tertiary)] border border-[var(--border)] text-xs font-medium flex items-center gap-1 ml-auto hover:bg-[var(--background)] transition-colors"
                    >
                        Actions
                        <ChevronDown className="w-3 h-3" />
                    </button>

                    {showActions && (
                        <>
                            <div
                                className="fixed inset-0 z-10"
                                onClick={() => setShowActions(false)}
                            />
                            <div className="absolute right-0 top-full mt-1 z-20 w-48 rounded-lg bg-[var(--background-secondary)] border border-[var(--border)] shadow-xl overflow-hidden">
                                {!isBeta ? (
                                    <button
                                        onClick={() => { onGrantBeta(); setShowActions(false); }}
                                        className="w-full px-4 py-2.5 text-left text-sm flex items-center gap-2 hover:bg-[var(--background-tertiary)] transition-colors text-cyan-400"
                                    >
                                        <Star className="w-4 h-4" />
                                        Grant Beta Rewards
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => { onRevokeBeta(); setShowActions(false); }}
                                        className="w-full px-4 py-2.5 text-left text-sm flex items-center gap-2 hover:bg-[var(--background-tertiary)] transition-colors text-orange-400"
                                    >
                                        <UserX className="w-4 h-4" />
                                        Revoke Beta Rewards
                                    </button>
                                )}

                                <div className="border-t border-[var(--border)]" />

                                {!isBlacklisted ? (
                                    <button
                                        onClick={() => { onBlacklist(); setShowActions(false); }}
                                        className="w-full px-4 py-2.5 text-left text-sm flex items-center gap-2 hover:bg-[var(--background-tertiary)] transition-colors text-red-400"
                                    >
                                        <Ban className="w-4 h-4" />
                                        Blacklist Wallet
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => { onWhitelist(); setShowActions(false); }}
                                        className="w-full px-4 py-2.5 text-left text-sm flex items-center gap-2 hover:bg-[var(--background-tertiary)] transition-colors text-green-400"
                                    >
                                        <UserCheck className="w-4 h-4" />
                                        Whitelist Wallet
                                    </button>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </td>
        </tr>
    );
}
