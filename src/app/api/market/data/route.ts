import { NextResponse } from 'next/server';

const COINGECKO_API = 'https://api.coingecko.com/api/v3';

// Cache in memory for simple server-side caching (prevent 429s)
let cache: Record<string, { data: any; timestamp: number }> = {};

const CACHE_TTL = 60 * 1000; // 1 minute

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const categoryId = searchParams.get('category');
    const count = Math.min(parseInt(searchParams.get('count') || '50'), 100); // Max 100

    try {
        if (type === 'coins') {
            const cacheKey = categoryId ? `coins_${categoryId}_${count}` : `coins_${count}`;

            // Check cache
            if (cache[cacheKey] && Date.now() - cache[cacheKey].timestamp < CACHE_TTL) {
                return NextResponse.json(cache[cacheKey].data);
            }

            // Fetch Top coins
            // If categoryId is present, fetch standard market data for that category
            // Include 1h, 24h, and 7d price changes for heatmap timeframe support
            const url = categoryId
                ? `${COINGECKO_API}/coins/markets?vs_currency=usd&category=${categoryId}&order=market_cap_desc&per_page=${count}&page=1&sparkline=false&price_change_percentage=1h,24h,7d`
                : `${COINGECKO_API}/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=${count}&page=1&sparkline=false&price_change_percentage=1h,24h,7d`;

            const res = await fetch(url, {
                headers: { 'Accept': 'application/json' },
                next: { revalidate: 60 }
            });

            if (!res.ok) throw new Error(`CoinGecko error: ${res.status}`);

            const data = await res.json();

            // Update cache
            cache[cacheKey] = { data, timestamp: Date.now() };

            return NextResponse.json(data);
        }

        if (type === 'categories') {
            const cacheKey = 'categories';

            // Check cache
            if (cache[cacheKey] && Date.now() - cache[cacheKey].timestamp < CACHE_TTL) {
                return NextResponse.json(cache[cacheKey].data);
            }

            // Fetch Categories
            const res = await fetch(`${COINGECKO_API}/coins/categories`);
            if (!res.ok) throw new Error(`CoinGecko error: ${res.status}`);

            const data = await res.json();

            // Whitelist of "Interesting" Sectors for Traders
            const INTERESTING_SECTORS = [
                'layer-1', // Covers ETH, SOL, ADA etc.
                'meme-token',
                'artificial-intelligence',
                'gaming',
                'decentralized-finance-defi',
                'real-world-assets-rwa',
                'depin'
            ];

            // Filter for our interesting sectors
            // CoinGecko returns "id" field we can match against
            const curatedCategories = data
                .filter((c: any) => INTERESTING_SECTORS.includes(c.id))
                .sort((a: any, b: any) => b.market_cap - a.market_cap);

            cache[cacheKey] = { data: curatedCategories, timestamp: Date.now() };

            return NextResponse.json(curatedCategories);
        }

        return NextResponse.json({ error: 'Invalid type parameter' }, { status: 400 });
    } catch (error) {
        console.error('Market API Error:', error);
        return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
    }
}
