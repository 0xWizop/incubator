import { NextRequest, NextResponse } from 'next/server';
import { createBillingPortalSession } from '@/lib/stripe';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { customerId } = body;

        if (!customerId) {
            return NextResponse.json(
                { error: 'Customer ID is required' },
                { status: 400 }
            );
        }

        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

        const url = await createBillingPortalSession({
            customerId,
            returnUrl: `${baseUrl}/app/settings`,
        });

        if (!url) {
            return NextResponse.json(
                { error: 'Failed to create portal session' },
                { status: 500 }
            );
        }

        return NextResponse.json({ url });
    } catch (error) {
        console.error('Portal error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
