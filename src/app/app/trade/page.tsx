'use client';

import React, { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useTradingStore, useAppStore, useWalletStore, useWatchlistStore } from '@/store';
import { useAuth } from '@/context/AuthContext';
import { usePreferences } from '@/hooks/usePreferences';
import { TokenPair, ChainId, RecentTrade } from '@/types';
import { getChain } from '@/config/chains';
import * as dexscreener from '@/lib/services/dexscreener';
import * as alchemyService from '@/lib/services/alchemy';
import * as coingecko from '@/lib/services/coingecko';
import * as binance from '@/lib/services/binance';
import * as geckoterminal from '@/lib/services/geckoterminal';
import { createChart, IChartApi, CandlestickData, Time } from 'lightweight-charts';
import {
    ArrowUpDown,
    Settings,
    ChevronDown,
    Activity,
    Wallet,
    RefreshCw,
    Info,
    Clock,
    BarChart3,
    ExternalLink,
    ArrowLeft,
    Star,
    Bell,
    Wrench,
    ListPlus,
    Grid3X3,
    TrendingUp,
    Minus,
} from 'lucide-react';
import { clsx } from 'clsx';
import { formatDistanceToNow } from 'date-fns';
import { formatPrice as formatWithSubscript } from '@/lib/utils/format';
import { AlertModal, AddToWatchlistModal } from '@/components/watchlist';
import * as indicators from '@/lib/utils/indicators';
import { horizontalLineManager, HorizontalLineHandle } from '@/lib/chart/drawingTools';

import { LoadingSpinner, LoadingOverlay } from '@/components/ui/Loading';

// Helper to calculate optimal priceFormat based on price data range
function calculatePriceFormat(chartData: { open: number; high: number; low: number; close: number }[], isMcapMode: boolean = false): { type: 'custom'; formatter?: (price: number) => string } | { type: 'price'; precision: number; minMove: number } {
    if (!chartData || chartData.length === 0) {
        return { type: 'price', precision: 8, minMove: 0.00000001 };
    }

    // Find the minimum and maximum prices to determine formatting needed
    const allPrices = chartData.flatMap(d => [d.open, d.high, d.low, d.close]).filter(p => p > 0);
    const minPrice = Math.min(...allPrices);
    const maxPrice = Math.max(...allPrices);

    // Use custom formatter for large values (mcap mode or high prices) or very small values (subscript)
    if (isMcapMode || maxPrice >= 1000000 || minPrice < 0.0001) {
        return {
            type: 'custom',
            formatter: (price: number) => {
                if (price >= 1e12) return '$' + (price / 1e12).toFixed(2) + 'T';
                if (price >= 1e9) return '$' + (price / 1e9).toFixed(2) + 'B';
                if (price >= 1e6) return '$' + (price / 1e6).toFixed(2) + 'M';
                if (price >= 1e3) return '$' + (price / 1e3).toFixed(2) + 'K';
                if (price >= 1) return '$' + price.toFixed(2);
                if (price < 0.0001) return '$' + formatWithSubscript(price); // Uses subscript
                if (price >= 0.01) return '$' + price.toFixed(4);
                return '$' + price.toFixed(6);
            },
        };
    }

    // Calculate precision based on magnitude of smallest price for regular prices
    let precision: number;
    let minMove: number;

    if (minPrice >= 1000) {
        precision = 2;
        minMove = 0.01;
    } else if (minPrice >= 1) {
        precision = 4;
        minMove = 0.0001;
    } else if (minPrice >= 0.01) {
        precision = 6;
        minMove = 0.000001;
    } else if (minPrice >= 0.0001) {
        precision = 8;
        minMove = 0.00000001;
    } else if (minPrice >= 0.000001) {
        precision = 10;
        minMove = 0.0000000001;
    } else {
        // For extremely small prices (meme coins), use maximum precision
        precision = 12;
        minMove = 0.000000000001;
    }

    return { type: 'price', precision, minMove };
}

// Helper to transform price data to market cap data
function transformToMarketCap(
    chartData: { time: any; open: number; high: number; low: number; close: number }[],
    supply: number
): { time: any; open: number; high: number; low: number; close: number }[] {
    if (!supply || supply <= 0) return chartData;
    return chartData.map(d => ({
        time: d.time,
        open: d.open * supply,
        high: d.high * supply,
        low: d.low * supply,
        close: d.close * supply,
    }));
}

// Helper to strictly sort and deduplicate chart data
function cleanChartData(data: any[]): any[] {
    if (!data || data.length === 0) return [];

    // Sort ascending
    const sorted = [...data].sort((a, b) => (a.time as number) - (b.time as number));

    // Deduplicate
    const unique: any[] = [];
    const seen = new Set<number>();

    for (const item of sorted) {
        const t = item.time as number;
        if (t && !seen.has(t)) {
            seen.add(t);
            unique.push(item);
        }
    }
    return unique;
}

// Wrapper component to handle Suspense boundary for useSearchParams
export default function TradePage() {
    return (
        <Suspense fallback={<LoadingSpinner fullHeight size="xl" text="Loading market data..." />}>
            <TradePageContent />
        </Suspense>
    );
}

function TradePageContent() {
    const searchParams = useSearchParams();
    const { firebaseUser } = useAuth();
    const { toggleFavorite, isFavorited, initialize, isInitialized } = useWatchlistStore();
    const chartContainerRef = useRef<HTMLDivElement>(null);
    const chartRef = useRef<IChartApi | null>(null);
    const candlestickSeriesRef = useRef<any>(null);
    const volumeSeriesRef = useRef<any>(null);
    const lastContextRef = useRef<{ pair: string; timeframe: string } | null>(null);

    const [timeframe, setTimeframe] = useState('1D');
    const [showTimeframeDropdown, setShowTimeframeDropdown] = useState(false);
    const [loading, setLoading] = useState(true);
    const [tokenData, setTokenData] = useState<TokenPair | null>(null);
    const [coinData, setCoinData] = useState<coingecko.CoinData | null>(null);
    const [currentOHLC, setCurrentOHLC] = useState<{ open: number; high: number; low: number; close: number; change: number; volume?: number } | null>(null);
    const [chartUnavailable, setChartUnavailable] = useState(false);
    const [yAxisMode, setYAxisMode] = useState<'price' | 'mcap'>('price');
    const [showAlertModal, setShowAlertModal] = useState(false);
    const [showWatchlistModal, setShowWatchlistModal] = useState(false);
    const [retryTrigger, setRetryTrigger] = useState(0);
    const [isChartLoading, setIsChartLoading] = useState(false);
    const [showGridLines, setShowGridLines] = useState(true);
    const [isTimeframeLoading, setIsTimeframeLoading] = useState(false);
    const [activeIndicators, setActiveIndicators] = useState<indicators.ActiveIndicator[]>([]);
    const [showIndicatorMenu, setShowIndicatorMenu] = useState(false);
    const [pendingIndicator, setPendingIndicator] = useState<{ type: indicators.IndicatorBaseType; period: number } | null>(null);
    const indicatorSeriesRef = useRef<Record<string, any>>({});
    const [isDrawingMode, setIsDrawingMode] = useState(false);
    const [horizontalLineCount, setHorizontalLineCount] = useState(0);

    // Initialize watchlist store
    useEffect(() => {
        if (firebaseUser?.uid && !isInitialized) {
            initialize(firebaseUser.uid);
        }
    }, [firebaseUser?.uid, isInitialized, initialize]);

    // URL params for deep linking
    const chainParam = searchParams.get('chain') as ChainId;
    const pairParam = searchParams.get('pair');

    useEffect(() => {
        loadPairData(false); // Initial load (visible)
        // Refresh price data every 3 seconds for more responsive live prices
        const priceInterval = setInterval(() => loadPairData(true), 3000); // Background refresh (silent)
        return () => clearInterval(priceInterval);
    }, [chainParam, pairParam]);

    // Save last viewed token to localStorage when tokenData changes
    useEffect(() => {
        if (tokenData?.pairAddress && tokenData?.chainId) {
            localStorage.setItem('lastViewedToken', JSON.stringify({
                chain: tokenData.chainId,
                pair: tokenData.pairAddress,
            }));
        }
    }, [tokenData?.pairAddress, tokenData?.chainId]);

    async function loadPairData(silent = false) {
        if (!silent) setLoading(true);
        try {
            if (chainParam && pairParam) {
                // Load from URL params
                const pair = await dexscreener.getPairByAddress(chainParam, pairParam);
                if (pair) setTokenData(pair);
            } else {
                // Try to restore last viewed token from localStorage
                const lastViewedRaw = localStorage.getItem('lastViewedToken');
                if (lastViewedRaw) {
                    try {
                        const lastViewed = JSON.parse(lastViewedRaw);
                        if (lastViewed.chain && lastViewed.pair) {
                            const restoredPair = await dexscreener.getPairByAddress(lastViewed.chain, lastViewed.pair);
                            if (restoredPair) {
                                setTokenData(restoredPair);
                                return;
                            }
                        }
                    } catch (e) {
                        console.error('Failed to restore last viewed token:', e);
                    }
                }

                // Default to Fartcoin on Solana if no saved token
                try {
                    const fartcoinPair = await dexscreener.getPairByAddress('solana', 'Bzc9NZfMqkXR6fz1DBph7BDf9BroyEf6pnzESP7v5iiw');
                    if (fartcoinPair) {
                        setTokenData(fartcoinPair);
                    }
                } catch (e) {
                    console.error('Failed to load Fartcoin:', e);
                }
            }
        } catch (error) {
            console.error('Failed to load pair data', error);
        } finally {
            if (!silent) setLoading(false);
        }
    }

    // Initialize chart once (separate from data fetching to prevent flickering)
    useEffect(() => {
        if (!chartContainerRef.current || chartRef.current) return;

        const chart = createChart(chartContainerRef.current, {
            layout: {
                background: { color: 'transparent' },
                textColor: '#666666',
            },
            grid: {
                vertLines: { color: 'rgba(255, 255, 255, 0.03)' },
                horzLines: { color: 'rgba(255, 255, 255, 0.05)' },
            },
            crosshair: {
                mode: 0,
                vertLine: {
                    color: '#ff6600',
                    width: 1,
                    style: 2,
                },
                horzLine: {
                    color: '#ff6600',
                    width: 1,
                    style: 2,
                },
            },
            rightPriceScale: {
                borderColor: 'rgba(255, 255, 255, 0.05)',
                scaleMargins: {
                    top: 0.1,
                    bottom: 0.25,
                },
                autoScale: true,
                borderVisible: true,
            },
            timeScale: {
                borderColor: 'rgba(255, 255, 255, 0.05)',
                timeVisible: true,
                barSpacing: 12,
                rightOffset: 5,
            },
        });

        const candlestickSeries = chart.addCandlestickSeries({
            upColor: '#00e676',
            downColor: '#ff4444',
            borderUpColor: '#00e676',
            borderDownColor: '#ff4444',
            wickUpColor: '#00e676',
            wickDownColor: '#ff4444',
            priceFormat: {
                type: 'price',
                precision: 8,
                minMove: 0.00000001,
            },
        });

        const volumeSeries = chart.addHistogramSeries({
            color: '#26a69a',
            priceFormat: { type: 'volume' },
            priceScaleId: '',
        });

        volumeSeries.priceScale().applyOptions({
            scaleMargins: { top: 0.85, bottom: 0 },
        });

        chartRef.current = chart;
        candlestickSeriesRef.current = candlestickSeries;
        volumeSeriesRef.current = volumeSeries;

        // Subscribe to crosshair move
        chart.subscribeCrosshairMove((param) => {
            if (param.seriesData) {
                const data = param.seriesData.get(candlestickSeries) as any;
                const volumeData = param.seriesData.get(volumeSeries) as any;
                if (data && data.open !== undefined) {
                    const change = ((data.close - data.open) / data.open) * 100;
                    setCurrentOHLC({
                        open: data.open,
                        high: data.high,
                        low: data.low,
                        close: data.close,
                        change: change,
                        volume: volumeData?.value,
                    });
                }
            }
        });

        // Resize observer for container
        const resizeObserver = new ResizeObserver((entries) => {
            if (entries.length === 0 || !entries[0].target) return;
            const newRect = entries[0].contentRect;
            chart.applyOptions({
                width: newRect.width,
                height: newRect.height
            });
        });

        if (chartContainerRef.current) {
            resizeObserver.observe(chartContainerRef.current);
        }

        // Attach horizontal line manager to series
        horizontalLineManager.attach(candlestickSeries);

        // Chart click handler for drawing mode
        const handleChartClick = (param: any) => {
            if (param.point) {
                const price = candlestickSeries.coordinateToPrice(param.point.y);
                if (price !== null) {
                    // We'll expose this via a ref to be called from the component
                    (window as any).__chartClickPrice = price;
                    (window as any).__chartClickHandler?.();
                }
            }
        };
        chart.subscribeClick(handleChartClick);

        return () => {
            resizeObserver.disconnect();
            chart.unsubscribeClick(handleChartClick);
            horizontalLineManager.detach();
            chart.remove();
            chartRef.current = null;
            candlestickSeriesRef.current = null;
            volumeSeriesRef.current = null;
        };
    }, []); // Only run once

    // Toggle grid lines visibility
    useEffect(() => {
        if (!chartRef.current) return;
        chartRef.current.applyOptions({
            grid: {
                vertLines: { visible: showGridLines, color: 'rgba(255, 255, 255, 0.03)' },
                horzLines: { visible: showGridLines, color: 'rgba(255, 255, 255, 0.05)' },
            },
        });
    }, [showGridLines]);

    // Fetch and update chart data (Robust version with race condition protection)
    useEffect(() => {
        if (!tokenData || !candlestickSeriesRef.current || !volumeSeriesRef.current) return;

        const candlestickSeries = candlestickSeriesRef.current;
        const volumeSeries = volumeSeriesRef.current;
        const chart = chartRef.current;
        let isActive = true;

        setChartUnavailable(false);

        // Only show loading spinner if context changed (new pair or timeframe)
        // This prevents flashing when only FDV/price updates or during background refresh
        const isNewContext = lastContextRef.current?.pair !== tokenData.pairAddress ||
            lastContextRef.current?.timeframe !== timeframe;

        if (isNewContext) {
            setIsChartLoading(true);
        }

        const fetchChartData = async () => {
            try {
                // 1. Try GeckoTerminal
                if (tokenData.pairAddress && tokenData.chainId && tokenData.dexId !== 'coingecko') {
                    const ohlcvData = await geckoterminal.getPoolOHLCV(
                        tokenData.chainId,
                        tokenData.pairAddress,
                        timeframe,
                        500
                    );

                    if (isActive && ohlcvData.length > 0) {
                        let chartData = cleanChartData(geckoterminal.toChartData(ohlcvData));
                        const volumeData = cleanChartData(geckoterminal.toVolumeData(ohlcvData));

                        if (yAxisMode === 'mcap' && tokenData.fdv && chartData.length > 0) {
                            const currentPrice = chartData[chartData.length - 1]?.close || tokenData.priceUsd || 1;
                            const estimatedSupply = tokenData.fdv / currentPrice;
                            chartData = transformToMarketCap(chartData, estimatedSupply);
                        }

                        candlestickSeries.setData(chartData);
                        volumeSeries.setData(volumeData);
                        // Store for indicator calculations (full OHLCV data)
                        chartDataRef.current = chartData.map((d: any) => ({ time: d.time, open: d.open, high: d.high, low: d.low, close: d.close, volume: volumeData.find((v: any) => v.time === d.time)?.value || 0 }));
                        candlestickSeries.applyOptions({
                            priceFormat: calculatePriceFormat(chartData, yAxisMode === 'mcap'),
                        });

                        if (chartData.length > 0) {
                            const lastCandle = chartData[chartData.length - 1];
                            if (lastCandle) {
                                const change = ((lastCandle.close - lastCandle.open) / lastCandle.open) * 100;
                                setCurrentOHLC({ open: lastCandle.open, high: lastCandle.high, low: lastCandle.low, close: lastCandle.close, change });
                            }

                            if (isNewContext) {
                                chart?.timeScale().scrollToPosition(0, false);
                                lastContextRef.current = { pair: tokenData.pairAddress, timeframe };
                            }
                            console.log('Chart data loaded from GeckoTerminal');
                            setIsChartLoading(false);
                            return;
                        }
                    }
                }

                // 2. Try Binance
                if (isActive) {
                    const binanceSymbol = binance.getBinanceSymbol(tokenData.baseToken.symbol);
                    if (binanceSymbol) {
                        const klineData = await binance.getTokenKlines(tokenData.baseToken.symbol, timeframe, 500);
                        if (isActive && klineData.length > 0) {
                            let chartData = cleanChartData(binance.toChartData(klineData));
                            const volumeData = cleanChartData(binance.toVolumeData(klineData));

                            if (yAxisMode === 'mcap' && tokenData.fdv && chartData.length > 0) {
                                const currentPrice = chartData[chartData.length - 1]?.close || tokenData.priceUsd || 1;
                                const estimatedSupply = tokenData.fdv / currentPrice;
                                chartData = transformToMarketCap(chartData, estimatedSupply);
                            }

                            candlestickSeries.setData(chartData);
                            volumeSeries.setData(volumeData);
                            candlestickSeries.applyOptions({
                                priceFormat: calculatePriceFormat(chartData, yAxisMode === 'mcap'),
                            });

                            if (chartData.length > 0) {
                                const lastCandle = chartData[chartData.length - 1];
                                if (lastCandle) {
                                    const change = ((lastCandle.close - lastCandle.open) / lastCandle.open) * 100;
                                    setCurrentOHLC({ open: lastCandle.open, high: lastCandle.high, low: lastCandle.low, close: lastCandle.close, change });
                                }

                                const shouldFit = lastContextRef.current?.pair !== tokenData.baseToken.symbol || lastContextRef.current?.timeframe !== timeframe;
                                if (shouldFit) {
                                    chart?.timeScale().scrollToPosition(0, false);
                                    lastContextRef.current = { pair: tokenData.baseToken.symbol, timeframe };
                                }
                                console.log('Chart data loaded from Binance');
                                setIsChartLoading(false);
                                return;
                            }
                        }
                    }
                }

                // 3. Try CoinGecko
                if (isActive) {
                    const coinId = coingecko.getCoinGeckoId(tokenData.baseToken.symbol);
                    if (coinId) {
                        const daysMap: Record<string, string | number> = { '1M': 30, '5M': 90, '15M': 180, '1H': 365, '4H': 'max', '1D': 'max' };
                        const days = daysMap[timeframe] || 'max';
                        const marketData = await coingecko.getCoinData(coinId);
                        if (isActive && marketData) setCoinData(marketData);

                        const ohlcData = await coingecko.getOHLC(coinId, days);
                        if (isActive && ohlcData.length > 0) {
                            let chartData = cleanChartData(coingecko.toChartData(ohlcData));

                            if (yAxisMode === 'mcap' && chartData.length > 0) {
                                const supply = marketData?.marketCap && marketData.price
                                    ? marketData.marketCap / marketData.price
                                    : (tokenData.fdv && tokenData.priceUsd ? tokenData.fdv / tokenData.priceUsd : 0);
                                if (supply > 0) chartData = transformToMarketCap(chartData, supply);
                            }

                            candlestickSeries.setData(chartData);
                            candlestickSeries.applyOptions({
                                priceFormat: calculatePriceFormat(chartData, yAxisMode === 'mcap'),
                            });

                            const volumeData = chartData.map((candle: any) => ({
                                time: candle.time,
                                value: Math.abs(candle.close - candle.open) * 1000000,
                                color: candle.close >= candle.open ? 'rgba(0, 230, 118, 0.5)' : 'rgba(255, 68, 68, 0.5)',
                            }));
                            volumeSeries.setData(volumeData);

                            const lastCandle = chartData[chartData.length - 1];
                            if (lastCandle) {
                                const change = ((lastCandle.close - lastCandle.open) / lastCandle.open) * 100;
                                setCurrentOHLC({ open: lastCandle.open, high: lastCandle.high, low: lastCandle.low, close: lastCandle.close, change });
                            }

                            const shouldFit = lastContextRef.current?.pair !== tokenData.baseToken.symbol || lastContextRef.current?.timeframe !== timeframe;
                            if (shouldFit) {
                                chart?.timeScale().scrollToPosition(0, false);
                                lastContextRef.current = { pair: tokenData.baseToken.symbol, timeframe };
                            }
                            console.log('Chart data loaded from CoinGecko');
                            setIsChartLoading(false);
                            return;
                        }
                    }
                }

                if (isActive) {
                    setChartUnavailable(true);
                    console.log('No chart data available for this token');
                }
            } catch (error) {
                console.error('Failed to load chart data', error);
                if (isActive) setChartUnavailable(true);
            } finally {
                if (isActive) {
                    setIsChartLoading(false);
                    setIsTimeframeLoading(false);
                }
            }
        };

        fetchChartData();
        return () => { isActive = false; };
    }, [tokenData?.pairAddress, tokenData?.chainId, tokenData?.dexId, timeframe, yAxisMode, retryTrigger]);

    // Live candle tick updates - fetch only latest candle and use update() for performance
    useEffect(() => {
        if (!tokenData || !candlestickSeriesRef.current || !volumeSeriesRef.current) return;
        if (tokenData.dexId === 'coingecko') return; // CoinGecko doesn't support real-time

        const candlestickSeries = candlestickSeriesRef.current;
        const volumeSeries = volumeSeriesRef.current;
        let isActive = true;

        const updateLiveCandle = async () => {
            try {
                // Fetch only the latest 2 candles for efficiency
                const ohlcvData = await geckoterminal.getPoolOHLCV(
                    tokenData.chainId,
                    tokenData.pairAddress,
                    timeframe,
                    2
                );

                if (!isActive || ohlcvData.length === 0) return;

                const chartData = cleanChartData(geckoterminal.toChartData(ohlcvData));
                const volumeData = cleanChartData(geckoterminal.toVolumeData(ohlcvData));

                if (chartData.length > 0) {
                    const latestCandle = chartData[chartData.length - 1];
                    const latestVolume = volumeData[volumeData.length - 1];

                    // Transform to mcap if needed
                    let displayCandle = latestCandle;
                    if (yAxisMode === 'mcap' && tokenData.fdv) {
                        const estimatedSupply = tokenData.fdv / (latestCandle.close || 1);
                        displayCandle = {
                            ...latestCandle,
                            open: latestCandle.open * estimatedSupply,
                            high: latestCandle.high * estimatedSupply,
                            low: latestCandle.low * estimatedSupply,
                            close: latestCandle.close * estimatedSupply,
                        };
                    }

                    // Use update() for efficient single-candle updates (no re-render of entire chart)
                    candlestickSeries.update(displayCandle);
                    if (latestVolume) volumeSeries.update(latestVolume);

                    // Update OHLC display
                    const change = ((displayCandle.close - displayCandle.open) / displayCandle.open) * 100;
                    setCurrentOHLC({
                        open: displayCandle.open,
                        high: displayCandle.high,
                        low: displayCandle.low,
                        close: displayCandle.close,
                        change,
                    });
                }
            } catch (error) {
                // Silent fail for live updates - don't show error to user
                console.debug('Live candle update failed:', error);
            }
        };

        // Start live updates after initial data load, every 2 seconds
        const liveInterval = setInterval(updateLiveCandle, 2000);

        return () => {
            isActive = false;
            clearInterval(liveInterval);
        };
    }, [tokenData, timeframe, yAxisMode]);

    // Store latest chart data for indicator calculations
    const chartDataRef = useRef<{ time: number; close: number }[]>([]);

    // Add indicator with optional period
    const addIndicator = useCallback((type: indicators.IndicatorBaseType, period?: number) => {
        const config = indicators.INDICATOR_TYPES[type];
        const actualPeriod = config.requiresPeriod ? (period || config.defaultPeriod || 14) : config.defaultPeriod;
        const id = indicators.generateIndicatorId(type, actualPeriod);

        setActiveIndicators(prev => {
            // Check if already exists
            if (prev.some(i => i.id === id)) return prev;
            return [...prev, { type, period: actualPeriod, color: config.color, id }];
        });
        setPendingIndicator(null);
        setShowIndicatorMenu(false);
    }, []);

    // Remove indicator by id
    const removeIndicator = useCallback((id: string) => {
        if (indicatorSeriesRef.current[id] && chartRef.current) {
            chartRef.current.removeSeries(indicatorSeriesRef.current[id]);
            delete indicatorSeriesRef.current[id];
        }
        setActiveIndicators(prev => prev.filter(i => i.id !== id));
    }, []);

    // Render active indicators when chart data is loaded or indicators change
    useEffect(() => {
        if (!chartRef.current || !candlestickSeriesRef.current || chartDataRef.current.length === 0) return;
        const chart = chartRef.current;

        // Create/update indicator series for each active indicator
        activeIndicators.forEach(indicator => {
            const config = indicators.INDICATOR_TYPES[indicator.type];
            // Cast to full OHLCV type for proper access
            const ohlcv = chartDataRef.current as Array<{ time: number; open: number; high: number; low: number; close: number; volume: number }>;
            const closes = ohlcv.map(d => d.close);
            const highs = ohlcv.map(d => d.high);
            const lows = ohlcv.map(d => d.low);
            const volumes = ohlcv.map(d => d.volume || 0);
            const times = ohlcv.map(d => d.time);

            // Calculate indicator values based on type
            let values: (number | null)[];
            const period = indicator.period || config.defaultPeriod || 14;

            if (indicator.type === 'MA') {
                values = indicators.calculateSMA(closes, period);
            } else if (indicator.type === 'EMA') {
                values = indicators.calculateEMA(closes, period);
            } else if (indicator.type === 'RSI') {
                values = indicators.calculateRSI(closes, period);
            } else if (indicator.type === 'VWAP') {
                values = indicators.calculateVWAP(highs, lows, closes, volumes);
            } else {
                values = indicators.calculateSMA(closes, period);
            }

            const lineData = indicators.toLineSeriesData(times, values);

            // Create series if it doesn't exist
            if (!indicatorSeriesRef.current[indicator.id]) {
                const isRSI = indicator.type === 'RSI';
                const series = chart.addLineSeries({
                    color: indicator.color,
                    lineWidth: config.lineWidth as 1 | 2 | 3 | 4,
                    priceLineVisible: false,
                    lastValueVisible: isRSI,
                    crosshairMarkerVisible: false,
                    priceScaleId: isRSI ? 'rsi' : 'right',
                });

                // Configure RSI pane above volume
                if (isRSI) {
                    series.priceScale().applyOptions({
                        scaleMargins: { top: 0.7, bottom: 0.15 },
                        autoScale: false,
                    });
                    series.applyOptions({
                        autoscaleInfoProvider: () => ({
                            priceRange: { minValue: 0, maxValue: 100 },
                        }),
                    });
                }

                indicatorSeriesRef.current[indicator.id] = series;
            }

            indicatorSeriesRef.current[indicator.id].setData(lineData);
        });

        // Remove series for deactivated indicators
        Object.keys(indicatorSeriesRef.current).forEach(key => {
            if (!activeIndicators.some(i => i.id === key)) {
                chart.removeSeries(indicatorSeriesRef.current[key]);
                delete indicatorSeriesRef.current[key];
            }
        });
    }, [activeIndicators, chartDataRef.current.length]);

    // Handle drawing mode clicks - place horizontal line when chart is clicked
    useEffect(() => {
        const handleDrawingClick = () => {
            if (isDrawingMode) {
                const price = (window as any).__chartClickPrice;
                if (price !== null && price !== undefined) {
                    horizontalLineManager.addLine(price, { color: '#b8e600', lineWidth: 1 });
                    setHorizontalLineCount(horizontalLineManager.getLineCount());
                    setIsDrawingMode(false); // Exit drawing mode after placing line
                }
            }
        };

        (window as any).__chartClickHandler = handleDrawingClick;

        return () => {
            (window as any).__chartClickHandler = null;
        };
    }, [isDrawingMode]);

    // Clear all horizontal lines
    const clearAllLines = useCallback(() => {
        horizontalLineManager.clearAll();
        setHorizontalLineCount(0);
    }, []);



    // ... (existing helper functions or state, wait, I need to place this correctly)

    // Handle timeframe change with loading state
    const handleTimeframeChange = useCallback((newTimeframe: string) => {
        if (newTimeframe !== timeframe) {
            setIsTimeframeLoading(true);
            setTimeframe(newTimeframe);
        }
    }, [timeframe]);

    const timeframes = ['1M', '5M', '15M', '1H', '4H', '1D'];

    return (
        <div className="h-full max-h-full flex flex-col lg:flex-row bg-[var(--background)] overflow-hidden relative">
            {/* Initial Load Overlay - Solid Background */}
            {loading && !tokenData && (
                <div className="absolute inset-0 z-50 bg-[var(--background)] flex items-center justify-center">
                    <LoadingSpinner fullHeight size="xl" text="Loading market data..." />
                </div>
            )}

            {/* Background Refresh Overlay - Subtle */}
            {loading && tokenData && <LoadingOverlay />}
            {/* Main content - Chart & Data */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                {/* Header */}
                <div className="flex-shrink-0 px-2 sm:px-6 py-2 sm:py-4 border-b border-[var(--border)] bg-[var(--background-secondary)]">
                    {/* Token info - single row on mobile */}
                    <div className="flex items-center justify-between gap-2 sm:gap-4 mb-2 sm:mb-4">
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                            {tokenData && (
                                <>
                                    <div className="w-7 h-7 sm:w-10 sm:h-10 rounded-full bg-[var(--background-tertiary)] flex items-center justify-center overflow-hidden border border-[var(--border)] flex-shrink-0">
                                        {tokenData.baseToken.logo ? (
                                            <img src={tokenData.baseToken.logo} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                            <span className="text-[10px] sm:text-xs font-bold">{tokenData.baseToken.symbol.slice(0, 2)}</span>
                                        )}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-1 sm:gap-2">
                                            <span className="font-bold text-sm sm:text-xl truncate">{tokenData.baseToken.symbol}</span>
                                            <span className="text-[var(--foreground-muted)] text-xs sm:text-base">/</span>
                                            <span className="text-[var(--foreground-muted)] text-xs sm:text-base">{tokenData.quoteToken.symbol}</span>
                                            {tokenData.chainId && (
                                                <img
                                                    src={
                                                        tokenData.chainId === 'solana' ? 'https://i.imgur.com/xp7PYKk.png' :
                                                            tokenData.chainId === 'ethereum' ? 'https://i.imgur.com/NKQlhQj.png' :
                                                                tokenData.chainId === 'base' ? 'https://i.imgur.com/zn5hpMs.png' :
                                                                    tokenData.chainId === 'arbitrum' ? 'https://i.imgur.com/jmOXWlA.png' :
                                                                        ''
                                                    }
                                                    alt={tokenData.chainId}
                                                    className="w-4 h-4 sm:w-5 sm:h-5 rounded-full"
                                                />
                                            )}
                                        </div>
                                        <p className="text-[10px] sm:text-sm text-[var(--foreground-muted)] truncate hidden sm:block">{tokenData.baseToken.name}</p>
                                    </div>
                                    {/* Action buttons - no backdrop, positioned with token info */}
                                    <button
                                        onClick={() => {
                                            toggleFavorite(firebaseUser?.uid, {
                                                address: tokenData.baseToken.address,
                                                pairAddress: tokenData.pairAddress,
                                                chainId: tokenData.chainId,
                                                symbol: tokenData.baseToken.symbol,
                                                name: tokenData.baseToken.name,
                                                logo: tokenData.baseToken.logo,
                                            });
                                        }}
                                        className={clsx(
                                            'p-1.5 rounded-lg transition-all',
                                            isFavorited(tokenData.pairAddress)
                                                ? 'text-[var(--primary)]'
                                                : 'text-[var(--foreground-muted)] hover:text-[var(--primary)]'
                                        )}
                                        title={isFavorited(tokenData.pairAddress) ? 'Remove from favorites' : 'Add to favorites'}
                                    >
                                        <Star className="w-5 h-5" fill={isFavorited(tokenData.pairAddress) ? 'currentColor' : 'none'} />
                                    </button>
                                    <button
                                        onClick={() => setShowWatchlistModal(true)}
                                        className="p-1.5 rounded-lg text-[var(--foreground-muted)] hover:text-[var(--primary)] transition-all"
                                        title="Add to watchlist"
                                    >
                                        <ListPlus className="w-5 h-5" />
                                    </button>
                                    <button
                                        onClick={() => setShowAlertModal(true)}
                                        className="p-1.5 rounded-lg text-[var(--foreground-muted)] hover:text-[var(--primary)] transition-all"
                                        title="Set price alert"
                                    >
                                        <Bell className="w-5 h-5" />
                                    </button>
                                </>
                            )}
                        </div>

                        <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
                            <div className="text-right">
                                <p className="font-mono text-base sm:text-2xl font-medium tracking-tight">
                                    ${tokenData?.priceUsd ? formatWithSubscript(tokenData.priceUsd) : '0.00'}
                                </p>
                                <span className={clsx(
                                    'text-[10px] sm:text-sm font-medium flex items-center justify-end gap-0.5',
                                    (tokenData?.priceChange.h24 || 0) >= 0 ? 'text-[var(--accent-green)]' : 'text-[var(--accent-red)]'
                                )}>
                                    {(tokenData?.priceChange.h24 || 0) >= 0 ? '+' : ''}
                                    {(tokenData?.priceChange.h24 || 0).toFixed(2)}%
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Stats Bar - Horizontally scrollable on mobile */}
                    <div className="-mx-2 sm:-mx-6 px-2 sm:px-6 flex items-center gap-3 sm:gap-8 text-[10px] sm:text-sm border-t border-[var(--border)] pt-2 sm:pt-4 overflow-visible">
                        <div className="flex items-center gap-1 whitespace-nowrap flex-shrink-0">
                            <span className="text-[var(--foreground-muted)]">MCap</span>
                            <span className="tabular-nums">
                                ${coinData?.marketCap ? formatNumber(coinData.marketCap) : (tokenData?.fdv ? formatNumber(tokenData.fdv) : '-')}
                            </span>
                        </div>
                        <div className="flex items-center gap-1 whitespace-nowrap flex-shrink-0">
                            <span className="text-[var(--foreground-muted)]">Vol</span>
                            <span className="tabular-nums">
                                ${coinData?.volume24h ? formatNumber(coinData.volume24h) : (tokenData?.volume24h ? formatNumber(tokenData.volume24h) : '-')}
                            </span>
                        </div>
                        <div className="flex items-center gap-1 whitespace-nowrap flex-shrink-0">
                            <span className="text-[var(--foreground-muted)]">Liq</span>
                            <span className="tabular-nums">${tokenData ? formatNumber(tokenData.liquidity) : '-'}</span>
                        </div>
                        <div className="hidden sm:flex items-center gap-1 whitespace-nowrap flex-shrink-0">
                            <span className="text-[var(--foreground-muted)]">5m</span>
                            <span className={clsx(
                                'tabular-nums',
                                (tokenData?.priceChange.m5 || 0) >= 0 ? 'text-[var(--accent-green)]' : 'text-[var(--accent-red)]'
                            )}>
                                {(tokenData?.priceChange.m5 || 0) >= 0 ? '+' : ''}{(tokenData?.priceChange.m5 || 0).toFixed(2)}%
                            </span>
                        </div>
                        <div className="hidden sm:flex items-center gap-1 whitespace-nowrap flex-shrink-0">
                            <span className="text-[var(--foreground-muted)]">1h</span>
                            <span className={clsx(
                                'tabular-nums',
                                (tokenData?.priceChange.h1 || 0) >= 0 ? 'text-[var(--accent-green)]' : 'text-[var(--accent-red)]'
                            )}>
                                {(tokenData?.priceChange.h1 || 0) >= 0 ? '+' : ''}{(tokenData?.priceChange.h1 || 0).toFixed(2)}%
                            </span>
                        </div>
                        <div className="ml-auto flex gap-1 sm:gap-2 flex-shrink-0">
                            {/* Desktop Timeframes */}
                            <div className="hidden sm:flex gap-2 items-center">
                                {/* Timeframe Dropdown */}
                                <div className="relative">
                                    <button
                                        onClick={() => setShowTimeframeDropdown(!showTimeframeDropdown)}
                                        className="flex items-center gap-1 text-xs font-medium hover:text-[var(--primary)] transition-colors"
                                    >
                                        <span className="text-[var(--primary)] font-bold">{timeframe}</span>
                                        <ChevronDown className="w-3.5 h-3.5 text-[var(--foreground-muted)]" />
                                    </button>
                                    {showTimeframeDropdown && (
                                        <>
                                            <div className="fixed inset-0 z-40" onClick={() => setShowTimeframeDropdown(false)} />
                                            <div className="absolute right-0 top-full mt-1 w-20 bg-[var(--background-secondary)] border border-[var(--border)] rounded-lg shadow-xl z-50 overflow-hidden py-1">
                                                {timeframes.map((tf) => (
                                                    <button
                                                        key={tf}
                                                        onClick={() => {
                                                            handleTimeframeChange(tf);
                                                            setShowTimeframeDropdown(false);
                                                        }}
                                                        className={clsx(
                                                            "w-full text-center px-2 py-2 text-xs hover:bg-[var(--background-tertiary)] transition-colors",
                                                            timeframe === tf ? "text-[var(--primary)] font-bold bg-[var(--primary)]/5" : "text-[var(--foreground-muted)]"
                                                        )}
                                                    >
                                                        {tf}
                                                    </button>
                                                ))}
                                            </div>
                                        </>
                                    )}
                                </div>
                                {/* Price/MCap Toggle */}
                                <span className="text-[var(--foreground-muted)]">|</span>
                                <button
                                    onClick={() => setYAxisMode(yAxisMode === 'price' ? 'mcap' : 'price')}
                                    className="text-xs font-medium text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-all"
                                >
                                    <span className={yAxisMode === 'price' ? 'text-[var(--primary)]' : ''}>Price</span>
                                    <span className="text-[var(--foreground-muted)]">/</span>
                                    <span className={yAxisMode === 'mcap' ? 'text-[var(--primary)]' : ''}>MCap</span>
                                </button>
                                {/* Separator */}
                                <span className="text-[var(--foreground-muted)]/30">|</span>
                                {/* Indicators Dropdown */}
                                <div className="relative">
                                    <button
                                        onClick={() => setShowIndicatorMenu(!showIndicatorMenu)}
                                        className="flex items-center gap-1 text-xs font-medium hover:text-[var(--primary)] transition-colors"
                                        title="Technical Indicators"
                                    >
                                        <span className={activeIndicators.length > 0 ? 'text-[var(--primary)]' : 'text-[var(--foreground-muted)]'}>
                                            Indicators
                                        </span>
                                        {activeIndicators.length > 0 && (
                                            <span className="text-[10px] font-bold text-[var(--primary)]">({activeIndicators.length})</span>
                                        )}
                                        <ChevronDown className="w-3.5 h-3.5 text-[var(--foreground-muted)]" />
                                    </button>
                                    {showIndicatorMenu && (
                                        <>
                                            <div className="fixed inset-0 z-40" onClick={() => { setShowIndicatorMenu(false); setPendingIndicator(null); }} />
                                            <div className="absolute right-0 top-full mt-1 w-64 bg-[var(--background-secondary)] border border-[var(--border)] rounded-lg shadow-xl z-50 overflow-hidden">
                                                {/* Add Indicators */}
                                                <div className="px-3 py-2 text-[10px] font-semibold text-[var(--foreground-muted)] uppercase tracking-wider bg-[var(--background-tertiary)]">
                                                    Add Indicator
                                                </div>

                                                {/* MA with period input */}
                                                <div className="px-3 py-2 flex items-center gap-2">
                                                    <span
                                                        className="w-3 h-0.5 rounded-full flex-shrink-0"
                                                        style={{ backgroundColor: indicators.INDICATOR_TYPES.MA.color }}
                                                    />
                                                    <span className="text-xs font-medium">MA</span>
                                                    <input
                                                        type="number"
                                                        placeholder="20"
                                                        min={1}
                                                        max={500}
                                                        className="w-16 px-2 py-1 text-xs bg-[var(--background-tertiary)] border border-[var(--border)] rounded text-center"
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Enter') {
                                                                const value = parseInt((e.target as HTMLInputElement).value) || 20;
                                                                addIndicator('MA', value);
                                                                (e.target as HTMLInputElement).value = '';
                                                            }
                                                        }}
                                                    />
                                                    <button
                                                        onClick={() => addIndicator('MA', 20)}
                                                        className="text-[10px] text-[var(--primary)] hover:underline"
                                                    >
                                                        Add
                                                    </button>
                                                </div>

                                                {/* EMA with period input */}
                                                <div className="px-3 py-2 flex items-center gap-2">
                                                    <span
                                                        className="w-3 h-0.5 rounded-full flex-shrink-0"
                                                        style={{ backgroundColor: indicators.INDICATOR_TYPES.EMA.color }}
                                                    />
                                                    <span className="text-xs font-medium">EMA</span>
                                                    <input
                                                        type="number"
                                                        placeholder="12"
                                                        min={1}
                                                        max={500}
                                                        className="w-16 px-2 py-1 text-xs bg-[var(--background-tertiary)] border border-[var(--border)] rounded text-center"
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Enter') {
                                                                const value = parseInt((e.target as HTMLInputElement).value) || 12;
                                                                addIndicator('EMA', value);
                                                                (e.target as HTMLInputElement).value = '';
                                                            }
                                                        }}
                                                    />
                                                    <button
                                                        onClick={() => addIndicator('EMA', 12)}
                                                        className="text-[10px] text-[var(--primary)] hover:underline"
                                                    >
                                                        Add
                                                    </button>
                                                </div>

                                                {/* RSI - no period shown */}
                                                <button
                                                    onClick={() => addIndicator('RSI')}
                                                    className="w-full px-3 py-2 flex items-center gap-2 hover:bg-[var(--background-tertiary)] transition-colors"
                                                >
                                                    <span
                                                        className="w-3 h-0.5 rounded-full flex-shrink-0"
                                                        style={{ backgroundColor: indicators.INDICATOR_TYPES.RSI.color }}
                                                    />
                                                    <span className="text-xs font-medium">RSI</span>
                                                    <span className="text-[10px] text-[var(--foreground-muted)] ml-auto">Oscillator</span>
                                                </button>

                                                {/* VWAP */}
                                                <button
                                                    onClick={() => addIndicator('VWAP')}
                                                    className="w-full px-3 py-2 flex items-center gap-2 hover:bg-[var(--background-tertiary)] transition-colors"
                                                >
                                                    <span
                                                        className="w-3 h-0.5 rounded-full flex-shrink-0"
                                                        style={{ backgroundColor: indicators.INDICATOR_TYPES.VWAP.color }}
                                                    />
                                                    <span className="text-xs font-medium">VWAP</span>
                                                    <span className="text-[10px] text-[var(--foreground-muted)] ml-auto">Volume</span>
                                                </button>

                                                {/* Active Indicators */}
                                                {activeIndicators.length > 0 && (
                                                    <>
                                                        <div className="px-3 py-2 text-[10px] font-semibold text-[var(--foreground-muted)] uppercase tracking-wider bg-[var(--background-tertiary)] border-t border-[var(--border)]">
                                                            Active ({activeIndicators.length})
                                                        </div>
                                                        {activeIndicators.map(ind => (
                                                            <div
                                                                key={ind.id}
                                                                className="px-3 py-2 flex items-center gap-2 text-xs"
                                                            >
                                                                <span
                                                                    className="w-3 h-0.5 rounded-full flex-shrink-0"
                                                                    style={{ backgroundColor: ind.color }}
                                                                />
                                                                <span className="font-medium">
                                                                    {ind.type}{ind.period && ind.type !== 'RSI' && ind.type !== 'VWAP' ? ` ${ind.period}` : ''}
                                                                </span>
                                                                <button
                                                                    onClick={() => removeIndicator(ind.id)}
                                                                    className="ml-auto text-[var(--accent-red)] hover:text-[var(--accent-red)]/80 text-[10px]"
                                                                >
                                                                    Remove
                                                                </button>
                                                            </div>
                                                        ))}
                                                        <button
                                                            onClick={() => {
                                                                activeIndicators.forEach(ind => removeIndicator(ind.id));
                                                            }}
                                                            className="w-full text-left px-3 py-2 text-xs text-[var(--accent-red)] hover:bg-[var(--accent-red)]/10 transition-colors border-t border-[var(--border)]"
                                                        >
                                                            Clear All
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Mobile Timeframe + Price/MCap Dropdowns */}
                            <div className="flex gap-2 sm:hidden">
                                {/* Timeframe Dropdown */}
                                <div className="relative">
                                    <button
                                        onClick={() => setShowTimeframeDropdown(!showTimeframeDropdown)}
                                        className="flex items-center gap-1 bg-[var(--background-tertiary)] text-[var(--foreground)] text-[10px] font-medium rounded-lg px-2 py-1.5 border border-[var(--border)] transition-colors active:bg-[var(--background-secondary)]"
                                    >
                                        <span>{timeframe}</span>
                                        <ChevronDown className="w-3 h-3 text-[var(--foreground-muted)]" />
                                    </button>
                                    {showTimeframeDropdown && (
                                        <>
                                            <div className="fixed inset-0 z-40" onClick={() => setShowTimeframeDropdown(false)} />
                                            <div className="absolute right-0 top-full mt-1 w-16 bg-[var(--background-secondary)] border border-[var(--border)] rounded-lg shadow-xl z-50 overflow-hidden py-1">
                                                {timeframes.map((tf) => (
                                                    <button
                                                        key={tf}
                                                        onClick={() => {
                                                            handleTimeframeChange(tf);
                                                            setShowTimeframeDropdown(false);
                                                        }}
                                                        className={clsx(
                                                            "w-full text-center px-1 py-2 text-[10px] hover:bg-[var(--background-tertiary)] transition-colors",
                                                            timeframe === tf ? "text-[var(--primary)] font-bold bg-[var(--primary)]/5" : "text-[var(--foreground-muted)]"
                                                        )}
                                                    >
                                                        {tf}
                                                    </button>
                                                ))}
                                            </div>
                                        </>
                                    )}
                                </div>
                                <button
                                    onClick={() => setYAxisMode(yAxisMode === 'price' ? 'mcap' : 'price')}
                                    className="flex items-center gap-1 bg-[var(--background-tertiary)] text-[10px] font-medium rounded-lg px-2 py-1.5 border border-[var(--border)] transition-colors active:bg-[var(--background-secondary)]"
                                >
                                    <span className={yAxisMode === 'price' ? 'text-[var(--primary)]' : 'text-[var(--foreground-muted)]'}>$</span>
                                    <span className="text-[var(--foreground-muted)]">/</span>
                                    <span className={yAxisMode === 'mcap' ? 'text-[var(--primary)]' : 'text-[var(--foreground-muted)]'}>MC</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Chart Area - Fixed height on mobile, flexible on desktop */}
                <div className="relative bg-[var(--background)] h-[280px] lg:h-[400px] lg:flex-1 lg:min-h-[400px] border-b border-[var(--border)] flex-shrink-0">
                    {/* TradingView-style Chart Info Overlay */}
                    <div className="absolute top-2 left-2 sm:left-3 z-10 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 text-[10px] sm:text-xs pointer-events-none">
                        <div className="flex items-center gap-1 sm:gap-2">
                            {tokenData?.baseToken?.logo && (
                                <img src={tokenData.baseToken.logo} alt="" className="w-4 h-4 sm:w-5 sm:h-5 rounded-full" />
                            )}
                            <span className="font-semibold text-xs sm:text-sm text-[var(--foreground)]">
                                {tokenData?.baseToken?.symbol || 'BTC'}/{tokenData?.quoteToken?.symbol || 'USD'}
                            </span>
                            <span className="text-[var(--foreground-muted)]">
                                {tokenData?.dexId && tokenData.dexId !== 'coingecko' ? `${tokenData.dexId}` : ''}
                            </span>
                        </div>
                        {currentOHLC && (
                            <div className="flex items-center gap-1 sm:gap-2 font-mono text-[9px] sm:text-xs">
                                <span className="text-[var(--foreground-muted)]">O</span>
                                <span className="text-[var(--foreground)]">{formatPrice(currentOHLC.open)}</span>
                                <span className="text-[var(--foreground-muted)]">H</span>
                                <span className="text-[var(--foreground)]">{formatPrice(currentOHLC.high)}</span>
                                <span className="text-[var(--foreground-muted)]">L</span>
                                <span className="text-[var(--foreground)]">{formatPrice(currentOHLC.low)}</span>
                                <span className="text-[var(--foreground-muted)]">C</span>
                                <span className="text-[var(--foreground)]">{formatPrice(currentOHLC.close)}</span>
                                <span className={currentOHLC.change >= 0 ? 'text-[var(--accent-green)]' : 'text-[var(--accent-red)]'}>
                                    ({currentOHLC.change >= 0 ? '+' : ''}{currentOHLC.change.toFixed(2)}%)
                                </span>
                                {currentOHLC.volume !== undefined && (
                                    <>
                                        <span className="text-[var(--foreground-muted)]">V</span>
                                        <span className="text-[var(--foreground)]">{formatNumber(currentOHLC.volume)}</span>
                                    </>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Chart Unavailable Overlay */}
                    {chartUnavailable && !currentOHLC && !isChartLoading && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-[var(--background)]/90 z-20">
                            <BarChart3 className="w-12 h-12 text-[var(--foreground-muted)] mb-4" />
                            <p className="text-lg font-semibold text-[var(--foreground)] mb-2">Chart Data Not Available</p>
                            <p className="text-sm text-[var(--foreground-muted)] text-center max-w-[300px] mb-4">
                                OHLC chart data is not available for this token from our data sources.
                            </p>
                            <button
                                onClick={() => setRetryTrigger(c => c + 1)}
                                className="flex items-center gap-2 px-4 py-2 bg-[var(--primary)] text-black font-bold rounded-lg hover:bg-[var(--primary)]/90 transition-colors"
                            >
                                <RefreshCw className="w-4 h-4" />
                                Retry Loading
                            </button>
                        </div>
                    )}

                    {/* Chart Loading Spinner */}
                    {isChartLoading && (
                        <div className="absolute inset-0 z-30 flex items-center justify-center bg-[var(--background)]/50 backdrop-blur-sm">
                            <LoadingSpinner size="lg" />
                        </div>
                    )}

                    {/* Timeframe Loading Indicator - subtle, doesn't block chart */}
                    {isTimeframeLoading && !isChartLoading && (
                        <div className="absolute top-2 right-2 z-20 flex items-center gap-2 bg-[var(--background-secondary)]/90 px-3 py-1.5 rounded-lg border border-[var(--border)]">
                            <LoadingSpinner size="sm" />
                            <span className="text-xs text-[var(--foreground-muted)]">Loading {timeframe}...</span>
                        </div>
                    )}

                    <div ref={chartContainerRef} className="absolute inset-0" />
                </div>

                {/* Trades/Orders/Positions Panel */}
                <TradingPanel tokenData={tokenData} />
            </div>

            {/* Right sidebar - Swap (Desktop Only) */}
            <aside className="hidden lg:flex lg:w-[320px] xl:w-[380px] bg-[var(--background-secondary)] p-4 xl:p-6 flex-col relative overflow-hidden border-l border-[var(--border)] flex-shrink-0">
                {/* Background glow effects */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--primary)]/5 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-[var(--accent-yellow)]/5 rounded-full blur-3xl pointer-events-none" />

                <SwapPanel token={tokenData} />
            </aside>

            {/* Alert Modal */}
            {tokenData && (
                <AlertModal
                    isOpen={showAlertModal}
                    onClose={() => setShowAlertModal(false)}
                    tokenData={{
                        address: tokenData.baseToken.address,
                        pairAddress: tokenData.pairAddress,
                        chainId: tokenData.chainId,
                        symbol: tokenData.baseToken.symbol,
                        name: tokenData.baseToken.name,
                        logo: tokenData.baseToken.logo,
                        currentPrice: tokenData.priceUsd,
                    }}
                />
            )}

            {tokenData && (
                <AddToWatchlistModal
                    isOpen={showWatchlistModal}
                    onClose={() => setShowWatchlistModal(false)}
                    token={{
                        address: tokenData.baseToken.address,
                        pairAddress: tokenData.pairAddress,
                        chainId: tokenData.chainId,
                        symbol: tokenData.baseToken.symbol,
                        name: tokenData.baseToken.name,
                        logo: tokenData.baseToken.logo,
                    }}
                />
            )}
        </div >
    );
}

const TradingPanel = React.memo(function TradingPanel({ tokenData }: { tokenData: TokenPair | null }) {
    const [activeTab, setActiveTab] = useState<'trades' | 'orders' | 'positions' | 'swap'>('trades');

    const tabs = [
        { id: 'trades' as const, label: 'Activity', icon: Activity },
        { id: 'swap' as const, label: 'Swap', icon: RefreshCw, mobileOnly: true },
        { id: 'orders' as const, label: 'Orders', icon: ArrowUpDown },
        { id: 'positions' as const, label: 'Positions', icon: Wallet },
    ];

    return (
        <div className="flex-1 min-h-0 flex flex-col bg-[var(--background-secondary)] overflow-hidden">
            {/* Tab Header */}
            <div className="flex-shrink-0 px-2 sm:px-4 py-0 border-b border-[var(--border)] flex items-center gap-1 sm:gap-4 bg-[var(--background-secondary)] overflow-x-auto scrollbar-thin scrollbar-none">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={clsx(
                            'flex items-center gap-1.5 text-[10px] sm:text-xs font-medium py-2 sm:py-3 px-3 border-b-2 transition-all whitespace-nowrap flex-shrink-0',
                            tab.mobileOnly && 'lg:hidden',
                            activeTab === tab.id
                                ? 'border-[var(--primary)] text-[var(--primary)] bg-transparent'
                                : 'border-transparent text-[var(--foreground-muted)] hover:text-[var(--foreground)]'
                        )}
                    >
                        <tab.icon className="w-3.5 h-3.5" />
                        <span>{tab.label}</span>
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-hidden flex flex-col relative">
                {activeTab === 'trades' && tokenData && (
                    <RecentTradesFeed chainId={tokenData.chainId} tokenData={tokenData} />
                )}
                {activeTab === 'swap' && (
                    <div className="lg:hidden fixed inset-0 top-0 bottom-[64px] z-[40] bg-[var(--background)] flex flex-col overflow-hidden">
                        <div className="flex-1 p-3 pb-4 overflow-hidden">
                            <SwapPanel token={tokenData} onBack={() => setActiveTab('trades')} />
                        </div>
                    </div>
                )}
                {activeTab === 'orders' && (
                    <div className="h-full flex flex-col items-center justify-start text-[var(--foreground-muted)] gap-2 p-6 pt-8 overflow-y-auto overscroll-contain">
                        <ArrowUpDown className="w-8 h-8 opacity-50" />
                        <p className="text-sm font-medium">No Open Orders</p>
                        <p className="text-xs text-center">Your limit orders will appear here once placed.</p>
                    </div>
                )}
                {activeTab === 'positions' && (
                    <div className="h-full flex flex-col items-center justify-start text-[var(--foreground-muted)] gap-2 p-6 pt-8 overflow-y-auto overscroll-contain">
                        <BarChart3 className="w-8 h-8 opacity-50" />
                        <p className="text-sm font-medium">No Open Positions</p>
                        <p className="text-xs text-center">Connect wallet and trade to see your positions here.</p>
                    </div>
                )}
            </div>
        </div>
    );
});

// Helper for formatting price in chart overlay (handles both small prices and large market caps)
// Helper for formatting price in chart overlay (handles both small prices and large market caps)
function formatPrice(price: number) {
    if (price >= 1e9) return '$' + (price / 1e9).toFixed(2) + 'B';
    if (price >= 1e6) return '$' + (price / 1e6).toFixed(2) + 'M';
    if (price >= 1e3) return '$' + (price / 1e3).toFixed(2) + 'K';
    if (price < 0.0001) return '$' + formatWithSubscript(price);
    if (price < 1) return '$' + price.toFixed(6);
    return '$' + price.toFixed(2);
}

const RecentTradesFeed = React.memo(function RecentTradesFeed({ chainId, tokenData }: { chainId: ChainId; tokenData?: TokenPair | null }) {
    const [trades, setTrades] = useState<geckoterminal.PoolTrade[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [maxTradeSize, setMaxTradeSize] = useState(0);

    useEffect(() => {
        if (!tokenData?.pairAddress || !tokenData?.chainId) {
            setIsLoading(false);
            return;
        }

        const loadTrades = async () => {
            const data = await geckoterminal.getPoolTrades(tokenData.chainId, tokenData.pairAddress, 100);
            setTrades(prev => {
                // Keep track of new trades for animation
                const prevHashes = new Set(prev.map(t => t.txHash));
                return data.map(t => ({
                    ...t,
                    isNew: !prevHashes.has(t.txHash) && prev.length > 0
                }));
            });

            // Calculate max trade size for bar scaling
            const max = Math.max(...data.map(t => t.totalUsd), 1);
            setMaxTradeSize(max);
            setIsLoading(false);
        };

        loadTrades();
        const interval = setInterval(loadTrades, 2000); // Refresh every 2s
        return () => clearInterval(interval);
    }, [tokenData?.pairAddress, tokenData?.chainId]);

    return (
        <div
            className="overflow-y-auto overflow-x-hidden w-full h-full text-[11px] overscroll-contain"
            style={{ WebkitOverflowScrolling: 'touch', willChange: 'scroll-position' }}
        >
            {/* Header row */}
            <div className="grid grid-cols-6 gap-2 px-4 py-2 text-[10px] text-[var(--foreground-muted)] font-medium border-b border-[var(--border)] bg-[#0a0a0a] sticky top-0 z-20 items-center min-w-0">
                <span className="text-left">Time</span>
                <span className="text-left pl-2">Type</span>
                <span className="text-center">USD Value</span>
                <span className="text-center">{tokenData?.quoteToken?.symbol || 'Quote'}</span>
                <span className="text-right">Amount <span className="hidden sm:inline">{tokenData?.baseToken?.symbol ? `(${tokenData.baseToken.symbol})` : ''}</span></span>
                <span className="text-right">Maker</span>
            </div>

            {isLoading ? (
                <div className="flex-1 flex flex-col items-center justify-center text-[var(--foreground-muted)] gap-2 py-12">
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    <span className="text-xs">Loading live trades...</span>
                </div>
            ) : trades.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-[var(--foreground-muted)] gap-2 py-12">
                    <Activity className="w-5 h-5 opacity-50" />
                    <span className="text-xs">No recent trades found</span>
                </div>
            ) : (
                /* Trade rows */
                trades.map((trade, i) => {
                    const isBuy = trade.type === 'buy';
                    /* Use Log scale to dampen huge outliers, then normalize against max */
                    const normalizedSize = Math.log(trade.totalUsd + 1) / Math.log(maxTradeSize + 1);
                    const barWidth = Math.min(normalizedSize * 50, 50); // Capped at 50% width
                    const isNew = (trade as any).isNew;

                    return (
                        <div
                            key={`${i}-${trade.txHash}`}
                            className={clsx(
                                'relative grid grid-cols-6 gap-2 px-4 py-1.5 border-b border-[var(--border)]/20 items-center hover:bg-[var(--background-secondary)]/50 transition-colors',
                                isNew && 'animate-pulse'
                            )}
                        >
                            {/* Background size bar */}
                            <div
                                className={clsx(
                                    'absolute inset-y-0 left-0 transition-all duration-500',
                                    isBuy
                                        ? 'bg-gradient-to-r from-[var(--accent-green)]/15 to-transparent'
                                        : 'bg-gradient-to-r from-[var(--accent-red)]/15 to-transparent'
                                )}
                                style={{
                                    width: `${barWidth}%`,
                                    opacity: 0.6 + (normalizedSize * 0.4)
                                }}
                            />

                            {/* Time */}
                            <span className="relative z-10 text-[var(--foreground-muted)] tabular-nums text-left">
                                {(() => {
                                    const seconds = Math.floor((Date.now() - trade.timestamp) / 1000);
                                    if (seconds < 60) return `${seconds}s`;
                                    const minutes = Math.floor(seconds / 60);
                                    if (minutes < 60) return `${minutes}m`;
                                    const hours = Math.floor(minutes / 60);
                                    return `${hours}h`;
                                })()}
                            </span>

                            {/* Type */}
                            <span className={clsx(
                                'relative z-10 font-bold uppercase text-[10px] text-left pl-2',
                                isBuy ? 'text-[var(--accent-green)]' : 'text-[var(--accent-red)]'
                            )}>
                                {trade.type}
                            </span>

                            {/* USD Value */}
                            <span className={clsx(
                                'relative z-10 text-center font-semibold tabular-nums',
                                isBuy ? 'text-[var(--accent-green)]' : 'text-[var(--accent-red)]'
                            )}>
                                ${trade.totalUsd >= 1000
                                    ? (trade.totalUsd / 1000).toFixed(2) + 'K'
                                    : trade.totalUsd.toFixed(2)}
                            </span>

                            {/* Quote Value (NEW) */}
                            <span className="relative z-10 text-center text-[var(--foreground-muted)] tabular-nums">
                                {trade.amountQuote >= 1000
                                    ? (trade.amountQuote / 1000).toFixed(1) + 'K'
                                    : trade.amountQuote.toFixed(trade.amountQuote < 1 ? 4 : 2)}
                            </span>

                            {/* Token amount */}
                            <span className="relative z-10 text-right text-[var(--foreground)] tabular-nums whitespace-nowrap">
                                {formatNumber(trade.amountBase)}
                            </span>

                            {/* Maker address */}
                            <Link
                                href={`/app/explorer/detail/?type=address&id=${trade.maker}&chain=${tokenData?.chainId || 'ethereum'}`}
                                className="relative z-10 text-right text-[var(--foreground-muted)] tabular-nums text-[10px] hover:text-[var(--primary)] transition-colors truncate max-w-[70px]"
                            >
                                {trade.maker.slice(0, 4)}...{trade.maker.slice(-3)}
                            </Link>
                        </div>
                    );
                })
            )}
        </div>
    );
});

const SwapPanel = React.memo(function SwapPanel({ token, onBack }: { token: TokenPair | null; onBack?: () => void }) {
    // Use wallet store
    const { activeWallet, isUnlocked, balances, activeChain, openModal } = useWalletStore();
    const { defaultSlippage } = usePreferences();

    const isConnected = isUnlocked && !!activeWallet;
    const currentBalance = activeWallet ? balances[`${activeWallet.address}-${activeChain}`] || '0' : '0';

    const [payAmount, setPayAmount] = useState('');
    const [receiveAmount, setReceiveAmount] = useState('');
    const [slippage, setSlippage] = useState(typeof defaultSlippage === 'number' ? defaultSlippage : 0.5);

    // 0x State
    const [quote, setQuote] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [timer, setTimer] = useState<NodeJS.Timeout | null>(null);

    useEffect(() => {
        if (typeof defaultSlippage === 'number') {
            setSlippage(defaultSlippage);
        }
    }, [defaultSlippage]);

    const nativeToken = token ? getChain(token.chainId) : getChain('ethereum');

    // Fetch Quote logic
    const fetchQuote = async (amount: string, sellToken: string, buyToken: string) => {
        if (!amount || parseFloat(amount) <= 0 || !token) return;

        setIsLoading(true);
        try {
            const { getPrice, getZeroExChainId } = await import('@/lib/services/zeroEx');

            if (token.chainId === 'solana') {
                setIsLoading(false);
                return;
            }

            const numericChainId = getZeroExChainId(token.chainId);

            if (!numericChainId) {
                setIsLoading(false);
                return;
            }

            // Convert to Wei (assuming 18 for input token - usually ETH)
            const amountInWei = (parseFloat(amount) * 1e18).toString();

            // Use Pair Data
            // Native ETH address for 0x is usually '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee'
            const sellTokenAddr = '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee';
            const buyTokenAddr = token.baseToken.address;

            const data = await getPrice({
                chainId: numericChainId,
                sellToken: sellTokenAddr,
                buyToken: buyTokenAddr,
                sellAmount: amountInWei,
            });

            if (data) {
                setQuote(data);
                if (data.buyAmount) {
                    // Use decimals from token data if available, else 18
                    const decimals = token.baseToken.decimals || 18;
                    setReceiveAmount((parseFloat(data.buyAmount) / Math.pow(10, decimals)).toFixed(6));
                }
            }
        } catch (err) {
            console.error('Swap quote error:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleAmountChange = (val: string) => {
        setPayAmount(val);
        if (timer) clearTimeout(timer);
        const newTimer = setTimeout(() => {
            fetchQuote(val, nativeToken.symbol, token?.baseToken.symbol || '');
        }, 600);
        setTimer(newTimer);
    };

    const handleSwap = () => {
        if (!isConnected) {
            openModal();
            return;
        }
        alert(`Swap execution integration coming next step via 0x API!`);
    };

    return (
        <div className="flex flex-col h-full relative z-10 w-full lg:w-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-3 sm:mb-6">
                {onBack ? (
                    <button
                        onClick={onBack}
                        className="p-1.5 -ml-1.5 hover:bg-[var(--background-tertiary)] rounded-lg transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                ) : (
                    <div className="lg:hidden" />
                )}
                <div className="text-right lg:text-left">
                    <h3 className="font-bold text-sm sm:text-2xl">Swap v2</h3>
                    <p className="text-[10px] sm:text-xs text-[var(--foreground-muted)]">
                        via <span className="text-[var(--primary)]">0x Protocol</span>
                    </p>
                </div>
            </div>

            <div className="space-y-2 sm:space-y-4">
                {/* Pay Input */}
                <div className="p-2.5 sm:p-4 rounded-xl sm:rounded-2xl bg-[var(--background-tertiary)] border border-[var(--border)] group transition-colors shadow-lg">
                    <div className="flex justify-between mb-2">
                        <label className="text-[11px] text-[var(--foreground-muted)] opacity-60 font-normal">You pay</label>
                        <span className="text-xs text-[var(--foreground-muted)]">
                            Balance: {isConnected && currentBalance
                                ? parseFloat(currentBalance).toFixed(4) + ' ' + nativeToken.symbol
                                : '---'}
                        </span>
                    </div>
                    <div className="flex items-center justify-between">
                        <input
                            type="number"
                            placeholder="0.00"
                            value={payAmount}
                            onChange={(e) => handleAmountChange(e.target.value)}
                            className="bg-transparent text-xl sm:text-3xl font-mono font-bold outline-none w-full placeholder:text-[var(--foreground-muted)]/30 text-[var(--foreground)]"
                        />
                        <button className="flex items-center gap-2 bg-[var(--background)] px-3 py-1.5 rounded-xl border border-[var(--border)]">
                            <img src={nativeToken.logo} alt={nativeToken.symbol} className="w-6 h-6 rounded-full" />
                            <span className="font-bold text-sm">{nativeToken.symbol}</span>
                            <ChevronDown className="w-4 h-4 text-[var(--foreground-muted)]" />
                        </button>
                    </div>
                    {isConnected && currentBalance && parseFloat(currentBalance) > 0 && (
                        <button
                            className="text-xs text-[var(--primary)] mt-2 hover:underline"
                            onClick={() => handleAmountChange(currentBalance)}
                        >
                            Max
                        </button>
                    )}
                </div>

                {/* Switch Button */}
                <div className="flex justify-center -my-2 sm:-my-4 relative z-10">
                    <button className="p-2 sm:p-3 rounded-xl bg-[var(--background)] border border-[var(--border)] text-[var(--foreground-muted)] shadow-md hover:text-[var(--primary)] transition-colors">
                        <ArrowUpDown className="w-5 h-5" />
                    </button>
                </div>

                {/* Receive Input */}
                <div className="p-2.5 sm:p-4 rounded-xl sm:rounded-2xl bg-[var(--background-tertiary)] border border-[var(--border)] transition-colors shadow-lg">
                    <div className="flex justify-between mb-2">
                        <label className="text-[11px] text-[var(--foreground-muted)] opacity-60 font-normal">You receive</label>
                        <span className="text-xs text-[var(--foreground-muted)]">
                            {isLoading && <RefreshCw className="w-3 h-3 animate-spin inline ml-1" />}
                        </span>
                    </div>
                    <div className="flex items-center justify-between">
                        <input
                            type="text"
                            placeholder="0.00"
                            value={receiveAmount}
                            className="bg-transparent text-xl sm:text-3xl font-mono font-bold outline-none w-full placeholder:text-[var(--foreground-muted)]/30 text-[var(--foreground)]"
                            readOnly
                        />
                        <button className="flex items-center gap-2 bg-[var(--background)] px-3 py-1.5 rounded-xl border border-[var(--border)]">
                            {token?.baseToken.logo ? (
                                <img src={token.baseToken.logo} className="w-6 h-6 rounded-full" />
                            ) : (
                                <div className="w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-500">
                                    <span className="text-xs font-bold">?</span>
                                </div>
                            )}
                            <span className="font-bold text-sm">{token?.baseToken.symbol || 'SELECT'}</span>
                            <ChevronDown className="w-4 h-4 text-[var(--foreground-muted)]" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Price Info */}
            {(payAmount || quote) && (
                <div className="mt-3 sm:mt-6 mb-2 sm:mb-4 p-2.5 sm:p-4 rounded-lg sm:rounded-xl bg-[var(--background-tertiary)]/50 border border-[var(--border)] space-y-1.5 sm:space-y-3">
                    <div className="flex justify-between text-sm">
                        <span className="text-[var(--foreground-muted)]">Rate</span>
                        <span className="font-mono text-xs">
                            {quote ? `1 ${nativeToken.symbol} ≈ ${parseFloat(quote.price).toFixed(6)} ${token?.baseToken.symbol}` : '---'}
                        </span>
                    </div>
                    {quote && (
                        <>
                            <div className="flex justify-between text-sm">
                                <span className="text-[var(--foreground-muted)]">Estimated Gas</span>
                                <span className="text-xs font-medium">${quote.estimatedGas ? (parseFloat(quote.estimatedGas) * 0.000000001 * 2000 * 0.003).toFixed(2) : '~'}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-[var(--foreground-muted)]">Price Impact</span>
                                <span className={clsx(
                                    "text-xs",
                                    parseFloat(quote.estimatedPriceImpact || '0') > 2 ? 'text-red-500' : 'text-green-500'
                                )}>
                                    {quote.estimatedPriceImpact ? parseFloat(quote.estimatedPriceImpact).toFixed(2) : '< 0.01'}%
                                </span>
                            </div>
                        </>
                    )}
                    <div className="flex justify-between text-sm">
                        <span className="text-[var(--foreground-muted)]">Slippage</span>
                        <span className="text-xs font-medium">{slippage}%</span>
                    </div>
                </div>
            )}

            <button
                onClick={handleSwap}
                disabled={!payAmount || parseFloat(payAmount) <= 0}
                className={clsx(
                    'mt-auto w-full py-2.5 sm:py-4 text-sm sm:text-lg font-bold rounded-xl transition-all',
                    payAmount && parseFloat(payAmount) > 0
                        ? 'bg-[var(--primary)] text-black shadow-[0_4px_20px_var(--primary-glow)] hover:shadow-[0_6px_30px_var(--primary-glow)] hover:-translate-y-0.5'
                        : 'bg-[var(--background-tertiary)] text-[var(--foreground-muted)] cursor-not-allowed border border-[var(--border)]'
                )}
            >
                {payAmount && parseFloat(payAmount) > 0 ? 'Swap' : 'Enter Amount'}
            </button>
        </div>
    );
});

function formatNumber(num: number | undefined): string {
    if (num === undefined || num === null || isNaN(num)) return '0';
    if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B';
    if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M';
    if (num >= 1e3) return (num / 1e3).toFixed(2) + 'K';
    return num.toFixed(2);
}

