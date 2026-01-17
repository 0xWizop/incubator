'use client';

import { ChainId, TokenPair } from '@/types';

const GECKOTERMINAL_API = 'https://api.geckoterminal.com/api/v2';

// Chains to support for the screener
const NETWORK_MAP: Partial<Record<ChainId, string>> = {
    'base': 'base',
    'solana': 'solana',
};

// Types for internal screener use
export type ScreenerSort = 'h24' | 'h6' | 'h1' | 'dr' | 'volume' | 'liquidity' | 'fdv' | 'txns';
export type ScreenerTimeframe = '1h' | '24h';

export interface ScreenerFilters {
    chain: ChainId | 'all';
    minLiquidity?: number;
    minVolume?: number;
    minFdv?: number;
    maxFdv?: number;
}

// Interfaces for GeckoTerminal API responses
interface GeckoPoolAttributes {
    base_token_price_usd: string;
    quote_token_price_usd: string;
    base_token_price_native_currency: string;
    quote_token_price_native_currency: string;
    address: string;
    name: string;
    pool_created_at: string;
    fdv_usd: string;
    market_cap_usd: string;
    price_change_percentage: {
        m5: string;
        h1: string;
        h6: string;
        h24: string;
    };
    transactions: {
        m5: { buys: number; sells: number; buyers: number; sellers: number };
        h1: { buys: number; sells: number; buyers: number; sellers: number };
        h6: { buys: number; sells: number; buyers: number; sellers: number };
        h24: { buys: number; sells: number; buyers: number; sellers: number };
    };
    volume_usd: {
        m5: string;
        h1: string;
        h6: string;
        h24: string;
    };
    reserve_in_usd: string;
}

interface GeckoPoolData {
    id: string;
    type: string;
    attributes: GeckoPoolAttributes;
    relationships: {
        base_token: { data: { id: string; type: string } };
        quote_token: { data: { id: string; type: string } };
        dex: { data: { id: string; type: string } };
    };
}

interface GeckoTokenAttributes {
    address: string;
    name: string;
    symbol: string;
    image_url: string;
}

interface GeckoTokenData {
    id: string;
    type: string;
    attributes: GeckoTokenAttributes;
}

interface GeckoResponse {
    data: GeckoPoolData[];
    included?: GeckoTokenData[];
    links?: {
        first: string;
        prev?: string;
        next?: string;
        last?: string;
    };
}

// Cache keys for rate limiting and deduping
const CACHE_TTL = 60 * 1000; // 1 minute
const cache: Map<string, { data: TokenPair[]; timestamp: number }> = new Map();

/**
 * Fetch generic top pools (Deep pagination supported)
 * Essentially "Top Volume" mode
 */
export async function getTopPools(chainId: 'base' | 'solana', page: number = 1): Promise<TokenPair[]> {
    const network = NETWORK_MAP[chainId];
    if (!network) return [];

    const cacheKey = `top_${chainId}_${page}`;
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        return cached.data;
    }

    try {
        // GeckoTerminal /pools endpoint returns pools sorted by volume/liq by default
        const response = await fetch(`${GECKOTERMINAL_API}/networks/${network}/pools?page=${page}&include=base_token,quote_token`, {
            headers: { 'Accept': 'application/json' },
            next: { revalidate: 60 }
        });

        if (!response.ok) throw new Error(`GeckoTerminal error: ${response.status}`);

        const data: GeckoResponse = await response.json();
        const tokens = processGeckoResponse(chainId, data);

        cache.set(cacheKey, { data: tokens, timestamp: Date.now() });
        return tokens;
    } catch (error) {
        console.error(`Error fetching top pools for ${chainId}:`, error);
        return [];
    }
}

/**
 * Fetch TRENDING pools (Hot/Popular right now)
 * This uses the specific /trending_pools endpoint
 */
export async function getTrendingPools(chainId: 'base' | 'solana', page: number = 1): Promise<TokenPair[]> {
    const network = NETWORK_MAP[chainId];
    if (!network) return [];

    const cacheKey = `trending_${chainId}_${page}`;
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        return cached.data;
    }

    try {
        const response = await fetch(`${GECKOTERMINAL_API}/networks/${network}/trending_pools?page=${page}&include=base_token,quote_token`, {
            headers: { 'Accept': 'application/json' },
            next: { revalidate: 60 }
        });

        if (!response.ok) throw new Error(`GeckoTerminal error: ${response.status}`);

        const data: GeckoResponse = await response.json();
        const tokens = processGeckoResponse(chainId, data);

        cache.set(cacheKey, { data: tokens, timestamp: Date.now() });
        return tokens;
    } catch (error) {
        console.error(`Error fetching trending pools for ${chainId}:`, error);
        return [];
    }
}

/**
 * Fetch new pools from GeckoTerminal
 */
export async function getNewPools(chainId: 'base' | 'solana', page: number = 1): Promise<TokenPair[]> {
    const network = NETWORK_MAP[chainId];
    if (!network) return [];

    const cacheKey = `new_${chainId}_${page}`;
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        return cached.data;
    }

    try {
        // new_pools often has limited history
        const response = await fetch(`${GECKOTERMINAL_API}/networks/${network}/new_pools?page=${page}&include=base_token,quote_token`, {
            headers: { 'Accept': 'application/json' },
            next: { revalidate: 60 }
        });

        if (!response.ok) throw new Error(`GeckoTerminal error: ${response.status}`);

        const data: GeckoResponse = await response.json();
        const tokens = processGeckoResponse(chainId, data);

        cache.set(cacheKey, { data: tokens, timestamp: Date.now() });
        return tokens;
    } catch (error) {
        console.error(`Error fetching new pools for ${chainId}:`, error);
        return [];
    }
}

/**
 * Process GeckoTerminal response into our TokenPair format
 */
function processGeckoResponse(chainId: ChainId, response: GeckoResponse): TokenPair[] {
    const pools = response.data || [];
    const included = response.included || [];

    // Create a map of included tokens for quick lookup
    const tokenMap = new Map<string, GeckoTokenAttributes>();
    included.forEach(item => {
        if (item.type === 'token') {
            tokenMap.set(item.id, item.attributes);
        }
    });

    return pools.map(pool => {
        const attr = pool.attributes;
        const baseTokenId = pool.relationships.base_token.data.id;
        const quoteTokenId = pool.relationships.quote_token.data.id;

        const baseTokenAttr = tokenMap.get(baseTokenId);
        const quoteTokenAttr = tokenMap.get(quoteTokenId);

        // Fallback or skip if token data missing
        if (!baseTokenAttr || !quoteTokenAttr) return null;

        return {
            chainId,
            pairAddress: attr.address,
            dexId: 'geckoterminal', // We don't have exact DEX ID from list (requires dex include), keep generic or fetch details
            url: `https://geckoterminal.com/${NETWORK_MAP[chainId]}/pools/${attr.address}`,
            baseToken: {
                address: baseTokenAttr.address,
                symbol: baseTokenAttr.symbol,
                name: baseTokenAttr.name,
                decimals: 18, // Gecko doesn't return decimals in list view usually, fallback
                chainId,
                logo: baseTokenAttr.image_url,
                price: parseFloat(attr.base_token_price_usd),
            },
            quoteToken: {
                address: quoteTokenAttr.address,
                symbol: quoteTokenAttr.symbol,
                name: quoteTokenAttr.name,
                decimals: 18,
                chainId,
                logo: quoteTokenAttr.image_url,
                price: parseFloat(attr.quote_token_price_usd),
            },
            priceUsd: parseFloat(attr.base_token_price_usd),
            priceNative: parseFloat(attr.base_token_price_native_currency),
            liquidity: parseFloat(attr.reserve_in_usd),
            fdv: parseFloat(attr.fdv_usd),
            volume24h: parseFloat(attr.volume_usd.h24),
            priceChange: {
                m5: parseFloat(attr.price_change_percentage.m5),
                h1: parseFloat(attr.price_change_percentage.h1),
                h6: parseFloat(attr.price_change_percentage.h6),
                h24: parseFloat(attr.price_change_percentage.h24),
            },
            txns24h: {
                buys: attr.transactions.h24.buys,
                sells: attr.transactions.h24.sells,
            },
            createdAt: attr.pool_created_at,
        };
    }).filter(Boolean) as TokenPair[];
}
