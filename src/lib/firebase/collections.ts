import {
    collection,
    doc,
    getDoc,
    getDocs,
    setDoc,
    updateDoc,
    deleteDoc,
    query,
    where,
    orderBy,
    limit,
    increment,
    serverTimestamp,
    Timestamp,
} from 'firebase/firestore';
import { db } from './config';
import {
    User,
    Trade,
    Referral,
    Rewards,
    ChainId,
    UserPreferences,
    Watchlist,
    WatchlistToken,
    PriceAlert,
    TrackedWallet,
    WalletActivity,
    PortfolioSnapshot,
    SnapshotHolding,
    SharedWatchlist,
    WatchlistVisibility,
    WatchlistFollower,
    EnhancedPriceAlert,
    AlertConditionType,
    SavedArticle,
    SentimentType,
} from '@/types';
import type { NewsArticle } from '@/lib/api/coindesk';

// Helper to normalize IDs (lowercase addresses, keep UIDs as is)
function normalizeId(id: string): string {
    if (!id) return '';
    return id.startsWith('0x') ? id.toLowerCase() : id;
}

// Collection references
export const usersCollection = collection(db, 'users');
export const tradesCollection = collection(db, 'trades');
export const referralsCollection = collection(db, 'referrals');
export const rewardsCollection = collection(db, 'rewards');
export const watchlistsCollection = collection(db, 'watchlists');
export const alertsCollection = collection(db, 'alerts');
export const trackedWalletsCollection = collection(db, 'trackedWallets');
export const portfolioSnapshotsCollection = collection(db, 'portfolioSnapshots');
export const watchlistFollowersCollection = collection(db, 'watchlistFollowers');
export const savedArticlesCollection = collection(db, 'savedArticles');
export const newsStatsCollection = collection(db, 'newsStats');

// Default user preferences
export const defaultPreferences: UserPreferences = {
    darkMode: true,
    defaultChain: 'solana',
    // Trading defaults
    defaultSlippage: 1, // 1% default
    // customSlippage: undefined - removed to avoid Firestore error
    // Display defaults
    // Display defaults
    currencyDisplay: 'USD',
    hideBalances: false,
    // Notifications
    notifications: {
        tradeAlerts: false,
        rewardUpdates: true,
        priceAlerts: false,
        newsAlerts: false,
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
        const docRef = doc(usersCollection, normalizeId(address));
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
        address: normalizeId(address),
        chains: [],
        createdAt: now,
        referralCode,
        referredBy: referredBy ? normalizeId(referredBy) : null,
        totalVolume: 0,
        lastActive: now,
    };

    await setDoc(doc(usersCollection, normalizeId(address)), userData);

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

    // Auto-create the referral document so referral link works immediately
    await setDoc(doc(referralsCollection, referralCode), {
        ownerId: normalizeId(address),
        code: referralCode,
        referredUsers: [],
        totalReferralVolume: 0,
        earnedRewards: 0,
        createdAt: now,
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
        await updateDoc(doc(usersCollection, normalizeId(address)), {
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
        const userDoc = await getDoc(doc(usersCollection, normalizeId(userId)));

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

        // Sanitize preferences to remove undefined values which Firestore doesn't support
        const safePrefs = JSON.parse(JSON.stringify(updatedPrefs));

        await updateDoc(doc(usersCollection, normalizeId(userId)), {
            preferences: safePrefs,
            lastActive: serverTimestamp(),
        });

        return true;
    } catch (error) {
        console.error('Error updating preferences:', error);
        return false;
    }
}

// Update user profile (display name, etc.)
// Add a wallet address to user's chains
export async function addWalletToUser(userId: string, walletAddress: string): Promise<boolean> {
    try {
        const userRef = doc(usersCollection, normalizeId(userId));
        const userDoc = await getDoc(userRef);

        if (!userDoc.exists()) return false;

        const currentChains = userDoc.data().chains || [];
        const normalizedWallet = normalizeId(walletAddress);

        if (!currentChains.includes(normalizedWallet)) {
            await updateDoc(userRef, {
                chains: [...currentChains, normalizedWallet],
                lastActive: serverTimestamp(),
            });
        }
        return true;
    } catch (error) {
        console.error('Error adding wallet to user:', error);
        return false;
    }
}

export async function updateUserProfile(
    userId: string,
    updates: { displayName?: string; email?: string; photoURL?: string }
): Promise<boolean> {
    try {
        await updateDoc(doc(usersCollection, normalizeId(userId)), {
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
        if (!/^[A-Z0-9]{3,12}$/.test(newCode)) {
            console.error('Invalid code format:', newCode);
            return false;
        }

        let user = await getUser(address);

        // If user doesn't exist, create them first
        if (!user) {
            console.log('User not found, creating new user:', address);
            user = await createUser(address);
        }

        // Check if code is already taken
        const existingRef = await getDoc(doc(referralsCollection, newCode));
        if (existingRef.exists()) {
            console.error('Code already taken:', newCode);
            return false;
        }

        // Delete old referral doc if user had one
        if (user.referralCode && user.referralCode !== newCode) {
            try {
                await deleteDoc(doc(referralsCollection, user.referralCode));
            } catch (e) {
                // Ignore if old doc doesn't exist
            }
        }

        // Create new referral doc
        await setDoc(doc(referralsCollection, newCode), {
            ownerId: address.toLowerCase(),
            code: newCode,
            referredUsers: [],
            totalReferralVolume: 0,
            earnedRewards: 0,
            createdAt: serverTimestamp(),
        });

        // Update user profile
        await updateDoc(doc(usersCollection, address.toLowerCase()), {
            referralCode: newCode
        });

        console.log('Successfully created referral code:', newCode);
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
        await updateDoc(doc(usersCollection, normalizeId(address)), {
            referredBy: code
        });

        // Add to referrer's list
        await updateDoc(doc(referralsCollection, code), {
            referredUsers: [...(refDoc.data().referredUsers || []), normalizeId(address)]
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
        const docRef = doc(rewardsCollection, normalizeId(address));
        const docSnap = await getDoc(docRef);
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

        if (claimable <= 0) return 0;

        await updateDoc(doc(rewardsCollection, normalizeId(address)), {
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

// === WATCHLIST FUNCTIONS ===

const DEFAULT_FAVORITES_ID = 'favorites';

export async function getWatchlists(userId: string): Promise<Watchlist[]> {
    try {
        const docRef = doc(watchlistsCollection, normalizeId(userId));
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) {
            // Initialize with empty favorites list
            const now = Timestamp.now();
            const initialData = {
                lists: [{
                    id: DEFAULT_FAVORITES_ID,
                    name: 'Favorites',
                    tokens: [],
                    createdAt: now,
                    updatedAt: now,
                }]
            };
            await setDoc(docRef, initialData);
            return [{
                id: DEFAULT_FAVORITES_ID,
                name: 'Favorites',
                tokens: [],
                createdAt: new Date(),
                updatedAt: new Date(),
            }];
        }

        const data = docSnap.data();
        return (data.lists || []).map((list: any) => ({
            id: list.id,
            name: list.name,
            tokens: (list.tokens || []).map((t: any) => ({
                ...t,
                addedAt: t.addedAt?.toDate?.() || new Date(),
            })),
            createdAt: list.createdAt?.toDate?.() || new Date(),
            updatedAt: list.updatedAt?.toDate?.() || new Date(),
        }));
    } catch (error) {
        console.error('Error getting watchlists:', error);
        return [];
    }
}

export async function createWatchlist(userId: string, name: string): Promise<Watchlist | null> {
    try {
        const docRef = doc(watchlistsCollection, normalizeId(userId));
        const docSnap = await getDoc(docRef);

        const newList: Watchlist = {
            id: `list-${Date.now()}`,
            name,
            tokens: [],
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        if (!docSnap.exists()) {
            const now = Timestamp.now();
            await setDoc(docRef, {
                lists: [
                    { id: DEFAULT_FAVORITES_ID, name: 'Favorites', tokens: [], createdAt: now, updatedAt: now },
                    { ...newList, createdAt: now, updatedAt: now }
                ]
            });
        } else {
            const currentLists = docSnap.data().lists || [];
            const now = Timestamp.now();
            await updateDoc(docRef, {
                lists: [...currentLists, { ...newList, createdAt: now, updatedAt: now }]
            });
        }

        return newList;
    } catch (error) {
        console.error('Error creating watchlist:', error);
        return null;
    }
}

export async function deleteWatchlist(userId: string, listId: string): Promise<boolean> {
    try {
        if (listId === DEFAULT_FAVORITES_ID) return false; // Cannot delete favorites

        const docRef = doc(watchlistsCollection, normalizeId(userId));
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) return false;

        const currentLists = docSnap.data().lists || [];
        const updatedLists = currentLists.filter((l: any) => l.id !== listId);

        await updateDoc(docRef, { lists: updatedLists });
        return true;
    } catch (error) {
        console.error('Error deleting watchlist:', error);
        return false;
    }
}

export async function addToWatchlist(
    userId: string,
    listId: string,
    token: Omit<WatchlistToken, 'addedAt'>
): Promise<boolean> {
    try {
        const docRef = doc(watchlistsCollection, normalizeId(userId));
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) {
            // Initialize with favorites containing this token
            const now = Timestamp.now();
            await setDoc(docRef, {
                lists: [{
                    id: DEFAULT_FAVORITES_ID,
                    name: 'Favorites',
                    tokens: [{ ...token, addedAt: now }],
                    createdAt: now,
                    updatedAt: now,
                }]
            });
            return true;
        }

        const currentLists = docSnap.data().lists || [];
        const listIndex = currentLists.findIndex((l: any) => l.id === listId);

        if (listIndex === -1) return false;

        // Check if token already exists
        const existingTokens = currentLists[listIndex].tokens || [];
        if (existingTokens.some((t: any) => t.pairAddress === token.pairAddress)) {
            return true; // Already exists
        }

        const now = Timestamp.now();
        currentLists[listIndex].tokens = [...existingTokens, { ...token, addedAt: now }];
        currentLists[listIndex].updatedAt = now;

        await updateDoc(docRef, { lists: currentLists });
        return true;
    } catch (error) {
        console.error('Error adding to watchlist:', error);
        return false;
    }
}

export async function removeFromWatchlist(
    userId: string,
    listId: string,
    pairAddress: string
): Promise<boolean> {
    try {
        const docRef = doc(watchlistsCollection, normalizeId(userId));
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) return false;

        const currentLists = docSnap.data().lists || [];
        const listIndex = currentLists.findIndex((l: any) => l.id === listId);

        if (listIndex === -1) return false;

        currentLists[listIndex].tokens = (currentLists[listIndex].tokens || [])
            .filter((t: any) => t.pairAddress !== pairAddress);
        currentLists[listIndex].updatedAt = Timestamp.now();

        await updateDoc(docRef, { lists: currentLists });
        return true;
    } catch (error) {
        console.error('Error removing from watchlist:', error);
        return false;
    }
}

export async function isFavorited(userId: string, pairAddress: string): Promise<boolean> {
    try {
        const watchlists = await getWatchlists(userId);
        const favorites = watchlists.find(w => w.id === DEFAULT_FAVORITES_ID);
        return favorites?.tokens.some(t => t.pairAddress === pairAddress) || false;
    } catch (error) {
        return false;
    }
}

// === ALERT FUNCTIONS ===

export async function getAlerts(userId: string): Promise<PriceAlert[]> {
    try {
        const q = query(
            alertsCollection,
            where('userId', '==', normalizeId(userId)),
            orderBy('createdAt', 'desc')
        );

        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate?.() || new Date(),
        })) as PriceAlert[];
    } catch (error) {
        console.error('Error getting alerts:', error);
        return [];
    }
}

export async function createAlert(
    userId: string,
    alert: Omit<PriceAlert, 'id' | 'userId' | 'triggered' | 'createdAt'>
): Promise<PriceAlert | null> {
    try {
        const alertId = `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        const alertData = {
            ...alert,
            id: alertId,
            userId: normalizeId(userId),
            triggered: false,
            createdAt: serverTimestamp(),
        };

        await setDoc(doc(alertsCollection, alertId), alertData);

        return {
            ...alert,
            id: alertId,
            userId: normalizeId(userId),
            triggered: false,
            createdAt: new Date(),
        };
    } catch (error) {
        console.error('Error creating alert:', error);
        return null;
    }
}

export async function deleteAlert(alertId: string): Promise<boolean> {
    try {
        await deleteDoc(doc(alertsCollection, alertId));
        return true;
    } catch (error) {
        console.error('Error deleting alert:', error);
        return false;
    }
}

export async function markAlertTriggered(alertId: string): Promise<boolean> {
    try {
        await updateDoc(doc(alertsCollection, alertId), {
            triggered: true,
        });
        return true;
    } catch (error) {
        console.error('Error marking alert triggered:', error);
        return false;
    }
}

// === TRACKED WALLET FUNCTIONS ===

const MAX_TRACKED_WALLETS = 10;

export async function getTrackedWallets(userId: string): Promise<TrackedWallet[]> {
    try {
        const q = query(
            trackedWalletsCollection,
            where('userId', '==', normalizeId(userId)),
            orderBy('createdAt', 'desc')
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate() || new Date(),
            lastActivityAt: doc.data().lastActivityAt?.toDate(),
        })) as TrackedWallet[];
    } catch (error) {
        console.error('Error getting tracked wallets:', error);
        return [];
    }
}

export async function addTrackedWallet(
    userId: string,
    wallet: Omit<TrackedWallet, 'id' | 'userId' | 'createdAt' | 'isActive'>
): Promise<TrackedWallet | null> {
    try {
        // Check limit
        const existing = await getTrackedWallets(userId);
        if (existing.length >= MAX_TRACKED_WALLETS) {
            console.error('Tracked wallet limit reached');
            return null;
        }

        // Check if already tracking this address
        if (existing.some(w => w.address.toLowerCase() === wallet.address.toLowerCase() && w.chainId === wallet.chainId)) {
            console.error('Already tracking this wallet');
            return null;
        }

        const walletId = `${normalizeId(userId)}-${wallet.address.toLowerCase()}-${Date.now()}`;
        const now = serverTimestamp();

        const walletData = {
            ...wallet,
            id: walletId,
            userId: normalizeId(userId),
            address: wallet.address.toLowerCase(),
            isActive: true,
            createdAt: now,
        };

        await setDoc(doc(trackedWalletsCollection, walletId), walletData);

        return {
            ...wallet,
            id: walletId,
            userId: normalizeId(userId),
            address: wallet.address.toLowerCase(),
            isActive: true,
            createdAt: new Date(),
        } as TrackedWallet;
    } catch (error) {
        console.error('Error adding tracked wallet:', error);
        return null;
    }
}

export async function updateTrackedWallet(
    walletId: string,
    updates: Partial<Pick<TrackedWallet, 'name' | 'isActive' | 'notifyOnActivity' | 'lastActivityAt'>>
): Promise<boolean> {
    try {
        await updateDoc(doc(trackedWalletsCollection, walletId), updates);
        return true;
    } catch (error) {
        console.error('Error updating tracked wallet:', error);
        return false;
    }
}

export async function deleteTrackedWallet(walletId: string): Promise<boolean> {
    try {
        await deleteDoc(doc(trackedWalletsCollection, walletId));
        return true;
    } catch (error) {
        console.error('Error deleting tracked wallet:', error);
        return false;
    }
}

// === COPY TRADING FUNCTIONS ===

import { Trader, CopyRelationship, CopySettings, CopyPerformance, CopiedTrade, TraderApplication } from '@/types';

export const tradersCollection = collection(db, 'traders');
export const copyRelationshipsCollection = collection(db, 'copyRelationships');
export const copiedTradesCollection = collection(db, 'copiedTrades');

// Generate mock traders for demo (will be replaced with real data later)
const MOCK_TRADERS: Trader[] = [
    {
        id: 'trader-sol-whale',
        walletAddress: 'CxU6...BDp8',
        displayName: 'SolanaWhale',
        avatar: 'https://api.dicebear.com/7.x/identicon/svg?seed=SolanaWhale',
        bio: 'Full-time Solana degen. 3+ years trading memecoins and DeFi. DYOR, NFA.',
        isVerified: true,
        isPro: true,
        stats: {
            followers: 847,
            totalVolume: 2450000,
            winRate: 72.5,
            roi7d: 18.4,
            roi30d: 127.5,
            roi90d: 342.1,
            roiAllTime: 1250.0,
            totalTrades: 1234,
            profitableTrades: 894,
            avgTradeSize: 1985,
            activeChains: ['solana'],
        },
        settings: {
            allowCopying: true,
            commissionRate: 10,
            minCopyAmount: 50,
            maxCopiers: 1000,
        },
        createdAt: new Date('2023-06-15'),
        lastTradeAt: new Date(),
    },
    {
        id: 'trader-defi-master',
        walletAddress: '0x742d...f44e',
        displayName: 'DeFiMaster',
        avatar: 'https://api.dicebear.com/7.x/identicon/svg?seed=DeFiMaster',
        bio: 'Swing trading ETH and major alts. Risk-managed positions with tight stops.',
        isVerified: true,
        isPro: true,
        stats: {
            followers: 612,
            totalVolume: 1850000,
            winRate: 68.2,
            roi7d: 8.2,
            roi30d: 98.2,
            roi90d: 215.4,
            roiAllTime: 890.0,
            totalTrades: 892,
            profitableTrades: 608,
            avgTradeSize: 2075,
            activeChains: ['ethereum', 'arbitrum'],
        },
        settings: {
            allowCopying: true,
            commissionRate: 10,
            minCopyAmount: 100,
            maxCopiers: 500,
        },
        createdAt: new Date('2023-08-20'),
        lastTradeAt: new Date(),
    },
    {
        id: 'trader-meme-king',
        walletAddress: '7xKp...9mNz',
        displayName: 'MemeKing',
        avatar: 'https://api.dicebear.com/7.x/identicon/svg?seed=MemeKing',
        bio: '🐸 Early meme hunter. Finding the next 100x before CT. High risk, high reward.',
        isVerified: true,
        isPro: true,
        stats: {
            followers: 891,
            totalVolume: 980000,
            winRate: 45.8,
            roi7d: 42.1,
            roi30d: 82.1,
            roi90d: 567.3,
            roiAllTime: 2100.0,
            totalTrades: 2456,
            profitableTrades: 1124,
            avgTradeSize: 399,
            activeChains: ['solana', 'base'],
        },
        settings: {
            allowCopying: true,
            commissionRate: 15,
            minCopyAmount: 25,
            maxCopiers: 2000,
        },
        createdAt: new Date('2024-01-10'),
        lastTradeAt: new Date(),
    },
    {
        id: 'trader-base-builder',
        walletAddress: '0xa3c1...8e2f',
        displayName: 'BaseBuilder',
        avatar: 'https://api.dicebear.com/7.x/identicon/svg?seed=BaseBuilder',
        bio: 'Base ecosystem specialist. Focused on sustainable gains and new launches.',
        isVerified: true,
        isPro: true,
        stats: {
            followers: 324,
            totalVolume: 520000,
            winRate: 65.4,
            roi7d: 12.3,
            roi30d: 45.6,
            roi90d: 120.8,
            roiAllTime: 380.0,
            totalTrades: 456,
            profitableTrades: 298,
            avgTradeSize: 1140,
            activeChains: ['base'],
        },
        settings: {
            allowCopying: true,
            commissionRate: 8,
            minCopyAmount: 50,
            maxCopiers: 300,
        },
        createdAt: new Date('2024-03-01'),
        lastTradeAt: new Date(),
    },
    {
        id: 'trader-arb-alpha',
        walletAddress: '0xb7d2...4a1c',
        displayName: 'ArbAlpha',
        avatar: 'https://api.dicebear.com/7.x/identicon/svg?seed=ArbAlpha',
        bio: 'Arbitrum OG. Finding alpha in the L2 ecosystem since day 1.',
        isVerified: false,
        isPro: true,
        stats: {
            followers: 198,
            totalVolume: 340000,
            winRate: 58.2,
            roi7d: 5.8,
            roi30d: 32.4,
            roi90d: 89.2,
            roiAllTime: 210.0,
            totalTrades: 312,
            profitableTrades: 182,
            avgTradeSize: 1090,
            activeChains: ['arbitrum'],
        },
        settings: {
            allowCopying: true,
            commissionRate: 10,
            minCopyAmount: 75,
            maxCopiers: 200,
        },
        createdAt: new Date('2024-02-15'),
        lastTradeAt: new Date(),
    },
];

// Get all traders (leaderboard)
export async function getTraders(
    sortBy: 'roi30d' | 'followers' | 'winRate' | 'totalVolume' = 'roi30d',
    limitCount = 20
): Promise<Trader[]> {
    try {
        // For MVP, return mock data sorted
        // Later: query Firestore
        const sorted = [...MOCK_TRADERS].sort((a, b) => {
            switch (sortBy) {
                case 'roi30d':
                    return b.stats.roi30d - a.stats.roi30d;
                case 'followers':
                    return b.stats.followers - a.stats.followers;
                case 'winRate':
                    return b.stats.winRate - a.stats.winRate;
                case 'totalVolume':
                    return b.stats.totalVolume - a.stats.totalVolume;
                default:
                    return b.stats.roi30d - a.stats.roi30d;
            }
        });
        return sorted.slice(0, limitCount);
    } catch (error) {
        console.error('Error getting traders:', error);
        return [];
    }
}

// Get single trader by ID
export async function getTraderById(traderId: string): Promise<Trader | null> {
    try {
        // For MVP, search mock data
        // Later: query Firestore
        const trader = MOCK_TRADERS.find(t => t.id === traderId);
        return trader || null;
    } catch (error) {
        console.error('Error getting trader:', error);
        return null;
    }
}

// Follow/copy a trader
export async function followTrader(
    userId: string,
    traderId: string,
    settings: CopySettings
): Promise<CopyRelationship | null> {
    try {
        const relationshipId = `${normalizeId(userId)}-${traderId}`;
        const now = new Date();

        const relationship: CopyRelationship = {
            id: relationshipId,
            copierId: normalizeId(userId),
            traderId,
            settings,
            performance: {
                totalCopiedTrades: 0,
                totalVolume: 0,
                totalProfit: 0,
                totalLoss: 0,
                currentRoi: 0,
            },
            totalCommissionPaid: 0,
            createdAt: now,
            startedAt: now,
        };

        await setDoc(doc(copyRelationshipsCollection, relationshipId), {
            ...relationship,
            createdAt: serverTimestamp(),
            startedAt: serverTimestamp(),
        });

        return relationship;
    } catch (error) {
        console.error('Error following trader:', error);
        return null;
    }
}

// Unfollow/stop copying a trader
export async function unfollowTrader(userId: string, traderId: string): Promise<boolean> {
    try {
        const relationshipId = `${normalizeId(userId)}-${traderId}`;
        await deleteDoc(doc(copyRelationshipsCollection, relationshipId));
        return true;
    } catch (error) {
        console.error('Error unfollowing trader:', error);
        return false;
    }
}

// Pause copying a trader
export async function pauseCopying(userId: string, traderId: string): Promise<boolean> {
    try {
        const relationshipId = `${normalizeId(userId)}-${traderId}`;
        await updateDoc(doc(copyRelationshipsCollection, relationshipId), {
            'settings.isActive': false,
            pausedAt: serverTimestamp(),
        });
        return true;
    } catch (error) {
        console.error('Error pausing copy:', error);
        return false;
    }
}

// Resume copying a trader
export async function resumeCopying(userId: string, traderId: string): Promise<boolean> {
    try {
        const relationshipId = `${normalizeId(userId)}-${traderId}`;
        await updateDoc(doc(copyRelationshipsCollection, relationshipId), {
            'settings.isActive': true,
            pausedAt: null,
        });
        return true;
    } catch (error) {
        console.error('Error resuming copy:', error);
        return false;
    }
}

// Get user's followed traders
export async function getMyFollowedTraders(userId: string): Promise<CopyRelationship[]> {
    try {
        const q = query(
            copyRelationshipsCollection,
            where('copierId', '==', normalizeId(userId)),
            orderBy('createdAt', 'desc')
        );

        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                copierId: data.copierId,
                traderId: data.traderId,
                settings: data.settings,
                performance: data.performance || {
                    totalCopiedTrades: 0,
                    totalVolume: 0,
                    totalProfit: 0,
                    totalLoss: 0,
                    currentRoi: 0,
                },
                totalCommissionPaid: data.totalCommissionPaid || 0,
                createdAt: data.createdAt?.toDate() || new Date(),
                startedAt: data.startedAt?.toDate() || new Date(),
                pausedAt: data.pausedAt?.toDate(),
                stoppedAt: data.stoppedAt?.toDate(),
            };
        });
    } catch (error) {
        console.error('Error getting followed traders:', error);
        return [];
    }
}

// Check if user is following a trader
export async function isFollowingTrader(userId: string, traderId: string): Promise<boolean> {
    try {
        const relationshipId = `${normalizeId(userId)}-${traderId}`;
        const docSnap = await getDoc(doc(copyRelationshipsCollection, relationshipId));
        return docSnap.exists();
    } catch (error) {
        console.error('Error checking follow status:', error);
        return false;
    }
}

// Update copy settings
export async function updateCopySettings(
    userId: string,
    traderId: string,
    settings: Partial<CopySettings>
): Promise<boolean> {
    try {
        const relationshipId = `${normalizeId(userId)}-${traderId}`;
        const docRef = doc(copyRelationshipsCollection, relationshipId);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) return false;

        const currentSettings = docSnap.data().settings || {};
        await updateDoc(docRef, {
            settings: { ...currentSettings, ...settings },
        });
        return true;
    } catch (error) {
        console.error('Error updating copy settings:', error);
        return false;
    }
}

// === SAVED ARTICLES FUNCTIONS ===

export interface SaveArticleInput {
    articleId: string;
    title: string;
    description: string;
    url: string;
    imageUrl?: string;
    publishedAt: string;
    sourceName: string;
    sentiment?: SentimentType;
}

export async function saveArticle(userId: string, article: SaveArticleInput): Promise<SavedArticle | null> {
    try {
        const docId = `${normalizeId(userId)}-${article.articleId}`;
        const docRef = doc(savedArticlesCollection, docId);

        // Check if already saved
        const existing = await getDoc(docRef);
        if (existing.exists()) {
            return existing.data() as SavedArticle;
        }

        const savedArticle: Omit<SavedArticle, 'savedAt'> & { savedAt: any } = {
            id: docId,
            articleId: article.articleId,
            userId: normalizeId(userId),
            title: article.title,
            description: article.description,
            url: article.url,
            imageUrl: article.imageUrl,
            publishedAt: article.publishedAt,
            sourceName: article.sourceName,
            sentiment: article.sentiment,
            savedAt: serverTimestamp(),
        };

        await setDoc(docRef, savedArticle);

        return {
            ...savedArticle,
            savedAt: new Date(),
        } as SavedArticle;
    } catch (error) {
        console.error('Error saving article:', error);
        return null;
    }
}

export async function unsaveArticle(userId: string, articleId: string): Promise<boolean> {
    try {
        const docId = `${normalizeId(userId)}-${articleId}`;
        await deleteDoc(doc(savedArticlesCollection, docId));
        return true;
    } catch (error) {
        console.error('Error unsaving article:', error);
        return false;
    }
}

export async function getSavedArticles(userId: string): Promise<SavedArticle[]> {
    try {
        const q = query(
            savedArticlesCollection,
            where('userId', '==', normalizeId(userId)),
            orderBy('savedAt', 'desc')
        );

        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({
            ...doc.data(),
            savedAt: doc.data().savedAt?.toDate?.() || new Date(),
        })) as SavedArticle[];
    } catch (error) {
        console.error('Error getting saved articles:', error);
        return [];
    }
}

export async function isArticleSaved(userId: string, articleId: string): Promise<boolean> {
    try {
        const docId = `${normalizeId(userId)}-${articleId}`;
        const docSnap = await getDoc(doc(savedArticlesCollection, docId));
        return docSnap.exists();
    } catch (error) {
        return false;
    }
}

export async function getSavedArticleIds(userId: string): Promise<Set<string>> {
    try {
        const articles = await getSavedArticles(userId);
        return new Set(articles.map(a => a.articleId));
    } catch (error) {
        return new Set();
    }
}

// === TRENDING NEWS FUNCTIONS ===

const CLICK_COOLDOWN_PREFIX = 'news_click_';

export async function trackArticleClick(article: NewsArticle): Promise<void> {
    try {
        const docRef = doc(newsStatsCollection, article.id);

        // Anti-spam: Check session storage
        if (typeof window !== 'undefined') {
            const storageKey = `${CLICK_COOLDOWN_PREFIX}${article.id}`;
            const hasClicked = sessionStorage.getItem(storageKey);

            if (hasClicked) {
                console.log('Already clicked this session:', article.id);
                return;
            }

            // Mark as clicked for this session
            sessionStorage.setItem(storageKey, 'true');
        }

        // Use setDoc with merge to create if not exists, or update if exists
        // We update the metadata in case it changed/improved, and increment clicks
        await setDoc(docRef, {
            articleId: article.id,
            title: article.title,
            description: article.description,
            url: article.url,
            imageUrl: article.imageUrl,
            sourceName: article.source.name,
            publishedAt: article.publishedAt,
            sentiment: article.sentiment,
            clicks: increment(1),
            lastClickedAt: serverTimestamp(),
        }, { merge: true });

    } catch (error) {
        console.error('Error tracking article click:', error);
    }
}

export async function getTrendingArticles(limitCount = 20): Promise<NewsArticle[]> {
    try {
        // Query articles with most clicks
        // We filter for a minimum threshold of 3 clicks to be considered "trending"
        // This avoids showing random articles with 1 click
        const q = query(
            newsStatsCollection,
            where('clicks', '>=', 3),
            orderBy('clicks', 'desc'),
            limit(limitCount)
        );

        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: data.articleId,
                title: data.title,
                description: data.description,
                url: data.url,
                imageUrl: data.imageUrl,
                publishedAt: data.publishedAt,
                source: {
                    name: data.sourceName,
                    logo: undefined // We don't store logo in stats
                },
                categories: [], // We don't store categories in stats
                sentiment: data.sentiment,
            } as NewsArticle;
        });
    } catch (error) {
        console.error('Error getting trending articles:', error);
        return [];
    }
}


