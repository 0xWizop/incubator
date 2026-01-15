/**
 * Technical Indicators for Lightweight Charts
 * Provides calculation utilities for common indicators
 */

export interface IndicatorData {
    time: number;
    value: number | null;
}

/**
 * Calculate Simple Moving Average (SMA)
 * @param closes - Array of closing prices
 * @param period - Moving average period (e.g., 7, 25, 99)
 * @returns Array of SMA values (null for periods with insufficient data)
 */
export function calculateSMA(closes: number[], period: number): (number | null)[] {
    const result: (number | null)[] = [];

    for (let i = 0; i < closes.length; i++) {
        if (i < period - 1) {
            result.push(null);
        } else {
            let sum = 0;
            for (let j = 0; j < period; j++) {
                sum += closes[i - j];
            }
            result.push(sum / period);
        }
    }

    return result;
}

/**
 * Calculate Exponential Moving Average (EMA)
 * @param closes - Array of closing prices
 * @param period - EMA period (e.g., 12, 26)
 * @returns Array of EMA values (null for periods with insufficient data)
 */
export function calculateEMA(closes: number[], period: number): (number | null)[] {
    const result: (number | null)[] = [];
    const multiplier = 2 / (period + 1);

    for (let i = 0; i < closes.length; i++) {
        if (i < period - 1) {
            result.push(null);
        } else if (i === period - 1) {
            // First EMA is the SMA
            let sum = 0;
            for (let j = 0; j < period; j++) {
                sum += closes[i - j];
            }
            result.push(sum / period);
        } else {
            const prevEMA = result[i - 1];
            if (prevEMA !== null) {
                result.push((closes[i] - prevEMA) * multiplier + prevEMA);
            } else {
                result.push(null);
            }
        }
    }

    return result;
}

/**
 * Calculate Relative Strength Index (RSI)
 * @param closes - Array of closing prices
 * @param period - RSI period (typically 14)
 * @returns Array of RSI values (0-100, null for insufficient data)
 */
export function calculateRSI(closes: number[], period: number = 14): (number | null)[] {
    const result: (number | null)[] = [];
    const gains: number[] = [];
    const losses: number[] = [];

    // Calculate price changes
    for (let i = 1; i < closes.length; i++) {
        const change = closes[i] - closes[i - 1];
        gains.push(change > 0 ? change : 0);
        losses.push(change < 0 ? Math.abs(change) : 0);
    }

    result.push(null); // First element has no RSI

    for (let i = 0; i < gains.length; i++) {
        if (i < period - 1) {
            result.push(null);
        } else if (i === period - 1) {
            // First RSI calculation uses simple averages
            const avgGain = gains.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0) / period;
            const avgLoss = losses.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0) / period;

            if (avgLoss === 0) {
                result.push(100);
            } else {
                const rs = avgGain / avgLoss;
                result.push(100 - (100 / (1 + rs)));
            }
        } else {
            // Subsequent RSI uses smoothed averages
            const prevRSI = result[i];
            if (prevRSI !== null) {
                const prevAvgGain = gains.slice(i - period, i).reduce((a, b) => a + b, 0) / period;
                const prevAvgLoss = losses.slice(i - period, i).reduce((a, b) => a + b, 0) / period;

                const avgGain = (prevAvgGain * (period - 1) + gains[i]) / period;
                const avgLoss = (prevAvgLoss * (period - 1) + losses[i]) / period;

                if (avgLoss === 0) {
                    result.push(100);
                } else {
                    const rs = avgGain / avgLoss;
                    result.push(100 - (100 / (1 + rs)));
                }
            } else {
                result.push(null);
            }
        }
    }

    return result;
}

/**
 * Calculate Volume Weighted Average Price (VWAP)
 * @param highs - Array of high prices
 * @param lows - Array of low prices  
 * @param closes - Array of closing prices
 * @param volumes - Array of volumes
 * @returns Array of VWAP values (null for first element)
 */
export function calculateVWAP(
    highs: number[],
    lows: number[],
    closes: number[],
    volumes: number[]
): (number | null)[] {
    const result: (number | null)[] = [];
    let cumulativeTPV = 0; // Cumulative Typical Price * Volume
    let cumulativeVolume = 0;

    for (let i = 0; i < closes.length; i++) {
        const typicalPrice = (highs[i] + lows[i] + closes[i]) / 3;
        cumulativeTPV += typicalPrice * volumes[i];
        cumulativeVolume += volumes[i];

        if (cumulativeVolume === 0) {
            result.push(null);
        } else {
            result.push(cumulativeTPV / cumulativeVolume);
        }
    }

    return result;
}

/**
 * Convert indicator values to lightweight-charts line series format
 * @param times - Array of timestamps from OHLCV data
 * @param values - Array of indicator values
 * @returns Array suitable for lineSeries.setData()
 */
export function toLineSeriesData(
    times: number[],
    values: (number | null)[]
): { time: number; value: number }[] {
    const result: { time: number; value: number }[] = [];

    for (let i = 0; i < times.length; i++) {
        if (values[i] !== null) {
            result.push({ time: times[i], value: values[i] as number });
        }
    }

    return result;
}

/**
 * Indicator categories for organized UI
 */
export type IndicatorCategory = 'overlay' | 'oscillator';

export interface IndicatorConfig {
    defaultPeriod?: number;
    color: string;
    lineWidth: number;
    category: IndicatorCategory;
    label: string;
    description: string;
    requiresPeriod: boolean;
}

/**
 * Base indicator type configurations
 */
export const INDICATOR_TYPES: Record<string, IndicatorConfig> = {
    MA: {
        defaultPeriod: 20,
        color: '#ffd700',
        lineWidth: 1.5,
        category: 'overlay',
        label: 'MA',
        description: 'Simple Moving Average',
        requiresPeriod: true
    },
    EMA: {
        defaultPeriod: 12,
        color: '#00ff88',
        lineWidth: 1.5,
        category: 'overlay',
        label: 'EMA',
        description: 'Exponential Moving Average',
        requiresPeriod: true
    },
    RSI: {
        defaultPeriod: 14,
        color: '#f39c12',
        lineWidth: 1.5,
        category: 'oscillator',
        label: 'RSI',
        description: 'Relative Strength Index',
        requiresPeriod: false
    },
    VWAP: {
        color: '#8e44ad',
        lineWidth: 2,
        category: 'overlay',
        label: 'VWAP',
        description: 'Volume Weighted Average Price',
        requiresPeriod: false
    },
};

export type IndicatorBaseType = keyof typeof INDICATOR_TYPES;

/**
 * Active indicator instance with user-defined period
 */
export interface ActiveIndicator {
    type: IndicatorBaseType;
    period?: number;
    color: string;
    id: string; // Unique identifier for this instance
}

/**
 * Generate a unique ID for an indicator instance
 */
export function generateIndicatorId(type: IndicatorBaseType, period?: number): string {
    return period ? `${type}_${period}` : type;
}

// Legacy type for backwards compatibility
export const INDICATOR_CONFIGS = INDICATOR_TYPES;
export type IndicatorType = IndicatorBaseType;

