'use client';

import { useState, useEffect } from 'react';
import { useWalletStore } from '@/store';
import { Transaction, ChainId } from '@/types';
import { formatTransactionsForCSV, downloadCSV, generateCSVFilename, CSVFormat } from '@/lib/utils/csv-export';
import { Download, Calendar, Filter, ExternalLink, ChevronDown, FileText, X } from 'lucide-react';
import { clsx } from 'clsx';
import * as solana from '@/lib/services/solana';
import * as alchemy from '@/lib/services/alchemy';

interface TransactionHistoryProps {
    onClose?: () => void;
}

export function TransactionHistory({ onClose }: TransactionHistoryProps) {
    const { activeWallet, activeChain } = useWalletStore();
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Export settings
    const [format, setFormat] = useState<CSVFormat>('generic');
    const [showFormatDropdown, setShowFormatDropdown] = useState(false);
    const [dateRange, setDateRange] = useState<'30d' | '90d' | '1y' | 'all'>('1y');
    const [showDateDropdown, setShowDateDropdown] = useState(false);

    // Fetch transactions when wallet changes
    useEffect(() => {
        if (activeWallet?.address) {
            fetchTransactions();
        }
    }, [activeWallet?.address, activeChain]);

    async function fetchTransactions() {
        if (!activeWallet?.address) return;

        setLoading(true);
        setError(null);

        try {
            let txs: Transaction[] = [];

            // Fetch from Solana
            if (activeChain === 'solana') {
                const solanaTxs = await solana.getAddressTransactions(activeWallet.address, 100);
                txs = [...txs, ...solanaTxs];
            }
            // Fetch from EVM chains
            else {
                const { transactions: alchemyTxs } = await alchemy.getAddressTransactions(activeChain, activeWallet.address, 100);
                txs = [...txs, ...alchemyTxs];
            }

            // Sort by timestamp descending
            txs.sort((a, b) => b.timestamp - a.timestamp);

            setTransactions(txs);
        } catch (err) {
            console.error('Failed to fetch transactions:', err);
            setError('Failed to load transaction history. Please try again.');
        } finally {
            setLoading(false);
        }
    }

    function handleExport() {
        if (transactions.length === 0) {
            alert('No transactions to export');
            return;
        }

        // Calculate date range
        const now = new Date();
        let startDate: Date | undefined;

        switch (dateRange) {
            case '30d':
                startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                break;
            case '90d':
                startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
                break;
            case '1y':
                startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
                break;
            case 'all':
                startDate = undefined;
                break;
        }

        // Generate CSV
        const csvContent = formatTransactionsForCSV(transactions, {
            format,
            startDate,
            endDate: now,
            chains: [activeChain]
        });

        // Download
        const filename = generateCSVFilename(format, now.getFullYear());
        downloadCSV(csvContent, filename);
    }

    const formatOptions: { value: CSVFormat; label: string; description: string }[] = [
        { value: 'generic', label: 'Generic CSV', description: 'Universal format' },
        { value: 'cointracker', label: 'CoinTracker', description: 'Import to CoinTracker' },
        { value: 'koinly', label: 'Koinly', description: 'Import to Koinly' },
        { value: 'turbotax', label: 'TurboTax', description: 'Import to TurboTax' },
    ];

    const dateRangeOptions = [
        { value: '30d' as const, label: 'Last 30 Days' },
        { value: '90d' as const, label: 'Last 90 Days' },
        { value: '1y' as const, label: 'Last Year' },
        { value: 'all' as const, label: 'All Time' },
    ];

    const selectedFormat = formatOptions.find(f => f.value === format)!;
    const selectedDateRange = dateRangeOptions.find(d => d.value === dateRange)!;

    // Filter transactions by date range for display
    const filteredTransactions = transactions.filter(tx => {
        const now = new Date();
        let startDate: Date | undefined;

        switch (dateRange) {
            case '30d':
                startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                break;
            case '90d':
                startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
                break;
            case '1y':
                startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
                break;
            case 'all':
                return true;
        }

        const txDate = new Date(tx.timestamp);
        return !startDate || txDate >= startDate;
    });

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-[var(--background)] border border-[var(--border)] rounded-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-[var(--border)] bg-[var(--background-secondary)]">
                    <div>
                        <h2 className="text-2xl font-bold flex items-center gap-2">
                            <FileText className="w-6 h-6 text-[var(--primary)]" />
                            Transaction History
                        </h2>
                        <p className="text-sm text-[var(--foreground-muted)] mt-1">
                            Export your transaction history for tax reporting
                        </p>
                    </div>
                    {onClose && (
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-[var(--background-tertiary)] rounded-lg transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    )}
                </div>

                {/* Controls */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 border-b border-[var(--border)] bg-[var(--background-secondary)]/50">
                    <div className="flex flex-wrap items-center gap-3">
                        {/* Date Range Selector */}
                        <div className="relative">
                            <button
                                onClick={() => setShowDateDropdown(!showDateDropdown)}
                                className="flex items-center gap-2 px-4 py-2 bg-[var(--background-tertiary)] border border-[var(--border)] rounded-lg hover:bg-[var(--background)] transition-colors text-sm"
                            >
                                <Calendar className="w-4 h-4" />
                                <span>{selectedDateRange.label}</span>
                                <ChevronDown className="w-4 h-4" />
                            </button>
                            {showDateDropdown && (
                                <>
                                    <div className="fixed inset-0 z-40" onClick={() => setShowDateDropdown(false)} />
                                    <div className="absolute top-full mt-2 left-0 bg-[var(--background)] border border-[var(--border)] rounded-lg shadow-xl z-50 min-w-[200px] py-1">
                                        {dateRangeOptions.map(option => (
                                            <button
                                                key={option.value}
                                                onClick={() => {
                                                    setDateRange(option.value);
                                                    setShowDateDropdown(false);
                                                }}
                                                className={clsx(
                                                    'w-full text-left px-4 py-2 hover:bg-[var(--background-tertiary)] transition-colors text-sm',
                                                    dateRange === option.value && 'text-[var(--primary)] bg-[var(--primary)]/5 font-medium'
                                                )}
                                            >
                                                {option.label}
                                            </button>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Format Selector */}
                        <div className="relative">
                            <button
                                onClick={() => setShowFormatDropdown(!showFormatDropdown)}
                                className="flex items-center gap-2 px-4 py-2 bg-[var(--background-tertiary)] border border-[var(--border)] rounded-lg hover:bg-[var(--background)] transition-colors text-sm"
                            >
                                <Filter className="w-4 h-4" />
                                <span>{selectedFormat.label}</span>
                                <ChevronDown className="w-4 h-4" />
                            </button>
                            {showFormatDropdown && (
                                <>
                                    <div className="fixed inset-0 z-40" onClick={() => setShowFormatDropdown(false)} />
                                    <div className="absolute top-full mt-2 left-0 bg-[var(--background)] border border-[var(--border)] rounded-lg shadow-xl z-50 min-w-[250px] py-1">
                                        {formatOptions.map(option => (
                                            <button
                                                key={option.value}
                                                onClick={() => {
                                                    setFormat(option.value);
                                                    setShowFormatDropdown(false);
                                                }}
                                                className={clsx(
                                                    'w-full text-left px-4 py-3 hover:bg-[var(--background-tertiary)] transition-colors',
                                                    format === option.value && 'bg-[var(--primary)]/5'
                                                )}
                                            >
                                                <div className={clsx(
                                                    'font-medium text-sm',
                                                    format === option.value ? 'text-[var(--primary)]' : 'text-[var(--foreground)]'
                                                )}>
                                                    {option.label}
                                                </div>
                                                <div className="text-xs text-[var(--foreground-muted)] mt-0.5">
                                                    {option.description}
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Export Button */}
                    <button
                        onClick={handleExport}
                        disabled={loading || filteredTransactions.length === 0}
                        className="flex items-center gap-2 px-6 py-2.5 bg-[var(--primary)] text-black font-bold rounded-lg hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                    >
                        <Download className="w-4 h-4" />
                        Export CSV ({filteredTransactions.length})
                    </button>
                </div>

                {/* Transaction List */}
                <div className="flex-1 overflow-y-auto p-6">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-12">
                            <div className="w-8 h-8 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin mb-4" />
                            <p className="text-[var(--foreground-muted)]">Loading transactions...</p>
                        </div>
                    ) : error ? (
                        <div className="flex flex-col items-center justify-center py-12">
                            <p className="text-red-500 mb-4">{error}</p>
                            <button
                                onClick={fetchTransactions}
                                className="px-4 py-2 bg-[var(--primary)] text-black font-medium rounded-lg hover:opacity-90"
                            >
                                Retry
                            </button>
                        </div>
                    ) : filteredTransactions.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12">
                            <FileText className="w-12 h-12 text-[var(--foreground-muted)] opacity-50 mb-4" />
                            <p className="text-[var(--foreground-muted)] text-center">
                                No transactions found for the selected period
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {filteredTransactions.map((tx) => (
                                <TransactionRow key={tx.hash} transaction={tx} />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function TransactionRow({ transaction }: { transaction: Transaction }) {
    const date = new Date(transaction.timestamp);
    const explorerUrl = getExplorerUrl(transaction.chainId, transaction.hash);

    return (
        <div className="flex items-center justify-between p-4 bg-[var(--background-secondary)] border border-[var(--border)] rounded-lg hover:bg-[var(--background-tertiary)] transition-colors">
            <div className="flex items-center gap-4 flex-1 min-w-0">
                {/* Date & Time */}
                <div className="hidden sm:block text-sm">
                    <div className="font-medium">{date.toLocaleDateString()}</div>
                    <div className="text-[var(--foreground-muted)] text-xs">
                        {date.toLocaleTimeString()}
                    </div>
                </div>

                {/* Chain Badge */}
                <div className="flex-shrink-0">
                    <span className="inline-block px-2 py-1 text-xs font-medium rounded-md bg-[var(--primary)]/10 text-[var(--primary)] uppercase">
                        {transaction.chainId}
                    </span>
                </div>

                {/* Transaction Details */}
                <div className="flex-1 min-w-0">
                    <div className="font-mono text-sm truncate">
                        {transaction.hash.slice(0, 10)}...{transaction.hash.slice(-8)}
                    </div>
                    <div className="text-xs text-[var(--foreground-muted)] flex items-center gap-2">
                        <span>From: {transaction.from.slice(0, 6)}...{transaction.from.slice(-4)}</span>
                        {transaction.to && (
                            <span>To: {transaction.to.slice(0, 6)}...{transaction.to.slice(-4)}</span>
                        )}
                    </div>
                </div>

                {/* Status */}
                <div className="flex-shrink-0">
                    <span className={clsx(
                        'inline-block px-2 py-1 text-xs font-medium rounded-md',
                        transaction.status === 'success' && 'bg-green-500/10 text-green-500',
                        transaction.status === 'failed' && 'bg-red-500/10 text-red-500',
                        transaction.status === 'pending' && 'bg-yellow-500/10 text-yellow-500'
                    )}>
                        {transaction.status}
                    </span>
                </div>
            </div>

            {/* Explorer Link */}
            <a
                href={explorerUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="ml-4 p-2 hover:bg-[var(--background)] rounded-lg transition-colors text-[var(--foreground-muted)] hover:text-[var(--primary)]"
                title="View in explorer"
            >
                <ExternalLink className="w-4 h-4" />
            </a>
        </div>
    );
}

function getExplorerUrl(chainId: ChainId, hash: string): string {
    const explorers: Record<ChainId, string> = {
        'solana': 'https://solscan.io/tx/',
        'ethereum': 'https://etherscan.io/tx/',
        'base': 'https://basescan.org/tx/',
        'arbitrum': 'https://arbiscan.io/tx/'
    };
    return explorers[chainId] + hash;
}
