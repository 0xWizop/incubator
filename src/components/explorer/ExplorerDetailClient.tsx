'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAppStore } from '@/store';
import { useWalletTracker } from '@/hooks/useWalletTracker';
import { AddWalletModal } from '@/components/tracker/AddWalletModal';
import { Block, Transaction, ChainId } from '@/types';
import * as alchemyService from '@/lib/services/alchemy';
import { Breadcrumb } from '@/components/explorer';
import { useCryptoPrices } from '@/hooks/useCryptoPrices';
import { formatCurrency } from '@/lib/utils/format';
import {
    Box,
    Hash,
    Fuel,
    Layers,
    User,
    Wallet,
    ExternalLink,
    Copy,
    Check,
    ChevronLeft,
    ChevronRight,
    ArrowRightLeft,
    ArrowUpRight,
    ArrowDownLeft,
    CheckCircle,
    XCircle,
    ArrowRight,
    Clock,
    Coins,
    Activity,
    ArrowLeft,
    Eye,
} from 'lucide-react';
import { clsx } from 'clsx';
import { formatDistanceToNow, format } from 'date-fns';
import { getAddressLabel } from '@/lib/data/address-labels';
import { FileCode, Shield } from 'lucide-react';

export function ExplorerDetailClient() {
    const searchParams = useSearchParams();
    const type = searchParams.get('type'); // 'block', 'tx', or 'address'
    const id = searchParams.get('id'); // block number, tx hash, or address
    const chainParam = searchParams.get('chain'); // 'ethereum', 'base', 'arbitrum', 'solana'
    const initialChain = chainParam as ChainId | undefined;

    if (!type || !id) {
        return (
            <div className="p-6 max-w-6xl mx-auto">
                <div className="card p-12 text-center">
                    <Box className="w-12 h-12 text-[var(--foreground-muted)] mx-auto mb-4" />
                    <h2 className="text-xl font-normal mb-2">Invalid Request</h2>
                    <p className="text-[var(--foreground-muted)] mb-4">Missing type or id parameter</p>
                    <Link href="/app/explorer/" className="btn btn-primary">Back to Explorer</Link>
                </div>
            </div>
        );
    }

    if (type === 'block') {
        return <BlockDetail number={id} initialChain={initialChain} />;
    } else if (type === 'tx') {
        return <TxDetail hash={id} initialChain={initialChain} />;
    } else if (type === 'address') {
        // If it's a solana address (base58 chars), infer solana if no chain param
        const isSolanaAddress = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(id) && !id.startsWith('0x');
        return <AddressDetail address={id} initialChain={initialChain || (isSolanaAddress ? 'solana' : undefined)} />;
    }

    return (
        <div className="p-6 max-w-6xl mx-auto">
            <div className="card p-12 text-center">
                <Box className="w-12 h-12 text-[var(--foreground-muted)] mx-auto mb-4" />
                <h2 className="text-xl font-normal mb-2">Unknown Type</h2>
                <p className="text-[var(--foreground-muted)] mb-4">Type &quot;{type}&quot; is not supported</p>
                <Link href="/app/explorer/" className="btn btn-primary">Back to Explorer</Link>
            </div>
        </div>
    );
}

// ============ BLOCK DETAIL ============
function BlockDetail({ number, initialChain }: { number: string; initialChain?: ChainId }) {
    const { selectedChains } = useAppStore();
    const [block, setBlock] = useState<Block | null>(null);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedChain, setSelectedChain] = useState<ChainId>(initialChain || selectedChains[0] || 'ethereum');
    const { getPriceForChain } = useCryptoPrices();

    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 50;
    const totalPages = Math.ceil(transactions.length / ITEMS_PER_PAGE);
    const paginatedTransactions = transactions.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

    useEffect(() => {
        setCurrentPage(1);
    }, [transactions]);

    useEffect(() => {
        async function fetchBlock() {
            setLoading(true);
            try {
                const blockNum = parseInt(number);
                const blockData = await alchemyService.getBlock(selectedChain, blockNum);
                if (blockData) {
                    setBlock(blockData);
                    const txs = await alchemyService.getBlockTransactions(selectedChain, blockNum);
                    setTransactions(txs);
                }
            } catch (error) {
                console.error('Error fetching block:', error);
            } finally {
                setLoading(false);
            }
        }
        fetchBlock();
    }, [number, selectedChain]);

    const chainLogos: Record<ChainId, string> = {
        ethereum: 'https://i.imgur.com/NKQlhQj.png',
        base: 'https://i.imgur.com/zn5hpMs.png',
        arbitrum: 'https://i.imgur.com/jmOXWlA.png',
        solana: 'https://i.imgur.com/xp7PYKk.png',
    };

    if (loading) {
        return (
            <div className="p-6 max-w-6xl mx-auto">
                <Breadcrumb items={[{ label: 'Block' }, { label: number }]} />
                <div className="card p-12 text-center">
                    <div className="w-8 h-8 rounded-full border-2 border-[var(--primary)] border-t-transparent animate-spin mx-auto mb-4" />
                    <p className="text-[var(--foreground-muted)]">Loading block {number}...</p>
                </div>
            </div>
        );
    }

    if (!block) {
        return (
            <div className="p-6 max-w-6xl mx-auto">
                <Breadcrumb items={[{ label: 'Block' }, { label: number }]} />
                <div className="card p-12 text-center">
                    <Box className="w-12 h-12 text-[var(--foreground-muted)] mx-auto mb-4" />
                    <h2 className="text-xl font-normal mb-2">Block Not Found</h2>
                    <p className="text-[var(--foreground-muted)] mb-4">Could not find block {number} on {selectedChain}</p>
                    <Link href="/app/explorer/" className="btn btn-primary">Back to Explorer</Link>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full sm:overflow-hidden overflow-y-auto w-full">
            <div className="flex flex-col sm:h-full shrink-0 p-4 sm:p-6 pb-6 max-w-7xl mx-auto w-full gap-4">
                <div>
                    <Breadcrumb items={[{ label: 'Block' }, { label: `#${number}` }]} />

                    {/* Header Row with Nav Buttons */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                        <div className="flex items-center gap-3">
                            <div>
                                <h1 className="text-base sm:text-lg font-normal">Block #{block.number.toLocaleString()}</h1>
                                <p className="text-xs text-[var(--foreground-muted)]">{format(block.timestamp * 1000, 'PPpp')}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <Link href={`/app/explorer/detail/?type=block&id=${block.number - 1}&chain=${selectedChain}`} className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background-tertiary)] text-xs hover:bg-[var(--background-secondary)] transition-colors">
                                <ChevronLeft className="w-3.5 h-3.5" /> Prev
                            </Link>
                            <Link href={`/app/explorer/detail/?type=block&id=${block.number + 1}&chain=${selectedChain}`} className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background-tertiary)] text-xs hover:bg-[var(--background-secondary)] transition-colors">
                                Next <ChevronRight className="w-3.5 h-3.5" />
                            </Link>
                            <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background-tertiary)]">
                                <img src={chainLogos[selectedChain]} alt={selectedChain} className="w-4 h-4 rounded-full" />
                                <span className="text-xs capitalize">{selectedChain}</span>
                            </div>
                        </div>
                    </div>

                    {/* Compact Block Details Card */}
                    <div className="card p-4 bg-[var(--background-secondary)]">
                        <div className="flex items-center gap-2 mb-3">
                            <span className="text-sm font-normal">Block Details</span>
                        </div>

                        {/* Compact Grid Layout */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-3">
                            <div className="flex flex-col gap-0.5">
                                <span className="text-[10px] uppercase tracking-wider text-[var(--foreground-muted)]">Block Height</span>
                                <span className="text-sm font-mono">{block.number.toLocaleString()}</span>
                            </div>
                            <div className="flex flex-col gap-0.5">
                                <span className="text-[10px] uppercase tracking-wider text-[var(--foreground-muted)]">Timestamp</span>
                                <span className="text-sm">{formatDistanceToNow(block.timestamp * 1000, { addSuffix: true })}</span>
                            </div>
                            <div className="flex flex-col gap-0.5">
                                <span className="text-[10px] uppercase tracking-wider text-[var(--foreground-muted)]">Transactions</span>
                                <span className="text-sm font-mono">{block.transactions}</span>
                            </div>
                            {block.gasUsed && (
                                <div className="flex flex-col gap-0.5">
                                    <span className="text-[10px] uppercase tracking-wider text-[var(--foreground-muted)]">Gas Used</span>
                                    <span className="text-sm font-mono">{(block.gasUsed / 1e9).toFixed(4)} Gwei</span>
                                </div>
                            )}
                        </div>

                        {/* Hashes - Compact */}
                        <div className="pt-3 border-t border-[var(--border)]/50">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <div className="flex flex-col gap-0.5">
                                        <span className="text-[10px] uppercase tracking-wider text-[var(--foreground-muted)]">Block Hash</span>
                                        <div className="flex items-center gap-2">
                                            <code className="text-xs font-mono text-[var(--primary)] truncate">{block.hash}</code>
                                            <CopyButton text={block.hash} />
                                        </div>
                                    </div>
                                    {block.parentHash && (
                                        <div className="flex flex-col gap-0.5">
                                            <span className="text-[10px] uppercase tracking-wider text-[var(--foreground-muted)]">Parent Hash</span>
                                            <div className="flex items-center gap-2">
                                                <code className="text-xs font-mono text-[var(--foreground-muted)] truncate">{block.parentHash}</code>
                                                <CopyButton text={block.parentHash} />
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {block.miner && (
                                    <div className="flex flex-col gap-0.5 md:items-end md:text-right">
                                        <span className="text-[10px] uppercase tracking-wider text-[var(--foreground-muted)]">Miner</span>
                                        <Link href={`/app/explorer/detail/?type=address&id=${block.miner}&chain=${selectedChain}`} className="text-xs font-mono text-[var(--primary)] hover:underline truncate max-w-full">{block.miner}</Link>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Transactions Section - Fixed Flex Column */}
                <div className="card h-[600px] sm:h-auto sm:flex-1 sm:min-h-0 flex flex-col bg-[var(--background-secondary)] mb-12">
                    <div className="p-4 border-b border-[var(--border)] flex-shrink-0">
                        <h2 className="font-normal text-sm flex items-center gap-2">
                            Transactions ({transactions.length || block.transactions})
                        </h2>
                    </div>

                    {transactions.length === 0 ? (
                        <div className="p-8 text-center text-[var(--foreground-muted)]">
                            <Layers className="w-10 h-10 mb-3 opacity-50 mx-auto" />
                            <p>{block.transactions > 0 ? 'Loading transactions...' : 'No transactions in this block'}</p>
                        </div>
                    ) : (
                        <div className="flex-1 overflow-y-auto overflow-x-auto divide-y divide-[var(--border)]">
                            {paginatedTransactions.map((tx) => (
                                <Link key={tx.hash} href={`/app/explorer/detail/?type=tx&id=${tx.hash}&chain=${selectedChain}`} className="flex items-center justify-between p-3 hover:bg-[var(--background-tertiary)] transition-colors min-w-[600px]">
                                    <div className="flex items-center gap-3 min-w-0 flex-1">
                                        <div className="p-2 rounded-lg bg-[var(--primary)]/10 flex-shrink-0">
                                            <Layers className="w-4 h-4 text-[var(--primary)]" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="font-mono text-sm text-[var(--primary)] truncate">{tx.hash.slice(0, 16)}...</p>
                                            <p className="text-xs text-[var(--foreground-muted)]">From: {tx.from.slice(0, 10)}...</p>
                                        </div>
                                    </div>
                                    <div className="font-mono text-sm flex-shrink-0 text-right">
                                        <span>
                                            {parseFloat(tx.value).toFixed(4)} ETH
                                            {(() => {
                                                const price = getPriceForChain(selectedChain);
                                                const val = parseFloat(tx.value);
                                                return price && !isNaN(val) ? <span className="text-[var(--foreground-muted)] ml-1.5">(~{formatCurrency(val * price)})</span> : null;
                                            })()}
                                        </span>
                                    </div>
                                </Link>
                            ))}

                            {/* Pagination Controls */}
                            {totalPages > 1 && (
                                <div className="p-4 border-t border-[var(--border)] flex items-center justify-center gap-4 bg-[var(--background-secondary)]">
                                    <button
                                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                        disabled={currentPage === 1}
                                        className="btn btn-sm btn-secondary disabled:opacity-50 flex items-center gap-1"
                                    >
                                        <ChevronLeft className="w-4 h-4" /> Prev
                                    </button>
                                    <span className="text-xs text-[var(--foreground-muted)]">
                                        Page {currentPage} of {totalPages}
                                    </span>
                                    <button
                                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                        disabled={currentPage === totalPages}
                                        className="btn btn-sm btn-secondary disabled:opacity-50 flex items-center gap-1"
                                    >
                                        Next <ChevronRight className="w-4 h-4" />
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// ============ TX DETAIL ============
function TxDetail({ hash, initialChain }: { hash: string; initialChain?: ChainId }) {
    const { selectedChains } = useAppStore();
    const [transaction, setTransaction] = useState<Transaction | null>(null);
    const [receipt, setReceipt] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [selectedChain, setSelectedChain] = useState<ChainId>(initialChain || selectedChains[0] || 'ethereum');
    const { getPriceForChain } = useCryptoPrices();

    useEffect(() => {
        async function fetchTx() {
            setLoading(true);
            try {
                const txData = await alchemyService.getTransaction(selectedChain, hash);
                if (txData) {
                    setTransaction(txData);
                    const receiptData = await alchemyService.getTransactionReceipt(selectedChain, hash);
                    setReceipt(receiptData);
                }
            } catch (error) {
                console.error('Error fetching transaction:', error);
            } finally {
                setLoading(false);
            }
        }
        fetchTx();
    }, [hash, selectedChain]);

    const chainLogos: Record<ChainId, string> = {
        ethereum: 'https://i.imgur.com/NKQlhQj.png',
        base: 'https://i.imgur.com/zn5hpMs.png',
        arbitrum: 'https://i.imgur.com/jmOXWlA.png',
        solana: 'https://i.imgur.com/xp7PYKk.png',
    };

    const shortHash = hash.length > 20 ? `${hash.slice(0, 10)}...${hash.slice(-8)}` : hash;

    if (loading) {
        return (
            <div className="p-6 max-w-6xl mx-auto">
                <Breadcrumb items={[{ label: 'Transaction' }, { label: shortHash }]} />
                <div className="card p-12 text-center">
                    <div className="w-8 h-8 rounded-full border-2 border-[var(--primary)] border-t-transparent animate-spin mx-auto mb-4" />
                    <p className="text-[var(--foreground-muted)]">Loading transaction...</p>
                </div>
            </div>
        );
    }

    if (!transaction) {
        return (
            <div className="p-6 max-w-6xl mx-auto">
                <Breadcrumb items={[{ label: 'Transaction' }, { label: shortHash }]} />
                <div className="card p-12 text-center">
                    <ArrowRightLeft className="w-12 h-12 text-[var(--foreground-muted)] mx-auto mb-4" />
                    <h2 className="text-xl font-normal mb-2">Transaction Not Found</h2>
                    <p className="text-[var(--foreground-muted)] mb-4">Could not find on {selectedChain}. Try another chain.</p>
                    <div className="flex items-center justify-center gap-2 mb-4 flex-wrap">
                        {selectedChains.filter(c => c !== 'solana').map((chain) => (
                            <button key={chain} onClick={() => setSelectedChain(chain)} className={clsx('flex items-center gap-2 px-3 py-2 rounded-lg border transition-all', selectedChain === chain ? 'border-[var(--primary)] bg-transparent' : 'border-[var(--border)]')}>
                                <img src={chainLogos[chain]} alt={chain} className="w-5 h-5 rounded-full" />
                                <span className="text-sm capitalize">{chain}</span>
                            </button>
                        ))}
                    </div>
                    <Link href="/app/explorer/" className="btn btn-primary">Back to Explorer</Link>
                </div>
            </div>
        );
    }

    const isSuccess = receipt?.status === 1 || receipt?.status === '0x1';
    const gasUsed = receipt?.gasUsed ? parseInt(receipt.gasUsed, 16) : 0;
    const gasPrice = transaction.gasPrice ? parseInt(transaction.gasPrice, 16) : 0;
    const txFee = (gasUsed * gasPrice) / 1e18;

    return (
        <div className="h-full p-4 pb-20 sm:p-6 sm:pb-6 max-w-6xl mx-auto w-full overflow-y-hidden">
            <div className="flex flex-col gap-3">
                <Breadcrumb items={[{ label: 'Transaction' }, { label: shortHash }]} />

                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className={clsx('p-2.5 rounded-xl', isSuccess ? 'bg-[var(--accent-green)]/10' : 'bg-[var(--accent-red)]/10')}>
                            {isSuccess ? <CheckCircle className="w-6 h-6 text-[var(--accent-green)]" /> : <XCircle className="w-6 h-6 text-[var(--accent-red)]" />}
                        </div>
                        <div>
                            <h1 className="text-base sm:text-lg font-normal">Transaction</h1>
                            <p className="text-sm text-[var(--foreground-muted)]">{isSuccess ? 'Success' : 'Failed'}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--background-tertiary)]">
                        <img src={chainLogos[selectedChain]} alt={selectedChain} className="w-4 h-4 rounded-full" />
                        <span className="text-sm capitalize">{selectedChain}</span>
                    </div>
                </div>

                {/* Main Card */}
                <div className="card p-4 sm:p-5 bg-[var(--background-secondary)] flex flex-col gap-3">
                    {/* Transaction Hash */}
                    <div className="flex items-center gap-2 p-3 bg-[var(--background-tertiary)] rounded-lg">
                        <Hash className="w-4 h-4 text-[var(--foreground-muted)] shrink-0" />
                        <code className="flex-1 font-mono text-xs break-all text-[var(--primary)]">{hash}</code>
                        <CopyButton text={hash} />
                    </div>

                    {/* From/To */}
                    <div className="grid grid-cols-2 gap-2.5">
                        <div className="p-2.5 bg-[var(--background-tertiary)] rounded-lg">
                            <p className="text-[10px] uppercase tracking-wider text-[var(--foreground-muted)] mb-1">From</p>
                            <Link href={`/app/explorer/detail/?type=address&id=${transaction.from}&chain=${transaction.chainId}`} className="font-mono text-xs text-[var(--primary)] hover:underline break-all">{transaction.from.slice(0, 18)}...</Link>
                        </div>
                        <div className="p-2.5 bg-[var(--background-tertiary)] rounded-lg">
                            <p className="text-[10px] uppercase tracking-wider text-[var(--foreground-muted)] mb-1">To</p>
                            {transaction.to ? (
                                <Link href={`/app/explorer/detail/?type=address&id=${transaction.to}&chain=${transaction.chainId}`} className="font-mono text-xs text-[var(--primary)] hover:underline break-all">{transaction.to.slice(0, 18)}...</Link>
                            ) : <span className="text-xs text-[var(--foreground-muted)]">Contract Creation</span>}
                        </div>
                    </div>

                    {/* Value, Block, Fee */}
                    <div className="grid grid-cols-3 gap-2.5 pt-3 border-t border-[var(--border)]/40">
                        <div>
                            <p className="text-[10px] uppercase text-[var(--foreground-muted)]">Value</p>
                            <p className="font-mono text-base">{parseFloat(transaction.value).toFixed(4)}</p>
                            <p className="text-[10px] text-[var(--foreground-muted)]">
                                {(() => {
                                    const price = getPriceForChain(transaction.chainId);
                                    const val = parseFloat(transaction.value);
                                    const symbol = transaction.chainId === 'solana' ? 'SOL' : 'ETH';
                                    return price && !isNaN(val) ? `≈${formatCurrency(val * price)}` : symbol;
                                })()}
                            </p>
                        </div>
                        <div>
                            <p className="text-[10px] uppercase text-[var(--foreground-muted)]">Block</p>
                            <Link href={`/app/explorer/detail/?type=block&id=${transaction.blockNumber}&chain=${transaction.chainId}`} className="font-mono text-base text-[var(--primary)] hover:underline">{transaction.blockNumber}</Link>
                        </div>
                        <div>
                            <p className="text-[10px] uppercase text-[var(--foreground-muted)]">Fee</p>
                            {selectedChain === 'solana' ? (
                                <>
                                    <p className="font-mono text-base">0.000005</p>
                                    <p className="text-[10px] text-[var(--foreground-muted)]">SOL (Est.)</p>
                                </>
                            ) : (
                                <>
                                    <p className="font-mono text-base">{txFee.toFixed(5)}</p>
                                    <p className="text-[10px] text-[var(--foreground-muted)]">ETH</p>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Gas Details - Hide for Solana or show different info */}
                    {selectedChain !== 'solana' && (
                        <div className="flex items-center gap-3 pt-3 border-t border-[var(--border)]/40 text-xs">
                            <Fuel className="w-4 h-4 text-[var(--foreground-muted)]" />
                            <span className="font-mono">{gasUsed.toLocaleString()}</span>
                            <span className="text-[var(--foreground-muted)]">@</span>
                            <span className="font-mono">{(gasPrice / 1e9).toFixed(1)} Gwei</span>
                            <span className="text-[var(--foreground-muted)] ml-auto">Nonce: <span className="font-mono">{transaction.nonce || 0}</span></span>
                        </div>
                    )}
                    {selectedChain === 'solana' && (
                        <div className="flex items-center gap-3 pt-3 border-t border-[var(--border)]/40 text-xs">
                            <Layers className="w-4 h-4 text-[var(--foreground-muted)]" />
                            <span className="text-[var(--foreground-muted)]">Slot: <span className="font-mono">{transaction.blockNumber}</span></span>
                            <span className="text-[var(--foreground-muted)] ml-auto">Version: <span className="font-mono">Legacy/V0</span></span>
                        </div>
                    )}
                </div>

                {/* Solana Specific Details: Instructions & Accounts */}
                {selectedChain === 'solana' && (
                    <>
                        {/* Instructions */}
                        <div className="card p-4 sm:p-5 bg-[var(--background-secondary)] flex flex-col gap-3">
                            <h3 className="font-normal text-sm flex items-center gap-2">
                                <FileCode className="w-4 h-4 text-[var(--primary)]" /> Instructions
                            </h3>
                            <div className="space-y-2">
                                {transaction.instructions?.map((ix, idx) => {
                                    const programLabel = getAddressLabel(ix.programId) || 'Unknown Program';
                                    return (
                                        <div key={idx} className="p-3 bg-[var(--background-tertiary)] rounded-lg text-xs font-mono break-all overflow-x-auto">
                                            <div className="flex items-center gap-2 mb-1 text-[var(--foreground-muted)]">
                                                <span className="text-[var(--primary)]">#{idx + 1}</span>
                                                <Link href={`/app/explorer/detail/?type=address&id=${ix.programId}&chain=solana`} className="hover:underline text-[var(--foreground)]">{programLabel} ({ix.programId})</Link>
                                            </div>
                                            {ix.parsed ? (
                                                <div className="bg-[var(--background)]/50 p-2 rounded border border-[var(--border)]/50">
                                                    <div className="text-[var(--accent-blue)] mb-1 font-bold">{ix.parsed.type}</div>
                                                    <pre className="whitespace-pre-wrap text-[var(--foreground-muted)] text-[10px]">{JSON.stringify(ix.parsed.info, null, 2)}</pre>
                                                </div>
                                            ) : (
                                                <div className="text-[var(--foreground-muted)] break-all">Raw Data: {ix.data}</div>
                                            )}
                                        </div>
                                    )
                                })}
                                {!transaction.instructions?.length && <p className="text-[var(--foreground-muted)] text-sm">No instructions found.</p>}
                            </div>
                        </div>

                        {/* Accounts */}
                        <div className="card p-4 sm:p-5 bg-[var(--background-secondary)] flex flex-col gap-3">
                            <h3 className="font-normal text-sm flex items-center gap-2">
                                <User className="w-4 h-4 text-[var(--primary)]" /> Accounts Involved
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {transaction.accounts?.map((acc, idx) => (
                                    <div key={idx} className="p-2 bg-[var(--background-tertiary)] rounded-lg flex items-center justify-between gap-2 text-xs">
                                        <div className="flex items-center gap-2 min-w-0">
                                            <span className="text-[var(--foreground-muted)] w-6 shrink-0">#{idx + 1}</span>
                                            <Link href={`/app/explorer/detail/?type=address&id=${acc.pubkey}&chain=solana`} className="font-mono text-[var(--primary)] truncate hover:underline">
                                                {getAddressLabel(acc.pubkey) || `${acc.pubkey.slice(0, 8)}...${acc.pubkey.slice(-8)}`}
                                            </Link>
                                        </div>
                                        <div className="flex items-center gap-1 shrink-0">
                                            {acc.signer && <span className="px-1.5 py-0.5 rounded bg-[var(--accent-green)]/10 text-[var(--accent-green)] text-[10px]">Signer</span>}
                                            {acc.writable && <span className="px-1.5 py-0.5 rounded bg-[var(--accent-blue)]/10 text-[var(--accent-blue)] text-[10px]">Writable</span>}
                                        </div>
                                    </div>
                                ))}
                                {!transaction.accounts?.length && <p className="text-[var(--foreground-muted)] text-sm">No accounts found.</p>}
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

// ============ ADDRESS DETAIL ============
function AddressDetail({ address, initialChain }: { address: string; initialChain?: ChainId }) {
    const { selectedChains } = useAppStore();
    const [balance, setBalance] = useState<string>('0');
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [tokens, setTokens] = useState<{ contractAddress: string; tokenBalance: string }[]>([]);
    const [activeTab, setActiveTab] = useState<'txs' | 'tokens'>('txs');
    const [pageKeys, setPageKeys] = useState<{ fromKey?: string; toKey?: string }>({});
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const { getPriceForChain } = useCryptoPrices();

    // Tracker state
    const { addWallet } = useWalletTracker();
    const [isTrackModalOpen, setIsTrackModalOpen] = useState(false);

    // Determine default chain based on address format
    const isEvmAddress = address.startsWith('0x');
    const defaultChain: ChainId = initialChain || (isEvmAddress ? 'ethereum' : 'solana');
    const [selectedChain, setSelectedChain] = useState<ChainId>(defaultChain);

    // Chain-specific configurations
    const chainConfig: Record<ChainId, { symbol: string; price: number }> = {
        ethereum: { symbol: 'ETH', price: 3500 },
        base: { symbol: 'ETH', price: 3500 },
        arbitrum: { symbol: 'ETH', price: 3500 },
        solana: { symbol: 'SOL', price: 190 },
    };

    const nativeSymbol = chainConfig[selectedChain]?.symbol || 'ETH';
    const nativePrice = chainConfig[selectedChain]?.price || 3500;

    useEffect(() => {
        async function fetchData() {
            // Skip Solana for EVM addresses and vice versa
            if (isEvmAddress && selectedChain === 'solana') {
                setBalance('0');
                setTransactions([]);
                setLoading(false);
                return;
            }
            if (!isEvmAddress && selectedChain !== 'solana') {
                setBalance('0');
                setTransactions([]);
                setLoading(false);
                return;
            }

            setLoading(true);
            try {
                const balanceData = await alchemyService.getBalance(selectedChain, address);
                setBalance(balanceData);
                const { transactions: txs, pageKeys: keys } = await alchemyService.getAddressTransactions(selectedChain, address);
                setTransactions(txs);
                setPageKeys(keys);

                // Fetch tokens (especially for Solana)
                if (selectedChain === 'solana') { // Optimized to only fetch for Solana for now or if needed
                    const tokenData = await alchemyService.getTokenBalances(selectedChain, address);
                    setTokens(tokenData);
                } else {
                    setTokens([]); // Reset or fetch for EVM if implemented
                }
            } catch (error) {
                console.error('Error fetching address:', error);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, [address, selectedChain, isEvmAddress]);

    const loadMore = async () => {
        if (!pageKeys.fromKey && !pageKeys.toKey) return;

        setLoadingMore(true);
        try {
            const { transactions: newTxs, pageKeys: newKeys } = await alchemyService.getAddressTransactions(
                selectedChain,
                address,
                25,
                pageKeys
            );

            setTransactions(prev => [...prev, ...newTxs]);
            setPageKeys(newKeys);
        } catch (error) {
            console.error('Error loading more:', error);
        } finally {
            setLoadingMore(false);
        }
    };

    const chainLogos: Record<ChainId, string> = {
        ethereum: 'https://i.imgur.com/NKQlhQj.png',
        base: 'https://i.imgur.com/zn5hpMs.png',
        arbitrum: 'https://i.imgur.com/jmOXWlA.png',
        solana: 'https://i.imgur.com/xp7PYKk.png',
    };

    const shortAddress = `${address.slice(0, 6)}...${address.slice(-4)}`;
    const usdBalance = parseFloat(balance) * nativePrice;

    const sentCount = transactions.filter(tx => tx.from.toLowerCase() === address.toLowerCase()).length;
    const recvCount = transactions.filter(tx => tx.to?.toLowerCase() === address.toLowerCase()).length;

    return (
        <div className="flex flex-col h-[calc(100dvh-100px)] sm:h-full p-2 sm:p-6 pb-0 max-w-7xl mx-auto w-full gap-2 sm:gap-6 overflow-hidden">
            {/* Top Fixed Section - Ultra Compact */}
            <div className="flex-shrink-0 bg-[var(--background)] z-10 pt-1 pb-1 border-b border-[var(--border)]/50">
                <div className="flex flex-col gap-2">
                    {/* Row 1: Address + Actions + Chain (All in one line if possible) */}
                    <div className="flex items-center justify-between gap-2 overflow-hidden">
                        <div className="flex items-center gap-2 min-w-0">
                            <div className="flex flex-col min-w-0">
                                <span className="text-[10px] text-[var(--foreground-muted)] uppercase tracking-wider leading-none">Address</span>
                                <div className="flex items-center gap-1">
                                    <code className="text-xs font-mono text-[var(--primary)] truncate">{shortAddress}</code>
                                    <CopyButton text={address} />
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 flex-shrink-0">
                            <button
                                onClick={() => setIsTrackModalOpen(true)}
                                className="flex items-center justify-center w-7 h-7 rounded-lg bg-[var(--primary)] text-black hover:opacity-90 transition-opacity"
                            >
                                <Eye className="w-4 h-4" />
                            </button>
                            {/* Chain Selector - Icon Only on Mobile */}
                            {initialChain ? (
                                <div className="flex items-center justify-center w-7 h-7 rounded-lg border border-[var(--border)] bg-[var(--background-tertiary)]">
                                    <img src={chainLogos[selectedChain]} alt={selectedChain} className="w-4 h-4 rounded-full" />
                                </div>
                            ) : (
                                <div className="flex items-center gap-1">
                                    {selectedChains.filter(c => c !== 'solana').slice(0, 3).map((chain) => (
                                        <button key={chain} onClick={() => setSelectedChain(chain)} className={clsx('w-7 h-7 flex items-center justify-center rounded-lg border transition-all', selectedChain === chain ? 'border-[var(--primary)] bg-transparent' : 'border-[var(--border)]')}>
                                            <img src={chainLogos[chain]} alt={chain} className="w-4 h-4 rounded-full" />
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Row 2: Balance + Stats Grid */}
                    <div className="grid grid-cols-2 gap-2">
                        {/* Balance - Very Compact */}
                        <div className="p-2 rounded-lg bg-gradient-to-br from-[var(--background-secondary)] to-[var(--background-tertiary)] flex flex-col justify-center">
                            <span className="text-[9px] text-[var(--foreground-muted)] uppercase tracking-wider mb-0.5">Balance</span>
                            <div className="flex items-baseline gap-1.5 flex-wrap">
                                <span className="text-base font-mono leading-none">{parseFloat(balance).toFixed(4)}</span>
                                <span className="text-[10px] text-[var(--foreground-muted)]">{nativeSymbol}</span>
                            </div>
                            <span className="text-[10px] text-[var(--foreground-muted)] leading-none mt-1">≈ ${usdBalance.toLocaleString('en-US', { useGrouping: false, maximumFractionDigits: 0 })}</span>
                        </div>

                        {/* Mini Stats Grid - 2x2 inside the right column */}
                        <div className="grid grid-cols-2 gap-1.5">
                            {/* Txs */}
                            <div className="bg-[var(--background-secondary)] rounded-lg p-1.5 flex flex-col justify-center text-center border border-[var(--border)]/30">
                                <span className="text-[8px] text-[var(--foreground-muted)] uppercase tracking-wider leading-none mb-0.5">Txs</span>
                                <span className="text-xs font-mono leading-none">{transactions.length}</span>
                            </div>
                            {/* Tokens */}
                            <div className="bg-[var(--background-secondary)] rounded-lg p-1.5 flex flex-col justify-center text-center border border-[var(--border)]/30 cursor-pointer hover:bg-[var(--background-tertiary)]" onClick={() => setActiveTab('tokens')}>
                                <span className="text-[8px] text-[var(--foreground-muted)] uppercase tracking-wider leading-none mb-0.5">Tokens</span>
                                <span className="text-xs font-mono leading-none text-[var(--foreground-muted)]">{tokens.length > 0 ? tokens.length : '-'}</span>
                            </div>
                            {/* Sent */}
                            <div className="bg-[var(--background-secondary)] rounded-lg p-1.5 flex flex-col justify-center text-center border border-[var(--border)]/30">
                                <span className="text-[8px] text-[var(--accent-red)] uppercase tracking-wider leading-none mb-0.5">Out</span>
                                <span className="text-xs font-mono leading-none">{sentCount}</span>
                            </div>
                            {/* Recv */}
                            <div className="bg-[var(--background-secondary)] rounded-lg p-1.5 flex flex-col justify-center text-center border border-[var(--border)]/30">
                                <span className="text-[8px] text-[var(--accent-green)] uppercase tracking-wider leading-none mb-0.5">In</span>
                                <span className="text-xs font-mono leading-none">{recvCount}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom Scrollable Transactions */}
            {/* Bottom Scrollable Section with Tabs */}
            <div className="card flex-1 min-h-0 flex flex-col overflow-hidden p-0 mb-0 sm:mb-6 bg-[var(--background-secondary)] shadow-none sm:shadow-md border-0 sm:border">
                {/* Tabs */}
                <div className="flex items-center gap-1 p-2 border-b border-[var(--border)] bg-[var(--background-tertiary)]/50 shrink-0">
                    <button onClick={() => setActiveTab('txs')} className={clsx("px-3 py-1.5 rounded-md text-xs font-medium transition-colors", activeTab === 'txs' ? "bg-[var(--background-secondary)] text-[var(--foreground)] shadow-sm" : "text-[var(--foreground-muted)] hover:text-[var(--foreground)]")}>
                        Transactions
                    </button>
                    <button onClick={() => setActiveTab('tokens')} className={clsx("px-3 py-1.5 rounded-md text-xs font-medium transition-colors", activeTab === 'tokens' ? "bg-[var(--background-secondary)] text-[var(--foreground)] shadow-sm" : "text-[var(--foreground-muted)] hover:text-[var(--foreground)]")}>
                        Holdings
                    </button>
                </div>

                {/* Content */}
                {activeTab === 'txs' ? (
                    <>
                        {loading ? (
                            <div className="p-8 text-center flex-1 flex items-center justify-center">
                                <div className="w-8 h-8 rounded-full border-2 border-[var(--primary)] border-t-transparent animate-spin" />
                            </div>
                        ) : transactions.length === 0 ? (
                            <div className="p-12 text-center text-[var(--foreground-muted)] flex-1 flex flex-col items-center justify-center">
                                <ArrowRightLeft className="w-12 h-12 mb-4 opacity-50" />
                                <p>No transactions found</p>
                            </div>
                        ) : (
                            <div className="overflow-y-auto flex-1 overscroll-contain divide-y divide-[var(--border)] pb-40 sm:pb-0">
                                {transactions.map((tx) => {
                                    const isSent = tx.from.toLowerCase() === address.toLowerCase();
                                    return (
                                        <Link key={tx.hash} href={`/app/explorer/detail/?type=tx&id=${tx.hash}&chain=${tx.chainId}`} className="flex items-center gap-3 p-2.5 sm:p-4 hover:bg-[var(--background-tertiary)] transition-colors group">
                                            <div className={clsx('p-2 rounded-full flex-shrink-0 transition-colors', isSent ? 'bg-[var(--accent-red)]/10 group-hover:bg-[var(--accent-red)]/20' : 'bg-[var(--accent-green)]/10 group-hover:bg-[var(--accent-green)]/20')}>
                                                {isSent ? <ArrowUpRight className="w-4 h-4 text-[var(--accent-red)]" /> : <ArrowDownLeft className="w-4 h-4 text-[var(--accent-green)]" />}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between mb-0.5 gap-2">
                                                    <span className="text-xs sm:text-sm shrink-0 font-medium">{isSent ? 'Sent' : 'Received'}</span>
                                                    <span className={clsx('text-xs sm:text-sm flex items-center justify-end gap-1.5 min-w-0 truncate', isSent ? 'text-[var(--accent-red)]' : 'text-[var(--accent-green)]')}>
                                                        <span className="truncate max-w-[120px] sm:max-w-none">{isSent ? '-' : '+'}{parseFloat(tx.value).toLocaleString(undefined, { maximumFractionDigits: 4 })} {tx.asset || nativeSymbol}</span>
                                                        {(() => {
                                                            const isNative = !tx.asset || tx.asset === nativeSymbol || tx.asset === 'ETH' || tx.asset === 'SOL';
                                                            if (!isNative) return null;

                                                            const price = getPriceForChain(tx.chainId);
                                                            const val = parseFloat(tx.value);
                                                            return price && !isNaN(val) ? <span className="text-[var(--foreground-muted)] text-[10px] sm:text-xs font-normal shrink-0">(≈{formatCurrency(val * price)})</span> : null;
                                                        })()}
                                                    </span>
                                                </div>
                                                <div className="flex items-center justify-between text-[10px] sm:text-xs text-[var(--foreground-muted)]">
                                                    <span className="truncate opacity-70 hover:opacity-100 transition-opacity max-w-[100px]">{isSent ? `To: ${tx.to?.slice(0, 8)}...` : `From: ${tx.from.slice(0, 8)}...`}</span>
                                                    <span className="flex items-center gap-1 whitespace-nowrap"><Clock className="w-3 h-3" />{formatDistanceToNow(tx.timestamp * 1000, { addSuffix: true })}</span>
                                                </div>
                                            </div>
                                        </Link>
                                    );
                                })}

                                {/* Load More Button */}
                                {(pageKeys.fromKey || pageKeys.toKey) && (
                                    <div className="p-4 text-center">
                                        <button
                                            onClick={loadMore}
                                            disabled={loadingMore}
                                            className="btn btn-secondary w-full py-2 text-sm disabled:opacity-50"
                                        >
                                            {loadingMore ? 'Loading...' : 'Load More Transactions'}
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </>
                ) : (
                    <div className="overflow-y-auto flex-1 p-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                            {tokens.map((token, i) => (
                                <div key={i} className="p-3 bg-[var(--background-tertiary)] rounded-lg border border-[var(--border)]/30 hover:border-[var(--primary)]/30 transition-colors">
                                    <div className="flex items-start justify-between gap-2 mb-2">
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 rounded-full bg-[var(--background-secondary)] flex items-center justify-center">
                                                <Coins className="w-4 h-4 text-[var(--foreground-muted)]" />
                                            </div>
                                            <div className="flex flex-col min-w-0">
                                                <Link href={`/app/explorer/detail/?type=address&id=${token.contractAddress}&chain=solana`} className="text-xs font-mono text-[var(--primary)] hover:underline truncate">
                                                    {token.contractAddress.slice(0, 4)}...{token.contractAddress.slice(-4)}
                                                </Link>
                                                <span className="text-[10px] text-[var(--foreground-muted)] uppercase">Token</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="font-mono text-lg font-medium truncate" title={token.tokenBalance}>
                                        {token.tokenBalance}
                                    </div>
                                </div>
                            ))}
                            {tokens.length === 0 && (
                                <div className="col-span-full h-full flex flex-col items-center justify-center p-12 text-[var(--foreground-muted)]">
                                    <Coins className="w-12 h-12 mb-3 opacity-20" />
                                    <p>No tokens found or API not supported for this chain.</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            <AddWalletModal
                isOpen={isTrackModalOpen}
                onClose={() => setIsTrackModalOpen(false)}
                onAdd={addWallet}
                initialAddress={address}
            />
        </div>
    );
}

// ============ HELPER COMPONENTS ============
function InfoRow({ label, value, mono = false, copyable = false, icon }: { label: string; value: React.ReactNode; mono?: boolean; copyable?: boolean; icon?: React.ReactNode }) {
    return (
        <div className="flex flex-col gap-1">
            <span className="text-xs text-[var(--foreground-muted)] flex items-center gap-1.5">{icon}{label}</span>
            <div className="flex items-center gap-2">
                <span className={clsx('text-sm break-all', mono && 'font-mono')}>{value}</span>
                {copyable && typeof value === 'string' && <CopyButton text={value} />}
            </div>
        </div>
    );
}

function CopyButton({ text }: { text: string }) {
    const [copied, setCopied] = useState(false);
    const handleCopy = () => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); };
    return (
        <button onClick={handleCopy} className="p-2 -m-1 rounded-lg hover:bg-[var(--background-tertiary)] transition-colors relative z-20">
            {copied ? <Check className="w-3.5 h-3.5 text-[var(--accent-green)]" /> : <Copy className="w-3.5 h-3.5 text-[var(--foreground-muted)]" />}
        </button>
    );
}
