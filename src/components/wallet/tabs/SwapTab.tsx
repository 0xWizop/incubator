'use client';

import { useState } from 'react';
import { ArrowDownUp, ChevronDown, Settings } from 'lucide-react';
import { clsx } from 'clsx';
import { useWalletStore } from '@/store/walletStore';
import { CHAINS } from '@/lib/wallet';

export function SwapTab() {
    const { activeWallet, isUnlocked, balances, activeChain, openModal } = useWalletStore();
    const isConnected = isUnlocked && !!activeWallet;

    const [fromAmount, setFromAmount] = useState('');
    const [toAmount, setToAmount] = useState('');
    const [fromToken, setFromToken] = useState(activeWallet?.type === 'solana' ? 'SOL' : 'ETH');
    const [toToken, setToToken] = useState('USDC');
    const [slippage, setSlippage] = useState(0.5);
    const [showSettings, setShowSettings] = useState(false);

    // 0x State
    const [quote, setQuote] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [timer, setTimer] = useState<NodeJS.Timeout | null>(null);

    const currentBalance = activeWallet
        ? balances[`${activeWallet.address}-${activeChain}`] || '0'
        : '0';

    const chainConfig = activeWallet?.type === 'solana' ? CHAINS.solana : CHAINS[activeChain];

    const fetchQuote = async (amount: string) => {
        if (!amount || parseFloat(amount) <= 0) return;
        if (activeWallet?.type === 'solana') return; // Skip Solana for now

        setIsLoading(true);
        try {
            const { getPrice, getZeroExChainId } = await import('@/lib/services/zeroEx');
            const numericChainId = getZeroExChainId(activeChain);

            if (!numericChainId) return;

            // Convert to Wei (assuming 18 decimals for ETH)
            const amountInWei = (parseFloat(amount) * 1e18).toString();
            // Native Token (ETH, etc) usually represented as 0xeee...
            const sellTokenAddr = '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee';
            // USDC Address (Hardcoded for now based on chain - ideally dynamic)
            // Base USDC: 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913
            let buyTokenAddr = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913';

            if (activeChain === 'ethereum') buyTokenAddr = '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48';
            if (activeChain === 'arbitrum') buyTokenAddr = '0xaf88d065e77c8cC2239327C5EDb3A432268e5831';

            const data = await getPrice({
                chainId: numericChainId,
                sellToken: sellTokenAddr,
                buyToken: buyTokenAddr,
                sellAmount: amountInWei,
            });

            if (data) {
                setQuote(data);
                // USDC has 6 decimals
                if (data.buyAmount) {
                    setToAmount((parseFloat(data.buyAmount) / 1e6).toFixed(6));
                }
            }
        } catch (err) {
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleAmountChange = (val: string) => {
        setFromAmount(val);
        if (activeWallet?.type === 'solana') {
            // Mock fallback for Sol
            setToAmount(val ? (parseFloat(val) * 180).toFixed(2) : '');
            return;
        }

        if (timer) clearTimeout(timer);
        const newTimer = setTimeout(() => {
            fetchQuote(val);
        }, 600);
        setTimer(newTimer);
    };

    const handleSwapDirection = () => {
        setFromToken(toToken);
        setToToken(fromToken);
        setFromAmount(toAmount);
        handleAmountChange(toAmount); // Trigger quote fetch
    };

    const handleSwap = () => {
        if (!isConnected) {
            openModal();
            return;
        }
        alert('Swap execution integration coming next step via 0x API!');
    };

    const handlePercentageClick = (percentage: number) => {
        const balance = parseFloat(currentBalance);
        if (balance > 0) {
            const newAmount = (balance * percentage / 100).toFixed(6);
            setFromAmount(newAmount);
            // Trigger fetch
            handleAmountChange(newAmount);
        }
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
                            href="https://0x.org/docs"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[var(--primary)] hover:underline"
                        >
                            0x Protocol
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

            {/* From Token (You Pay) */}
            <div className="p-4 rounded-2xl bg-[var(--background-tertiary)] border border-[var(--border)]">
                <div className="flex justify-between mb-2">
                    <label className="text-xs text-[var(--foreground-muted)]">You pay</label>
                    <span className="text-xs text-[var(--foreground-muted)]">
                        Bal: {parseFloat(currentBalance).toFixed(4)} {chainConfig.symbol}
                    </span>
                </div>
                <div className="flex items-center gap-3">
                    <input
                        type="number"
                        value={fromAmount}
                        onChange={(e) => handleAmountChange(e.target.value)}
                        placeholder="0.00"
                        className="flex-1 bg-transparent text-2xl font-mono font-bold outline-none placeholder:text-[var(--foreground-muted)]/30"
                    />
                    <button className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[var(--background)] border border-[var(--border)] hover:border-[var(--border-hover)] transition-all">
                        <img src={chainConfig.logo} alt={fromToken} className="w-6 h-6 rounded-full" />
                        <span className="font-bold text-sm">{fromToken}</span>
                        <ChevronDown className="w-4 h-4 text-[var(--foreground-muted)]" />
                    </button>
                </div>

                {/* Quick Amount Selectors */}
                <div className="flex gap-2 mt-3">
                    {[25, 50, 75, 100].map((pct) => (
                        <button
                            key={pct}
                            onClick={() => handlePercentageClick(pct)}
                            className="flex-1 py-1.5 text-xs font-medium rounded-lg bg-[var(--background)] hover:bg-[var(--background-tertiary)] hover:text-[var(--primary)] transition-all"
                        >
                            {pct === 100 ? 'Max' : `${pct}%`}
                        </button>
                    ))}
                </div>
            </div>

            {/* Swap Direction Button */}
            <div className="flex justify-center -my-2 relative z-10">
                <button
                    onClick={handleSwapDirection}
                    className="p-3 rounded-xl bg-[var(--background-secondary)] border border-[var(--border)] hover:border-[var(--border-hover)] text-[var(--primary)] hover:text-[var(--primary)] transition-all shadow-lg hover:scale-110 active:scale-95"
                >
                    <ArrowDownUp className="w-5 h-5" />
                </button>
            </div>

            {/* To Token (You Receive) */}
            <div className="p-4 rounded-2xl bg-[var(--background-tertiary)] border border-[var(--border)]">
                <div className="flex justify-between mb-2">
                    <label className="text-xs text-[var(--foreground-muted)]">You receive</label>
                    <span className="text-xs text-[var(--foreground-muted)]">
                        {isLoading ? 'Fetching best price...' : 'Bal: 0.0000'}
                    </span>
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
            {(fromAmount || quote) && (
                <div className="p-3 rounded-xl bg-[var(--background-tertiary)]/50 border border-[var(--border)] space-y-1.5 text-sm">
                    <div className="flex justify-between">
                        <span className="text-[var(--foreground-muted)]">Rate</span>
                        <span className="font-mono text-xs">
                            {quote ? `1 ${fromToken} ≈ ${parseFloat(quote.price).toFixed(6)} ${toToken}` : '---'}
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
                    <div className="flex justify-between">
                        <span className="text-[var(--foreground-muted)]">Slippage</span>
                        <span className="text-xs">{slippage}%</span>
                    </div>
                </div>
            )}

            {/* Action Button */}
            {!activeWallet ? (
                <button
                    onClick={() => openModal()}
                    className="w-full py-4 text-lg font-bold rounded-xl transition-all bg-[var(--primary)] text-black shadow-[0_0_15px_var(--primary-glow)] hover:opacity-90 hover:shadow-[0_0_25px_var(--primary-glow)]"
                >
                    Connect
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
