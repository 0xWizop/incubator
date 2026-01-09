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

                {/* Tier Progress Card */}
                {userTier && (
                    <div className="card p-4 sm:p-6 mb-4 sm:mb-8 bg-gradient-to-r from-[var(--background-secondary)] to-transparent border-l-4" style={{ borderLeftColor: userTier.color }}>
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <span className="text-3xl">{userTier.icon}</span>
                                <div>
                                    <p className="text-sm text-[var(--foreground-muted)]">Your Tier</p>
                                    <p className="text-xl font-bold" style={{ color: userTier.color }}>{userTier.name}</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-xs text-[var(--foreground-muted)]">XP</p>
                                <p className="text-lg font-bold font-mono">{userXP.toLocaleString()}</p>
                            </div>
                        </div>

                        {nextTier && (
                            <div>
                                <div className="flex justify-between text-xs mb-1">
                                    <span className="text-[var(--foreground-muted)]">Progress to {nextTier.tier.name}</span>
                                    <span className="font-medium">${(nextTier.tier.minVolume - nextTier.volumeNeeded).toLocaleString()} / ${nextTier.tier.minVolume.toLocaleString()}</span>
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
                                <p className="text-xs text-[var(--foreground-muted)] mt-1">
                                    ${nextTier.volumeNeeded.toLocaleString()} more volume needed
                                </p>
                            </div>
                        )}

                        <div className="flex gap-4 mt-4 pt-4 border-t border-[var(--border)]">
                            <div>
                                <p className="text-xs text-[var(--foreground-muted)]">Trading Rate</p>
                                <p className="font-bold text-[var(--primary)]">{userTier.tradingRewardRate}%</p>
                            </div>
                            <div>
                                <p className="text-xs text-[var(--foreground-muted)]">Referral Rate</p>
                                <p className="font-bold text-[var(--accent-purple)]">{userTier.referralRewardRate}%</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Stats Cards - 2x2 on mobile, 4 across on desktop */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 mb-4 sm:mb-8">
                    <div className="card p-1.5 sm:p-3 flex flex-col">
                        <div className="flex items-center justify-between mb-0.5 sm:mb-2">
                            <span className="text-[0.6rem] sm:text-sm font-bold text-[var(--accent-green)] uppercase tracking-wide">Claimable</span>
                            <Coins className="w-3 h-3 sm:w-5 sm:h-5 text-[var(--accent-green)]" />
                        </div>
                        <p className="text-sm sm:text-xl font-semibold text-[var(--accent-green)] h-5 sm:h-7 flex items-center">
                            ${claimable.toFixed(2)}
                        </p>
                        <button
                            onClick={handleClaim}
                            disabled={claimable <= 0 || isClaiming}
                            className="btn w-full mt-1 sm:mt-auto text-[10px] sm:text-sm py-0.5 sm:py-2 bg-[var(--accent-green)] text-black font-bold hover:-translate-y-0.5 transition-all disabled:opacity-50"
                        >
                            {isClaiming ? '...' : 'Claim'}
                        </button>
                    </div>

                    <div className="card p-1.5 sm:p-3 flex flex-col">
                        <div className="flex items-center justify-between mb-0.5 sm:mb-2">
                            <span className="text-[0.6rem] sm:text-sm text-[var(--foreground-muted)]">Trading</span>
                            <TrendingUp className="w-3 h-3 sm:w-5 sm:h-5 text-[var(--primary)]" />
                        </div>
                        <p className="text-sm sm:text-xl font-semibold h-5 sm:h-7 flex items-center">${rewards?.tradingRewards.toFixed(2) || '0.00'}</p>
                        <p className="text-[0.55rem] sm:text-sm text-[var(--foreground-muted)] mt-1 sm:mt-auto">Lifetime</p>
                    </div>

                    <div className="card p-1.5 sm:p-3 flex flex-col">
                        <div className="flex items-center justify-between mb-0.5 sm:mb-2">
                            <span className="text-[0.6rem] sm:text-sm text-[var(--foreground-muted)]">Referral</span>
                            <Users className="w-3 h-3 sm:w-5 sm:h-5 text-[var(--accent-purple)]" />
                        </div>
                        <p className="text-sm sm:text-xl font-semibold h-5 sm:h-7 flex items-center">${rewards?.referralRewards.toFixed(2) || '0.00'}</p>
                        <p className="text-[0.55rem] sm:text-sm text-[var(--foreground-muted)] mt-1 sm:mt-auto">
                            {referral?.referredUsers.length || 0} refs
                        </p>
                    </div>

                    <div className="card p-1.5 sm:p-3 flex flex-col">
                        <div className="flex items-center justify-between mb-0.5 sm:mb-2">
                            <span className="text-[0.6rem] sm:text-sm text-[var(--foreground-muted)]">Ref Vol</span>
                            <Trophy className="w-3 h-3 sm:w-5 sm:h-5 text-[var(--accent-yellow)]" />
                        </div>
                        <p className="text-sm sm:text-xl font-semibold h-5 sm:h-7 flex items-center">${referral?.totalReferralVolume.toLocaleString() || '0'}</p>
                        <p className="text-[0.55rem] sm:text-sm text-[var(--foreground-muted)] mt-1 sm:mt-auto">Total</p>
                    </div>
                </div>

                {/* Referral Management */}
                <div className="grid lg:grid-cols-2 gap-4 mb-4 sm:mb-8">
                    {/* My Referral Code Section */}
                    <div className="card p-4 sm:p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-bold flex items-center gap-2 text-sm sm:text-lg">
                                <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-[var(--accent-yellow)]" />
                                Your Referral Code
                            </h3>
                            {referral && !isEditing && (
                                <button
                                    onClick={() => setIsEditing(true)}
                                    className="text-xs text-[var(--primary)] hover:underline"
                                >
                                    Customize
                                </button>
                            )}
                        </div>

                        {/* Show create form if no code yet OR if editing */}
                        {(!referral || isEditing) ? (
                            <div>
                                <p className="text-xs sm:text-sm text-[var(--foreground-muted)] mb-4">
                                    {referral ? 'Change your referral code:' : 'Create a unique code to start earning'}{' '}
                                    <span className="text-[var(--primary)] font-bold">0.5%</span> of referral fees.
                                </p>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        placeholder="e.g. THEINCUBATOR"
                                        className="input flex-1 uppercase font-mono text-sm"
                                        value={createCode}
                                        onChange={(e) => setCreateCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                                        maxLength={12}
                                    />
                                    <button
                                        onClick={handleCreateCode}
                                        disabled={isSubmitting || !createCode || createCode.length < 3}
                                        className="btn btn-primary px-4 text-sm whitespace-nowrap"
                                    >
                                        {isSubmitting ? '...' : (referral ? 'Update' : 'Create')}
                                    </button>
                                    {isEditing && (
                                        <button
                                            onClick={() => { setIsEditing(false); setCreateCode(''); }}
                                            className="btn btn-secondary px-3 text-sm"
                                        >
                                            Cancel
                                        </button>
                                    )}
                                </div>
                                <p className="text-[10px] text-[var(--foreground-muted)] mt-2">
                                    3-12 alphanumeric characters
                                </p>
                            </div>
                        ) : (
                            <div>
                                <p className="text-xs sm:text-sm text-[var(--foreground-muted)] mb-3">
                                    Share your link and earn <span className="text-[var(--primary)] font-bold">0.5%</span> of all referral trading fees. Forever.
                                </p>
                                <div className="flex items-center gap-2">
                                    <div className="flex-1 px-3 py-2.5 bg-[var(--background-tertiary)] rounded-lg font-mono text-xs sm:text-sm border border-[var(--border)] text-left overflow-hidden text-ellipsis">
                                        {referralLink}
                                    </div>
                                    <button
                                        onClick={handleCopy}
                                        className={clsx(
                                            'btn px-4 py-2.5 text-sm font-medium',
                                            copied ? 'btn-primary' : 'btn-secondary'
                                        )}
                                    >
                                        {copied ? (
                                            <span className="flex items-center gap-1">
                                                <CheckCircle className="w-4 h-4" />
                                                Copied
                                            </span>
                                        ) : (
                                            <span className="flex items-center gap-1">
                                                <Copy className="w-4 h-4" />
                                                Copy
                                            </span>
                                        )}
                                    </button>
                                </div>
                                <p className="text-[10px] text-[var(--foreground-muted)] mt-2">
                                    Your code: <span className="font-mono text-[var(--primary)]">{referral.code}</span>
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Apply Someone Else's Code */}
                    <div className="card p-4 sm:p-6">
                        <h3 className="font-bold flex items-center gap-2 mb-4 text-sm sm:text-lg">
                            <Gift className="w-4 h-4 sm:w-5 sm:h-5 text-[var(--accent-purple)]" />
                            Got a Referral Code?
                        </h3>
                        <p className="text-xs sm:text-sm text-[var(--foreground-muted)] mb-4">
                            Enter a friend's code to link your account to their referral.
                        </p>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                placeholder="Enter code"
                                className="input flex-1 uppercase font-mono text-sm"
                                value={redeemCode}
                                onChange={(e) => setRedeemCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                                maxLength={12}
                            />
                            <button
                                onClick={handleRedeemCode}
                                disabled={isSubmitting || !redeemCode || redeemCode.length < 3}
                                className="btn btn-secondary px-4 text-sm whitespace-nowrap"
                            >
                                {isSubmitting ? 'Applying...' : 'Apply'}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Tabs - Compact on mobile */}
                <div className="flex gap-1 sm:gap-2 mb-6 sm:mb-8 pb-4 border-b border-[var(--border)]">
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
                                    ? 'bg-[var(--background-tertiary)] text-[var(--foreground)] border border-[var(--border-hover)]'
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
                                    <p className="text-[9px] sm:text-sm text-[var(--foreground-muted)] leading-tight">Earn rewards from trading volume</p>
                                </div>
                                <div>
                                    <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-full bg-[var(--primary)]/20 text-[var(--primary)] flex items-center justify-center text-sm sm:text-xl font-bold mx-auto mb-2 sm:mb-4">2</div>
                                    <h4 className="font-bold text-xs sm:text-base mb-1 sm:mb-2">Refer</h4>
                                    <p className="text-[9px] sm:text-sm text-[var(--foreground-muted)] leading-tight">Share your link to earn referral fees</p>
                                </div>
                                <div>
                                    <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-full bg-[var(--primary)]/20 text-[var(--primary)] flex items-center justify-center text-sm sm:text-xl font-bold mx-auto mb-2 sm:mb-4">3</div>
                                    <h4 className="font-bold text-xs sm:text-base mb-1 sm:mb-2">Claim</h4>
                                    <p className="text-[9px] sm:text-sm text-[var(--foreground-muted)] leading-tight">Claim rewards weekly</p>
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
                                        <th className="w-12">Rank</th>
                                        <th>Trader</th>
                                        <th className="text-center hidden sm:table-cell">Tier</th>
                                        <th className="text-right">Volume</th>
                                        <th className="text-right">Rewards</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {leaderboard.length === 0 ? (
                                        <tr><td colSpan={5} className="text-center py-8 text-[var(--foreground-muted)]">No data yet</td></tr>
                                    ) : (
                                        leaderboard.map((entry) => (
                                            <tr key={entry.address}>
                                                <td>
                                                    <span className={clsx(
                                                        "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold",
                                                        entry.rank === 1 && "bg-[#FFD700] text-black",
                                                        entry.rank === 2 && "bg-[#C0C0C0] text-black",
                                                        entry.rank === 3 && "bg-[#CD7F32] text-black",
                                                        entry.rank > 3 && "text-[var(--foreground-muted)]"
                                                    )}>
                                                        {entry.rank}
                                                    </span>
                                                </td>
                                                <td>
                                                    <div className="flex items-center gap-2">
                                                        <span className="sm:hidden">{entry.tier.icon}</span>
                                                        <div>
                                                            <p className="font-mono text-sm">
                                                                {entry.displayName || `${entry.address.slice(0, 6)}...${entry.address.slice(-4)}`}
                                                                {entry.address.toLowerCase() === address?.toLowerCase() && <span className="ml-2 text-xs text-[var(--primary)]">(You)</span>}
                                                            </p>
                                                            <p className="text-xs text-[var(--foreground-muted)]">{entry.xp.toLocaleString()} XP</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="text-center hidden sm:table-cell">
                                                    <span className="text-xl" title={entry.tier.name}>{entry.tier.icon}</span>
                                                </td>
                                                <td className="text-right font-mono">${entry.totalVolume.toLocaleString()}</td>
                                                <td className="text-right font-mono text-[var(--accent-green)]">${entry.totalRewards.toFixed(2)}</td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )
                }

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
