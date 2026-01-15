'use client';

import { CandlestickData, Time } from 'lightweight-charts';

const GECKOTERMINAL_API = 'https://api.geckoterminal.com/api/v2';

// Map our internal chain IDs to GeckoTerminal network IDs
const NETWORK_MAP: Record<string, string> = {
    'ethereum': 'eth',
    'base': 'base',
    'arbitrum': 'arbitrum',
    'solana': 'solana',
};

// Map our timeframes to GeckoTerminal timeframes
const TIMEFRAME_MAP: Record<string, { timeframe: string; aggregate: number }> = {
    '1M': { timeframe: 'minute', aggregate: 1 },
    '5M': { timeframe: 'minute', aggregate: 5 },
    '15M': { timeframe: 'minute', aggregate: 15 },
    '1H': { timeframe: 'hour', aggregate: 1 },
    '4H': { timeframe: 'hour', aggregate: 4 },
    '1D': { timeframe: 'day', aggregate: 1 },
};

export interface OHLCVData {
    time: number;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
}

/**
 * Fetch OHLCV data from GeckoTerminal for a specific pool
 * @param chainId - Our internal chain ID (ethereum, base, arbitrum, solana)
 * @param poolAddress - The pool/pair address from DexScreener
 * @param timeframe - Our internal timeframe (1M, 5M, 15M, 1H, 4H, 1D)
 * @param limit - Number of candles to fetch (max ~1000)
 */
export async function getPoolOHLCV(
    chainId: string,
    poolAddress: string,
    timeframe: string = '1H',
    limit: number = 500
): Promise<OHLCVData[]> {
    try {
        const network = NETWORK_MAP[chainId];
        if (!network) {
            console.error(`Unknown chain ID: ${chainId}`);
            return [];
        }

        const tf = TIMEFRAME_MAP[timeframe] || TIMEFRAME_MAP['1H'];

        // GeckoTerminal API endpoint for OHLCV
        const url = `${GECKOTERMINAL_API}/networks/${network}/pools/${poolAddress}/ohlcv/${tf.timeframe}?aggregate=${tf.aggregate}&limit=${limit}`;

        const response = await fetch(url, {
            headers: {
                'Accept': 'application/json',
            },
            next: { revalidate: 30 } // Cache for 30 seconds
        });

        if (!response.ok) {
            console.error(`GeckoTerminal OHLCV error: ${response.status}`);
            return [];
        }

        const data = await response.json();

        // GeckoTerminal returns data in format:
        // { data: { attributes: { ohlcv_list: [[timestamp, open, high, low, close, volume], ...] } } }
        const ohlcvList = data?.data?.attributes?.ohlcv_list || [];

        // Convert to our format and sort by time ascending
        const result: OHLCVData[] = ohlcvList.map((item: number[]) => ({
            time: Math.floor(item[0]), // Already in seconds
            open: item[1],
            high: item[2],
            low: item[3],
            close: item[4],
            volume: item[5],
        }));

        // Sort ascending by time (GeckoTerminal returns descending)
        result.sort((a, b) => a.time - b.time);

        return result;
    } catch (error) {
        console.error('Error fetching OHLCV from GeckoTerminal:', error);
        return [];
    }
}

/**
 * Convert OHLCV data to lightweight-charts candlestick format
 */
export function toChartData(ohlcvData: OHLCVData[]): CandlestickData<Time>[] {
    return ohlcvData.map(d => ({
        time: d.time as Time,
        open: d.open,
        high: d.high,
        low: d.low,
        close: d.close,
    }));
}

/**
 * Convert OHLCV data to volume histogram format
 */
export function toVolumeData(ohlcvData: OHLCVData[]): { time: Time; value: number; color: string }[] {
    return ohlcvData.map(d => ({
        time: d.time as Time,
        value: d.volume,
        color: d.close >= d.open ? 'rgba(0, 230, 118, 0.5)' : 'rgba(255, 68, 68, 0.5)',
    }));
}

export interface PoolTrade {
    txHash: string;
    type: 'buy' | 'sell';
    priceUsd: number;
    amountBase: number;
    amountQuote: number;
    totalUsd: number;
    timestamp: number;
    maker: string;
}

/**
 * Fetch recent trades for a pool from GeckoTerminal
 * @param chainId - Our internal chain ID
 * @param poolAddress - The pool address
 * @param limit - Number of trades to fetch (max 100 for free tier)
 */
export async function getPoolTrades(
    chainId: string,
    poolAddress: string,
    limit: number = 100
): Promise<PoolTrade[]> {
    try {
        const network = NETWORK_MAP[chainId];
        if (!network) {
            console.error(`Unknown chain ID: ${chainId}`);
            return [];
        }

        const url = `${GECKOTERMINAL_API}/networks/${network}/pools/${poolAddress}/trades`;

        const response = await fetch(url, {
            headers: {
                'Accept': 'application/json',
            },
            next: { revalidate: 2 } // Cache for 2 seconds for live data
        });

        if (!response.ok) {
            console.error(`GeckoTerminal trades error: ${response.status}`);
            return [];
        }

        const data = await response.json();
        const trades = data?.data || [];

        return trades.slice(0, limit).map((trade: any) => {
            const attrs = trade.attributes;
            const kind = attrs.kind === 'buy' ? 'buy' : 'sell';
            const fromAmount = parseFloat(attrs.from_token_amount) || 0;
            const toAmount = parseFloat(attrs.to_token_amount) || 0;

            // Mapping based on trade direction:
            // Buy: Quote -> Base (From = Quote, To = Base)
            // Sell: Base -> Quote (From = Base, To = Quote)
            const amountBase = kind === 'buy' ? toAmount : fromAmount;
            const amountQuote = kind === 'buy' ? fromAmount : toAmount;

            return {
                txHash: attrs.tx_hash || '',
                type: kind,
                priceUsd: parseFloat(attrs.price_to_in_usd) || 0,
                amountBase,
                amountQuote,
                totalUsd: parseFloat(attrs.volume_in_usd) || 0,
                timestamp: new Date(attrs.block_timestamp).getTime(),
                maker: attrs.tx_from_address || '0x',
            };
        });
    } catch (error) {
        console.error('Error fetching trades from GeckoTerminal:', error);
        return [];
    }
}

/**
 * Get pool info from GeckoTerminal
 */
export async function getPoolInfo(chainId: string, poolAddress: string): Promise<any | null> {
    try {
        const network = NETWORK_MAP[chainId];
        if (!network) return null;

        const url = `${GECKOTERMINAL_API}/networks/${network}/pools/${poolAddress}`;

        const response = await fetch(url, {
            headers: { 'Accept': 'application/json' },
            next: { revalidate: 60 }
        });

        if (!response.ok) return null;

        const data = await response.json();
        return data?.data?.attributes || null;
    } catch (error) {
        console.error('Error fetching pool info:', error);
        return null;
    }
}
