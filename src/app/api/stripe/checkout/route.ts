import { NextRequest, NextResponse } from 'next/server';
import { createCheckoutSession, STRIPE_PRODUCTS } from '@/lib/stripe';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { userId, email, plan, interval } = body;

        if (!userId) {
            return NextResponse.json(
                { error: 'User ID is required' },
                { status: 400 }
            );
        }

        // Get the correct price ID based on plan and interval
        let priceId: string;
        if (plan === 'pro') {
            priceId = interval === 'yearly'
                ? STRIPE_PRODUCTS.pro.yearly
                : STRIPE_PRODUCTS.pro.monthly;
        } else {
            return NextResponse.json(
                { error: 'Invalid plan' },
                { status: 400 }
            );
        }

        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

        const session = await createCheckoutSession({
            userId,
            email,
            priceId,
            successUrl: `${baseUrl}/app/settings?subscription=success`,
            cancelUrl: `${baseUrl}/app/settings?subscription=canceled`,
        });

        if (!session) {
            return NextResponse.json(
                { error: 'Failed to create checkout session. Make sure STRIPE_SECRET_KEY is configured.' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            sessionId: session.sessionId,
            url: session.url,
        });
    } catch (error: any) {
        console.error('Checkout error:', error);
        return NextResponse.json(
            { error: error?.message || 'Internal server error. Check that your Stripe Price IDs are configured correctly.' },
            { status: 500 }
        );
    }
}
