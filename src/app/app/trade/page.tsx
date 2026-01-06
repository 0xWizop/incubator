'use client';

import React, { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useTradingStore, useAppStore, useWalletStore } from '@/store';
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
    ArrowLeft
} from 'lucide-react';
import { clsx } from 'clsx';
import { formatDistanceToNow } from 'date-fns';

// Wrapper component to handle Suspense boundary for useSearchParams
export default function TradePage() {
    return (
        <Suspense fallback={<TradePageSkeleton />}>
            <TradePageContent />
        </Suspense>
    );
}

function TradePageSkeleton() {
    return (
        <div className="h-full flex items-center justify-center bg-[var(--background)]">
            <div className="text-center">
                <div className="w-8 h-8 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-[var(--foreground-muted)]">Loading trade...</p>
            </div>
        </div>
    );
}

function TradePageContent() {
    const searchParams = useSearchParams();
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
    const [currentOHLC, setCurrentOHLC] = useState<{ open: number; high: number; low: number; close: number; change: number } | null>(null);
    const [chartUnavailable, setChartUnavailable] = useState(false);

    // URL params for deep linking
    const chainParam = searchParams.get('chain') as ChainId;
    const pairParam = searchParams.get('pair');

    useEffect(() => {
        loadPairData();
        // Refresh price data every 10 seconds for live prices
        const priceInterval = setInterval(loadPairData, 10000);
        return () => clearInterval(priceInterval);
    }, [chainParam, pairParam]);

    async function loadPairData() {
        setLoading(true);
        try {
            if (chainParam && pairParam) {
                const pair = await dexscreener.getPairByAddress(chainParam, pairParam);
                if (pair) setTokenData(pair);
            } else {
                // Default to Fartcoin on Solana - fetch from DexScreener
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
            setLoading(false);
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
                vertLines: { color: 'rgba(255, 255, 255, 0.02)' },
                horzLines: { color: 'rgba(255, 255, 255, 0.02)' },
            },
            crosshair: {
                mode: 1,
                vertLine: {
                    color: '#b8e600',
                    width: 1,
                    style: 2,
                },
                horzLine: {
                    color: '#b8e600',
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
            },
            timeScale: {
                borderColor: 'rgba(255, 255, 255, 0.05)',
                timeVisible: true,
            },
        });

        const candlestickSeries = chart.addCandlestickSeries({
            upColor: '#00e676',
            downColor: '#ff4444',
            borderUpColor: '#00e676',
            borderDownColor: '#ff4444',
            wickUpColor: '#00e676',
            wickDownColor: '#ff4444',
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
                if (data && data.open !== undefined) {
                    const change = ((data.close - data.open) / data.open) * 100;
                    setCurrentOHLC({
                        open: data.open,
                        high: data.high,
                        low: data.low,
                        close: data.close,
                        change: change,
                    });
                }
            }
        });

        const handleResize = () => {
            if (chartContainerRef.current) {
                chart.applyOptions({
                    width: chartContainerRef.current.clientWidth,
                    height: chartContainerRef.current.clientHeight,
                });
            }
        };

        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
            chart.remove();
            chartRef.current = null;
            candlestickSeriesRef.current = null;
            volumeSeriesRef.current = null;
        };
    }, []); // Only run once

    // Fetch and update chart data (separate effect to prevent chart recreation)
    useEffect(() => {
        if (!tokenData || !candlestickSeriesRef.current || !volumeSeriesRef.current) return;

        const candlestickSeries = candlestickSeriesRef.current;
        const volumeSeries = volumeSeriesRef.current;
        const chart = chartRef.current;

        setChartUnavailable(false);

        const fetchChartData = async () => {
            // 1. Try GeckoTerminal first for DEX pool data
            if (tokenData.pairAddress && tokenData.chainId && tokenData.dexId !== 'coingecko') {
                const ohlcvData = await geckoterminal.getPoolOHLCV(
                    tokenData.chainId,
                    tokenData.pairAddress,
                    timeframe,
                    500
                );

                if (ohlcvData.length > 0) {
                    const chartData = geckoterminal.toChartData(ohlcvData).sort((a: any, b: any) => a.time - b.time);
                    const volumeData = geckoterminal.toVolumeData(ohlcvData).sort((a: any, b: any) => a.time - b.time);
                    candlestickSeries.setData(chartData);
                    volumeSeries.setData(volumeData);

                    if (chartData.length > 0) {
                        const lastCandle = chartData[chartData.length - 1];
                        if (lastCandle) {
                            const change = ((lastCandle.close - lastCandle.open) / lastCandle.open) * 100;
                            setCurrentOHLC({ open: lastCandle.open, high: lastCandle.high, low: lastCandle.low, close: lastCandle.close, change });
                        }

                        // Only reset view if pair or timeframe changed
                        const contextKey = `${tokenData.pairAddress}-${timeframe}`;
                        const shouldFit = lastContextRef.current?.pair !== tokenData.pairAddress || lastContextRef.current?.timeframe !== timeframe;

                        if (shouldFit) {
                            chart?.timeScale().fitContent();
                            lastContextRef.current = { pair: tokenData.pairAddress, timeframe };
                        }
                        console.log('Chart data loaded from GeckoTerminal');
                        return;
                    }
                }
            }

            // 2. Try Binance for major tokens
            const binanceSymbol = binance.getBinanceSymbol(tokenData.baseToken.symbol);
            if (binanceSymbol) {
                const klineData = await binance.getTokenKlines(tokenData.baseToken.symbol, timeframe, 500);
                if (klineData.length > 0) {
                    const chartData = binance.toChartData(klineData).sort((a: any, b: any) => a.time - b.time);
                    const volumeData = binance.toVolumeData(klineData).sort((a: any, b: any) => a.time - b.time);
                    candlestickSeries.setData(chartData);
                    volumeSeries.setData(volumeData);

                    if (chartData.length > 0) {
                        const lastCandle = chartData[chartData.length - 1];
                        if (lastCandle) {
                            const change = ((lastCandle.close - lastCandle.open) / lastCandle.open) * 100;
                            setCurrentOHLC({ open: lastCandle.open, high: lastCandle.high, low: lastCandle.low, close: lastCandle.close, change });
                        }

                        const contextKey = `${tokenData.baseToken.symbol}-${timeframe}`;
                        const shouldFit = lastContextRef.current?.pair !== tokenData.baseToken.symbol || lastContextRef.current?.timeframe !== timeframe;

                        if (shouldFit) {
                            chart?.timeScale().fitContent();
                            lastContextRef.current = { pair: tokenData.baseToken.symbol, timeframe };
                        }
                        console.log('Chart data loaded from Binance');
                        return;
                    }
                }
            }

            // 3. Fallback to CoinGecko
            const coinId = coingecko.getCoinGeckoId(tokenData.baseToken.symbol);
            if (coinId) {
                const daysMap: Record<string, string | number> = {
                    '1M': 30, '5M': 90, '15M': 180, '1H': 365, '4H': 'max', '1D': 'max'
                };
                const days = daysMap[timeframe] || 'max';
                const marketData = await coingecko.getCoinData(coinId);
                if (marketData) setCoinData(marketData);

                const ohlcData = await coingecko.getOHLC(coinId, days);
                if (ohlcData.length > 0) {
                    const chartData = coingecko.toChartData(ohlcData).sort((a: any, b: any) => a.time - b.time);
                    candlestickSeries.setData(chartData);

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

                    const contextKey = `${tokenData.baseToken.symbol}-${timeframe}`;
                    const shouldFit = lastContextRef.current?.pair !== tokenData.baseToken.symbol || lastContextRef.current?.timeframe !== timeframe;

                    if (shouldFit) {
                        chart?.timeScale().fitContent();
                        lastContextRef.current = { pair: tokenData.baseToken.symbol, timeframe };
                    }
                    console.log('Chart data loaded from CoinGecko');
                    return;
                }
            }

            // No data available
            setChartUnavailable(true);
            console.log('No chart data available for this token');
        };

        fetchChartData();
    }, [tokenData, timeframe]);

    const timeframes = ['1M', '5M', '15M', '1H', '4H', '1D'];

    return (
        <div className="min-h-full lg:h-full flex flex-col lg:flex-row bg-[var(--background)]">
            {/* Main content - Chart & Data */}
            <div className="flex-1 flex flex-col min-w-0 lg:border-r border-[var(--border)]">
                {/* Header */}
                <div className="px-2 sm:px-6 py-2 sm:py-4 border-b border-[var(--border)] bg-[var(--background-secondary)]">
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
                                </>
                            )}
                        </div>

                        <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
                            <div className="text-right">
                                <p className="font-mono text-base sm:text-2xl font-bold tracking-tight">
                                    ${tokenData?.priceUsd?.toFixed(tokenData?.priceUsd < 0.01 ? 6 : 4) || '0.00'}
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
                    <div className="flex items-center gap-3 sm:gap-8 text-[10px] sm:text-sm border-t border-[var(--border)] pt-2 sm:pt-4 overflow-x-auto scrollbar-thin">
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
                        <div className="flex items-center gap-1 whitespace-nowrap flex-shrink-0">
                            <span className="text-[var(--foreground-muted)]">5m</span>
                            <span className={clsx(
                                'tabular-nums',
                                (tokenData?.priceChange.m5 || 0) >= 0 ? 'text-[var(--accent-green)]' : 'text-[var(--accent-red)]'
                            )}>
                                {(tokenData?.priceChange.m5 || 0) >= 0 ? '+' : ''}{(tokenData?.priceChange.m5 || 0).toFixed(2)}%
                            </span>
                        </div>
                        <div className="flex items-center gap-1 whitespace-nowrap flex-shrink-0">
                            <span className="text-[var(--foreground-muted)]">1h</span>
                            <span className={clsx(
                                'tabular-nums',
                                (tokenData?.priceChange.h1 || 0) >= 0 ? 'text-[var(--accent-green)]' : 'text-[var(--accent-red)]'
                            )}>
                                {(tokenData?.priceChange.h1 || 0) >= 0 ? '+' : ''}{(tokenData?.priceChange.h1 || 0).toFixed(2)}%
                            </span>
                        </div>
                        <div className="flex items-center gap-1 whitespace-nowrap flex-shrink-0">
                            <span className="text-[var(--foreground-muted)]">24h</span>
                            <span className={clsx(
                                'tabular-nums',
                                (tokenData?.priceChange.h24 || 0) >= 0 ? 'text-[var(--accent-green)]' : 'text-[var(--accent-red)]'
                            )}>
                                {(tokenData?.priceChange.h24 || 0) >= 0 ? '+' : ''}{(tokenData?.priceChange.h24 || 0).toFixed(2)}%
                            </span>
                        </div>
                        <div className="ml-auto flex gap-1 sm:gap-2 flex-shrink-0">
                            {/* Desktop Timeframes */}
                            <div className="hidden sm:flex gap-2">
                                {timeframes.map((tf) => (
                                    <button
                                        key={tf}
                                        onClick={() => setTimeframe(tf)}
                                        className={clsx(
                                            'px-3 py-1 text-xs font-medium rounded-lg transition-all',
                                            timeframe === tf
                                                ? 'bg-[var(--primary)] text-black font-bold'
                                                : 'text-[var(--foreground-muted)] hover:bg-[var(--background-tertiary)] hover:text-[var(--foreground)]'
                                        )}
                                    >
                                        {tf}
                                    </button>
                                ))}
                            </div>

                            {/* Mobile Timeframe Dropdown */}
                            {/* Mobile Timeframe Dropdown */}
                            <div className="relative sm:hidden">
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
                                                        setTimeframe(tf);
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
                        </div>
                    </div>
                </div>

                {/* Chart Area - Fixed height on mobile, flexible on desktop */}
                <div className="relative bg-[var(--background)] h-[280px] lg:h-[400px] lg:flex-1 lg:min-h-[400px] border-b border-[var(--border)] flex-shrink-0">
                    {/* TradingView-style Chart Info Overlay */}
                    <div className="absolute top-2 left-3 z-10 flex items-center gap-3 text-xs pointer-events-none">
                        <div className="flex items-center gap-2">
                            {tokenData?.baseToken?.logo && (
                                <img src={tokenData.baseToken.logo} alt="" className="w-5 h-5 rounded-full" />
                            )}
                            <span className="font-semibold text-sm text-[var(--foreground)]">
                                {tokenData?.baseToken?.symbol || 'BTC'}/{tokenData?.quoteToken?.symbol || 'USD'}
                            </span>
                            <span className="text-[var(--foreground-muted)] hidden sm:inline">
                                {tokenData?.dexId && tokenData.dexId !== 'coingecko' ? `on ${tokenData.dexId}` : ''}
                            </span>
                            <span className="text-[var(--foreground-muted)] hidden sm:inline">•</span>
                            <span className="text-[var(--foreground-muted)] hidden sm:inline">{timeframe}</span>
                        </div>
                        {currentOHLC && (
                            <div className="flex items-center gap-2 font-mono hidden sm:flex">
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
                            </div>
                        )}
                    </div>

                    {/* Chart Unavailable Overlay */}
                    {chartUnavailable && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-[var(--background)]/90 z-20">
                            <BarChart3 className="w-12 h-12 text-[var(--foreground-muted)] mb-4" />
                            <p className="text-lg font-semibold text-[var(--foreground)] mb-2">Chart Data Not Available</p>
                            <p className="text-sm text-[var(--foreground-muted)] text-center max-w-[300px]">
                                OHLC chart data is not available for this token. Price data from DexScreener is shown above.
                            </p>
                        </div>
                    )}

                    <div ref={chartContainerRef} className="absolute inset-0" />
                </div>

                {/* Trades/Orders/Positions Panel */}
                <TradingPanel tokenData={tokenData} />
            </div>

            {/* Right sidebar - Swap (Desktop Only) */}
            <aside className="hidden lg:flex w-[400px] bg-[var(--background-secondary)] p-6 flex-col relative overflow-hidden border-l border-[var(--border)]">
                {/* Background glow effects */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--primary)]/5 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-[var(--accent-yellow)]/5 rounded-full blur-3xl pointer-events-none" />

                <SwapPanel token={tokenData} />
            </aside>
        </div>
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
        <div className="flex flex-col bg-[var(--background-secondary)] h-[300px] lg:flex-1 lg:h-auto lg:min-h-0">
            {/* Tab Header */}
            <div className="px-2 sm:px-4 py-0 border-b border-[var(--border)] flex items-center gap-1 sm:gap-4 bg-[var(--background-secondary)] overflow-x-auto scrollbar-thin scrollbar-none">
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
            <div className="flex-1 overflow-y-auto">
                {activeTab === 'trades' && tokenData && (
                    <RecentTradesFeed chainId={tokenData.chainId} tokenData={tokenData} />
                )}
                {activeTab === 'swap' && (
                    <div className="lg:hidden fixed inset-0 top-0 bottom-[64px] z-[40] bg-[var(--background)] flex flex-col">
                        <div className="flex items-center gap-3 px-4 h-14 border-b border-[var(--border)] bg-[var(--background-secondary)] flex-shrink-0">
                            <button
                                onClick={() => setActiveTab('trades')}
                                className="p-2 -ml-2 hover:bg-[var(--background-tertiary)] rounded-lg transition-colors"
                            >
                                <ArrowLeft className="w-5 h-5" />
                            </button>
                            <span className="font-bold">Swap</span>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 pb-20">
                            <SwapPanel token={tokenData} />
                        </div>
                    </div>
                )}
                {activeTab === 'orders' && (
                    <div className="h-full flex flex-col items-center justify-center text-[var(--foreground-muted)] gap-3 p-4 min-h-[200px]">
                        <ArrowUpDown className="w-8 h-8 opacity-50" />
                        <p className="text-sm font-medium">No Open Orders</p>
                        <p className="text-xs text-center max-w-[200px]">Your limit orders will appear here once placed.</p>
                    </div>
                )}
                {activeTab === 'positions' && (
                    <div className="h-full flex flex-col items-center justify-center text-[var(--foreground-muted)] gap-3 p-4 min-h-[200px]">
                        <BarChart3 className="w-8 h-8 opacity-50" />
                        <p className="text-sm font-medium">No Open Positions</p>
                        <p className="text-xs text-center max-w-[200px]">Connect wallet and trade to see your positions here.</p>
                    </div>
                )}
            </div>
        </div>
    );
});

// Helper for formatting price in chart overlay
function formatPrice(price: number) {
    if (price < 1) return price.toFixed(6);
    return price.toFixed(2);
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
        const interval = setInterval(loadTrades, 5000); // Refresh every 5s
        return () => clearInterval(interval);
    }, [tokenData?.pairAddress, tokenData?.chainId]);

    return (
        <div className="overflow-y-auto overflow-x-hidden w-full h-full text-[11px]">
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
                            <span className="relative z-10 text-[var(--foreground-muted)] font-mono tabular-nums text-left">
                                {new Date(trade.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
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
                                'relative z-10 text-center font-semibold font-mono tabular-nums',
                                isBuy ? 'text-[var(--accent-green)]' : 'text-[var(--accent-red)]'
                            )}>
                                ${trade.totalUsd >= 1000
                                    ? (trade.totalUsd / 1000).toFixed(2) + 'K'
                                    : trade.totalUsd.toFixed(2)}
                            </span>

                            {/* Quote Value (NEW) */}
                            <span className="relative z-10 text-center text-[var(--foreground-muted)] font-mono tabular-nums">
                                {trade.amountQuote >= 1000
                                    ? (trade.amountQuote / 1000).toFixed(1) + 'K'
                                    : trade.amountQuote.toFixed(trade.amountQuote < 1 ? 4 : 2)}
                            </span>

                            {/* Token amount */}
                            <span className="relative z-10 text-right text-[var(--foreground)] font-mono tabular-nums whitespace-nowrap">
                                {formatNumber(trade.amountBase)}
                            </span>

                            {/* Maker address */}
                            <Link
                                href={`/app/explorer/detail/?type=address&id=${trade.maker}&chain=${tokenData?.chainId || 'ethereum'}`}
                                className="relative z-10 text-right text-[var(--foreground-muted)] font-mono tabular-nums text-[10px] hover:text-[var(--primary)] transition-colors"
                            >
                                {trade.maker.slice(0, 6)}...{trade.maker.slice(-4)}
                            </Link>
                        </div>
                    );
                })
            )}
        </div>
    );
});

const SwapPanel = React.memo(function SwapPanel({ token }: { token: TokenPair | null }) {
    // Use wallet store directly
    const { activeWallet, isUnlocked, balances, activeChain, openModal } = useWalletStore();
    const { defaultSlippage } = usePreferences();

    const isConnected = isUnlocked && !!activeWallet;
    const currentBalance = activeWallet ? balances[`${activeWallet.address}-${activeChain}`] || '0' : '0';

    const [payAmount, setPayAmount] = useState('');
    const [slippage, setSlippage] = useState(typeof defaultSlippage === 'number' ? defaultSlippage : 0.5);

    // Update slippage when default changes
    useEffect(() => {
        if (typeof defaultSlippage === 'number') {
            setSlippage(defaultSlippage);
        }
    }, [defaultSlippage]);

    // Calculate receive amount (mock for now - would integrate with DEX API)
    const receiveAmount = payAmount && token?.priceUsd
        ? (parseFloat(payAmount) * 3500 / token.priceUsd).toFixed(4)
        : '';

    const handleSwap = () => {
        if (!isConnected) {
            openModal();
            return;
        }
        // Real swap would call DEX aggregator API here (1inch, 0x, etc.)
        alert(`Swap functionality coming soon! Would swap ${payAmount} ${nativeToken.symbol} for ~${receiveAmount} ${token?.baseToken.symbol}`);
    };

    const nativeToken = token ? getChain(token.chainId) : getChain('ethereum');

    return (
        <div className="flex flex-col h-full relative z-10">
            <div className="mb-4 sm:mb-8">
                <h3 className="font-bold text-lg sm:text-2xl mb-1 flex items-center gap-2">
                    Swap v2
                </h3>
                <p className="text-xs text-[var(--foreground-muted)]">
                    via{' '}
                    <a
                        href="https://lightspeed-9288f.web.app/docs"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[var(--primary)] hover:underline"
                    >
                        Lightspeed
                    </a>
                </p>
            </div>

            <div className="space-y-4">
                {/* Pay Input */}
                <div className="p-3 sm:p-4 rounded-2xl bg-[var(--background-tertiary)] border border-[var(--border)] group focus-within:border-[var(--primary)] transition-colors shadow-lg">
                    <div className="flex justify-between mb-2">
                        <label className="text-xs text-[var(--foreground-muted)] font-medium">You pay</label>
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
                            onChange={(e) => setPayAmount(e.target.value)}
                            className="bg-transparent text-2xl sm:text-3xl font-mono font-bold outline-none w-full placeholder:text-[var(--foreground-muted)]/30"
                        />
                        <button
                            className="flex items-center gap-2 bg-[var(--background)] hover:bg-[var(--background-secondary)] px-3 py-1.5 rounded-xl border border-[var(--border)] transition-all"
                            onClick={() => currentBalance && setPayAmount(currentBalance)}
                        >
                            <img src={nativeToken.logo} alt={nativeToken.symbol} className="w-6 h-6 rounded-full" />
                            <span className="font-bold text-sm">{nativeToken.symbol}</span>
                            <ChevronDown className="w-4 h-4 text-[var(--foreground-muted)]" />
                        </button>
                    </div>
                    {isConnected && currentBalance && parseFloat(currentBalance) > 0 && (
                        <button
                            className="text-xs text-[var(--primary)] mt-2 hover:underline"
                            onClick={() => setPayAmount(currentBalance)}
                        >
                            Max
                        </button>
                    )}
                </div>

                {/* Switch Button */}
                <div className="flex justify-center -my-4 relative z-10">
                    <button className="p-3 rounded-xl bg-[var(--background)] border border-[var(--border)] hover:border-[var(--primary)] text-[var(--foreground-muted)] hover:text-[var(--primary)] transition-all shadow-md hover:scale-110 active:scale-95">
                        <ArrowUpDown className="w-5 h-5" />
                    </button>
                </div>

                {/* Receive Input */}
                <div className="p-3 sm:p-4 rounded-2xl bg-[var(--background-tertiary)] border border-[var(--border)] group focus-within:border-[var(--primary)] transition-colors shadow-lg">
                    <div className="flex justify-between mb-2">
                        <label className="text-xs text-[var(--foreground-muted)] font-medium">You receive</label>
                        <span className="text-xs text-[var(--foreground-muted)]">Balance: ---</span>
                    </div>
                    <div className="flex items-center justify-between">
                        <input
                            type="text"
                            placeholder="0.00"
                            value={receiveAmount}
                            className="bg-transparent text-2xl sm:text-3xl font-mono font-bold outline-none w-full placeholder:text-[var(--foreground-muted)]/30"
                            readOnly
                        />
                        <button className="flex items-center gap-2 bg-[var(--background)] hover:bg-[var(--background-secondary)] px-3 py-1.5 rounded-xl border border-[var(--border)] transition-all">
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
            <div className="mt-6 mb-4 p-4 rounded-xl bg-[var(--background-tertiary)]/50 border border-[var(--border)] space-y-3">
                <div className="flex justify-between text-sm">
                    <span className="text-[var(--foreground-muted)]">Rate</span>
                    <span className="font-mono text-xs">1 {token?.quoteToken?.symbol || 'Quote'} ≈ {token?.priceUsd && token?.quoteToken?.symbol ? (1 / (token.priceUsd / (token.quoteToken.symbol === 'SOL' ? 190 : token.quoteToken.symbol === 'ETH' ? 3500 : 1))).toFixed(2) : '---'} {token?.baseToken.symbol}</span>
                </div>
                <div className="flex justify-between text-sm">
                    <span className="text-[var(--foreground-muted)]">Slippage</span>
                    <span className="text-xs font-medium">{slippage}%</span>
                </div>
                <div className="flex justify-between text-sm">
                    <span className="text-[var(--foreground-muted)]">Price Impact</span>
                    <span className="text-[var(--accent-green)] text-xs">~0.05%</span>
                </div>
                <div className="flex justify-between text-sm">
                    <span className="text-[var(--foreground-muted)]">Network Fee</span>
                    <span className="flex items-center gap-1 text-xs">
                        <Activity className="w-3 h-3 text-[var(--foreground-muted)]" />
                        ~$3.50
                    </span>
                </div>
            </div>

            <button
                onClick={handleSwap}
                disabled={isConnected && (!payAmount || parseFloat(payAmount) <= 0)}
                className={clsx(
                    "mt-auto w-full py-3 sm:py-4 text-base sm:text-lg font-bold rounded-xl transition-all",
                    isConnected && payAmount && parseFloat(payAmount) > 0
                        ? "bg-[var(--primary)] text-black shadow-[0_4px_20px_var(--primary-glow)] hover:shadow-[0_6px_30px_var(--primary-glow)] hover:-translate-y-0.5 active:translate-y-0"
                        : isConnected
                            ? "bg-[var(--background-tertiary)] text-[var(--foreground-muted)] cursor-not-allowed"
                            : "bg-[var(--primary)] text-black shadow-[0_4px_20px_var(--primary-glow)] hover:shadow-[0_6px_30px_var(--primary-glow)] hover:-translate-y-0.5"
                )}
            >
                {isConnected
                    ? (payAmount && parseFloat(payAmount) > 0 ? 'Swap' : 'Enter Amount')
                    : 'Connect Wallet'}
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

