import {
    collection,
    doc,
    getDoc,
    getDocs,
    setDoc,
    updateDoc,
    query,
    where,
    orderBy,
    limit,
    increment,
    serverTimestamp,
    Timestamp,
} from 'firebase/firestore';
import { db } from './config';
import { User, Trade, Referral, Rewards, ChainId, UserPreferences } from '@/types';

// Collection references
export const usersCollection = collection(db, 'users');
export const tradesCollection = collection(db, 'trades');
export const referralsCollection = collection(db, 'referrals');
export const rewardsCollection = collection(db, 'rewards');

// Default user preferences
export const defaultPreferences: UserPreferences = {
    darkMode: true,
    defaultChain: 'solana',
    notifications: {
        tradeAlerts: false,
        rewardUpdates: true,
        priceAlerts: false,
    },
};

// Generate a unique referral code
function generateReferralCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = 'CX-';
    for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}

// === USER FUNCTIONS ===

export async function getUser(address: string): Promise<User | null> {
    try {
        const docRef = doc(usersCollection, address.toLowerCase());
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) return null;

        const data = docSnap.data();
        return {
            address: data.address,
            chains: data.chains || [],
            createdAt: data.createdAt?.toDate() || new Date(),
            referralCode: data.referralCode,
            referredBy: data.referredBy,
            totalVolume: data.totalVolume || 0,
            lastActive: data.lastActive?.toDate() || new Date(),
            email: data.email,
            displayName: data.displayName,
            photoURL: data.photoURL,
            preferences: data.preferences || defaultPreferences,
        };
    } catch (error) {
        console.error('Error getting user:', error);
        return null;
    }
}

export async function createUser(
    address: string,
    referredBy?: string
): Promise<User> {
    const referralCode = generateReferralCode();
    const now = serverTimestamp();

    const userData = {
        address: address.toLowerCase(),
        chains: [],
        createdAt: now,
        referralCode,
        referredBy: referredBy?.toLowerCase() || null,
        totalVolume: 0,
        lastActive: now,
    };

    await setDoc(doc(usersCollection, address.toLowerCase()), userData);

    // If referred, add to referrer's list
    if (referredBy) {
        await addReferral(referredBy, address);
    }

    // Initialize rewards
    await setDoc(doc(rewardsCollection, address.toLowerCase()), {
        userId: address.toLowerCase(),
        tradingRewards: 0,
        referralRewards: 0,
        claimedRewards: 0,
        lastUpdated: now,
    });

    return {
        address: address.toLowerCase(),
        chains: [],
        createdAt: new Date(),
        referralCode,
        referredBy,
        totalVolume: 0,
        lastActive: new Date(),
    };
}

export async function updateUserActivity(address: string): Promise<void> {
    try {
        await updateDoc(doc(usersCollection, address.toLowerCase()), {
            lastActive: serverTimestamp(),
        });
    } catch (error) {
        console.error('Error updating user activity:', error);
    }
}

// Update user preferences
export async function updateUserPreferences(
    userId: string,
    preferences: Partial<UserPreferences>
): Promise<boolean> {
    try {
        const userDoc = await getDoc(doc(usersCollection, userId.toLowerCase()));

        if (!userDoc.exists()) {
            console.error('User not found:', userId);
            return false;
        }

        const currentPrefs = userDoc.data().preferences || defaultPreferences;
        const updatedPrefs = {
            ...currentPrefs,
            ...preferences,
            notifications: {
                ...currentPrefs.notifications,
                ...(preferences.notifications || {}),
            },
        };

        await updateDoc(doc(usersCollection, userId.toLowerCase()), {
            preferences: updatedPrefs,
            lastActive: serverTimestamp(),
        });

        return true;
    } catch (error) {
        console.error('Error updating preferences:', error);
        return false;
    }
}

// Update user profile (display name, etc.)
export async function updateUserProfile(
    userId: string,
    updates: { displayName?: string; email?: string; photoURL?: string }
): Promise<boolean> {
    try {
        await updateDoc(doc(usersCollection, userId.toLowerCase()), {
            ...updates,
            lastActive: serverTimestamp(),
        });
        return true;
    } catch (error) {
        console.error('Error updating profile:', error);
        return false;
    }
}

// === TRADE FUNCTIONS ===

export async function recordTrade(trade: Omit<Trade, 'id'>): Promise<string> {
    const tradeId = `${trade.txHash}-${Date.now()}`;

    await setDoc(doc(tradesCollection, tradeId), {
        ...trade,
        userId: trade.userId.toLowerCase(),
        timestamp: serverTimestamp(),
    });

    // Update user's total volume
    await updateDoc(doc(usersCollection, trade.userId.toLowerCase()), {
        totalVolume: increment(trade.amountInUsd),
        lastActive: serverTimestamp(),
    });

    // Calculate and add trading rewards (0.1% of volume)
    const rewardAmount = trade.amountInUsd * 0.001;
    await updateDoc(doc(rewardsCollection, trade.userId.toLowerCase()), {
        tradingRewards: increment(rewardAmount),
        lastUpdated: serverTimestamp(),
    });

    // If user was referred, add referral rewards to referrer
    const user = await getUser(trade.userId);
    if (user?.referredBy) {
        const referralReward = trade.amountInUsd * 0.005; // 0.5%
        await updateDoc(doc(rewardsCollection, user.referredBy.toLowerCase()), {
            referralRewards: increment(referralReward),
            lastUpdated: serverTimestamp(),
        });

        // Update referral volume
        await updateReferralVolume(user.referredBy, trade.amountInUsd, referralReward);
    }

    return tradeId;
}

export async function getUserTrades(
    userId: string,
    limitCount = 50
): Promise<Trade[]> {
    try {
        const q = query(
            tradesCollection,
            where('userId', '==', userId.toLowerCase()),
            orderBy('timestamp', 'desc'),
            limit(limitCount)
        );

        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            timestamp: doc.data().timestamp?.toDate() || new Date(),
        })) as Trade[];
    } catch (error) {
        console.error('Error getting user trades:', error);
        return [];
    }
}

// === REFERRAL FUNCTIONS ===

export async function createCustomReferralCode(address: string, newCode: string): Promise<boolean> {
    try {
        // Validate code format (alphanumeric, 3-12 chars)
        if (!/^[A-Z0-9]{3,12}$/.test(newCode)) return false;

        const user = await getUser(address);
        if (!user) return false;

        // Check if code is already taken
        const existingRef = await getDoc(doc(referralsCollection, newCode));
        if (existingRef.exists()) return false;

        // Create new referral doc
        await setDoc(doc(referralsCollection, newCode), {
            ownerId: address.toLowerCase(),
            code: newCode,
            referredUsers: [],
            totalReferralVolume: 0,
            earnedRewards: 0,
        });

        // Update user profile
        await updateDoc(doc(usersCollection, address.toLowerCase()), {
            referralCode: newCode
        });

        return true;
    } catch (error) {
        console.error('Error creating referral code:', error);
        return false;
    }
}

export async function redeemReferralCode(address: string, code: string): Promise<boolean> {
    try {
        const user = await getUser(address);
        if (!user || user.referredBy) return false; // Already referred

        // Check if code exists
        const refDoc = await getDoc(doc(referralsCollection, code));
        if (!refDoc.exists()) return false;

        // Cannot refer self
        if (refDoc.data().ownerId === address.toLowerCase()) return false;

        // Update user
        await updateDoc(doc(usersCollection, address.toLowerCase()), {
            referredBy: code
        });

        // Add to referrer's list
        await updateDoc(doc(referralsCollection, code), {
            referredUsers: [...(refDoc.data().referredUsers || []), address.toLowerCase()]
        });

        return true;
    } catch (error) {
        console.error('Error redeeming code:', error);
        return false;
    }
}

async function addReferral(referrerAddress: string, referredAddress: string): Promise<void> {
    const referrer = await getUser(referrerAddress);
    if (!referrer) return;

    const referralDocRef = doc(referralsCollection, referrer.referralCode);
    const referralDoc = await getDoc(referralDocRef);

    if (referralDoc.exists()) {
        await updateDoc(referralDocRef, {
            referredUsers: [...(referralDoc.data().referredUsers || []), referredAddress.toLowerCase()],
        });
    } else {
        await setDoc(referralDocRef, {
            ownerId: referrerAddress.toLowerCase(),
            code: referrer.referralCode,
            referredUsers: [referredAddress.toLowerCase()],
            totalReferralVolume: 0,
            earnedRewards: 0,
        });
    }
}

async function updateReferralVolume(
    referrerAddress: string,
    volume: number,
    reward: number
): Promise<void> {
    const referrer = await getUser(referrerAddress);
    if (!referrer) return;

    await updateDoc(doc(referralsCollection, referrer.referralCode), {
        totalReferralVolume: increment(volume),
        earnedRewards: increment(reward),
    });
}

export async function getReferralStats(address: string): Promise<Referral | null> {
    try {
        const user = await getUser(address);
        if (!user) return null;

        // Try getting by the code stored in user profile
        let docSnap;
        if (user.referralCode) {
            docSnap = await getDoc(doc(referralsCollection, user.referralCode));
        }

        // If snapshot exists, return data
        if (docSnap && docSnap.exists()) {
            const data = docSnap.data();
            return {
                ownerId: data.ownerId,
                code: data.code,
                referredUsers: data.referredUsers || [],
                totalReferralVolume: data.totalReferralVolume || 0,
                earnedRewards: data.earnedRewards || 0,
            };
        } else {
            // If no referral doc yet, return a stub based on user profile code (if present) or null
            if (user.referralCode) {
                return {
                    ownerId: address,
                    code: user.referralCode,
                    referredUsers: [],
                    totalReferralVolume: 0,
                    earnedRewards: 0
                }
            }
            return null;
        }

    } catch (error) {
        console.error('Error getting referral stats:', error);
        return null;
    }
}

// === REWARDS FUNCTIONS ===

export async function getRewards(address: string): Promise<Rewards | null> {
    try {
        const docSnap = await getDoc(doc(rewardsCollection, address.toLowerCase()));
        if (!docSnap.exists()) return null;

        const data = docSnap.data();
        return {
            userId: data.userId,
            tradingRewards: data.tradingRewards || 0,
            referralRewards: data.referralRewards || 0,
            claimedRewards: data.claimedRewards || 0,
            lastUpdated: data.lastUpdated?.toDate() || new Date(),
        };
    } catch (error) {
        console.error('Error getting rewards:', error);
        return null;
    }
}

export async function claimRewards(address: string): Promise<number> {
    try {
        const rewards = await getRewards(address);
        if (!rewards) return 0;

        const claimable = rewards.tradingRewards + rewards.referralRewards - rewards.claimedRewards;
        if (claimable <= 0) return 0;

        await updateDoc(doc(rewardsCollection, address.toLowerCase()), {
            claimedRewards: increment(claimable),
            lastUpdated: serverTimestamp(),
        });

        return claimable;
    } catch (error) {
        console.error('Error claiming rewards:', error);
        return 0;
    }
}

// === LEADERBOARD ===

export async function getLeaderboard(limitCount = 20): Promise<User[]> {
    try {
        const q = query(
            usersCollection,
            orderBy('totalVolume', 'desc'),
            limit(limitCount)
        );

        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                address: data.address,
                chains: data.chains || [],
                createdAt: data.createdAt?.toDate() || new Date(),
                referralCode: data.referralCode,
                referredBy: data.referredBy,
                totalVolume: data.totalVolume || 0,
                lastActive: data.lastActive?.toDate() || new Date(),
            };
        });
    } catch (error) {
        console.error('Error getting leaderboard:', error);
        return [];
    }
}

// === TIER SYSTEM ===

export interface RewardTier {
    id: string;
    name: string;
    minVolume: number;
    tradingRewardRate: number; // percentage of volume as reward
    referralRewardRate: number; // percentage of referred volume
    color: string;
    icon: string;
}

export const REWARD_TIERS: RewardTier[] = [
    { id: 'bronze', name: 'Bronze', minVolume: 0, tradingRewardRate: 0.10, referralRewardRate: 0.50, color: '#CD7F32', icon: '🥉' },
    { id: 'silver', name: 'Silver', minVolume: 1000, tradingRewardRate: 0.12, referralRewardRate: 0.60, color: '#C0C0C0', icon: '🥈' },
    { id: 'gold', name: 'Gold', minVolume: 10000, tradingRewardRate: 0.15, referralRewardRate: 0.75, color: '#FFD700', icon: '🥇' },
    { id: 'platinum', name: 'Platinum', minVolume: 50000, tradingRewardRate: 0.20, referralRewardRate: 1.00, color: '#E5E4E2', icon: '💎' },
    { id: 'diamond', name: 'Diamond', minVolume: 100000, tradingRewardRate: 0.25, referralRewardRate: 1.50, color: '#B9F2FF', icon: '👑' },
];

export function getUserTier(totalVolume: number): RewardTier {
    // Find highest tier user qualifies for
    for (let i = REWARD_TIERS.length - 1; i >= 0; i--) {
        if (totalVolume >= REWARD_TIERS[i].minVolume) {
            return REWARD_TIERS[i];
        }
    }
    return REWARD_TIERS[0];
}

export function getNextTier(totalVolume: number): { tier: RewardTier; volumeNeeded: number } | null {
    const currentTier = getUserTier(totalVolume);
    const currentIndex = REWARD_TIERS.findIndex(t => t.id === currentTier.id);

    if (currentIndex >= REWARD_TIERS.length - 1) {
        return null; // Already at max tier
    }

    const nextTier = REWARD_TIERS[currentIndex + 1];
    return {
        tier: nextTier,
        volumeNeeded: nextTier.minVolume - totalVolume,
    };
}

export function calculateXP(totalVolume: number, referralCount: number): number {
    // XP formula: 1 XP per $10 volume + 100 XP per referral
    return Math.floor(totalVolume / 10) + (referralCount * 100);
}

// Enhanced leaderboard with rewards
export interface LeaderboardEntry {
    rank: number;
    address: string;
    displayName?: string;
    totalVolume: number;
    tier: RewardTier;
    xp: number;
    referralCount: number;
    totalRewards: number;
}

export async function getEnhancedLeaderboard(limitCount = 20): Promise<LeaderboardEntry[]> {
    try {
        const q = query(
            usersCollection,
            orderBy('totalVolume', 'desc'),
            limit(limitCount)
        );

        const snapshot = await getDocs(q);
        const entries: LeaderboardEntry[] = [];

        for (let i = 0; i < snapshot.docs.length; i++) {
            const data = snapshot.docs[i].data();
            const address = data.address;

            // Get referral stats
            const referral = await getReferralStats(address);
            const referralCount = referral?.referredUsers.length || 0;

            // Get rewards
            const rewards = await getRewards(address);
            const totalRewards = rewards ? (rewards.tradingRewards + rewards.referralRewards) : 0;

            entries.push({
                rank: i + 1,
                address,
                displayName: data.displayName,
                totalVolume: data.totalVolume || 0,
                tier: getUserTier(data.totalVolume || 0),
                xp: calculateXP(data.totalVolume || 0, referralCount),
                referralCount,
                totalRewards,
            });
        }

        return entries;
    } catch (error) {
        console.error('Error getting enhanced leaderboard:', error);
        return [];
    }
}
