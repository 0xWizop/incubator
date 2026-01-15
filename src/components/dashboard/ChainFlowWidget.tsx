'use client';

import { useState, useEffect } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell, Legend } from 'recharts';
import { DefiLlamaService } from '@/lib/services/defillama';
import clsx from 'clsx';
import { LoadingSpinner } from '@/components/ui/Loading';
import { ArrowLeftRight, TrendingUp, Layers } from 'lucide-react';
import { formatNumber } from '@/lib/utils/format';

type MetricMode = 'tvl' | 'volume';

export function ChainFlowWidget() {
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [mode, setMode] = useState<MetricMode>('volume');

    const fetchData = async () => {
        setLoading(true);
        try {
            let result: any[] = [];

            if (mode === 'tvl') {
                const chains = await DefiLlamaService.getChainTvls();
                result = chains.map((c: any) => ({
                    name: c.name,
                    value: c.tvl,
                    formatted: formatNumber(c.tvl)
                }));
            } else {
                const flows = await DefiLlamaService.getChainVolumes();
                result = flows.map((f: any) => ({
                    name: f.name,
                    value: f.volume,
                    formatted: formatNumber(f.volume)
                }));
            }

            // Take top 10 only for cleaner chart
            setData(result.slice(0, 10));
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [mode]);

    return (
        <div className="w-full h-[400px] bg-[var(--background-secondary)] rounded-xl border border-[var(--border)] flex flex-col overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-[var(--border)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h3 className="font-bold flex items-center gap-2">
                        <ArrowLeftRight className="w-5 h-5 text-[var(--accent-blue)]" />
                        Chain Flow Monitor
                    </h3>
                    <p className="text-xs text-[var(--foreground-muted)]">
                        Real-time capital rotation tracker (Top 10 Chains)
                    </p>
                </div>

                {/* Toggles */}
                <div className="flex p-1 bg-[var(--background-tertiary)] rounded-lg self-start sm:self-auto">
                    <button
                        onClick={() => setMode('volume')}
                        className={clsx(
                            "px-3 py-1.5 text-xs font-medium rounded-md transition-all flex items-center gap-2",
                            mode === 'volume'
                                ? "bg-[var(--background)] text-[var(--foreground)] shadow-sm"
                                : "text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
                        )}
                    >
                        <TrendingUp className="w-3 h-3" />
                        DEX Volume (24h)
                    </button>
                    <button
                        onClick={() => setMode('tvl')}
                        className={clsx(
                            "px-3 py-1.5 text-xs font-medium rounded-md transition-all flex items-center gap-2",
                            mode === 'tvl'
                                ? "bg-[var(--background)] text-[var(--foreground)] shadow-sm"
                                : "text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
                        )}
                    >
                        <Layers className="w-3 h-3" />
                        Total Value Locked
                    </button>
                </div>
            </div>

            {/* Chart */}
            <div className="flex-1 w-full min-h-0 relative p-4">
                {loading ? (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <LoadingSpinner />
                    </div>
                ) : (
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                            data={data}
                            layout="vertical"
                            margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
                        >
                            <XAxis type="number" hide />
                            <YAxis
                                type="category"
                                dataKey="name"
                                width={80}
                                tick={{ fontSize: 11, fill: 'var(--foreground-muted)' }}
                                axisLine={false}
                                tickLine={false}
                            />
                            <Tooltip
                                cursor={{ fill: 'var(--background-tertiary)', opacity: 0.5 }}
                                contentStyle={{
                                    backgroundColor: 'var(--background)',
                                    borderColor: 'var(--border)',
                                    borderRadius: '8px',
                                    color: 'var(--foreground)'
                                }}
                                formatter={(value: any) => [`$${formatNumber(value)}`, mode === 'volume' ? 'Volume' : 'TVL']}
                            />
                            <Bar
                                dataKey="value"
                                radius={[0, 4, 4, 0]}
                                barSize={20}
                            >
                                {data.map((entry, index) => (
                                    <Cell
                                        key={`cell-${index}`}
                                        fill={index === 0 ? 'var(--primary)' : index === 1 ? 'var(--accent-blue)' : index === 2 ? 'var(--accent-purple)' : 'var(--background-tertiary-hover)'}
                                    />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                )}
            </div>
        </div>
    );
}
