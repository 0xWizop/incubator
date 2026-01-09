'use client';

import { useState } from 'react';
import { ArrowUpRight, ArrowDownLeft, RefreshCw, ExternalLink, Clock } from 'lucide-react';
import { clsx } from 'clsx';
import { useWalletStore } from '@/store/walletStore';

interface Transaction {
    id: string;
    type: 'send' | 'receive' | 'swap';
    token: string;
    amount: string;
    valueUsd: number;
    counterparty: string;
    timestamp: Date;
    status: 'confirmed' | 'pending';
    txHash: string;
}

type FilterType = 'all' | 'send' | 'receive' | 'swap';

export function ActivityTab() {
    const { activeWallet } = useWalletStore();
    const [filter, setFilter] = useState<FilterType>('all');

    // Mock transactions - would be fetched from blockchain
    const transactions: Transaction[] = [];

    const filteredTransactions = filter === 'all'
        ? transactions
        : transactions.filter(tx => tx.type === filter);

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'send':
                return <ArrowUpRight className="w-4 h-4 text-[var(--accent-red)]" />;
            case 'receive':
                return <ArrowDownLeft className="w-4 h-4 text-[var(--accent-green)]" />;
            case 'swap':
                return <RefreshCw className="w-4 h-4 text-[var(--primary)]" />;
            default:
                return null;
        }
    };

    const filters: { id: FilterType; label: string }[] = [
        { id: 'all', label: 'All' },
        { id: 'send', label: 'Sent' },
        { id: 'receive', label: 'Received' },
        { id: 'swap', label: 'Swaps' },
    ];

    if (transactions.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-16 h-16 rounded-2xl bg-[var(--background-tertiary)] flex items-center justify-center mb-4">
                    <Clock className="w-8 h-8 text-[var(--foreground-muted)]" />
                </div>
                <h3 className="font-medium text-lg mb-2">No transactions yet</h3>
                <p className="text-sm text-[var(--foreground-muted)] max-w-[250px]">
                    Your transaction history will appear here once you start using your wallet
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Filters */}
            <div className="flex gap-2">
                {filters.map((f) => (
                    <button
                        key={f.id}
                        onClick={() => setFilter(f.id)}
                        className={clsx(
                            'px-3 py-1.5 text-xs font-medium rounded-lg transition-all',
                            filter === f.id
                                ? 'bg-[var(--primary)] text-black'
                                : 'bg-[var(--background-tertiary)] text-[var(--foreground-muted)] hover:text-[var(--foreground)]'
                        )}
                    >
                        {f.label}
                    </button>
                ))}
            </div>

            {/* Transaction List */}
            <div className="space-y-2">
                {filteredTransactions.map((tx) => (
                    <div
                        key={tx.id}
                        className="flex items-center gap-3 p-3 rounded-xl bg-[var(--background-tertiary)] border border-[var(--border)] hover:border-[var(--border-hover)]/30 transition-all"
                    >
                        {/* Type Icon */}
                        <div className={clsx(
                            'w-10 h-10 rounded-full flex items-center justify-center',
                            tx.type === 'send' ? 'bg-[var(--accent-red)]/10' :
                                tx.type === 'receive' ? 'bg-[var(--accent-green)]/10' :
                                    'bg-[var(--background-tertiary)]'
                        )}>
                            {getTypeIcon(tx.type)}
                        </div>

                        {/* Transaction Info */}
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                                <span className="font-medium capitalize">{tx.type}</span>
                                <span className="text-xs text-[var(--foreground-muted)]">
                                    {tx.counterparty.slice(0, 6)}...{tx.counterparty.slice(-4)}
                                </span>
                            </div>
                            <p className="text-sm text-[var(--foreground-muted)]">
                                {tx.timestamp.toLocaleDateString()} • {tx.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                        </div>

                        {/* Amount */}
                        <div className="text-right">
                            <p className={clsx(
                                'font-medium font-mono',
                                tx.type === 'send' ? 'text-[var(--accent-red)]' : 'text-[var(--accent-green)]'
                            )}>
                                {tx.type === 'send' ? '-' : '+'}{tx.amount} {tx.token}
                            </p>
                            <p className="text-xs text-[var(--foreground-muted)]">
                                ${tx.valueUsd.toFixed(2)}
                            </p>
                        </div>

                        {/* Status & Link */}
                        <div className="flex items-center gap-2">
                            <span className={clsx(
                                'text-[10px] px-2 py-0.5 rounded-full font-medium',
                                tx.status === 'confirmed'
                                    ? 'bg-[var(--accent-green)]/10 text-[var(--accent-green)]'
                                    : 'bg-[var(--accent-yellow)]/10 text-[var(--accent-yellow)]'
                            )}>
                                {tx.status === 'confirmed' ? '✓' : '⏳'}
                            </span>
                            <button className="p-1.5 rounded-md hover:bg-[var(--border)] transition-colors">
                                <ExternalLink className="w-3.5 h-3.5 text-[var(--foreground-muted)]" />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
