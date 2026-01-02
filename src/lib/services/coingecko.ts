'use client';

import { CandlestickData, Time } from 'lightweight-charts';

const COINGECKO_API = 'https://api.coingecko.com/api/v3';

// Map common token symbols to CoinGecko IDs
const TOKEN_ID_MAP: Record<string, string> = {
    'BTC': 'bitcoin',
    'ETH': 'ethereum',
    'WETH': 'ethereum',
    'SOL': 'solana',
    'USDC': 'usd-coin',
    'USDT': 'tether',
    'DAI': 'dai',
    'LINK': 'chainlink',
    'UNI': 'uniswap',
    'AAVE': 'aave',
    'MATIC': 'matic-network',
    'ARB': 'arbitrum',
    'OP': 'optimism',
    'PEPE': 'pepe',
    'SHIB': 'shiba-inu',
    'DOGE': 'dogecoin',
    'BONK': 'bonk',
    'WIF': 'dogwifcoin',
};

export interface OHLCData {
    time: number; // Unix timestamp in seconds
    open: number;
    high: number;
    low: number;
    close: number;
}

/**
 * Get CoinGecko ID from token symbol
 */
export function getCoinGeckoId(symbol: string): string | null {
    const normalized = symbol.toUpperCase();
    return TOKEN_ID_MAP[normalized] || null;
}

/**
 * Fetch OHLC data from CoinGecko
 * @param coinId - CoinGecko coin ID (e.g., 'bitcoin', 'ethereum')
 * @param days - Number of days (1, 7, 14, 30, 90, 180, 365, max)
 * @param vsCurrency - Quote currency (default: 'usd')
 */
export async function getOHLC(
    coinId: string,
    days: number | string = 7,
    vsCurrency: string = 'usd'
): Promise<OHLCData[]> {
    try {
        const url = `${COINGECKO_API}/coins/${coinId}/ohlc?vs_currency=${vsCurrency}&days=${days}`;

        const response = await fetch(url, {
            headers: {
                'Accept': 'application/json',
            },
            next: { revalidate: 60 } // Cache for 60 seconds
        });

        if (!response.ok) {
            console.error(`CoinGecko OHLC error: ${response.status}`);
            return [];
        }

        const data = await response.json();

        // CoinGecko returns array of [timestamp, open, high, low, close]
        return data.map((item: number[]) => ({
            time: Math.floor(item[0] / 1000), // Convert ms to seconds
            open: item[1],
            high: item[2],
            low: item[3],
            close: item[4],
        }));
    } catch (error) {
        console.error('Error fetching OHLC from CoinGecko:', error);
        return [];
    }
}

/**
 * Convert OHLC data to lightweight-charts format
 */
export function toChartData(ohlcData: OHLCData[]): CandlestickData<Time>[] {
    return ohlcData.map(d => ({
        time: d.time as Time,
        open: d.open,
        high: d.high,
        low: d.low,
        close: d.close,
    }));
}

/**
 * Get token price history for simple line charts
 */
export async function getPriceHistory(
    coinId: string,
    days: number = 7,
    vsCurrency: string = 'usd'
): Promise<{ time: number; value: number }[]> {
    try {
        const url = `${COINGECKO_API}/coins/${coinId}/market_chart?vs_currency=${vsCurrency}&days=${days}`;

        const response = await fetch(url, {
            headers: { 'Accept': 'application/json' },
            next: { revalidate: 60 }
        });

        if (!response.ok) return [];

        const data = await response.json();

        return data.prices.map((item: number[]) => ({
            time: Math.floor(item[0] / 1000),
            value: item[1],
        }));
    } catch (error) {
        console.error('Error fetching price history:', error);
        return [];
    }
}

/**
 * Search for coin by name or symbol
 */
export async function searchCoin(query: string): Promise<{ id: string; symbol: string; name: string }[]> {
    try {
        const url = `${COINGECKO_API}/search?query=${encodeURIComponent(query)}`;

        const response = await fetch(url, {
            headers: { 'Accept': 'application/json' },
            next: { revalidate: 300 } // Cache for 5 minutes
        });

        if (!response.ok) return [];

        const data = await response.json();

        return data.coins.slice(0, 10).map((coin: any) => ({
            id: coin.id,
            symbol: coin.symbol,
            name: coin.name,
        }));
    } catch (error) {
        console.error('Error searching CoinGecko:', error);
        return [];
    }
}

export interface CoinData {
    price: number;
    marketCap: number;
    volume24h: number;
    priceChange24h: number;
    circulatingSupply: number;
    totalSupply: number;
    ath: number;
    athChangePercent: number;
}

/**
 * Get detailed coin data including market cap, volume, etc.
 */
export async function getCoinData(coinId: string): Promise<CoinData | null> {
    try {
        const url = `${COINGECKO_API}/coins/${coinId}?localization=false&tickers=false&community_data=false&developer_data=false`;

        const response = await fetch(url, {
            headers: { 'Accept': 'application/json' },
            next: { revalidate: 60 }
        });

        if (!response.ok) return null;

        const data = await response.json();

        return {
            price: data.market_data?.current_price?.usd || 0,
            marketCap: data.market_data?.market_cap?.usd || 0,
            volume24h: data.market_data?.total_volume?.usd || 0,
            priceChange24h: data.market_data?.price_change_percentage_24h || 0,
            circulatingSupply: data.market_data?.circulating_supply || 0,
            totalSupply: data.market_data?.total_supply || 0,
            ath: data.market_data?.ath?.usd || 0,
            athChangePercent: data.market_data?.ath_change_percentage?.usd || 0,
        };
    } catch (error) {
        console.error('Error fetching coin data:', error);
        return null;
    }
}
