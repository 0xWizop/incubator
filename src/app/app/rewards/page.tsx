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
import { useWallet } from '@/hooks/useWallet';
import { ConnectPrompt } from '@/components/ui/ConnectPrompt';

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
    const [leaderboard, setLeaderboard] = useState<firebase.LeaderboardEntry[]>([]);
    const [userTier, setUserTier] = useState<firebase.RewardTier | null>(null);
    const [nextTier, setNextTier] = useState<{ tier: firebase.RewardTier; volumeNeeded: number } | null>(null);
    const [userXP, setUserXP] = useState(0);
    const [totalVolume, setTotalVolume] = useState(0);
    const [isClaiming, setIsClaiming] = useState(false);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    const showToast = (message: string, type: 'success' | 'error') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

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

        // Get user data for tier calculation
        const userData = await firebase.getUser(addr);
        if (userData) {
            setTotalVolume(userData.totalVolume || 0);
            const tier = firebase.getUserTier(userData.totalVolume || 0);
            setUserTier(tier);
            setNextTier(firebase.getNextTier(userData.totalVolume || 0));
            setUserXP(firebase.calculateXP(userData.totalVolume || 0, referralData?.referredUsers.length || 0));
        }
    }

    async function loadLeaderboard() {
        const data = await firebase.getEnhancedLeaderboard(10);
        setLeaderboard(data);
    }

    async function handleClaim() {
        if (!address || !rewards) return;
        setIsClaiming(true);
        const claimed = await firebase.claimRewards(address);
        if (claimed > 0) {
            await loadData(address);
        }
        setIsClaiming(false);
    }

    const referralLink = referral ? `https://incubatorprotocol-c31de.web.app/?ref=${referral.code}` : '...';

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
        if (!isConnected || !address) {
            showToast('Please connect your wallet first', 'error');
            return;
        }
        if (!createCode) {
            showToast('Please enter a code', 'error');
            return;
        }
        setIsSubmitting(true);
        try {
            const success = await firebase.createCustomReferralCode(address, createCode);
            if (success) {
                await loadData(address);
                setCreateCode('');
                setIsEditing(false);
                showToast('Referral code created successfully!', 'success');
            } else {
                showToast('Code taken or invalid format. Use 3-12 alphanumeric characters.', 'error');
            }
        } catch (error) {
            console.error('Error creating code:', error);
            showToast('Error creating code. Please try again.', 'error');
        }
        setIsSubmitting(false);
    }

    async function handleRedeemCode() {
        if (!isConnected || !address) {
            showToast('Please connect your wallet first', 'error');
            return;
        }
        if (!redeemCode) {
            showToast('Please enter a code to apply', 'error');
            return;
        }
        setIsSubmitting(true);
        try {
            const success = await firebase.redeemReferralCode(address, redeemCode);
            if (success) {
                await loadData(address);
                setRedeemCode('');
                showToast('Referral code applied successfully!', 'success');
            } else {
                showToast('This referral code is not active or does not exist.', 'error');
            }
        } catch (error) {
            console.error('Error redeeming code:', error);
            showToast('Error applying code. Please try again.', 'error');
        }
        setIsSubmitting(false);
    }

    // Computed values
    const totalEarned = rewards ? (rewards.tradingRewards + rewards.referralRewards) : 0;
    const claimable = rewards ? (totalEarned - rewards.claimedRewards) : 0;



    return (
        <div className="h-full overflow-y-auto overscroll-contain">
            <div className="px-4 py-4 sm:px-6 sm:py-6 max-w-7xl mx-auto pb-24 lg:pb-6">
                {/* Header - Clean */}
                <div className="mb-6">
                    <h1 className="text-xl sm:text-2xl font-semibold tracking-tight flex items-center gap-2">
                        <Gift className="w-5 h-5 sm:w-6 sm:h-6 text-[var(--accent-purple)]" />
                        Rewards
                    </h1>
                    <p className="text-sm text-[var(--foreground-muted)] mt-0.5">
                        Earn rewards for volume and referrals
                    </p>
                </div>

                {/* Tier Progress Card - Clean, no gradient */}
                {userTier && (
                    <div className="bg-[var(--background-secondary)] border border-[var(--border)] rounded-xl p-5 mb-6">
                        <div className="flex items-center justify-between mb-5">
                            <div className="flex items-center gap-3">
                                <div
                                    className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                                    style={{ backgroundColor: `${userTier.color}15` }}
                                >
                                    {userTier.icon}
                                </div>
                                <div>
                                    <p className="text-xs text-[var(--foreground-muted)]">Your Tier</p>
                                    <p className="text-lg font-semibold" style={{ color: userTier.color }}>{userTier.name}</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-xs text-[var(--foreground-muted)]">XP</p>
                                <p className="text-lg font-semibold font-mono">{userXP.toLocaleString()}</p>
                            </div>
                        </div>

                        {nextTier && (
                            <div className="mb-5">
                                <div className="flex justify-between text-xs mb-2">
                                    <span className="text-[var(--foreground-muted)]">Progress to {nextTier.tier.name}</span>
                                    <span className="font-medium font-mono">
                                        ${(nextTier.tier.minVolume - nextTier.volumeNeeded).toLocaleString()} / ${nextTier.tier.minVolume.toLocaleString()}
                                    </span>
                                </div>
                                <div className="h-2 bg-[var(--background-tertiary)] rounded-full overflow-hidden">
                                    <div
                                        className="h-full rounded-full transition-all"
                                        style={{
                                            width: `${Math.min(100, ((totalVolume) / nextTier.tier.minVolume) * 100)}%`,
                                            backgroundColor: nextTier.tier.color
                                        }}
                                    />
                                </div>
                                <p className="text-xs text-[var(--foreground-muted)] mt-2">
                                    ${nextTier.volumeNeeded.toLocaleString()} more volume needed
                                </p>
                            </div>
                        )}

                        <div className="flex gap-6 pt-4 border-t border-[var(--border)]">
                            <div>
                                <p className="text-xs text-[var(--foreground-muted)]">Trading Rate</p>
                                <p className="text-lg font-semibold text-[var(--primary)]">{userTier.tradingRewardRate}%</p>
                            </div>
                            <div>
                                <p className="text-xs text-[var(--foreground-muted)]">Referral Rate</p>
                                <p className="text-lg font-semibold text-[var(--accent-purple)]">{userTier.referralRewardRate}%</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Stats Grid - Clean cards matching Dashboard */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 mb-6">
                    <div className="bg-[var(--background-secondary)] border border-[var(--border)] rounded-xl p-3 sm:p-4 hover:border-[var(--border-hover)] transition-colors">
                        <div className="flex items-center gap-1.5 sm:gap-2 mb-2 sm:mb-3">
                            <div className="p-1 sm:p-1.5 rounded-lg bg-[var(--accent-green)]/10">
                                <Coins className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[var(--accent-green)]" />
                            </div>
                            <span className="text-[10px] sm:text-xs text-[var(--foreground-muted)]">Claimable</span>
                        </div>
                        <p className="text-lg sm:text-xl font-semibold text-[var(--accent-green)] mb-2 sm:mb-3">
                            ${claimable.toFixed(2)}
                        </p>
                        <button
                            onClick={handleClaim}
                            disabled={claimable <= 0 || isClaiming}
                            className="w-full py-1.5 sm:py-2 text-[10px] sm:text-xs font-semibold rounded-lg bg-[var(--accent-green)] text-black hover:bg-[var(--accent-green)]/90 disabled:opacity-50 transition-all"
                        >
                            {isClaiming ? 'Claiming...' : 'Claim'}
                        </button>
                    </div>

                    <div className="bg-[var(--background-secondary)] border border-[var(--border)] rounded-xl p-3 sm:p-4 hover:border-[var(--border-hover)] transition-colors">
                        <div className="flex items-center gap-1.5 sm:gap-2 mb-2 sm:mb-3">
                            <div className="p-1 sm:p-1.5 rounded-lg bg-[var(--primary)]/10">
                                <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[var(--primary)]" />
                            </div>
                            <span className="text-[10px] sm:text-xs text-[var(--foreground-muted)]">Trading</span>
                        </div>
                        <p className="text-lg sm:text-xl font-semibold">${rewards?.tradingRewards.toFixed(2) || '0.00'}</p>
                        <p className="text-[10px] sm:text-xs text-[var(--foreground-muted)] mt-0.5 sm:mt-1">Lifetime earned</p>
                    </div>

                    <div className="bg-[var(--background-secondary)] border border-[var(--border)] rounded-xl p-3 sm:p-4 hover:border-[var(--border-hover)] transition-colors">
                        <div className="flex items-center gap-1.5 sm:gap-2 mb-2 sm:mb-3">
                            <div className="p-1 sm:p-1.5 rounded-lg bg-[var(--accent-purple)]/10">
                                <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[var(--accent-purple)]" />
                            </div>
                            <span className="text-[10px] sm:text-xs text-[var(--foreground-muted)]">Referral</span>
                        </div>
                        <p className="text-lg sm:text-xl font-semibold">${rewards?.referralRewards.toFixed(2) || '0.00'}</p>
                        <p className="text-[10px] sm:text-xs text-[var(--foreground-muted)] mt-0.5 sm:mt-1">{referral?.referredUsers.length || 0} referrals</p>
                    </div>

                    <div className="bg-[var(--background-secondary)] border border-[var(--border)] rounded-xl p-3 sm:p-4 hover:border-[var(--border-hover)] transition-colors">
                        <div className="flex items-center gap-1.5 sm:gap-2 mb-2 sm:mb-3">
                            <div className="p-1 sm:p-1.5 rounded-lg bg-[var(--accent-yellow)]/10">
                                <Trophy className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[var(--accent-yellow)]" />
                            </div>
                            <span className="text-[10px] sm:text-xs text-[var(--foreground-muted)]">Ref Volume</span>
                        </div>
                        <p className="text-lg sm:text-xl font-semibold">${referral?.totalReferralVolume.toLocaleString() || '0'}</p>
                        <p className="text-[10px] sm:text-xs text-[var(--foreground-muted)] mt-0.5 sm:mt-1">Total</p>
                    </div>
                </div>

                {/* Referral Management - Clean cards */}
                <div className="grid lg:grid-cols-2 gap-4 mb-6">
                    {/* My Referral Code Section */}
                    <div className="bg-[var(--background-secondary)] border border-[var(--border)] rounded-xl p-5">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-semibold flex items-center gap-2 text-sm">
                                <Sparkles className="w-4 h-4 text-[var(--accent-yellow)]" />
                                Your Referral Code
                            </h3>
                            {referral && !isEditing && (
                                <button
                                    onClick={() => setIsEditing(true)}
                                    className="text-xs text-[var(--primary)] hover:underline"
                                >
                                    Edit
                                </button>
                            )}
                        </div>

                        {(!referral || isEditing) ? (
                            <div>
                                <p className="text-sm text-[var(--foreground-muted)] mb-4">
                                    {referral ? 'Update your code:' : 'Create a code to earn'}{' '}
                                    <span className="text-[var(--primary)] font-semibold">0.5%</span> of referral fees.
                                </p>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        placeholder="e.g. MYCODE"
                                        className="flex-1 px-3 py-2 bg-[var(--background-tertiary)] border border-[var(--border)] rounded-lg font-mono text-sm uppercase focus:outline-none focus:border-[var(--primary)]"
                                        value={createCode}
                                        onChange={(e) => setCreateCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                                        maxLength={12}
                                    />
                                    <button
                                        onClick={handleCreateCode}
                                        disabled={isSubmitting || !createCode || createCode.length < 3}
                                        className="px-4 py-2 bg-[var(--primary)] text-black text-sm font-semibold rounded-lg hover:bg-[var(--primary)]/90 disabled:opacity-50 transition-all"
                                    >
                                        {isSubmitting ? '...' : (referral ? 'Update' : 'Create')}
                                    </button>
                                    {isEditing && (
                                        <button
                                            onClick={() => { setIsEditing(false); setCreateCode(''); }}
                                            className="px-3 py-2 bg-[var(--background-tertiary)] border border-[var(--border)] text-sm rounded-lg hover:bg-[var(--background)] transition-all"
                                        >
                                            Cancel
                                        </button>
                                    )}
                                </div>
                                <p className="text-xs text-[var(--foreground-muted)] mt-2">3-12 alphanumeric characters</p>
                            </div>
                        ) : (
                            <div>
                                <p className="text-sm text-[var(--foreground-muted)] mb-3">
                                    Share your link to earn <span className="text-[var(--primary)] font-semibold">0.5%</span> forever.
                                </p>
                                <div className="flex items-center gap-2">
                                    <div className="flex-1 px-3 py-2.5 bg-[var(--background-tertiary)] rounded-lg font-mono text-xs border border-[var(--border)] overflow-hidden text-ellipsis">
                                        {referralLink}
                                    </div>
                                    <button
                                        onClick={handleCopy}
                                        className={clsx(
                                            'flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium rounded-lg border transition-all',
                                            copied
                                                ? 'bg-[var(--primary)] text-black border-[var(--primary)]'
                                                : 'bg-[var(--background-tertiary)] border-[var(--border)] hover:bg-[var(--background)]'
                                        )}
                                    >
                                        {copied ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                        {copied ? 'Copied' : 'Copy'}
                                    </button>
                                </div>
                                <p className="text-xs text-[var(--foreground-muted)] mt-2">
                                    Code: <span className="font-mono text-[var(--primary)]">{referral.code}</span>
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Apply Code */}
                    <div className="bg-[var(--background-secondary)] border border-[var(--border)] rounded-xl p-5">
                        <h3 className="font-semibold flex items-center gap-2 mb-4 text-sm">
                            <Gift className="w-4 h-4 text-[var(--accent-purple)]" />
                            Got a Referral Code?
                        </h3>
                        <p className="text-sm text-[var(--foreground-muted)] mb-4">
                            Enter a friend's code to link your account.
                        </p>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                placeholder="Enter code"
                                className="flex-1 px-3 py-2 bg-[var(--background-tertiary)] border border-[var(--border)] rounded-lg font-mono text-sm uppercase focus:outline-none focus:border-[var(--primary)]"
                                value={redeemCode}
                                onChange={(e) => setRedeemCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                                maxLength={12}
                            />
                            <button
                                onClick={handleRedeemCode}
                                disabled={isSubmitting || !redeemCode || redeemCode.length < 3}
                                className="px-4 py-2 bg-[var(--background-tertiary)] border border-[var(--border)] text-sm font-medium rounded-lg hover:bg-[var(--background)] disabled:opacity-50 transition-all"
                            >
                                {isSubmitting ? '...' : 'Apply'}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Tab Navigation - Clean inline */}
                <div className="flex gap-1 mb-6">
                    {[
                        { id: 'overview', label: 'Overview', icon: Gift },
                        { id: 'leaderboard', label: 'Leaderboard', icon: Trophy },
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as typeof activeTab)}
                            className={clsx(
                                'flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all',
                                activeTab === tab.id
                                    ? 'bg-[var(--primary)] text-white'
                                    : 'text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:bg-[var(--background-tertiary)]'
                            )}
                        >
                            <tab.icon className="w-4 h-4" />
                            {tab.label}
                        </button>
                    ))}
                </div>

                {activeTab === 'overview' && (
                    <div className="bg-[var(--background-secondary)] border border-[var(--border)] rounded-xl p-6">
                        <h3 className="font-semibold text-base mb-6 text-center">How it works</h3>
                        <div className="grid grid-cols-3 gap-6">
                            <div className="text-center">
                                <div className="w-10 h-10 rounded-xl bg-[var(--primary)]/10 text-[var(--primary)] flex items-center justify-center text-lg font-semibold mx-auto mb-3">1</div>
                                <h4 className="font-semibold text-sm mb-1">Trade</h4>
                                <p className="text-xs text-[var(--foreground-muted)]">Earn rewards from volume</p>
                            </div>
                            <div className="text-center">
                                <div className="w-10 h-10 rounded-xl bg-[var(--primary)]/10 text-[var(--primary)] flex items-center justify-center text-lg font-semibold mx-auto mb-3">2</div>
                                <h4 className="font-semibold text-sm mb-1">Refer</h4>
                                <p className="text-xs text-[var(--foreground-muted)]">Share link for fees</p>
                            </div>
                            <div className="text-center">
                                <div className="w-10 h-10 rounded-xl bg-[var(--primary)]/10 text-[var(--primary)] flex items-center justify-center text-lg font-semibold mx-auto mb-3">3</div>
                                <h4 className="font-semibold text-sm mb-1">Claim</h4>
                                <p className="text-xs text-[var(--foreground-muted)]">Claim rewards weekly</p>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'leaderboard' && (
                    <div className="bg-[var(--background-secondary)] border border-[var(--border)] rounded-xl overflow-hidden">
                        <table className="w-full">
                            <thead>
                                <tr className="text-xs text-[var(--foreground-muted)] border-b border-[var(--border)]">
                                    <th className="text-left p-4 font-medium w-16">Rank</th>
                                    <th className="text-left p-4 font-medium">Trader</th>
                                    <th className="text-center p-4 font-medium hidden sm:table-cell">Tier</th>
                                    <th className="text-right p-4 font-medium">Volume</th>
                                    <th className="text-right p-4 font-medium">Rewards</th>
                                </tr>
                            </thead>
                            <tbody className="text-sm">
                                {leaderboard.length === 0 ? (
                                    <tr><td colSpan={5} className="text-center py-12 text-[var(--foreground-muted)]">No data yet</td></tr>
                                ) : (
                                    leaderboard.map((entry, i) => (
                                        <tr
                                            key={entry.address}
                                            className={clsx(
                                                "hover:bg-[var(--background-tertiary)] transition-colors",
                                                i < leaderboard.length - 1 && "border-b border-[var(--border)]/50"
                                            )}
                                        >
                                            <td className="p-4">
                                                <span className={clsx(
                                                    "w-7 h-7 rounded-lg flex items-center justify-center text-xs font-semibold",
                                                    entry.rank === 1 && "bg-[#FFD700]/20 text-[#FFD700]",
                                                    entry.rank === 2 && "bg-[#C0C0C0]/20 text-[#C0C0C0]",
                                                    entry.rank === 3 && "bg-[#CD7F32]/20 text-[#CD7F32]",
                                                    entry.rank > 3 && "text-[var(--foreground-muted)]"
                                                )}>
                                                    {entry.rank}
                                                </span>
                                            </td>
                                            <td className="p-4">
                                                <div className="flex items-center gap-2">
                                                    <span className="sm:hidden text-lg">{entry.tier.icon}</span>
                                                    <div>
                                                        <p className="font-mono text-sm">
                                                            {entry.displayName || `${entry.address.slice(0, 6)}...${entry.address.slice(-4)}`}
                                                            {entry.address.toLowerCase() === address?.toLowerCase() && <span className="ml-2 text-xs text-[var(--primary)]">(You)</span>}
                                                        </p>
                                                        <p className="text-xs text-[var(--foreground-muted)]">{entry.xp.toLocaleString()} XP</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-4 text-center hidden sm:table-cell">
                                                <span className="text-xl" title={entry.tier.name}>{entry.tier.icon}</span>
                                            </td>
                                            <td className="p-4 text-right font-mono">${entry.totalVolume.toLocaleString()}</td>
                                            <td className="p-4 text-right font-mono text-[var(--accent-green)]">${entry.totalRewards.toFixed(2)}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Toast notification */}
                {toast && (
                    <div className={clsx(
                        "fixed bottom-24 lg:bottom-8 left-1/2 -translate-x-1/2 px-4 py-3 rounded-lg shadow-lg z-50 flex items-center gap-2 animate-fade-in",
                        toast.type === 'success'
                            ? "bg-[var(--accent-green)] text-black"
                            : "bg-[var(--accent-red)] text-white"
                    )}>
                        {toast.type === 'success' ? '✓' : '✕'} {toast.message}
                    </div>
                )}
            </div>
        </div>
    );
}
