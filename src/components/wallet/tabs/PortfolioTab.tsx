'use client';

import { useState, useEffect } from 'react';
import {
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
    chainId: string;
}

export function PortfolioTab() {
    const { activeWallet, balances, activeChain } = useWalletStore();
    const [holdings, setHoldings] = useState<TokenHolding[]>([]);
    const [isLoading, setIsLoading] = useState(true);

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
                        chainId: activeChain,
                    });
                    mockHoldings.push({
                        symbol: 'VIRTUAL',
                        name: 'Virtual Protocol',
                        logo: 'https://dd.dexscreener.com/ds-data/tokens/base/0x0b3e328455c4059eeb9e3f84b5543f74e24e7e1b.png',
                        balance: '1161.3',
                        valueUsd: 0.39,
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
        <div className="space-y-4">
            {/* Action Buttons Row */}
            <div className="flex justify-between px-6 pt-2">
                <ActionButton icon={Plus} label="Buy" />
                <ActionButton icon={RefreshCw} label="Swap" />
                <ActionButton icon={ArrowUpRight} label="Send" />
                <ActionButton icon={ArrowDownLeft} label="Receive" />
                <ActionButton icon={Maximize2} label="Expand" />
            </div>

            {/* Crypto Header */}
            <div className="px-4 pt-2">
                <div className="border-b border-[var(--border)]">
                    <span className="inline-block pb-2 text-sm font-medium border-b-2 border-[var(--primary)] text-white">
                        Crypto
                    </span>
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
                        <p className="text-sm">No tokens found</p>
                        <p className="text-xs mt-1">Your crypto tokens will appear here</p>
                    </div>
                ) : (
                    <div className="space-y-0.5">
                        {holdings.map((token) => (
                            <div
                                key={`${token.chainId}-${token.symbol}`}
                                className="flex items-center gap-3 p-3 hover:bg-[var(--background-tertiary)] rounded-xl transition-colors cursor-pointer"
                            >
                                {/* Token Icon */}
                                <img
                                    src={token.logo}
                                    alt={token.symbol}
                                    className="w-10 h-10 rounded-full bg-[var(--background-tertiary)]"
                                />

                                {/* Name */}
                                <div className="flex-1 min-w-0">
                                    <span className="font-medium text-sm">{token.name}</span>
                                </div>

                                {/* Value & Balance */}
                                <div className="text-right">
                                    <p className="font-semibold text-sm">
                                        ${token.valueUsd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </p>
                                    <p className="text-xs text-[var(--foreground-muted)] font-mono">
                                        {parseFloat(token.balance).toLocaleString()} {token.symbol}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

function ActionButton({ icon: Icon, label }: { icon: any; label: string }) {
    return (
        <button className="flex flex-col items-center gap-1.5 group">
            <div className="w-11 h-11 rounded-full bg-[var(--primary)] hover:bg-[var(--primary-hover)] flex items-center justify-center transition-all group-hover:scale-105">
                <Icon className="w-5 h-5 text-black" />
            </div>
            <span className="text-[11px] font-medium text-[var(--foreground-muted)] group-hover:text-white transition-colors">{label}</span>
        </button>
    );
}
