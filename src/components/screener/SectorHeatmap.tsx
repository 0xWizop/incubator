'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ResponsiveContainer, Treemap, Tooltip } from 'recharts';
import clsx from 'clsx';
import { LoadingSpinner } from '@/components/ui/Loading';
import { RefreshCw, Layers, TrendingUp, ArrowLeft, Download, Clock, Hash } from 'lucide-react';
import { formatNumber } from '@/lib/utils/format';
import { toPng } from 'html-to-image';
import { toast } from 'sonner';

interface HeatmapNode {
    name: string;
    size: number;
    change: number;
    symbol?: string;
    isCategory?: boolean;
    categoryId?: string;
    children?: HeatmapNode[];
    rank?: number;
}

type TimeframeOption = '1h' | '24h' | '7d';

// Smooth gradient color interpolation
const getGradientColor = (change: number): string => {
    const safeChange = change || 0;

    // Clamp change between -30 and +30 for color mapping
    const clampedChange = Math.max(-30, Math.min(30, safeChange));

    if (clampedChange === 0) return '#404040'; // Neutral gray

    if (clampedChange > 0) {
        // Green gradient: from dark green to bright green
        const intensity = Math.min(clampedChange / 20, 1); // Normalize to 0-1
        const r = Math.round(20 + intensity * 50);
        const g = Math.round(80 + intensity * 140);
        const b = Math.round(30 + intensity * 70);
        return `rgb(${r}, ${g}, ${b})`;
    } else {
        // Red gradient: from dark red to bright red
        const intensity = Math.min(Math.abs(clampedChange) / 20, 1);
        const r = Math.round(80 + intensity * 140);
        const g = Math.round(20 + intensity * 30);
        const b = Math.round(20 + intensity * 30);
        return `rgb(${r}, ${g}, ${b})`;
    }
};

const CustomContent = (props: any) => {
    const { root, depth, x, y, width, height, index, payload, colors, rank, name, change, symbol } = props;
    // Get rank from payload if available
    const displayRank = payload?.rank;

    const safeChange = change || 0;
    const fillColor = getGradientColor(safeChange);

    // Dynamic font size logic
    const fontSize = Math.min(width / 5, height / 3, 12);
    // Show label if reasonable size, otherwise just color
    const showLabel = width > 24 && height > 16;
    const showRank = displayRank && width > 30 && height > 20;

    return (
        <g>
            <rect
                x={x}
                y={y}
                width={width}
                height={height}
                style={{
                    fill: fillColor,
                    stroke: '#000',
                    strokeWidth: 2 / (depth + 1e-10),
                    strokeOpacity: 1,
                }}
            />
            {showLabel && (
                <foreignObject x={x} y={y} width={width} height={height}>
                    <div className="w-full h-full flex flex-col items-center justify-center overflow-hidden p-0.5 text-center pointer-events-none relative">
                        {/* Rank badge in top-left corner */}
                        {showRank && (
                            <span
                                className="absolute top-0.5 left-0.5 bg-black/50 text-white/90 font-bold rounded px-1 leading-tight"
                                style={{ fontSize: `${Math.max(fontSize * 0.6, 8)}px` }}
                            >
                                #{displayRank}
                            </span>
                        )}
                        <span
                            className="text-white font-bold truncate max-w-full drop-shadow-md leading-none mb-0.5"
                            style={{ fontSize: `${fontSize}px` }}
                        >
                            {name}
                        </span>
                        {height > 25 && (
                            <span
                                className="text-white/90 font-medium drop-shadow-md leading-none"
                                style={{ fontSize: `${fontSize * 0.8}px` }}
                            >
                                {change > 0 ? '+' : ''}{change?.toFixed(1)}%
                            </span>
                        )}
                    </div>
                </foreignObject>
            )}
        </g>
    );
};

type ViewMode = 'coins' | 'sectors';
type CoinCount = 20 | 50 | 100;

export function SectorHeatmap() {
    const router = useRouter();
    const [mode, setMode] = useState<ViewMode>('coins'); // 'coins' (Top 50) or 'sectors'
    const [data, setData] = useState<HeatmapNode[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedSector, setSelectedSector] = useState<{ name: string, id: string } | null>(null);
    const [timeframe, setTimeframe] = useState<TimeframeOption>('24h');
    const [coinCount, setCoinCount] = useState<CoinCount>(50);
    const chartRef = useRef<HTMLDivElement>(null);

    const handleDownload = async () => {
        if (!chartRef.current) return;

        try {
            const dataUrl = await toPng(chartRef.current, {
                backgroundColor: '#000000', // Pure black background
                pixelRatio: 4, // Ultra-High Res (Retina x2)
                cacheBust: true,
            });

            const link = document.createElement('a');
            link.download = `incubator-heatmap-${new Date().toISOString().slice(0, 10)}.png`;
            link.href = dataUrl;
            link.click();
            toast.success('Heatmap downloaded!');
        } catch (err) {
            console.error('Download failed:', err);
            toast.error('Failed to download image');
        }
    };

    const fetchData = async () => {
        setLoading(true);
        try {
            // Helper to get correct change field based on timeframe
            const getChangeField = (coin: any) => {
                switch (timeframe) {
                    case '1h': return coin.price_change_percentage_1h_in_currency ?? coin.price_change_percentage_24h ?? 0;
                    case '7d': return coin.price_change_percentage_7d_in_currency ?? coin.price_change_percentage_7d ?? 0;
                    case '24h':
                    default: return coin.price_change_percentage_24h ?? 0;
                }
            };

            // 1. If viewing a specific sector (Drill Down)
            if (selectedSector) {
                const res = await fetch(`/api/market/data?type=coins&category=${selectedSector.id}`);
                if (!res.ok) throw new Error('Failed to fetch sector coins');
                const coins = await res.json();

                setData(coins.map((c: any, i: number) => ({
                    name: c.symbol.toUpperCase(),
                    size: c.market_cap,
                    change: getChangeField(c),
                    symbol: c.symbol,
                    rank: i + 1
                })));
            }
            // 2. If viewing Top Coins (Global)
            else if (mode === 'coins') {
                const res = await fetch(`/api/market/data?type=coins&count=${coinCount}`);
                if (!res.ok) throw new Error('Failed to fetch top coins');
                let coins = await res.json();
                // Slice to requested count in case API returns more
                coins = coins.slice(0, coinCount);

                setData(coins.map((c: any, i: number) => ({
                    name: c.symbol.toUpperCase(),
                    size: c.market_cap,
                    change: getChangeField(c),
                    symbol: c.symbol,
                    rank: i + 1
                })));
            }
            // 3. If viewing Sectors
            else {
                const res = await fetch('/api/market/data?type=categories');
                if (!res.ok) throw new Error('Failed to fetch categories');
                const cats = await res.json();

                // Map categories to heat map nodes
                setData(cats.map((c: any, i: number) => ({
                    name: c.name,
                    size: c.market_cap,
                    change: c.market_cap_change_24h,
                    isCategory: true,
                    categoryId: c.id,
                    rank: i + 1
                })));
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [mode, selectedSector, timeframe, coinCount]);

    return (
        <div className="h-full w-full bg-[var(--background-secondary)] rounded-xl border border-[var(--border)] flex flex-col overflow-hidden relative">
            {/* Header */}
            <div className="p-4 border-b border-[var(--border)] flex flex-col sm:flex-row justify-between items-center bg-[var(--background-secondary)] z-10 gap-4">
                <div className="flex items-center gap-3">
                    {selectedSector ? (
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setSelectedSector(null)}
                                className="p-1.5 hover:bg-[var(--background-tertiary)] rounded-lg transition-colors"
                            >
                                <ArrowLeft className="w-5 h-5" />
                            </button>
                            <h3 className="font-bold text-lg">{selectedSector.name}</h3>
                            <span className="text-xs text-[var(--foreground-muted)] px-2 py-0.5 bg-[var(--background-tertiary)] rounded-full">
                                Sector View
                            </span>
                        </div>
                    ) : (
                        <h3 className="font-bold text-lg flex items-center gap-2">
                            Market Heatmap
                        </h3>
                    )}
                </div>

                <div className="flex items-center gap-3">
                    {/* Mode Toggle */}
                    {!selectedSector && (
                        <div className="flex p-1 bg-[var(--background-tertiary)] rounded-lg">
                            <button
                                onClick={() => setMode('coins')}
                                className={clsx(
                                    "px-3 py-1.5 text-xs font-medium rounded-md transition-all flex items-center gap-2",
                                    mode === 'coins'
                                        ? "bg-[var(--background)] text-[var(--foreground)] shadow-sm"
                                        : "text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
                                )}
                            >
                                <TrendingUp className="w-3 h-3" />
                                Top 20
                            </button>
                            <button
                                onClick={() => setMode('sectors')}
                                className={clsx(
                                    "px-3 py-1.5 text-xs font-medium rounded-md transition-all flex items-center gap-2",
                                    mode === 'sectors'
                                        ? "bg-[var(--background)] text-[var(--foreground)] shadow-sm"
                                        : "text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
                                )}
                            >
                                <Layers className="w-3 h-3" />
                                Sectors
                            </button>
                        </div>
                    )}

                    {/* Timeframe Toggle */}
                    <div className="flex p-1 bg-[var(--background-tertiary)] rounded-lg">
                        {(['1h', '24h', '7d'] as TimeframeOption[]).map((tf) => (
                            <button
                                key={tf}
                                onClick={() => setTimeframe(tf)}
                                className={clsx(
                                    "px-2.5 py-1 text-xs font-medium rounded-md transition-all flex items-center gap-1",
                                    timeframe === tf
                                        ? "bg-[var(--background)] text-[var(--foreground)] shadow-sm"
                                        : "text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
                                )}
                            >
                                {tf === '1h' && <Clock className="w-3 h-3" />}
                                {tf}
                            </button>
                        ))}
                    </div>

                    {/* Coin Count Toggle (only in coins mode) */}
                    {mode === 'coins' && !selectedSector && (
                        <div className="flex p-1 bg-[var(--background-tertiary)] rounded-lg">
                            {([20, 50, 100] as CoinCount[]).map((count) => (
                                <button
                                    key={count}
                                    onClick={() => setCoinCount(count)}
                                    className={clsx(
                                        "px-2 py-1 text-xs font-medium rounded-md transition-all",
                                        coinCount === count
                                            ? "bg-[var(--background)] text-[var(--foreground)] shadow-sm"
                                            : "text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
                                    )}
                                >
                                    {count}
                                </button>
                            ))}
                        </div>
                    )}

                    <button
                        onClick={handleDownload}
                        className="p-2 hover:bg-[var(--background-tertiary)] rounded-full transition-colors text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
                        title="Download Heatmap"
                    >
                        <Download className="w-4 h-4" />
                    </button>

                    <button
                        onClick={fetchData}
                        className="p-2 hover:bg-[var(--background-tertiary)] rounded-full transition-colors"
                    >
                        <RefreshCw className={clsx("w-4 h-4", loading && "animate-spin")} />
                    </button>
                </div>
            </div>

            {/* Chart Area */}
            <div ref={chartRef} className="flex-1 w-full min-h-0 relative bg-[var(--background)]">
                {loading ? (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <LoadingSpinner size="lg" text={
                            selectedSector ? `Loading ${selectedSector.name}...` :
                                mode === 'sectors' ? 'Loading Sectors...' : 'Loading Market...'
                        } />
                    </div>
                ) : (
                    <ResponsiveContainer width="100%" height="100%">
                        <Treemap
                            data={data as any}
                            dataKey="size"
                            aspectRatio={16 / 9}
                            stroke="#000"
                            content={<CustomContent />}
                            onClick={(node: any) => {
                                // If in Sector mode and clicked a category, drill down
                                if (mode === 'sectors' && !selectedSector && node.isCategory) {
                                    setSelectedSector({ name: node.name, id: node.categoryId });
                                }
                                // If clicked a coin (not a category), navigate to trade page
                                else if (node.symbol && !node.isCategory) {
                                    // Navigate to trade page with the coin
                                    router.push(`/app/trade?chain=ethereum&pair=${node.symbol}`);
                                }
                            }}
                            animationDuration={0}
                        >
                            <Tooltip
                                content={({ active, payload }) => {
                                    if (active && payload && payload.length) {
                                        const d = payload[0].payload;
                                        return (
                                            <div className="bg-[var(--background)] border border-[var(--border)] p-3 rounded-lg shadow-xl text-sm z-50">
                                                <p className="font-bold mb-1 border-b border-[var(--border)] pb-1">{d.name}</p>
                                                <div className="space-y-1 mt-2">
                                                    <div className="flex justify-between gap-4">
                                                        <span className="text-[var(--foreground-muted)]">Price Change</span>
                                                        <span className={clsx("font-mono font-medium", d.change >= 0 ? "text-green-500" : "text-red-500")}>
                                                            {d.change > 0 ? '+' : ''}{d.change?.toFixed(2)}%
                                                        </span>
                                                    </div>
                                                    <div className="flex justify-between gap-4">
                                                        <span className="text-[var(--foreground-muted)]">Market Cap</span>
                                                        <span className="font-mono">${formatNumber(d.size)}</span>
                                                    </div>
                                                </div>
                                                {!selectedSector && mode === 'sectors' && (
                                                    <p className="text-[10px] text-[var(--primary)] mt-2 text-center bg-[var(--primary)]/10 py-1 rounded">
                                                        Click to view tokens
                                                    </p>
                                                )}
                                            </div>
                                        );
                                    }
                                    return null;
                                }}
                            />
                        </Treemap>
                    </ResponsiveContainer>
                )}
            </div>
        </div>
    );
}
