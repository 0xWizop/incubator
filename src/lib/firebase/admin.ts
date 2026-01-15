import {
    collection,
    doc,
    getDoc,
    getDocs,
    updateDoc,
    query,
    orderBy,
    limit,
    startAfter,
    where,
    serverTimestamp,
    QueryDocumentSnapshot,
} from 'firebase/firestore';
import { db } from './config';
import type { User, UserFlags, UserRole, SubscriptionTier, Subscription } from '@/types';

// Admin wallet addresses (lowercase)
const ADMIN_WALLETS = [
    // Add your admin wallet addresses here
    process.env.NEXT_PUBLIC_ADMIN_WALLET?.toLowerCase() || '',
].filter(Boolean);

/**
 * Check if a wallet address is an admin
 */
export function isAdminWallet(address: string): boolean {
    return ADMIN_WALLETS.includes(address.toLowerCase());
}

/**
 * Get paginated list of all users
 */
export async function getAllUsers(
    pageSize: number = 50,
    lastDoc?: QueryDocumentSnapshot
): Promise<{ users: User[]; lastDoc: QueryDocumentSnapshot | null }> {
    try {
        const usersRef = collection(db, 'users');
        let q = query(
            usersRef,
            orderBy('createdAt', 'desc'),
            limit(pageSize)
        );

        if (lastDoc) {
            q = query(q, startAfter(lastDoc));
        }

        const snapshot = await getDocs(q);
        const users: User[] = snapshot.docs.map(doc => ({
            address: doc.data().address,
            chains: doc.data().chains || [],
            createdAt: doc.data().createdAt?.toDate() || new Date(),
            referralCode: doc.data().referralCode || '',
            referredBy: doc.data().referredBy,
            totalVolume: doc.data().totalVolume || 0,
            lastActive: doc.data().lastActive?.toDate() || new Date(),
            email: doc.data().email,
            displayName: doc.data().displayName,
            photoURL: doc.data().photoURL,
            preferences: doc.data().preferences,
            subscription: doc.data().subscription,
            flags: doc.data().flags,
            role: doc.data().role,
        }));

        const lastVisible = snapshot.docs[snapshot.docs.length - 1] || null;

        return { users, lastDoc: lastVisible };
    } catch (error) {
        console.error('Error getting users:', error);
        return { users: [], lastDoc: null };
    }
}

/**
 * Search users by wallet address
 */
export async function searchUsers(searchTerm: string): Promise<User[]> {
    try {
        const usersRef = collection(db, 'users');
        const normalizedSearch = searchTerm.toLowerCase();

        // For wallet addresses, we can do an exact match
        const docRef = doc(db, 'users', normalizedSearch);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const data = docSnap.data();
            return [{
                address: data.address,
                chains: data.chains || [],
                createdAt: data.createdAt?.toDate() || new Date(),
                referralCode: data.referralCode || '',
                referredBy: data.referredBy,
                totalVolume: data.totalVolume || 0,
                lastActive: data.lastActive?.toDate() || new Date(),
                email: data.email,
                displayName: data.displayName,
                subscription: data.subscription,
                flags: data.flags,
                role: data.role,
            }];
        }

        return [];
    } catch (error) {
        console.error('Error searching users:', error);
        return [];
    }
}

/**
 * Update user role
 */
export async function updateUserRole(userId: string, role: UserRole): Promise<boolean> {
    try {
        const userRef = doc(db, 'users', userId.toLowerCase());
        await updateDoc(userRef, {
            role,
            lastModified: serverTimestamp(),
        });
        return true;
    } catch (error) {
        console.error('Error updating user role:', error);
        return false;
    }
}

/**
 * Update user flags (beta tester, lifetime access, whitelist/blacklist)
 */
export async function updateUserFlags(
    userId: string,
    flags: Partial<UserFlags>
): Promise<boolean> {
    try {
        const userRef = doc(db, 'users', userId.toLowerCase());
        const userDoc = await getDoc(userRef);

        if (!userDoc.exists()) return false;

        const currentFlags = userDoc.data().flags || {};
        const updatedFlags = { ...currentFlags, ...flags };

        await updateDoc(userRef, {
            flags: updatedFlags,
            lastModified: serverTimestamp(),
        });
        return true;
    } catch (error) {
        console.error('Error updating user flags:', error);
        return false;
    }
}

/**
 * Grant beta tester rewards
 */
export async function grantBetaRewards(userId: string): Promise<boolean> {
    try {
        const userRef = doc(db, 'users', userId.toLowerCase());
        await updateDoc(userRef, {
            'flags.isBetaTester': true,
            'flags.hasLifetimeDiamond': true,
            'flags.hasLifetimeProTools': true,
            role: 'beta_tester',
            lastModified: serverTimestamp(),
        });
        return true;
    } catch (error) {
        console.error('Error granting beta rewards:', error);
        return false;
    }
}

/**
 * Revoke beta tester rewards
 */
export async function revokeBetaRewards(userId: string): Promise<boolean> {
    try {
        const userRef = doc(db, 'users', userId.toLowerCase());
        await updateDoc(userRef, {
            'flags.isBetaTester': false,
            'flags.hasLifetimeDiamond': false,
            'flags.hasLifetimeProTools': false,
            role: 'user',
            lastModified: serverTimestamp(),
        });
        return true;
    } catch (error) {
        console.error('Error revoking beta rewards:', error);
        return false;
    }
}

/**
 * Whitelist a wallet
 */
export async function whitelistWallet(userId: string): Promise<boolean> {
    return updateUserFlags(userId, { isWhitelisted: true, isBlacklisted: false });
}

/**
 * Blacklist a wallet
 */
export async function blacklistWallet(userId: string): Promise<boolean> {
    return updateUserFlags(userId, { isWhitelisted: false, isBlacklisted: true });
}

/**
 * Manually set user subscription tier (for compensations, partnerships, etc.)
 */
export async function setUserTier(
    userId: string,
    tier: SubscriptionTier
): Promise<boolean> {
    try {
        const userRef = doc(db, 'users', userId.toLowerCase());

        const subscription: Subscription = {
            tier,
            status: 'active',
        };

        await updateDoc(userRef, {
            subscription,
            lastModified: serverTimestamp(),
        });
        return true;
    } catch (error) {
        console.error('Error setting user tier:', error);
        return false;
    }
}

/**
 * Get platform statistics
 */
export async function getPlatformStats(): Promise<{
    totalUsers: number;
    proSubscribers: number;
    betaTesters: number;
    activeToday: number;
    totalVolume: number;
}> {
    try {
        const usersRef = collection(db, 'users');
        const snapshot = await getDocs(usersRef);

        let totalUsers = 0;
        let proSubscribers = 0;
        let betaTesters = 0;
        let activeToday = 0;
        let totalVolume = 0;

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        snapshot.docs.forEach(doc => {
            const data = doc.data();
            totalUsers++;

            // Count pro subscribers
            if (data.subscription?.status === 'active' && data.subscription?.tier === 'pro') {
                proSubscribers++;
            }

            // Count beta testers
            if (data.flags?.isBetaTester) {
                betaTesters++;
            }

            // Count active today
            const lastActive = data.lastActive?.toDate();
            if (lastActive && lastActive >= today) {
                activeToday++;
            }

            // Sum total volume
            totalVolume += data.totalVolume || 0;
        });

        return { totalUsers, proSubscribers, betaTesters, activeToday, totalVolume };
    } catch (error) {
        console.error('Error getting platform stats:', error);
        return { totalUsers: 0, proSubscribers: 0, betaTesters: 0, activeToday: 0, totalVolume: 0 };
    }
}

/**
 * Get all beta testers
 */
export async function getBetaTesters(): Promise<User[]> {
    try {
        const usersRef = collection(db, 'users');
        const q = query(
            usersRef,
            where('flags.isBetaTester', '==', true),
            orderBy('createdAt', 'desc'),
            limit(100)
        );

        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({
            address: doc.data().address,
            chains: doc.data().chains || [],
            createdAt: doc.data().createdAt?.toDate() || new Date(),
            referralCode: doc.data().referralCode || '',
            totalVolume: doc.data().totalVolume || 0,
            lastActive: doc.data().lastActive?.toDate() || new Date(),
            displayName: doc.data().displayName,
            flags: doc.data().flags,
            role: doc.data().role,
        })) as User[];
    } catch (error) {
        console.error('Error getting beta testers:', error);
        return [];
    }
}

/**
 * Get blacklisted wallets
 */
export async function getBlacklistedWallets(): Promise<User[]> {
    try {
        const usersRef = collection(db, 'users');
        const q = query(
            usersRef,
            where('flags.isBlacklisted', '==', true),
            limit(100)
        );

        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({
            address: doc.data().address,
            chains: doc.data().chains || [],
            createdAt: doc.data().createdAt?.toDate() || new Date(),
            referralCode: doc.data().referralCode || '',
            totalVolume: doc.data().totalVolume || 0,
            lastActive: doc.data().lastActive?.toDate() || new Date(),
            displayName: doc.data().displayName,
            flags: doc.data().flags,
        })) as User[];
    } catch (error) {
        console.error('Error getting blacklisted wallets:', error);
        return [];
    }
}
