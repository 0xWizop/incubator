'use client';

import { useState } from 'react';
import {
    ArrowLeft,
    ArrowUpRight,
    ArrowDownLeft,
    RefreshCw,
    Copy,
    Check,
    ExternalLink,
    TrendingUp,
    TrendingDown,
} from 'lucide-react';
import { clsx } from 'clsx';
import { AreaChart, Area, ResponsiveContainer, YAxis } from 'recharts';

interface TokenData {
    symbol: string;
    name: string;
    logo: string;
    balance: string;
    usd: number;
    chainId?: string;
    contractAddress?: string;
}

interface TokenDetailViewProps {
    token: TokenData;
    onBack: () => void;
    onSend: () => void;
    onReceive: () => void;
    onSwap: () => void;
}

type Timeframe = '1H' | '24H' | '7D' | '30D';

// Generate mock sparkline data
const generateSparklineData = (timeframe: Timeframe, basePrice: number) => {
    const points = timeframe === '1H' ? 12 : timeframe === '24H' ? 24 : timeframe === '7D' ? 7 : 30;
    const volatility = timeframe === '1H' ? 0.01 : timeframe === '24H' ? 0.03 : timeframe === '7D' ? 0.08 : 0.15;

    let price = basePrice;
    const data = [];

    for (let i = 0; i < points; i++) {
        const change = (Math.random() - 0.5) * volatility * price;
        price = Math.max(price + change, 0);
        data.push({ value: price });
    }

    return data;
};

export function TokenDetailView({ token, onBack, onSend, onReceive, onSwap }: TokenDetailViewProps) {
    const [timeframe, setTimeframe] = useState<Timeframe>('24H');
    const [copied, setCopied] = useState(false);

    const basePrice = token.usd / Math.max(parseFloat(token.balance) || 1, 0.0001);
    const sparklineData = generateSparklineData(timeframe, basePrice);

    // Calculate price change (mock)
    const priceChange = sparklineData.length > 1
        ? ((sparklineData[sparklineData.length - 1].value - sparklineData[0].value) / sparklineData[0].value) * 100
        : 0;
    const isPositive = priceChange >= 0;

    const handleCopyAddress = () => {
        if (token.contractAddress) {
            navigator.clipboard.writeText(token.contractAddress);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const timeframes: Timeframe[] = ['1H', '24H', '7D', '30D'];

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center gap-3 p-3 border-b border-[var(--border)]">
                <button
                    onClick={onBack}
                    className="p-1.5 rounded-lg hover:bg-[var(--background-tertiary)] transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                </button>
                <img src={token.logo} alt={token.symbol} className="w-8 h-8 rounded-full" />
                <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-sm truncate">{token.name}</h3>
                    <p className="text-[10px] text-[var(--foreground-muted)]">{token.symbol}</p>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-3 space-y-3">
                {/* Price & Holdings */}
                <div className="text-center">
                    <p className="text-2xl font-bold">
                        ${token.usd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                    <p className="text-xs text-[var(--foreground-muted)] mt-0.5">
                        {parseFloat(token.balance).toLocaleString()} {token.symbol}
                    </p>
                    <div className={clsx(
                        'inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full text-[10px] font-medium',
                        isPositive ? 'bg-[var(--accent-green)]/10 text-[var(--accent-green)]' : 'bg-[var(--accent-red)]/10 text-[var(--accent-red)]'
                    )}>
                        {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                        {isPositive ? '+' : ''}{priceChange.toFixed(2)}%
                    </div>
                </div>

                {/* Sparkline Chart */}
                <div className="bg-[var(--background-tertiary)] rounded-xl p-3 border border-[var(--border)]">
                    <div className="h-24">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={sparklineData}>
                                <defs>
                                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor={isPositive ? 'var(--accent-green)' : 'var(--accent-red)'} stopOpacity={0.3} />
                                        <stop offset="95%" stopColor={isPositive ? 'var(--accent-green)' : 'var(--accent-red)'} stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <YAxis domain={['dataMin', 'dataMax']} hide />
                                <Area
                                    type="monotone"
                                    dataKey="value"
                                    stroke={isPositive ? 'var(--accent-green)' : 'var(--accent-red)'}
                                    strokeWidth={2}
                                    fill="url(#colorValue)"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Timeframe Selector */}
                    <div className="flex gap-1.5 mt-2">
                        {timeframes.map((tf) => (
                            <button
                                key={tf}
                                onClick={() => setTimeframe(tf)}
                                className={clsx(
                                    'flex-1 py-1.5 text-[10px] font-medium rounded-lg transition-all',
                                    timeframe === tf
                                        ? 'bg-[var(--primary)] text-black'
                                        : 'bg-[var(--background)] text-[var(--foreground-muted)] hover:text-white'
                                )}
                            >
                                {tf}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="flex gap-2">
                    <button
                        onClick={onSend}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-[var(--background-tertiary)] border border-[var(--border)] hover:border-[var(--border-hover)] transition-all"
                    >
                        <ArrowUpRight className="w-4 h-4 text-[var(--primary)]" />
                        <span className="text-xs font-medium">Send</span>
                    </button>
                    <button
                        onClick={onReceive}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-[var(--background-tertiary)] border border-[var(--border)] hover:border-[var(--border-hover)] transition-all"
                    >
                        <ArrowDownLeft className="w-4 h-4 text-[var(--primary)]" />
                        <span className="text-xs font-medium">Receive</span>
                    </button>
                    <button
                        onClick={onSwap}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-[var(--background-tertiary)] border border-[var(--border)] hover:border-[var(--border-hover)] transition-all"
                    >
                        <RefreshCw className="w-4 h-4 text-[var(--primary)]" />
                        <span className="text-xs font-medium">Swap</span>
                    </button>
                </div>

                {/* Token Info */}
                <div className="space-y-2">
                    <h4 className="text-xs font-medium text-[var(--foreground-muted)]">Token Info</h4>

                    {/* Holdings */}
                    <div className="flex justify-between items-center p-2.5 rounded-lg bg-[var(--background-tertiary)] border border-[var(--border)]">
                        <span className="text-xs text-[var(--foreground-muted)]">Your Holdings</span>
                        <span className="text-xs font-medium">{parseFloat(token.balance).toLocaleString()} {token.symbol}</span>
                    </div>

                    {/* Price per token */}
                    <div className="flex justify-between items-center p-2.5 rounded-lg bg-[var(--background-tertiary)] border border-[var(--border)]">
                        <span className="text-xs text-[var(--foreground-muted)]">Price</span>
                        <span className="text-xs font-medium">${basePrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 6 })}</span>
                    </div>

                    {/* Contract Address */}
                    {token.contractAddress && (
                        <div className="p-2.5 rounded-lg bg-[var(--background-tertiary)] border border-[var(--border)]">
                            <div className="flex justify-between items-center mb-1">
                                <span className="text-xs text-[var(--foreground-muted)]">Contract</span>
                                <button
                                    onClick={handleCopyAddress}
                                    className="flex items-center gap-1 text-[10px] text-[var(--primary)] hover:underline"
                                >
                                    {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                                    {copied ? 'Copied!' : 'Copy'}
                                </button>
                            </div>
                            <p className="text-[10px] font-mono text-[var(--foreground-muted)] break-all">
                                {token.contractAddress}
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
