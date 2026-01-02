'use client';

import { CandlestickData, Time } from 'lightweight-charts';

const BINANCE_API = 'https://api.binance.com/api/v3';

// Map common symbols to Binance trading pairs
const SYMBOL_MAP: Record<string, string> = {
    'BTC': 'BTCUSDT',
    'ETH': 'ETHUSDT',
    'SOL': 'SOLUSDT',
    'ARB': 'ARBUSDT',
    'LINK': 'LINKUSDT',
    'UNI': 'UNIUSDT',
    'AAVE': 'AAVEUSDT',
    'MATIC': 'MATICUSDT',
    'OP': 'OPUSDT',
    'PEPE': 'PEPEUSDT',
    'SHIB': 'SHIBUSDT',
    'DOGE': 'DOGEUSDT',
    'BONK': 'BONKUSDT',
    'WIF': 'WIFUSDT',
    'AVAX': 'AVAXUSDT',
    'DOT': 'DOTUSDT',
    'ADA': 'ADAUSDT',
    'XRP': 'XRPUSDT',
    'BNB': 'BNBUSDT',
    'NEAR': 'NEARUSDT',
    'ATOM': 'ATOMUSDT',
    'FTM': 'FTMUSDT',
    'INJ': 'INJUSDT',
    'SUI': 'SUIUSDT',
    'APT': 'APTUSDT',
    'RENDER': 'RENDERUSDT',
    'FET': 'FETUSDT',
    'LDO': 'LDOUSDT',
    'MKR': 'MKRUSDT',
    'CRV': 'CRVUSDT',
    'SNX': 'SNXUSDT',
};

// Interval mapping
const INTERVAL_MAP: Record<string, string> = {
    '1M': '1m',   // 1 minute
    '5M': '5m',   // 5 minutes
    '15M': '15m', // 15 minutes
    '1H': '1h',   // 1 hour
    '4H': '4h',   // 4 hours
    '1D': '1d',   // 1 day
    '1W': '1w',   // 1 week
};

export interface KlineData {
    time: number;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
}

/**
 * Get Binance trading pair symbol from token symbol
 */
export function getBinanceSymbol(symbol: string): string | null {
    const normalized = symbol.toUpperCase();
    return SYMBOL_MAP[normalized] || null;
}

/**
 * Fetch Kline (candlestick) data from Binance
 * @param symbol - Binance trading pair (e.g., 'BTCUSDT')
 * @param interval - Kline interval (1m, 5m, 15m, 1h, 4h, 1d, 1w)
 * @param limit - Number of candles to fetch (max 1000)
 */
export async function getKlines(
    symbol: string,
    interval: string = '1h',
    limit: number = 500
): Promise<KlineData[]> {
    try {
        const url = `${BINANCE_API}/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`;

        const response = await fetch(url, {
            headers: { 'Accept': 'application/json' },
            next: { revalidate: 30 } // Cache for 30 seconds
        });

        if (!response.ok) {
            console.error(`Binance Klines error: ${response.status}`);
            return [];
        }

        const data = await response.json();

        // Binance returns array of arrays:
        // [openTime, open, high, low, close, volume, closeTime, quoteAssetVolume, trades, ...]
        return data.map((item: any[]) => ({
            time: Math.floor(item[0] / 1000), // Convert ms to seconds
            open: parseFloat(item[1]),
            high: parseFloat(item[2]),
            low: parseFloat(item[3]),
            close: parseFloat(item[4]),
            volume: parseFloat(item[5]),
        }));
    } catch (error) {
        console.error('Error fetching Klines from Binance:', error);
        return [];
    }
}

/**
 * Fetch Klines for a token symbol with automatic interval mapping
 * @param tokenSymbol - Token symbol (e.g., 'BTC', 'ETH')
 * @param timeframe - Timeframe string (1M, 5M, 15M, 1H, 4H, 1D)
 * @param limit - Number of candles
 */
export async function getTokenKlines(
    tokenSymbol: string,
    timeframe: string = '1H',
    limit: number = 500
): Promise<KlineData[]> {
    const binanceSymbol = getBinanceSymbol(tokenSymbol);
    if (!binanceSymbol) {
        return [];
    }

    const interval = INTERVAL_MAP[timeframe] || '1h';
    return getKlines(binanceSymbol, interval, limit);
}

/**
 * Convert Kline data to lightweight-charts format
 */
export function toChartData(klineData: KlineData[]): CandlestickData<Time>[] {
    return klineData.map(d => ({
        time: d.time as Time,
        open: d.open,
        high: d.high,
        low: d.low,
        close: d.close,
    }));
}

/**
 * Get volume data for histogram series
 */
export function toVolumeData(klineData: KlineData[]): { time: Time; value: number; color: string }[] {
    return klineData.map(d => ({
        time: d.time as Time,
        value: d.volume,
        color: d.close >= d.open ? 'rgba(0, 230, 118, 0.5)' : 'rgba(255, 68, 68, 0.5)',
    }));
}
