import { ChainId, TokenPair } from '@/types';

const DEXSCREENER_API = 'https://api.dexscreener.com/latest/dex';

export interface TrendingToken {
    url: string;
    chainId: string;
    tokenAddress: string;
    icon?: string;
    header?: string;
    description?: string;
    links?: {
        type?: string;
        label?: string;
        url: string;
    }[];
}

// Map internal chain IDs to DexScreener chain IDs
const CHAIN_MAPPING: Record<ChainId, string> = {
    ethereum: 'ethereum',
    base: 'base',
    arbitrum: 'arbitrum',
    solana: 'solana',
};

// Map DexScreener chain IDs back to internal ChainId
const REVERSE_CHAIN_MAPPING: Record<string, ChainId> = {
    'ethereum': 'ethereum',
    'base': 'base',
    'arbitrum': 'arbitrum',
    'solana': 'solana',
};

// Base token addresses for each chain to query
const BASE_TOKENS: Record<string, string[]> = {
    ethereum: [
        '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', // WETH
        '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', // USDC
        '0xdAC17F958D2ee523a2206206994597C13D831ec7', // USDT
    ],
    base: [
        '0x4200000000000000000000000000000000000006', // WETH
        '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', // USDC
    ],
    arbitrum: [
        '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1', // WETH
        '0xaf88d065e77c8cC2239327C5EDb3A432268e5831', // USDC
        '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9', // USDT
    ],
    solana: [
        'So11111111111111111111111111111111111111112', // SOL
        'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', // USDC
    ],
};

// Popular search terms per chain to get more diversity
const SEARCH_TERMS: Record<string, string[]> = {
    ethereum: ['pepe', 'shib', 'floki', 'wojak', 'mog', 'grok', 'turbo', 'neiro', 'andy', 'ponke'],
    base: ['brett', 'toshi', 'degen', 'bald', 'normie', 'mochi', 'doginme', 'higher', 'ski', 'miggles'],
    arbitrum: ['magic', 'pendle', 'jones', 'grail', 'vela', 'dopex', 'radiant', 'plutus', 'umami', 'camelot'],
    solana: ['bonk', 'wif', 'popcat', 'mew', 'wen', 'jup', 'pyth', 'ray', 'orca', 'samo', 'fartcoin', 'goat', 'ai16z'],
};

// Target token count (even number)
const TARGET_TOKEN_COUNT = 200;

// Tokens to EXCLUDE from screener results
const EXCLUDED_SYMBOLS = new Set([
    'WETH', 'WBTC', 'USDC', 'USDT', 'USDC.E', 'USDbC', 'DAI', 'FRAX', 'LUSD', 'TUSD', 'BUSD',
    'WSOL', 'SOL', 'ETH', 'STETH', 'WSTETH', 'RETH', 'CBETH',
    'ARB', 'OP', 'MATIC', 'WMATIC',
]);

// Client-side cache
interface CacheEntry {
    data: TokenPair[];
    timestamp: number;
}

const memoryCache: Map<string, CacheEntry> = new Map();
const CACHE_TTL = 1 * 60 * 1000; // 1 minute (reduced for testing)

// Rate limiting
const FETCH_DELAY = 150;
let lastFetchTime = 0;

async function rateLimitedFetch(url: string): Promise<any> {
    // Ensure minimum delay between requests
    const now = Date.now();
    const timeSinceLast = now - lastFetchTime;
    if (timeSinceLast < FETCH_DELAY) {
        await new Promise(r => setTimeout(r, FETCH_DELAY - timeSinceLast));
    }
    lastFetchTime = Date.now();

    try {
        const res = await fetch(url);
        if (res.status === 429) {
            // Rate limited - wait and retry once
            await new Promise(r => setTimeout(r, 1000));
            const retry = await fetch(url);
            if (!retry.ok) return null;
            return await retry.json();
        }
        if (!res.ok) return null;
        return await res.json();
    } catch (e) {
        console.error('Fetch error:', e);
        return null;
    }
}

function transformPair(pair: any): TokenPair {
    const chainId = REVERSE_CHAIN_MAPPING[pair.chainId] || 'ethereum';

    return {
        baseToken: {
            address: pair.baseToken.address,
            symbol: pair.baseToken.symbol,
            name: pair.baseToken.name,
            decimals: 18,
            chainId: chainId,
            price: parseFloat(pair.priceUsd),
            priceChange24h: pair.priceChange?.h24,
            volume24h: pair.volume?.h24,
            liquidity: pair.liquidity?.usd,
            marketCap: pair.fdv,
            logo: pair.info?.imageUrl || undefined,
        },
        quoteToken: {
            address: pair.quoteToken.address,
            symbol: pair.quoteToken.symbol,
            name: pair.quoteToken.name,
            decimals: 18,
            chainId: chainId,
        },
        pairAddress: pair.pairAddress,
        dexId: pair.dexId,
        chainId: chainId,
        priceUsd: parseFloat(pair.priceUsd),
        priceNative: parseFloat(pair.priceNative),
        volume24h: pair.volume?.h24 || 0,
        liquidity: pair.liquidity?.usd || 0,
        fdv: pair.fdv,
        priceChange: {
            m5: pair.priceChange?.m5 || 0,
            h1: pair.priceChange?.h1 || 0,
            h6: pair.priceChange?.h6 || 0,
            h24: pair.priceChange?.h24 || 0,
        },
        txns24h: {
            buys: pair.txns?.h24?.buys || 0,
            sells: pair.txns?.h24?.sells || 0,
        },
        createdAt: pair.pairCreatedAt,
        url: pair.url,
        logo: pair.info?.imageUrl,
    };
}

function filterPair(pair: any, dexChainId: string): boolean {
    return (
        pair.chainId === dexChainId &&
        (pair.liquidity?.usd || 0) >= 1000 && // Lowered to $1k
        pair.baseToken?.symbol &&
        ((pair.txns?.h24?.buys || 0) + (pair.txns?.h24?.sells || 0)) >= 5 // Lowered to 5
    );
}

async function fetchChainData(chainId: ChainId): Promise<TokenPair[]> {
    const dexChainId = CHAIN_MAPPING[chainId];
    if (!dexChainId) return [];

    let allPairs: any[] = [];

    // 1. Fetch pairs for each base token
    const tokenAddresses = BASE_TOKENS[dexChainId] || [];
    for (const tokenAddress of tokenAddresses) {
        const url = `https://api.dexscreener.com/latest/dex/tokens/${tokenAddress}`;
        const data = await rateLimitedFetch(url);
        if (data?.pairs) {
            const filtered = data.pairs.filter((p: any) => filterPair(p, dexChainId));
            allPairs.push(...filtered);
        }
    }

    // 2. Search by popular terms for this chain
    const searchTerms = SEARCH_TERMS[dexChainId] || [];
    for (const term of searchTerms) {
        const url = `https://api.dexscreener.com/latest/dex/search/?q=${term}`;
        const data = await rateLimitedFetch(url);
        if (data?.pairs) {
            const filtered = data.pairs.filter((p: any) => filterPair(p, dexChainId));
            allPairs.push(...filtered);
        }
    }

    // 3. Get boosted/trending tokens
    try {
        const boostUrl = `https://api.dexscreener.com/token-boosts/top/v1`;
        const boostData = await rateLimitedFetch(boostUrl);
        if (boostData) {
            const chainBoosted = (boostData || []).filter((t: any) => t.chainId === dexChainId);
            for (const token of chainBoosted.slice(0, 5)) {
                const tokenUrl = `https://api.dexscreener.com/latest/dex/tokens/${token.tokenAddress}`;
                const tokenData = await rateLimitedFetch(tokenUrl);
                if (tokenData?.pairs) {
                    const filtered = tokenData.pairs.filter((p: any) => filterPair(p, dexChainId));
                    allPairs.push(...filtered);
                }
            }
        }
    } catch (e) {
        console.error('Boost fetch error:', e);
    }

    return allPairs.map(transformPair);
}

export async function getTrendingTokens(chainIds: ChainId[] = []): Promise<TokenPair[]> {
    try {
        const chainsToFetch = chainIds.length > 0 ? chainIds : (Object.keys(CHAIN_MAPPING) as ChainId[]);
        const cacheKey = `screener-${chainsToFetch.sort().join(',')}`;

        // Check memory cache
        const cached = memoryCache.get(cacheKey);
        if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
            console.log(`[Screener] Returning ${cached.data.length} cached tokens`);
            return cached.data;
        }

        console.log(`[Screener] Fetching fresh data for chains: ${chainsToFetch.join(', ')}`);

        // Fetch all chains in parallel
        const chainPromises = chainsToFetch.map(chain => fetchChainData(chain));
        const results = await Promise.all(chainPromises);

        // Flatten and combine
        let allPairs: TokenPair[] = results.flat();

        // Deduplicate by token address + chain (not pair address)
        // This ensures the same token doesn't appear multiple times from different pairs
        const seenTokens = new Set<string>();
        allPairs = allPairs.filter(p => {
            const key = `${p.chainId}-${p.baseToken.address.toLowerCase()}`;
            if (seenTokens.has(key)) return false;
            seenTokens.add(key);
            return true;
        });

        // Filter excluded symbols
        allPairs = allPairs.filter(p => {
            const symbol = p.baseToken?.symbol?.toUpperCase() || '';
            return !EXCLUDED_SYMBOLS.has(symbol);
        });

        // Secondary filtering removed - initial filter is sufficient

        // Sort by volume
        allPairs.sort((a, b) => (b.volume24h || 0) - (a.volume24h || 0));

        // Cap at target count (even number)
        const finalPairs = allPairs.slice(0, TARGET_TOKEN_COUNT);

        console.log(`[Screener] Returning ${finalPairs.length} tokens (from ${allPairs.length} total)`);

        // Update cache
        memoryCache.set(cacheKey, {
            data: finalPairs,
            timestamp: Date.now(),
        });

        return finalPairs;
    } catch (error) {
        console.error('Error fetching trending tokens:', error);
        // Return cached data on error if available
        const fallbackKey = `screener-arbitrum,base,ethereum,solana`;
        const cached = memoryCache.get(fallbackKey);
        if (cached) return cached.data;
        return [];
    }
}

export async function getTopPairs(chainIds: ChainId[], limit = 400): Promise<TokenPair[]> {
    const pairs = await getTrendingTokens(chainIds);
    return pairs.slice(0, limit);
}

export async function searchPairs(query: string): Promise<TokenPair[]> {
    try {
        const url = `${DEXSCREENER_API}/search/?q=${encodeURIComponent(query)}`;
        const response = await fetch(url);
        if (!response.ok) return [];

        const data = await response.json();
        const pairs = data.pairs || [];

        return pairs.map(transformPair).filter((p: TokenPair) => {
            return Object.keys(REVERSE_CHAIN_MAPPING).includes(p.chainId);
        });
    } catch (error) {
        console.error('Error searching pairs:', error);
        return [];
    }
}

export async function getPairByAddress(chainId: ChainId, pairAddress: string): Promise<TokenPair | null> {
    try {
        const dexChainId = CHAIN_MAPPING[chainId];
        const url = `${DEXSCREENER_API}/pairs/${dexChainId}/${pairAddress}`;
        const response = await fetch(url);

        if (!response.ok) return null;

        const data = await response.json();
        const pairs = data.pairs || [];

        if (pairs.length === 0) return null;

        return transformPair(pairs[0]);
    } catch (error) {
        console.error('Error fetching pair:', error);
        return null;
    }
}

export async function getPairsByTokenAddress(chainId: ChainId, tokenAddress: string): Promise<TokenPair[]> {
    try {
        const dexChainId = CHAIN_MAPPING[chainId];
        const response = await fetch(`${DEXSCREENER_API}/tokens/${tokenAddress}`);

        if (!response.ok) return [];

        const data = await response.json();
        let pairs: any[] = data.pairs || [];

        if (dexChainId) {
            pairs = pairs.filter(p => p.chainId === dexChainId);
        }

        return pairs.map(transformPair);
    } catch (error) {
        console.error('Error fetching pairs for token:', error);
        return [];
    }
}
