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
    serverTimestamp,
    Timestamp,
    arrayUnion,
    arrayRemove,
    increment,
} from 'firebase/firestore';
import { db } from './config';
import {
    PortfolioSnapshot,
    SnapshotHolding,
    SharedWatchlist,
    WatchlistVisibility,
    WatchlistFollower,
    EnhancedPriceAlert,
    AlertConditionType,
    ChainId,
} from '@/types';

// Helper to normalize IDs
function normalizeId(id: string): string {
    if (!id) return '';
    return id.startsWith('0x') ? id.toLowerCase() : id;
}

// Collection references
export const portfolioSnapshotsCollection = collection(db, 'portfolioSnapshots');
export const watchlistFollowersCollection = collection(db, 'watchlistFollowers');
export const watchlistsCollection = collection(db, 'watchlists');
export const alertsCollection = collection(db, 'alerts');

// === PORTFOLIO SNAPSHOT FUNCTIONS ===

export async function createSnapshot(
    userId: string,
    walletAddress: string,
    chainId: ChainId,
    holdings: Omit<SnapshotHolding, 'valueUsd'>[],
): Promise<PortfolioSnapshot | null> {
    try {
        const snapshotId = `${normalizeId(userId)}-${chainId}-${Date.now()}`;

        // Calculate total value
        const holdingsWithValue = holdings.map(h => ({
            ...h,
            valueUsd: parseFloat(h.balance) * h.priceUsd,
        }));

        const totalValueUsd = holdingsWithValue.reduce((sum, h) => sum + h.valueUsd, 0);

        const snapshotData = {
            userId: normalizeId(userId),
            walletAddress: normalizeId(walletAddress),
            chainId,
            timestamp: serverTimestamp(),
            holdings: holdingsWithValue,
            totalValueUsd,
        };

        await setDoc(doc(portfolioSnapshotsCollection, snapshotId), snapshotData);

        return {
            id: snapshotId,
            userId: normalizeId(userId),
            walletAddress: normalizeId(walletAddress),
            chainId,
            timestamp: new Date(),
            holdings: holdingsWithValue,
            totalValueUsd,
        };
    } catch (error) {
        console.error('Error creating snapshot:', error);
        return null;
    }
}

export async function getSnapshots(
    userId: string,
    limitCount = 90,
    startDate?: Date,
    endDate?: Date
): Promise<PortfolioSnapshot[]> {
    try {
        let q = query(
            portfolioSnapshotsCollection,
            where('userId', '==', normalizeId(userId)),
            orderBy('timestamp', 'desc'),
            limit(limitCount)
        );

        const snapshot = await getDocs(q);
        const snapshots = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                userId: data.userId,
                walletAddress: data.walletAddress,
                chainId: data.chainId,
                timestamp: data.timestamp?.toDate() || new Date(),
                holdings: data.holdings || [],
                totalValueUsd: data.totalValueUsd || 0,
            };
        }) as PortfolioSnapshot[];

        // Filter by date range if provided
        if (startDate || endDate) {
            return snapshots.filter(s => {
                if (startDate && s.timestamp < startDate) return false;
                if (endDate && s.timestamp > endDate) return false;
                return true;
            });
        }

        return snapshots;
    } catch (error) {
        console.error('Error getting snapshots:', error);
        return [];
    }
}

export async function getLatestSnapshot(
    userId: string,
    chainId?: ChainId
): Promise<PortfolioSnapshot | null> {
    try {
        let q = query(
            portfolioSnapshotsCollection,
            where('userId', '==', normalizeId(userId)),
            orderBy('timestamp', 'desc'),
            limit(1)
        );

        if (chainId) {
            q = query(
                portfolioSnapshotsCollection,
                where('userId', '==', normalizeId(userId)),
                where('chainId', '==', chainId),
                orderBy('timestamp', 'desc'),
                limit(1)
            );
        }

        const snapshot = await getDocs(q);
        if (snapshot.empty) return null;

        const data = snapshot.docs[0].data();
        return {
            id: snapshot.docs[0].id,
            userId: data.userId,
            walletAddress: data.walletAddress,
            chainId: data.chainId,
            timestamp: data.timestamp?.toDate() || new Date(),
            holdings: data.holdings || [],
            totalValueUsd: data.totalValueUsd || 0,
        };
    } catch (error) {
        console.error('Error getting latest snapshot:', error);
        return null;
    }
}

export async function getSnapshotAtDate(
    userId: string,
    date: Date,
    chainId?: ChainId
): Promise<PortfolioSnapshot | null> {
    try {
        // Get snapshots around the target date
        const snapshots = await getSnapshots(userId, 100);

        if (snapshots.length === 0) return null;

        // Filter by chain if specified
        const filtered = chainId
            ? snapshots.filter(s => s.chainId === chainId)
            : snapshots;

        if (filtered.length === 0) return null;

        // Find closest snapshot to the target date
        const targetTime = date.getTime();
        let closest = filtered[0];
        let minDiff = Math.abs(filtered[0].timestamp.getTime() - targetTime);

        for (const snapshot of filtered) {
            const diff = Math.abs(snapshot.timestamp.getTime() - targetTime);
            if (diff < minDiff) {
                minDiff = diff;
                closest = snapshot;
            }
        }

        return closest;
    } catch (error) {
        console.error('Error getting snapshot at date:', error);
        return null;
    }
}

export async function deleteOldSnapshots(
    userId: string,
    daysToKeep = 90
): Promise<number> {
    try {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

        const snapshots = await getSnapshots(userId, 1000);
        const toDelete = snapshots.filter(s => s.timestamp < cutoffDate);

        for (const snapshot of toDelete) {
            await deleteDoc(doc(portfolioSnapshotsCollection, snapshot.id));
        }

        return toDelete.length;
    } catch (error) {
        console.error('Error deleting old snapshots:', error);
        return 0;
    }
}

// === SHARED WATCHLIST FUNCTIONS ===

export async function updateWatchlistVisibility(
    userId: string,
    watchlistId: string,
    visibility: WatchlistVisibility,
    description?: string,
    tags?: string[],
    sharedWith?: string[]
): Promise<boolean> {
    try {
        const docRef = doc(watchlistsCollection, normalizeId(userId));
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) return false;

        const currentLists = docSnap.data().lists || [];
        const listIndex = currentLists.findIndex((l: any) => l.id === watchlistId);

        if (listIndex === -1) return false;

        currentLists[listIndex].visibility = visibility;
        currentLists[listIndex].updatedAt = Timestamp.now();

        if (description !== undefined) currentLists[listIndex].description = description;
        if (tags !== undefined) currentLists[listIndex].tags = tags;
        if (sharedWith !== undefined) currentLists[listIndex].sharedWith = sharedWith;

        await updateDoc(docRef, { lists: currentLists });
        return true;
    } catch (error) {
        console.error('Error updating watchlist visibility:', error);
        return false;
    }
}

export async function getPublicWatchlists(
    limitCount = 50,
    orderByField: 'followers' | 'updatedAt' = 'followers'
): Promise<SharedWatchlist[]> {
    try {
        // Get all watchlists documents
        const snapshot = await getDocs(watchlistsCollection);
        const publicWatchlists: SharedWatchlist[] = [];

        for (const docSnap of snapshot.docs) {
            const data = docSnap.data();
            const lists = data.lists || [];
            const userId = docSnap.id;

            for (const list of lists) {
                if (list.visibility === 'public') {
                    publicWatchlists.push({
                        id: list.id,
                        name: list.name,
                        tokens: (list.tokens || []).map((t: any) => ({
                            ...t,
                            addedAt: t.addedAt?.toDate?.() || new Date(),
                        })),
                        createdAt: list.createdAt?.toDate?.() || new Date(),
                        updatedAt: list.updatedAt?.toDate?.() || new Date(),
                        ownerId: userId,
                        ownerName: data.ownerName,
                        visibility: list.visibility,
                        followers: list.followers || 0,
                        description: list.description,
                        tags: list.tags,
                        sharedWith: list.sharedWith,
                    });
                }
            }
        }

        // Sort based on orderByField
        publicWatchlists.sort((a, b) => {
            if (orderByField === 'followers') {
                return b.followers - a.followers;
            } else {
                return b.updatedAt.getTime() - a.updatedAt.getTime();
            }
        });

        return publicWatchlists.slice(0, limitCount);
    } catch (error) {
        console.error('Error getting public watchlists:', error);
        return [];
    }
}

export async function searchWatchlists(
    searchQuery: string,
    limitCount = 20
): Promise<SharedWatchlist[]> {
    try {
        const allPublic = await getPublicWatchlists(1000);
        const query = searchQuery.toLowerCase();

        const filtered = allPublic.filter(w =>
            w.name.toLowerCase().includes(query) ||
            w.description?.toLowerCase().includes(query) ||
            w.tags?.some(tag => tag.toLowerCase().includes(query)) ||
            w.ownerName?.toLowerCase().includes(query)
        );

        return filtered.slice(0, limitCount);
    } catch (error) {
        console.error('Error searching watchlists:', error);
        return [];
    }
}

export async function followWatchlist(
    userId: string,
    watchlistId: string,
    ownerId: string
): Promise<boolean> {
    try {
        const followId = `${normalizeId(userId)}-${watchlistId}`;

        await setDoc(doc(watchlistFollowersCollection, followId), {
            userId: normalizeId(userId),
            watchlistId,
            ownerId: normalizeId(ownerId),
            followedAt: serverTimestamp(),
        });

        // Increment follower count on the watchlist
        const ownerDocRef = doc(watchlistsCollection, normalizeId(ownerId));
        const ownerDocSnap = await getDoc(ownerDocRef);

        if (ownerDocSnap.exists()) {
            const currentLists = ownerDocSnap.data().lists || [];
            const listIndex = currentLists.findIndex((l: any) => l.id === watchlistId);

            if (listIndex !== -1) {
                currentLists[listIndex].followers = (currentLists[listIndex].followers || 0) + 1;
                await updateDoc(ownerDocRef, { lists: currentLists });
            }
        }

        return true;
    } catch (error) {
        console.error('Error following watchlist:', error);
        return false;
    }
}

export async function unfollowWatchlist(
    userId: string,
    watchlistId: string,
    ownerId: string
): Promise<boolean> {
    try {
        const followId = `${normalizeId(userId)}-${watchlistId}`;
        await deleteDoc(doc(watchlistFollowersCollection, followId));

        // Decrement follower count
        const ownerDocRef = doc(watchlistsCollection, normalizeId(ownerId));
        const ownerDocSnap = await getDoc(ownerDocRef);

        if (ownerDocSnap.exists()) {
            const currentLists = ownerDocSnap.data().lists || [];
            const listIndex = currentLists.findIndex((l: any) => l.id === watchlistId);

            if (listIndex !== -1) {
                currentLists[listIndex].followers = Math.max(0, (currentLists[listIndex].followers || 1) - 1);
                await updateDoc(ownerDocRef, { lists: currentLists });
            }
        }

        return true;
    } catch (error) {
        console.error('Error unfollowing watchlist:', error);
        return false;
    }
}

export async function getFollowedWatchlists(userId: string): Promise<SharedWatchlist[]> {
    try {
        const q = query(
            watchlistFollowersCollection,
            where('userId', '==', normalizeId(userId))
        );

        const snapshot = await getDocs(q);
        const followed: SharedWatchlist[] = [];

        for (const docSnap of snapshot.docs) {
            const data = docSnap.data();
            const ownerDocRef = doc(watchlistsCollection, data.ownerId);
            const ownerDocSnap = await getDoc(ownerDocRef);

            if (ownerDocSnap.exists()) {
                const lists = ownerDocSnap.data().lists || [];
                const watchlist = lists.find((l: any) => l.id === data.watchlistId);

                if (watchlist) {
                    followed.push({
                        id: watchlist.id,
                        name: watchlist.name,
                        tokens: (watchlist.tokens || []).map((t: any) => ({
                            ...t,
                            addedAt: t.addedAt?.toDate?.() || new Date(),
                        })),
                        createdAt: watchlist.createdAt?.toDate?.() || new Date(),
                        updatedAt: watchlist.updatedAt?.toDate?.() || new Date(),
                        ownerId: data.ownerId,
                        ownerName: ownerDocSnap.data().ownerName,
                        visibility: watchlist.visibility,
                        followers: watchlist.followers || 0,
                        description: watchlist.description,
                        tags: watchlist.tags,
                    });
                }
            }
        }

        return followed;
    } catch (error) {
        console.error('Error getting followed watchlists:', error);
        return [];
    }
}

export async function isFollowingWatchlist(
    userId: string,
    watchlistId: string
): Promise<boolean> {
    try {
        const followId = `${normalizeId(userId)}-${watchlistId}`;
        const docSnap = await getDoc(doc(watchlistFollowersCollection, followId));
        return docSnap.exists();
    } catch (error) {
        console.error('Error checking follow status:', error);
        return false;
    }
}

// === ENHANCED ALERT FUNCTIONS ===

export async function createEnhancedAlert(
    userId: string,
    alert: Omit<EnhancedPriceAlert, 'id' | 'userId' | 'triggered' | 'createdAt'>
): Promise<EnhancedPriceAlert | null> {
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
        console.error('Error creating enhanced alert:', error);
        return null;
    }
}

export async function getEnhancedAlerts(userId: string): Promise<EnhancedPriceAlert[]> {
    try {
        const q = query(
            alertsCollection,
            where('userId', '==', normalizeId(userId)),
            orderBy('createdAt', 'desc')
        );

        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                userId: data.userId,
                tokenAddress: data.tokenAddress,
                pairAddress: data.pairAddress,
                chainId: data.chainId,
                symbol: data.symbol,
                name: data.name,
                logo: data.logo,
                conditionType: data.conditionType || 'price_above',
                targetValue: data.targetValue,
                currentValue: data.currentValue,
                timeframe: data.timeframe,
                triggered: data.triggered || false,
                triggeredAt: data.triggeredAt?.toDate(),
                triggeredValue: data.triggeredValue,
                createdAt: data.createdAt?.toDate() || new Date(),
            };
        }) as EnhancedPriceAlert[];
    } catch (error) {
        console.error('Error getting enhanced alerts:', error);
        return [];
    }
}

export async function getActiveAlerts(userId: string): Promise<EnhancedPriceAlert[]> {
    try {
        const q = query(
            alertsCollection,
            where('userId', '==', normalizeId(userId)),
            where('triggered', '==', false),
            orderBy('createdAt', 'desc')
        );

        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                userId: data.userId,
                tokenAddress: data.tokenAddress,
                pairAddress: data.pairAddress,
                chainId: data.chainId,
                symbol: data.symbol,
                name: data.name,
                logo: data.logo,
                conditionType: data.conditionType || 'price_above',
                targetValue: data.targetValue,
                currentValue: data.currentValue,
                timeframe: data.timeframe,
                triggered: false,
                createdAt: data.createdAt?.toDate() || new Date(),
            };
        }) as EnhancedPriceAlert[];
    } catch (error) {
        console.error('Error getting active alerts:', error);
        return [];
    }
}

export async function markEnhancedAlertTriggered(
    alertId: string,
    triggeredValue: number
): Promise<boolean> {
    try {
        await updateDoc(doc(alertsCollection, alertId), {
            triggered: true,
            triggeredAt: serverTimestamp(),
            triggeredValue,
        });
        return true;
    } catch (error) {
        console.error('Error marking alert triggered:', error);
        return false;
    }
}

export async function deleteEnhancedAlert(alertId: string): Promise<boolean> {
    try {
        await deleteDoc(doc(alertsCollection, alertId));
        return true;
    } catch (error) {
        console.error('Error deleting enhanced alert:', error);
        return false;
    }
}
