'use client';

import { useState, useEffect } from 'react';
import {
    Gift,
    Users,
    TrendingUp,
    Copy,
    CheckCircle,
    Coins,
    Trophy,
    Sparkles,
    Wallet,
} from 'lucide-react';
import { clsx } from 'clsx';
import * as firebase from '@/lib/firebase';
import { Rewards, Referral, User } from '@/types';

import { useWalletStore } from '@/store/walletStore';

function useWallet() {
    const { activeWallet, isUnlocked, openModal } = useWalletStore();
    return {
        address: activeWallet?.address || null,
        isConnected: isUnlocked && !!activeWallet,
        connect: () => openModal(),
    };
}

import { Suspense } from 'react';

export default function RewardsPage() {
    return (
        <Suspense fallback={<div className="p-6 text-center">Loading rewards...</div>}>
            <RewardsContent />
        </Suspense>
    );
}

function RewardsContent() {
    const { address, isConnected, connect } = useWallet();
    const [copied, setCopied] = useState(false);
    const [activeTab, setActiveTab] = useState<'overview' | 'referrals' | 'leaderboard'>('overview');

    const [rewards, setRewards] = useState<Rewards | null>(null);
    const [referral, setReferral] = useState<Referral | null>(null);
    const [leaderboard, setLeaderboard] = useState<User[]>([]);

    useEffect(() => {
        if (isConnected && address) {
            loadData(address);
        }
        loadLeaderboard();
    }, [isConnected, address]);

    async function loadData(addr: string) {
        const rewardsData = await firebase.getRewards(addr);
        setRewards(rewardsData);

        const referralData = await firebase.getReferralStats(addr);
        setReferral(referralData);
    }

    async function loadLeaderboard() {
        const data = await firebase.getLeaderboard(10);
        setLeaderboard(data);
    }

    const referralLink = referral ? `https://cypherx.trade/ref/${referral.code}` : '...';

    const [createCode, setCreateCode] = useState('');
    const [redeemCode, setRedeemCode] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isEditing, setIsEditing] = useState(false);

    const handleCopy = () => {
        if (!referral) return;
        navigator.clipboard.writeText(referralLink);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    async function handleCreateCode() {
        if (!address || !createCode) return;
        setIsSubmitting(true);
        const success = await firebase.createCustomReferralCode(address, createCode);
        if (success) {
            await loadData(address);
            setCreateCode('');
            setIsEditing(false);
        } else {
            alert('Code taken or invalid format. Use 3-12 alphanumeric characters.');
        }
        setIsSubmitting(false);
    }

    async function handleRedeemCode() {
        if (!address || !redeemCode) return;
        setIsSubmitting(true);
        const success = await firebase.redeemReferralCode(address, redeemCode);
        if (success) {
            await loadData(address);
            setRedeemCode('');
        } else {
            alert('Invalid code, self-referral, or already referred.');
        }
        setIsSubmitting(false);
    }

    // Computed values
    const totalEarned = rewards ? (rewards.tradingRewards + rewards.referralRewards) : 0;
    const claimable = rewards ? (totalEarned - rewards.claimedRewards) : 0;

    // Connect Wallet Prompt component for sections
    const ConnectPrompt = ({ message }: { message?: string }) => (
        <div className="flex flex-col items-center justify-center py-8 text-center">
            <Wallet className="w-8 h-8 text-[var(--foreground-muted)] mb-3" />
            <p className="text-[var(--foreground-muted)] mb-4">{message || 'Connect wallet to view'}</p>
            <button onClick={connect} className="btn btn-primary px-6">
                Connect Wallet
            </button>
        </div>
    );

    return (
        <div className="p-2 sm:p-6 max-w-7xl mx-auto pb-20 lg:pb-6">
            {/* Header */}
            <div className="mb-4 sm:mb-8">
                <h1 className="text-lg sm:text-2xl font-bold flex items-center gap-2">
                    <Gift className="w-5 h-5 sm:w-6 sm:h-6 text-[var(--accent-purple)]" />
                    Rewards Center
                </h1>
                <p className="text-xs sm:text-sm text-[var(--foreground-muted)]">
                    Earn rewards for volume and referrals
                </p>
            </div>

            {/* Stats Cards - 2x2 on mobile, 4 across on desktop */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 mb-4 sm:mb-8">
                <div className="card card-glow border-[var(--accent-green)]/30 p-3 sm:p-4">
                    <div className="flex items-center justify-between mb-2 sm:mb-4">
                        <span className="text-[0.65rem] sm:text-sm font-bold text-[var(--accent-green)] uppercase tracking-wide">Claimable</span>
                        <Coins className="w-4 h-4 sm:w-5 sm:h-5 text-[var(--accent-green)]" />
                    </div>
                    <p className="text-lg sm:text-2xl font-semibold text-[var(--accent-green)]">
                        ${claimable.toFixed(2)}
                    </p>
                    <button
                        className="btn btn-primary w-full mt-2 sm:mt-4 text-xs sm:text-sm py-1.5 sm:py-2 bg-gradient-to-r from-[var(--accent-green)] to-emerald-600"
                        disabled={claimable <= 0}
                    >
                        Claim
                    </button>
                </div>

                <div className="card p-3 sm:p-4">
                    <div className="flex items-center justify-between mb-2 sm:mb-4">
                        <span className="text-[0.65rem] sm:text-sm text-[var(--foreground-muted)]">Trading</span>
                        <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-[var(--primary)]" />
                    </div>
                    <p className="text-lg sm:text-2xl font-semibold">${rewards?.tradingRewards.toFixed(2) || '0.00'}</p>
                    <p className="text-[0.6rem] sm:text-sm text-[var(--foreground-muted)] mt-1">Lifetime</p>
                </div>

                <div className="card p-3 sm:p-4">
                    <div className="flex items-center justify-between mb-2 sm:mb-4">
                        <span className="text-[0.65rem] sm:text-sm text-[var(--foreground-muted)]">Referral</span>
                        <Users className="w-4 h-4 sm:w-5 sm:h-5 text-[var(--accent-purple)]" />
                    </div>
                    <p className="text-lg sm:text-2xl font-semibold">${rewards?.referralRewards.toFixed(2) || '0.00'}</p>
                    <p className="text-[0.6rem] sm:text-sm text-[var(--foreground-muted)] mt-1">
                        {referral?.referredUsers.length || 0} referrals
                    </p>
                </div>

                <div className="card p-3 sm:p-4">
                    <div className="flex items-center justify-between mb-2 sm:mb-4">
                        <span className="text-[0.65rem] sm:text-sm text-[var(--foreground-muted)]">Ref Vol</span>
                        <Trophy className="w-4 h-4 sm:w-5 sm:h-5 text-[var(--accent-yellow)]" />
                    </div>
                    <p className="text-lg sm:text-2xl font-semibold">${referral?.totalReferralVolume.toLocaleString() || '0'}</p>
                    <p className="text-[0.6rem] sm:text-sm text-[var(--foreground-muted)] mt-1">Total</p>
                </div>
            </div>

            {/* Referral Management */}
            <div className="grid lg:grid-cols-2 gap-4 mb-4 sm:mb-8">
                {/* My Referral Link Manager */}
                {rewards?.userId && (!referral || isEditing) ? (
                    <div className="card p-3 sm:p-6 bg-gradient-to-br from-[var(--primary)]/5 to-transparent">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="font-bold flex items-center gap-2 text-sm sm:text-lg">
                                <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-[var(--accent-yellow)]" />
                                {isEditing ? 'Customize Code' : 'Create Referral Code'}
                            </h3>
                            {isEditing && (
                                <button onClick={() => setIsEditing(false)} className="text-xs text-[var(--foreground-muted)] hover:text-white">
                                    Cancel
                                </button>
                            )}
                        </div>
                        <p className="text-xs sm:text-sm text-[var(--foreground-muted)] mb-4">
                            Create a unique code to start earning <span className="text-white font-bold">0.5%</span> fees.
                        </p>

                        <div className="flex gap-2">
                            <input
                                type="text"
                                placeholder="ENTER CODE (e.g. CRYPTOKING)"
                                className="input flex-1 uppercase font-mono"
                                value={createCode}
                                onChange={(e) => setCreateCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                                maxLength={12}
                            />
                            <button
                                onClick={handleCreateCode}
                                disabled={isSubmitting || !createCode || createCode.length < 3}
                                className="btn btn-primary px-4 whitespace-nowrap"
                            >
                                {isSubmitting ? 'Creating...' : 'Create Code'}
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="card p-3 sm:p-6 bg-gradient-to-r from-[var(--primary)]/10 to-[var(--accent-purple)]/10 border-[var(--primary)]/30">
                        <div className="flex flex-col gap-3 sm:gap-6">
                            <div>
                                <h3 className="font-bold flex items-center gap-2 mb-1 text-sm sm:text-lg">
                                    <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-[var(--accent-yellow)]" />
                                    Your Referral Link
                                </h3>
                                <p className="text-xs sm:text-sm text-[var(--foreground-muted)]">
                                    Earn <span className="text-white font-bold">0.5%</span> of fees from referrals. Forever.
                                </p>
                            </div>
                            <button
                                onClick={() => setIsEditing(true)}
                                className="text-xs bg-[var(--background-tertiary)] hover:bg-[var(--background-secondary)] px-2 py-1 rounded text-[var(--foreground-muted)]"
                            >
                                Edit
                            </button>
                        </div>
                        <div className="flex items-center gap-2 w-full">
                            <div className="flex-1 px-2 sm:px-4 py-2 sm:py-3 bg-[var(--background-tertiary)] rounded-lg sm:rounded-xl font-mono text-[0.65rem] sm:text-sm border border-[var(--border)] truncate">
                                {referralLink}
                            </div>
                            <button
                                onClick={handleCopy}
                                className={clsx(
                                    'btn px-3 sm:px-6 py-2 sm:py-3 text-xs sm:text-sm',
                                    copied ? 'btn-primary' : 'btn-secondary'
                                )}
                            >
                                {copied ? '✓' : 'Copy'}
                            </button>
                        </div>
                    </div>
                )}

                {/* Redeem Referral Code */}
                {!rewards?.referralRewards /* Just a check to see if we have user data loaded */ && (
                    <div className="hidden" />
                )}

                {/* Show "Enter Code" if user not referred yet */}
                {/* We need to fetch user profile to check 'referredBy'. For now assuming if we are loaded and no referredBy we show it. 
                    But wait, we stored 'referredBy' in user profile, but didn't pass it to state. 
                    Let's update the loadData logic or assume if we can redeem we show it.
                    Since we don't have 'referredBy' in state easily yet (it's in user object we don't fetch fully here),
                    let's add it or specific state. 
                */}
                <div className="card p-3 sm:p-6">
                    <h3 className="font-bold flex items-center gap-2 mb-2 text-sm sm:text-lg">
                        <Gift className="w-4 h-4 sm:w-5 sm:h-5 text-[var(--accent-purple)]" />
                        Enter Referral Code
                    </h3>
                    <p className="text-xs sm:text-sm text-[var(--foreground-muted)] mb-4">
                        Referred by a friend? Enter their code to link your account.
                    </p>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            placeholder="REFERRAL CODE"
                            className="input flex-1 uppercase font-mono"
                            value={redeemCode}
                            onChange={(e) => setRedeemCode(e.target.value.toUpperCase())}
                        />
                        <button
                            onClick={handleRedeemCode}
                            disabled={isSubmitting || !redeemCode}
                            className="btn btn-secondary px-4 whitespace-nowrap"
                        >
                            {isSubmitting ? 'Linking...' : 'Apply Code'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Tabs - Compact on mobile */}
            <div className="flex gap-1 sm:gap-2 mb-4 sm:mb-6">
                {[
                    { id: 'overview', label: 'Overview', icon: Gift },
                    { id: 'leaderboard', label: 'Leaderboard', icon: Trophy },
                ].map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as typeof activeTab)}
                        className={clsx(
                            'flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg font-medium text-xs sm:text-sm transition-all',
                            activeTab === tab.id
                                ? 'bg-[var(--primary)]/10 text-[var(--primary)] border border-[var(--primary)]/30'
                                : 'text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:bg-[var(--background-tertiary)]'
                        )}
                    >
                        <tab.icon className="w-3 h-3 sm:w-4 sm:h-4" />
                        {tab.label}
                    </button>
                ))}
            </div>

            {
                activeTab === 'overview' && (
                    <div className="card p-4 sm:p-8 text-center">
                        <h3 className="font-bold text-base sm:text-xl mb-3 sm:mb-4">How it works</h3>
                        <div className="grid grid-cols-3 gap-2 sm:gap-8 mt-4 sm:mt-8">
                            <div>
                                <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-full bg-[var(--primary)]/20 text-[var(--primary)] flex items-center justify-center text-sm sm:text-xl font-bold mx-auto mb-2 sm:mb-4">1</div>
                                <h4 className="font-bold text-xs sm:text-base mb-1 sm:mb-2">Trade</h4>
                                <p className="text-[0.6rem] sm:text-sm text-[var(--foreground-muted)] hidden sm:block">Calculate rewards based on your trading volume tier.</p>
                            </div>
                            <div>
                                <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-full bg-[#9945FF]/20 text-[#9945FF] flex items-center justify-center text-sm sm:text-xl font-bold mx-auto mb-2 sm:mb-4">2</div>
                                <h4 className="font-bold text-xs sm:text-base mb-1 sm:mb-2">Refer</h4>
                                <p className="text-[0.6rem] sm:text-sm text-[var(--foreground-muted)] hidden sm:block">Share your link and earn a percentage of their fees.</p>
                            </div>
                            <div>
                                <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-full bg-[var(--accent-green)]/20 text-[var(--accent-green)] flex items-center justify-center text-sm sm:text-xl font-bold mx-auto mb-2 sm:mb-4">3</div>
                                <h4 className="font-bold text-xs sm:text-base mb-1 sm:mb-2">Claim</h4>
                                <p className="text-[0.6rem] sm:text-sm text-[var(--foreground-muted)] hidden sm:block">Rewards are distributed to your claimable balance weekly.</p>
                            </div>
                        </div>
                    </div>
                )
            }

            {
                activeTab === 'leaderboard' && (
                    <div className="card overflow-hidden">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th className="w-16">Rank</th>
                                    <th>User</th>
                                    <th className="text-right">Volume</th>
                                    <th className="text-right">Rewards</th>
                                </tr>
                            </thead>
                            <tbody>
                                {leaderboard.length === 0 ? (
                                    <tr><td colSpan={4} className="text-center py-8 text-[var(--foreground-muted)]">No data yet</td></tr>
                                ) : (
                                    leaderboard.map((user, i) => (
                                        <tr key={user.address}>
                                            <td>
                                                <span className={clsx(
                                                    "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold",
                                                    i === 0 && "bg-[#FFD700] text-black",
                                                    i === 1 && "bg-[#C0C0C0] text-black",
                                                    i === 2 && "bg-[#CD7F32] text-black",
                                                    i > 2 && "text-[var(--foreground-muted)]"
                                                )}>
                                                    {i + 1}
                                                </span>
                                            </td>
                                            <td className="font-mono">
                                                {user.address.slice(0, 6)}...{user.address.slice(-4)}
                                                {user.address === address?.toLowerCase() && <span className="ml-2 text-xs text-[var(--primary)]">(You)</span>}
                                            </td>
                                            <td className="text-right font-mono">${user.totalVolume.toLocaleString()}</td>
                                            <td className="text-right font-mono text-[var(--accent-green)]">???</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                )
            }
        </div >
    );
}
