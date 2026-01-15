'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import type { Subscription, UserFlags, SubscriptionTier } from '@/types';

interface SubscriptionState {
    // Subscription data
    subscription: Subscription | null;
    flags: UserFlags | null;

    // Computed access levels
    tier: SubscriptionTier;
    isPro: boolean;
    isBetaTester: boolean;
    hasLifetimeAccess: boolean;
    isAdmin: boolean;
    isTrial: boolean;
    daysRemaining: number;

    // Feature access
    canAccessHeatmap: boolean;
    canAccessFullNews: boolean;
    maxTrackedWallets: number;
    canAccessDappAnalytics: boolean;

    // Loading state
    isLoading: boolean;
}

const DEFAULT_FLAGS: UserFlags = {
    isBetaTester: false,
    hasLifetimeDiamond: false,
    hasLifetimeProTools: false,
    isWhitelisted: true,
    isBlacklisted: false,
};

const FREE_TRACKED_WALLET_LIMIT = 5;
const PRO_TRACKED_WALLET_LIMIT = 50;

export function useSubscription(): SubscriptionState {
    const { firebaseUser, user } = useAuth();
    const [subscription, setSubscription] = useState<Subscription | null>(null);
    const [flags, setFlags] = useState<UserFlags | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!firebaseUser?.uid) {
            setIsLoading(false);
            setSubscription(null);
            setFlags(null);
            return;
        }

        // Listen to user document for real-time subscription updates
        const userRef = doc(db, 'users', firebaseUser.uid.toLowerCase());

        const unsubscribe = onSnapshot(userRef, (doc) => {
            if (doc.exists()) {
                const data = doc.data();
                setSubscription(data.subscription || null);
                setFlags(data.flags || DEFAULT_FLAGS);
            } else {
                setSubscription(null);
                setFlags(DEFAULT_FLAGS);
            }
            setIsLoading(false);
        }, (error) => {
            console.error('Error listening to subscription:', error);
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, [firebaseUser?.uid]);

    // Compute access levels based on subscription and flags
    // Compute access levels based on subscription and flags
    const accessState = useMemo(() => {
        const currentFlags = flags || DEFAULT_FLAGS;

        // Admin check - robust comparison (case insensitive)
        const adminWallet = process.env.NEXT_PUBLIC_ADMIN_WALLET?.toLowerCase();
        const userAddress = user?.address?.toLowerCase();
        const isAdmin = !!(adminWallet && userAddress && adminWallet === userAddress);

        // Free Trial Check (7 days from account creation)
        let isTrial = false;
        let daysRemaining = 0;

        if (firebaseUser?.metadata.creationTime) {
            const creationTime = new Date(firebaseUser.metadata.creationTime).getTime();
            const now = Date.now();
            const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;

            if (now - creationTime < sevenDaysMs) {
                isTrial = true;
                daysRemaining = Math.max(0, Math.ceil((creationTime + sevenDaysMs - now) / (1000 * 60 * 60 * 24)));
            }
        }

        // Determine effective tier
        let tier: SubscriptionTier = 'free';

        // Check lifetime access first (beta testers)
        if (currentFlags.hasLifetimeProTools || currentFlags.isBetaTester) {
            tier = 'lifetime';
        }
        // Then check active subscription
        else if (subscription?.status === 'active' || subscription?.status === 'trialing') {
            tier = subscription.tier;
        }
        // Then check trial status
        else if (isTrial) {
            tier = 'pro'; // Trial users get Pro features
        }

        // Grant Pro access if: 1. Tier is Pro/Lifetime 2. User is Admin 3. Trial is active
        const isPro = tier === 'pro' || tier === 'lifetime' || isAdmin || isTrial;
        const isBetaTester = currentFlags.isBetaTester;
        const hasLifetimeAccess = currentFlags.hasLifetimeProTools;

        return {
            tier,
            isPro,
            isBetaTester,
            hasLifetimeAccess,
            isAdmin,
            isTrial,       // Export trial status
            daysRemaining, // Export days left

            // Feature access - all simplified to isPro check now (which includes Admin/Trial)
            canAccessHeatmap: isPro,
            canAccessFullNews: isPro,
            canAccessDappAnalytics: isPro,
            maxTrackedWallets: isPro ? PRO_TRACKED_WALLET_LIMIT : FREE_TRACKED_WALLET_LIMIT,
        };
    }, [subscription, flags, user?.address, firebaseUser?.metadata.creationTime]);

    return {
        subscription,
        flags,
        isLoading,
        ...accessState,
    };
}

/**
 * Helper to create checkout URL
 */
export async function createCheckout(
    userId: string,
    email: string | undefined,
    plan: 'pro',
    interval: 'monthly' | 'yearly'
): Promise<string | null> {
    try {
        const response = await fetch('/api/stripe/checkout', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, email, plan, interval }),
        });

        const data = await response.json();

        if (data.url) {
            return data.url;
        }

        console.error('Checkout error:', data.error);
        return null;
    } catch (error) {
        console.error('Checkout error:', error);
        return null;
    }
}

/**
 * Helper to open billing portal
 */
export async function openBillingPortal(customerId: string): Promise<string | null> {
    try {
        const response = await fetch('/api/stripe/portal', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ customerId }),
        });

        const data = await response.json();

        if (data.url) {
            return data.url;
        }

        console.error('Portal error:', data.error);
        return null;
    } catch (error) {
        console.error('Portal error:', error);
        return null;
    }
}
