'use strict';

import { useState, useEffect, useRef } from 'react';
import { DollarSign, TrendingUp, TrendingDown, RefreshCw, Calculator, Percent } from 'lucide-react';
import { clsx } from 'clsx';

export function PnLCalculator() {
    const [investment, setInvestment] = useState<string>('1000');
    const [entryPrice, setEntryPrice] = useState<string>('1');
    const [exitPrice, setExitPrice] = useState<string>('2');
    const [roi, setRoi] = useState<number>(0);
    const [profit, setProfit] = useState<number>(0);
    const [totalValue, setTotalValue] = useState<number>(0);
    const [isSliderActive, setIsSliderActive] = useState(false);

    // Multiplier for slider (0.1x to 10x range for simple slider)
    const [sliderValue, setSliderValue] = useState<number>(200); // 200 = 2x (100 base)

    // Calculate results whenever inputs change
    useEffect(() => {
        const inv = parseFloat(investment) || 0;
        const entry = parseFloat(entryPrice) || 0;
        const exit = parseFloat(exitPrice) || 0;

        if (inv > 0 && entry > 0) {
            const tokenCount = inv / entry;
            const finalVal = tokenCount * exit;
            const pnl = finalVal - inv;
            const roiVal = (pnl / inv) * 100;

            setTotalValue(finalVal);
            setProfit(pnl);
            setRoi(roiVal);

            // Update slider position if not being dragged
            if (!isSliderActive && entry > 0) {
                const multiple = exit / entry;
                // Map multiple to slider: 0x-10x range mapped to 0-1000
                setSliderValue(Math.min(1000, Math.max(0, multiple * 100)));
            }
        } else {
            setTotalValue(0);
            setProfit(0);
            setRoi(0);
        }
    }, [investment, entryPrice, exitPrice, isSliderActive]);

    const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = parseInt(e.target.value);
        setSliderValue(val);
        setIsSliderActive(true);

        // Convert slider value back to Exit Price
        // val = 100 is 1x (breakeven). val = 200 is 2x.
        const multiple = val / 100;
        const entry = parseFloat(entryPrice) || 0;
        if (entry > 0) {
            setExitPrice((entry * multiple).toFixed(4));
        }
    };

    const handleQuickSet = (multiple: number) => {
        const entry = parseFloat(entryPrice) || 0;
        if (entry > 0) {
            setExitPrice((entry * multiple).toFixed(4));
        }
    };

    return (
        <div className="card h-full flex flex-col p-4 sm:p-5 relative overflow-hidden group">
            {/* Background Glow */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--primary)]/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />

            <div className="flex items-center justify-between mb-4 relative z-10">
                <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-[var(--accent-blue)]/10 text-[var(--accent-blue)]">
                        <Calculator className="w-4 h-4" />
                    </div>
                    <h2 className="font-bold text-sm sm:text-base">Profit Simulator</h2>
                </div>
                <button
                    onClick={() => {
                        setInvestment('1000');
                        setEntryPrice('1');
                        setExitPrice('2');
                    }}
                    className="text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors"
                >
                    <RefreshCw className="w-3.5 h-3.5" />
                </button>
            </div>

            <div className="space-y-4 flex-1 relative z-10">
                {/* Inputs Grid */}
                <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                        <label className="text-[10px] text-[var(--foreground-muted)] uppercase tracking-wider font-medium pl-1">Investment</label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--foreground-muted)] text-sm">$</span>
                            <input
                                type="number"
                                value={investment}
                                onChange={(e) => setInvestment(e.target.value)}
                                className="w-full bg-[var(--background-tertiary)] border border-[var(--border)] rounded-lg py-2 pl-6 pr-2 text-sm font-mono focus:outline-none focus:border-[var(--primary)] transition-colors placeholder:text-[var(--foreground-muted)]/30"
                                placeholder="1000"
                            />
                        </div>
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] text-[var(--foreground-muted)] uppercase tracking-wider font-medium pl-1">Entry Price</label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--foreground-muted)] text-sm">$</span>
                            <input
                                type="number"
                                value={entryPrice}
                                onChange={(e) => setEntryPrice(e.target.value)}
                                className="w-full bg-[var(--background-tertiary)] border border-[var(--border)] rounded-lg py-2 pl-6 pr-2 text-sm font-mono focus:outline-none focus:border-[var(--primary)] transition-colors placeholder:text-[var(--foreground-muted)]/30"
                                placeholder="0.50"
                            />
                        </div>
                    </div>
                </div>

                {/* Slider Section */}
                <div className="space-y-3 pt-2">
                    <div className="flex justify-between items-end">
                        <label className="text-[10px] text-[var(--foreground-muted)] uppercase tracking-wider font-medium pl-1">Target Price</label>
                        <div className="font-mono font-bold text-[var(--primary)] text-sm">
                            {(parseFloat(exitPrice) / parseFloat(entryPrice || '1')).toFixed(2)}x
                        </div>
                    </div>

                    <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--foreground-muted)] text-sm z-10">$</span>
                        <input
                            type="number"
                            value={exitPrice}
                            onChange={(e) => setExitPrice(e.target.value)}
                            className="w-full bg-[var(--background-tertiary)] border border-[var(--border)] rounded-lg py-2 pl-6 pr-2 text-sm font-mono focus:outline-none focus:border-[var(--primary)] transition-colors placeholder:text-[var(--foreground-muted)]/30"
                        />
                    </div>

                    <div className="relative h-6 flex items-center">
                        <input
                            type="range"
                            min="0"
                            max="1000" // 0x to 10x
                            value={sliderValue}
                            onChange={handleSliderChange}
                            onMouseUp={() => setIsSliderActive(false)}
                            onTouchEnd={() => setIsSliderActive(false)}
                            className="w-full h-1.5 bg-[var(--background-tertiary)] rounded-full appearance-none cursor-pointer accent-[var(--primary)]"
                        />
                    </div>

                    <div className="flex gap-2">
                        {[2, 5, 10, 50].map((m) => (
                            <button
                                key={m}
                                onClick={() => handleQuickSet(m)}
                                className="flex-1 py-1 text-[10px] font-bold rounded-md bg-[var(--background-tertiary)] border border-[var(--border)] hover:bg-[var(--primary)]/10 hover:border-[var(--primary)] hover:text-[var(--primary)] transition-all"
                            >
                                {m}x
                            </button>
                        ))}
                    </div>
                </div>

                {/* Results Card */}
                <div className={clsx(
                    "mt-auto rounded-xl p-3 border transition-colors",
                    profit >= 0
                        ? "bg-[var(--accent-green)]/10 border-[var(--accent-green)]/20"
                        : "bg-[var(--accent-red)]/10 border-[var(--accent-red)]/20"
                )}>
                    <div className="flex justify-between items-center mb-1">
                        <span className="text-xs font-medium opacity-70">Total Profit</span>
                        <span className={clsx(
                            "text-xs font-bold",
                            profit >= 0 ? "text-[var(--accent-green)]" : "text-[var(--accent-red)]"
                        )}>
                            {profit >= 0 ? '+' : ''}{roi.toFixed(2)}%
                        </span>
                    </div>
                    <div className={clsx(
                        "text-2xl font-black font-mono tracking-tight",
                        profit >= 0 ? "text-[var(--accent-green)]" : "text-[var(--accent-red)]"
                    )}>
                        ${Math.abs(profit).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                    <div className="text-[10px] opacity-60 text-right mt-1 font-mono">
                        Total Value: ${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </div>
                </div>
            </div>
        </div>
    );
}
