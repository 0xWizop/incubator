import { ChainId, Token, TokenPair } from '@/types';

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

// Base token addresses for each chain to query - we get pairs involving these
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

// Tokens to EXCLUDE from screener results (stables, wrapped natives, etc.)
const EXCLUDED_SYMBOLS = new Set([
    'WETH', 'WBTC', 'USDC', 'USDT', 'USDC.E', 'USDbC', 'DAI', 'FRAX', 'LUSD', 'TUSD', 'BUSD',
    'WSOL', 'SOL', 'ETH', 'STETH', 'WSTETH', 'RETH', 'CBETH',
    'ARB', 'OP', 'MATIC', 'WMATIC',
]);

export async function getTrendingTokens(chainIds: ChainId[] = []): Promise<TokenPair[]> {
    try {
        const chainsToFetch = chainIds.length > 0 ? chainIds : (Object.keys(CHAIN_MAPPING) as ChainId[]);
        let allPairs: TokenPair[] = [];

        // Fetch pairs for each chain using multiple base token addresses
        const chainPromises = chainsToFetch.map(async (chainId) => {
            const dexChainId = CHAIN_MAPPING[chainId];
            if (!dexChainId) return [];

            const tokenAddresses = BASE_TOKENS[dexChainId] || [];
            let chainPairs: any[] = [];

            // Fetch pairs for each base token in this chain
            for (const tokenAddress of tokenAddresses) {
                try {
                    const url = `https://api.dexscreener.com/latest/dex/tokens/${tokenAddress}`;
                    const res = await fetch(url);
                    if (!res.ok) continue;
                    const data = await res.json();

                    // Filter to only this chain and with reasonable liquidity
                    const pairs = (data.pairs || []).filter((p: any) =>
                        p.chainId === dexChainId &&
                        (p.liquidity?.usd || 0) >= 5000 && // $5k liquidity minimum
                        p.baseToken?.symbol && // Has valid base token
                        ((p.txns?.h24?.buys || 0) + (p.txns?.h24?.sells || 0)) >= 25 // Pre-filter very low txn tokens
                    );
                    chainPairs = [...chainPairs, ...pairs];
                } catch (e) {
                    console.error(`Error fetching ${tokenAddress} on ${chainId}:`, e);
                }
            }

            // Also do a search query for the chain to catch more tokens
            try {
                const searchUrl = `https://api.dexscreener.com/latest/dex/search/?q=${dexChainId}`;
                const searchRes = await fetch(searchUrl);
                if (searchRes.ok) {
                    const searchData = await searchRes.json();
                    const searchPairs = (searchData.pairs || []).filter((p: any) =>
                        p.chainId === dexChainId &&
                        (p.liquidity?.usd || 0) >= 5000 &&
                        ((p.txns?.h24?.buys || 0) + (p.txns?.h24?.sells || 0)) >= 25
                    );
                    chainPairs = [...chainPairs, ...searchPairs];
                }
            } catch (e) {
                console.error(`Search error for ${chainId}:`, e);
            }

            // Also try fetching boosted/trending tokens
            try {
                const boostUrl = `https://api.dexscreener.com/token-boosts/top/v1`;
                const boostRes = await fetch(boostUrl);
                if (boostRes.ok) {
                    const boostData = await boostRes.json();
                    // Get token addresses from boosted tokens for this chain
                    const boostedTokens = (boostData || []).filter((t: any) => t.chainId === dexChainId);
                    for (const token of boostedTokens.slice(0, 10)) {
                        try {
                            const tokenUrl = `https://api.dexscreener.com/latest/dex/tokens/${token.tokenAddress}`;
                            const tokenRes = await fetch(tokenUrl);
                            if (tokenRes.ok) {
                                const tokenData = await tokenRes.json();
                                const tokenPairs = (tokenData.pairs || []).filter((p: any) =>
                                    p.chainId === dexChainId &&
                                    (p.liquidity?.usd || 0) >= 5000 &&
                                    ((p.txns?.h24?.buys || 0) + (p.txns?.h24?.sells || 0)) >= 25
                                );
                                chainPairs = [...chainPairs, ...tokenPairs];
                            }
                        } catch (e) { /* ignore */ }
                    }
                }
            } catch (e) {
                console.error(`Boost error for ${chainId}:`, e);
            }

            return chainPairs;
        });

        const results = await Promise.all(chainPromises);

        // Process each chain's results
        results.forEach((pairs) => {
            allPairs = [...allPairs, ...pairs.map(transformPair)];
        });

        // Deduplicate by pair address
        const seen = new Set<string>();
        allPairs = allPairs.filter(p => {
            const key = `${p.chainId}-${p.pairAddress}`;
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        });

        // Filter out stablecoins and wrapped native tokens - we want on-chain meme coins
        allPairs = allPairs.filter(p => {
            const symbol = p.baseToken?.symbol?.toUpperCase() || '';
            return !EXCLUDED_SYMBOLS.has(symbol);
        });

        // Filter out tokens with low transactions (less than 50 txns in 24h for quality)
        allPairs = allPairs.filter(p => {
            const totalTxns = (p.txns24h?.buys || 0) + (p.txns24h?.sells || 0);
            return totalTxns >= 50;
        });

        // Sort by 24h volume (highest first) - this gives us the most active pairs
        allPairs.sort((a, b) => (b.volume24h || 0) - (a.volume24h || 0));

        // Take different amounts per chain - Arbitrum is less active
        const CHAIN_LIMITS: Record<string, number> = {
            solana: 100,
            ethereum: 100,
            base: 100,
            arbitrum: 50, // Less active chain
        };
        const chainCounts: Record<string, number> = {};
        const finalPairs: TokenPair[] = [];

        for (const pair of allPairs) {
            const limit = CHAIN_LIMITS[pair.chainId] || 100;
            const count = chainCounts[pair.chainId] || 0;
            if (count < limit) {
                finalPairs.push(pair);
                chainCounts[pair.chainId] = count + 1;
            }
        }

        // Re-sort combined list by volume
        return finalPairs.sort((a, b) => (b.volume24h || 0) - (a.volume24h || 0));
    } catch (error) {
        console.error('Error fetching trending tokens:', error);
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
            // Filter out unsupported chains if strict, or map them as 'ethereum' default? 
            // Ideally we only show supported chains.
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
        // Note: DexScreener pairs endpoint is /pairs/chainId/pairAddresses
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

function transformPair(pair: any): TokenPair {
    const chainId = REVERSE_CHAIN_MAPPING[pair.chainId] || 'ethereum'; // Fallback to ethereum or handle unknown

    return {
        baseToken: {
            address: pair.baseToken.address,
            symbol: pair.baseToken.symbol,
            name: pair.baseToken.name,
            decimals: 18, // Default, often missing in simple search result
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
