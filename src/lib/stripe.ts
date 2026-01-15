import Stripe from 'stripe';

// Initialize Stripe with secret key (server-side only)
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

// Only initialize on server-side
export const stripe = stripeSecretKey
    ? new Stripe(stripeSecretKey, { apiVersion: '2025-12-15.clover' as any })
    : null;

// Product/Price IDs - Configure these after creating products in Stripe Dashboard
export const STRIPE_PRODUCTS = {
    pro: {
        monthly: process.env.STRIPE_PRO_MONTHLY_PRICE_ID || 'price_pro_monthly',
        yearly: process.env.STRIPE_PRO_YEARLY_PRICE_ID || 'price_pro_yearly',
    },
} as const;

// Subscription pricing for display
export const PRICING_TIERS = {
    free: {
        name: 'Free',
        price: 0,
        interval: null,
        features: [
            'Multi-chain trading (SOL, ETH, Base, Arbitrum)',
            'Basic charts & token info',
            'Up to 2 tracked wallets',
            '5 news articles per day',
            'Standard swap execution',
        ],
        limitations: [
            'No heatmap access',
            'Limited wallet tracking',
            'Limited news feed',
        ],
    },
    pro: {
        name: 'Pro',
        monthlyPrice: 9.99,
        yearlyPrice: 79.99, // ~2 months free
        features: [
            'Everything in Free, plus:',
            'Unlimited wallet tracking',
            'Full news terminal access',
            'Market heatmap',
            'dApp analytics (coming soon)',
            'Priority swap execution',
            'Advanced charting tools',
        ],
        limitations: [],
    },
    lifetime: {
        name: 'Lifetime (Beta)',
        price: 0,
        interval: null,
        description: 'Earned by beta testers',
        features: [
            'All Pro features forever',
            'Lifetime Diamond tier (lowest fees)',
            'Priority support',
            'Early access to new features',
        ],
        limitations: [],
    },
} as const;

/**
 * Create a Stripe Checkout session for subscription
 */
export async function createCheckoutSession({
    userId,
    email,
    priceId,
    successUrl,
    cancelUrl,
}: {
    userId: string;
    email?: string;
    priceId: string;
    successUrl: string;
    cancelUrl: string;
}): Promise<{ sessionId: string; url: string } | null> {
    if (!stripe) {
        console.error('Stripe not initialized - missing STRIPE_SECRET_KEY');
        return null;
    }

    try {
        // First, get the price to check if it's recurring or one-time
        const price = await stripe.prices.retrieve(priceId);
        const isRecurring = price.type === 'recurring';

        const session = await stripe.checkout.sessions.create({
            mode: isRecurring ? 'subscription' : 'payment',
            payment_method_types: ['card'],
            line_items: [
                {
                    price: priceId,
                    quantity: 1,
                },
            ],
            success_url: successUrl,
            cancel_url: cancelUrl,
            customer_email: email,
            metadata: {
                userId: userId.toLowerCase(),
            },
            ...(isRecurring && {
                subscription_data: {
                    metadata: {
                        userId: userId.toLowerCase(),
                    },
                },
            }),
        });

        return {
            sessionId: session.id,
            url: session.url || '',
        };
    } catch (error: any) {
        console.error('Error creating checkout session:', error?.message || error);
        throw error; // Re-throw to get more info
    }
}

/**
 * Create a Stripe billing portal session for managing subscription
 */
export async function createBillingPortalSession({
    customerId,
    returnUrl,
}: {
    customerId: string;
    returnUrl: string;
}): Promise<string | null> {
    if (!stripe) {
        console.error('Stripe not initialized');
        return null;
    }

    try {
        const session = await stripe.billingPortal.sessions.create({
            customer: customerId,
            return_url: returnUrl,
        });

        return session.url;
    } catch (error) {
        console.error('Error creating billing portal session:', error);
        return null;
    }
}

/**
 * Get subscription details from Stripe
 */
export async function getSubscription(subscriptionId: string): Promise<Stripe.Subscription | null> {
    if (!stripe) return null;

    try {
        return await stripe.subscriptions.retrieve(subscriptionId);
    } catch (error) {
        console.error('Error retrieving subscription:', error);
        return null;
    }
}

/**
 * Cancel a subscription (at period end)
 */
export async function cancelSubscription(subscriptionId: string): Promise<boolean> {
    if (!stripe) return false;

    try {
        await stripe.subscriptions.update(subscriptionId, {
            cancel_at_period_end: true,
        });
        return true;
    } catch (error) {
        console.error('Error canceling subscription:', error);
        return false;
    }
}

/**
 * Reactivate a canceled subscription
 */
export async function reactivateSubscription(subscriptionId: string): Promise<boolean> {
    if (!stripe) return false;

    try {
        await stripe.subscriptions.update(subscriptionId, {
            cancel_at_period_end: false,
        });
        return true;
    } catch (error) {
        console.error('Error reactivating subscription:', error);
        return false;
    }
}

/**
 * Construct and verify Stripe webhook event
 */
export function constructWebhookEvent(
    payload: string | Buffer,
    signature: string,
    webhookSecret: string
): Stripe.Event | null {
    if (!stripe) return null;

    try {
        return stripe.webhooks.constructEvent(payload, signature, webhookSecret);
    } catch (error) {
        console.error('Webhook signature verification failed:', error);
        return null;
    }
}
