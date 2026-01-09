'use client';

import { useState } from 'react';
import { ArrowUpDown, ChevronDown, Settings, AlertTriangle, ExternalLink } from 'lucide-react';
import { clsx } from 'clsx';
import { useWalletStore } from '@/store/walletStore';
import { CHAINS } from '@/lib/wallet';

export function SwapTab() {
    const { activeWallet, balances, activeChain, openModal } = useWalletStore();

    const [fromAmount, setFromAmount] = useState('');
    const [toAmount, setToAmount] = useState('');
    const [fromToken, setFromToken] = useState(activeWallet?.type === 'solana' ? 'SOL' : 'ETH');
    const [toToken, setToToken] = useState('USDC');
    const [slippage, setSlippage] = useState(0.5);
    const [showSettings, setShowSettings] = useState(false);

    const currentBalance = activeWallet
        ? balances[`${activeWallet.address}-${activeChain}`] || '0'
        : '0';

    const chainConfig = activeWallet?.type === 'solana' ? CHAINS.solana : CHAINS[activeChain];

    // Mock price calculation
    const price = activeWallet?.type === 'solana' ? 180 : 3500;
    const calculatedToAmount = fromAmount ? (parseFloat(fromAmount) * price).toFixed(2) : '';

    const handleSwapDirection = () => {
        setFromToken(toToken);
        setToToken(fromToken);
        setFromAmount(toAmount);
        setToAmount(fromAmount);
    };

    const handleSwap = () => {
        alert('Lightspeed integration coming soon! This will enable fast cross-chain swaps.');
    };

    return (
        <div className="space-y-4">
            {/* Header with Docs Link */}
            <div className="flex justify-between items-center">
                <div>
                    <h3 className="font-bold text-base">Swap v2</h3>
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
                <button
                    onClick={() => setShowSettings(!showSettings)}
                    className={clsx(
                        'p-2 rounded-lg transition-colors',
                        showSettings ? 'bg-[var(--background-tertiary)] text-[var(--primary)]' : 'hover:bg-[var(--background-tertiary)] text-[var(--foreground-muted)]'
                    )}
                >
                    <Settings className="w-4 h-4" />
                </button>
            </div>

            {/* Slippage Settings */}
            {showSettings && (
                <div className="p-3 rounded-xl bg-[var(--background-tertiary)] border border-[var(--border)]">
                    <p className="text-xs text-[var(--foreground-muted)] mb-2">Slippage Tolerance</p>
                    <div className="flex gap-2">
                        {[0.1, 0.5, 1.0].map((s) => (
                            <button
                                key={s}
                                onClick={() => setSlippage(s)}
                                className={clsx(
                                    'px-3 py-1.5 text-xs font-medium rounded-lg transition-all',
                                    slippage === s
                                        ? 'bg-[var(--primary)] text-black'
                                        : 'bg-[var(--background)] text-[var(--foreground-muted)] hover:text-[var(--foreground)]'
                                )}
                            >
                                {s}%
                            </button>
                        ))}
                        <input
                            type="number"
                            value={slippage}
                            onChange={(e) => setSlippage(parseFloat(e.target.value) || 0.5)}
                            className="w-16 px-2 py-1.5 text-xs bg-[var(--background)] rounded-lg border border-[var(--border)] text-center"
                            placeholder="Custom"
                        />
                    </div>
                </div>
            )}

            {/* From Token */}
            <div className="p-4 rounded-2xl bg-[var(--background-tertiary)] border border-[var(--border)]">
                <div className="flex justify-between mb-2">
                    <label className="text-xs text-[var(--foreground-muted)]">You pay</label>
                    <span className="text-xs text-[var(--foreground-muted)]">
                        Balance: {parseFloat(currentBalance).toFixed(4)} {chainConfig.symbol}
                    </span>
                </div>
                <div className="flex items-center gap-3">
                    <input
                        type="number"
                        value={fromAmount}
                        onChange={(e) => {
                            setFromAmount(e.target.value);
                            setToAmount(e.target.value ? (parseFloat(e.target.value) * price).toFixed(2) : '');
                        }}
                        placeholder="0.00"
                        className="flex-1 bg-transparent text-2xl font-mono font-bold outline-none placeholder:text-[var(--foreground-muted)]/30"
                    />
                    <button className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[var(--background)] border border-[var(--border)] hover:border-[var(--border-hover)] transition-all">
                        <img src={chainConfig.logo} alt={fromToken} className="w-6 h-6 rounded-full" />
                        <span className="font-bold text-sm">{fromToken}</span>
                        <ChevronDown className="w-4 h-4 text-[var(--foreground-muted)]" />
                    </button>
                </div>
                {parseFloat(currentBalance) > 0 && (
                    <button
                        onClick={() => {
                            setFromAmount(currentBalance);
                            setToAmount((parseFloat(currentBalance) * price).toFixed(2));
                        }}
                        className="text-xs text-[var(--primary)] mt-2 hover:underline"
                    >
                        Max
                    </button>
                )}
            </div>

            {/* Swap Direction Button */}
            <div className="flex justify-center -my-2 relative z-10">
                <button
                    onClick={handleSwapDirection}
                    className="p-3 rounded-xl bg-[var(--background-secondary)] border border-[var(--border)] hover:border-[var(--border-hover)] text-[var(--foreground-muted)] hover:text-[var(--primary)] transition-all shadow-lg hover:scale-110 active:scale-95"
                >
                    <ArrowUpDown className="w-5 h-5" />
                </button>
            </div>

            {/* To Token */}
            <div className="p-4 rounded-2xl bg-[var(--background-tertiary)] border border-[var(--border)]">
                <div className="flex justify-between mb-2">
                    <label className="text-xs text-[var(--foreground-muted)]">You receive</label>
                    <span className="text-xs text-[var(--foreground-muted)]">Balance: ---</span>
                </div>
                <div className="flex items-center gap-3">
                    <input
                        type="text"
                        value={toAmount}
                        placeholder="0.00"
                        className="flex-1 bg-transparent text-2xl font-mono font-bold outline-none placeholder:text-[var(--foreground-muted)]/30"
                        readOnly
                    />
                    <button className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[var(--background)] border border-[var(--border)] hover:border-[var(--border-hover)] transition-all">
                        <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold">$</div>
                        <span className="font-bold text-sm">{toToken}</span>
                        <ChevronDown className="w-4 h-4 text-[var(--foreground-muted)]" />
                    </button>
                </div>
            </div>

            {/* Swap Info */}
            {fromAmount && (
                <div className="p-3 rounded-xl bg-[var(--background-tertiary)]/50 border border-[var(--border)] space-y-2 text-sm">
                    <div className="flex justify-between">
                        <span className="text-[var(--foreground-muted)]">Rate</span>
                        <span className="font-mono text-xs">1 {fromToken} = {price.toLocaleString()} {toToken}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-[var(--foreground-muted)]">Slippage</span>
                        <span className="text-xs">{slippage}%</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-[var(--foreground-muted)]">Network Fee</span>
                        <span className="text-xs">~$2.50</span>
                    </div>
                </div>
            )}

            {/* Action Button */}
            {!activeWallet ? (
                <button
                    onClick={() => openModal()}
                    className="w-full py-4 text-lg font-bold rounded-xl transition-all bg-[var(--primary)] text-black shadow-[0_0_15px_var(--primary-glow)] hover:opacity-90 hover:shadow-[0_0_25px_var(--primary-glow)]"
                >
                    Connect Wallet
                </button>
            ) : (
                <button
                    onClick={handleSwap}
                    disabled={!fromAmount || parseFloat(fromAmount) <= 0}
                    className={clsx(
                        'w-full py-4 text-lg font-bold rounded-xl transition-all',
                        fromAmount && parseFloat(fromAmount) > 0
                            ? 'bg-[var(--primary)] text-black shadow-[0_4px_20px_var(--primary-glow)] hover:shadow-[0_6px_30px_var(--primary-glow)] hover:-translate-y-0.5'
                            : 'bg-[var(--background-tertiary)] text-[var(--foreground-muted)] cursor-not-allowed'
                    )}
                >
                    {fromAmount && parseFloat(fromAmount) > 0 ? 'Swap' : 'Enter Amount'}
                </button>
            )}
        </div>
    );
}
