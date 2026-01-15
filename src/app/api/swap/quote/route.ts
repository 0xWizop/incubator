import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    try {
        const searchParams = req.nextUrl.searchParams;
        const query = new URLSearchParams(searchParams as any).toString();
        const apiKey = process.env.NEXT_PUBLIC_0X_API_KEY;

        if (!apiKey) {
            return NextResponse.json({ error: 'Missing API Key' }, { status: 500 });
        }

        const response = await axios.get(`https://api.0x.org/swap/permit2/quote?${query}`, {
            headers: {
                '0x-api-key': apiKey,
                '0x-version': 'v2',
            },
        });

        return NextResponse.json(response.data);
    } catch (error: any) {
        console.error('0x Proxy Error:', error.response?.data || error.message);
        return NextResponse.json(
            { error: error.response?.data || 'Failed to fetch quote' },
            { status: error.response?.status || 500 }
        );
    }
}
