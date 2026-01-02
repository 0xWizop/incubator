'use client';

import { useState, useEffect } from 'react';
import {
    TrendingUp,
    TrendingDown,
    ArrowUpRight,
    ArrowDownLeft,
    RefreshCw,
    Plus,
    Maximize2
} from 'lucide-react';
import { clsx } from 'clsx';
import { useWalletStore } from '@/store/walletStore';
import { CHAINS } from '@/lib/wallet';

interface TokenHolding {
    symbol: string;
    name: string;
    logo: string;
    balance: string;
    valueUsd: number;
    change24h: number;
    chainId: string;
}

export function PortfolioTab() {
    const { activeWallet, balances, activeChain } = useWalletStore();
    const [holdings, setHoldings] = useState<TokenHolding[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [assetFilter, setAssetFilter] = useState<'crypto' | 'defi' | 'testnets'>('crypto');

    useEffect(() => {
        const loadHoldings = async () => {
            setIsLoading(true);

            const currentBalance = activeWallet
                ? balances[`${activeWallet.address}-${activeChain}`] || '0'
                : '0';

            const chainConfig = activeWallet?.type === 'solana' ? CHAINS.solana : CHAINS[activeChain];
            const price = activeWallet?.type === 'solana' ? 180 : 3500; // Mock prices

            const mockHoldings: TokenHolding[] = [];

            if (parseFloat(currentBalance) > 0) {
                mockHoldings.push({
                    symbol: chainConfig.symbol,
                    name: chainConfig.name,
                    logo: chainConfig.logo,
                    balance: parseFloat(currentBalance).toFixed(4),
                    valueUsd: parseFloat(currentBalance) * price,
                    change24h: 2.34,
                    chainId: activeChain,
                });

                // Add some mock tokens to show the list style
                if (activeChain === 'base') {
                    mockHoldings.push({
                        symbol: 'BRETT',
                        name: 'Brett',
                        logo: 'https://dd.dexscreener.com/ds-data/tokens/base/0x532f27101965dd16442e59d40670faf5ebb142e4.png',
                        balance: '480485.6',
                        valueUsd: 14.37,
                        change24h: -5.2,
                        chainId: activeChain,
                    });
                    mockHoldings.push({
                        symbol: 'VIRTUAL',
                        name: 'Virtual Protocol',
                        logo: 'https://dd.dexscreener.com/ds-data/tokens/base/0x0b3e328455c4059eeb9e3f84b5543f74e24e7e1b.png',
                        balance: '1161.3',
                        valueUsd: 0.39,
                        change24h: 12.5,
                        chainId: activeChain,
                    });
                }
            }

            setHoldings(mockHoldings);
            setIsLoading(false);
        };

        loadHoldings();
    }, [activeWallet, balances, activeChain]);

    return (
        <div className="space-y-6 pt-2">
            {/* Action Buttons */}
            <div className="flex justify-between px-4 sm:px-8">
                <ActionButton icon={Plus} label="Buy" />
                <ActionButton icon={RefreshCw} label="Swap" className="rotate-0" />
                <ActionButton icon={ArrowUpRight} label="Send" />
                <ActionButton icon={ArrowDownLeft} label="Receive" />
                <ActionButton icon={Maximize2} label="Expand" />
            </div>

            {/* Asset Toggle */}
            <div className="px-4">
                <div className="flex gap-4 border-b border-[var(--border)] pb-0">
                    <button
                        onClick={() => setAssetFilter('crypto')}
                        className={clsx(
                            "pb-3 text-sm font-medium border-b-2 transition-all",
                            assetFilter === 'crypto' ? "border-[var(--primary)] text-white" : "border-transparent text-[var(--foreground-muted)]"
                        )}
                    >
                        Crypto
                    </button>
                    <button
                        onClick={() => setAssetFilter('defi')}
                        className={clsx(
                            "pb-3 text-sm font-medium border-b-2 transition-all",
                            assetFilter === 'defi' ? "border-[var(--primary)] text-white" : "border-transparent text-[var(--foreground-muted)]"
                        )}
                    >
                        DeFi
                    </button>
                    <button
                        onClick={() => setAssetFilter('testnets')}
                        className={clsx(
                            "pb-3 text-sm font-medium border-b-2 transition-all",
                            assetFilter === 'testnets' ? "border-[var(--primary)] text-white" : "border-transparent text-[var(--foreground-muted)]"
                        )}
                    >
                        Testnets
                    </button>
                </div>
            </div>

            {/* Token List */}
            <div className="px-2">
                {isLoading ? (
                    <div className="flex justify-center py-8">
                        <RefreshCw className="w-6 h-6 animate-spin text-[var(--foreground-muted)]" />
                    </div>
                ) : holdings.length === 0 ? (
                    <div className="text-center py-8 text-[var(--foreground-muted)]">
                        <p className="text-sm">No assets found</p>
                    </div>
                ) : (
                    <div className="space-y-1">
                        {holdings.map((token) => (
                            <div
                                key={`${token.chainId}-${token.symbol}`}
                                className="flex items-center gap-4 p-3 hover:bg-[var(--background-tertiary)] rounded-xl transition-colors cursor-pointer group"
                            >
                                {/* Token Icon */}
                                <div className="relative">
                                    <img src={token.logo} alt={token.symbol} className="w-10 h-10 rounded-full" />
                                    {/* Chain Badge (optional, small) */}
                                    <div className="absolute -bottom-1 -right-1 bg-[var(--background-secondary)] rounded-full p-0.5">
                                        {/* Could show chain icon here */}
                                    </div>
                                </div>

                                {/* Name & Balance */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between">
                                        <span className="font-semibold text-base">{token.name}</span>
                                        <span className="font-semibold text-base font-mono">
                                            ${token.valueUsd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between mt-0.5">
                                        <span className="text-sm text-[var(--foreground-muted)] overflow-hidden text-ellipsis whitespace-nowrap max-w-[120px]">
                                            ${(token.valueUsd / parseFloat(token.balance)).toFixed(2)}
                                        </span>
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm text-[var(--foreground-muted)] font-mono">
                                                {parseFloat(token.balance).toLocaleString()} {token.symbol}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

function ActionButton({ icon: Icon, label, className }: { icon: any, label: string, className?: string }) {
    return (
        <button className="flex flex-col items-center gap-2 group">
            <div className="w-11 h-11 rounded-full bg-[var(--primary)] hover:bg-[var(--primary-hover)] flex items-center justify-center transition-transform group-hover:scale-105 shadow-lg shadow-[var(--primary)]/20">
                <Icon className={clsx("w-5 h-5 text-black", className)} />
            </div>
            <span className="text-xs font-medium text-white">{label}</span>
        </button>
    );
}
