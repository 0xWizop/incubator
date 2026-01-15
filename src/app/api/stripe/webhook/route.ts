import { NextRequest, NextResponse } from 'next/server';
import { constructWebhookEvent, stripe } from '@/lib/stripe';
import { doc, updateDoc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import type { Subscription } from '@/types';

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';

// Disable body parsing for webhooks
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
    try {
        const body = await request.text();
        const signature = request.headers.get('stripe-signature');

        if (!signature) {
            return NextResponse.json(
                { error: 'Missing stripe-signature header' },
                { status: 400 }
            );
        }

        const event = constructWebhookEvent(body, signature, webhookSecret);

        if (!event) {
            return NextResponse.json(
                { error: 'Invalid webhook signature' },
                { status: 400 }
            );
        }

        // Handle the event
        switch (event.type) {
            case 'checkout.session.completed': {
                const session = event.data.object as any;
                await handleCheckoutComplete(session);
                break;
            }
            case 'customer.subscription.updated': {
                const subscription = event.data.object as any;
                await handleSubscriptionUpdate(subscription);
                break;
            }
            case 'customer.subscription.deleted': {
                const subscription = event.data.object as any;
                await handleSubscriptionCanceled(subscription);
                break;
            }
            case 'invoice.payment_failed': {
                const invoice = event.data.object as any;
                await handlePaymentFailed(invoice);
                break;
            }
            default:
                console.log(`Unhandled event type: ${event.type}`);
        }

        return NextResponse.json({ received: true });
    } catch (error) {
        console.error('Webhook error:', error);
        return NextResponse.json(
            { error: 'Webhook handler failed' },
            { status: 500 }
        );
    }
}

async function handleCheckoutComplete(session: any) {
    const userId = session.metadata?.userId;
    if (!userId) {
        console.error('No userId in session metadata');
        return;
    }

    const subscriptionId = session.subscription;
    const customerId = session.customer;

    // Fetch the subscription details from Stripe
    if (!stripe) return;
    const subscription: any = await stripe.subscriptions.retrieve(subscriptionId);

    const subscriptionData: Subscription = {
        tier: 'pro',
        stripeCustomerId: customerId,
        stripeSubscriptionId: subscriptionId,
        status: subscription.status as any,
        currentPeriodEnd: new Date((subscription.current_period_end || 0) * 1000),
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
    };

    // Update user document in Firestore
    const userRef = doc(db, 'users', userId.toLowerCase());
    const userDoc = await getDoc(userRef);

    if (userDoc.exists()) {
        await updateDoc(userRef, { subscription: subscriptionData });
    } else {
        // Create user if doesn't exist (edge case)
        await setDoc(userRef, {
            address: userId,
            subscription: subscriptionData,
            createdAt: new Date(),
        }, { merge: true });
    }

    console.log(`Subscription activated for user: ${userId}`);
}

async function handleSubscriptionUpdate(subscription: any) {
    const userId = subscription.metadata?.userId;
    if (!userId) return;

    const subscriptionData: Partial<Subscription> = {
        status: subscription.status,
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
    };

    const userRef = doc(db, 'users', userId.toLowerCase());
    await updateDoc(userRef, { subscription: subscriptionData });

    console.log(`Subscription updated for user: ${userId}`);
}

async function handleSubscriptionCanceled(subscription: any) {
    const userId = subscription.metadata?.userId;
    if (!userId) return;

    const subscriptionData: Subscription = {
        tier: 'free',
        stripeCustomerId: subscription.customer,
        stripeSubscriptionId: subscription.id,
        status: 'canceled',
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        cancelAtPeriodEnd: true,
    };

    const userRef = doc(db, 'users', userId.toLowerCase());
    await updateDoc(userRef, { subscription: subscriptionData });

    console.log(`Subscription canceled for user: ${userId}`);
}

async function handlePaymentFailed(invoice: any) {
    const customerId = invoice.customer;

    // Find user by customer ID and update status
    // This is a simplified version - in production you'd want to query by customerId
    console.log(`Payment failed for customer: ${customerId}`);
}
