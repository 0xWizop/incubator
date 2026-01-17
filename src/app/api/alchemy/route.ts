import { NextRequest, NextResponse } from 'next/server';

// Alchemy API proxy to avoid CORS issues with browser requests
// This routes requests through the Next.js server

const ALCHEMY_API_KEY = process.env.ALCHEMY_API_KEY || process.env.NEXT_PUBLIC_ALCHEMY_API_KEY;

const NETWORK_URLS: Record<string, string> = {
    ethereum: `https://eth-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
    base: `https://base-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
    arbitrum: `https://arb-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
    solana: `https://solana-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
};

export async function POST(request: NextRequest) {
    // Check if API key is configured
    if (!ALCHEMY_API_KEY) {
        console.warn('[API/Alchemy] No API key configured');
        return NextResponse.json(
            { error: 'Alchemy API key not configured' },
            { status: 500 }
        );
    }

    try {
        const body = await request.json();
        const { chainId, method, params } = body;

        if (!chainId || !method) {
            return NextResponse.json(
                { error: 'Missing chainId or method' },
                { status: 400 }
            );
        }

        const url = NETWORK_URLS[chainId];
        if (!url) {
            return NextResponse.json(
                { error: `Unsupported chain: ${chainId}` },
                { status: 400 }
            );
        }

        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                jsonrpc: '2.0',
                id: 1,
                method,
                params: params || [],
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`[API/Alchemy] ${response.status} for ${chainId}/${method}:`, errorText);
            return NextResponse.json(
                { error: `Alchemy error: ${response.status}` },
                { status: response.status }
            );
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error('[API/Alchemy] Error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
