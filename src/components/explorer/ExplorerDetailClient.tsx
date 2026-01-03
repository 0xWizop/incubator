'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAppStore } from '@/store';
import { Block, Transaction, ChainId } from '@/types';
import * as alchemyService from '@/lib/services/alchemy';
import { Breadcrumb } from '@/components/explorer';
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
} from 'lucide-react';
import { clsx } from 'clsx';
import { formatDistanceToNow, format } from 'date-fns';

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
                    <h2 className="text-xl font-bold mb-2">Invalid Request</h2>
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
                <h2 className="text-xl font-bold mb-2">Unknown Type</h2>
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
                    <h2 className="text-xl font-bold mb-2">Block Not Found</h2>
                    <p className="text-[var(--foreground-muted)] mb-4">Could not find block {number} on {selectedChain}</p>
                    <Link href="/app/explorer/" className="btn btn-primary">Back to Explorer</Link>
                </div>
            </div>
        );
    }

    return (
        <div className="p-4 sm:p-6 max-w-6xl mx-auto pb-20 lg:pb-6">
            <Breadcrumb items={[{ label: 'Block' }, { label: `#${number}` }]} />

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-3">
                    <div className="p-3 rounded-xl bg-[var(--accent-blue)]/10">
                        <Box className="w-6 h-6 text-[var(--accent-blue)]" />
                    </div>
                    <div>
                        <h1 className="text-xl sm:text-2xl font-bold">Block #{block.number.toLocaleString()}</h1>
                        <p className="text-sm text-[var(--foreground-muted)]">{format(block.timestamp * 1000, 'PPpp')}</p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-[var(--primary)] bg-[var(--primary)]/10">
                        <img src={chainLogos[selectedChain]} alt={selectedChain} className="w-5 h-5 rounded-full" />
                        <span className="text-sm font-medium capitalize">{selectedChain}</span>
                    </div>
                </div>
            </div>

            <div className="flex items-center justify-between mb-6">
                <Link href={`/app/explorer/detail/?type=block&id=${block.number - 1}`} className="btn btn-secondary text-sm">
                    <ChevronLeft className="w-4 h-4" /> Previous
                </Link>
                <Link href={`/app/explorer/detail/?type=block&id=${block.number + 1}`} className="btn btn-secondary text-sm">
                    Next <ChevronRight className="w-4 h-4" />
                </Link>
            </div>

            <div className="card p-4 sm:p-6 mb-6">
                <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <Hash className="w-5 h-5 text-[var(--foreground-muted)]" /> Block Details
                </h2>
                <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <InfoRow label="Block Height" value={block.number.toLocaleString()} />
                        <InfoRow label="Timestamp" value={formatDistanceToNow(block.timestamp * 1000, { addSuffix: true })} />
                    </div>
                    <div className="border-t border-[var(--border)] pt-4">
                        <InfoRow label="Block Hash" value={block.hash} mono copyable />
                    </div>
                    {block.parentHash && <InfoRow label="Parent Hash" value={block.parentHash} mono copyable />}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-t border-[var(--border)] pt-4">
                        <InfoRow label="Transactions" value={block.transactions.toString()} icon={<Layers className="w-4 h-4" />} />
                        {block.gasUsed && <InfoRow label="Gas Used" value={`${(block.gasUsed / 1e9).toFixed(4)} Gwei`} icon={<Fuel className="w-4 h-4" />} />}
                    </div>
                    {block.miner && (
                        <div className="border-t border-[var(--border)] pt-4">
                            <InfoRow
                                label="Miner"
                                value={<Link href={`/app/explorer/detail/?type=address&id=${block.miner}`} className="text-[var(--primary)] hover:underline font-mono text-sm">{block.miner}</Link>}
                                icon={<User className="w-4 h-4" />}
                            />
                        </div>
                    )}
                </div>
            </div>

            <div className="card p-0 overflow-hidden">
                <div className="p-4 border-b border-[var(--border)]">
                    <h2 className="font-bold flex items-center gap-2">
                        <Layers className="w-5 h-5 text-[var(--accent-green)]" /> Transactions ({transactions.length})
                    </h2>
                </div>
                {transactions.length === 0 ? (
                    <div className="p-8 text-center text-[var(--foreground-muted)]">No transactions in this block</div>
                ) : (
                    <div className="divide-y divide-[var(--border)] max-h-[400px] overflow-y-auto">
                        {transactions.slice(0, 20).map((tx) => (
                            <Link key={tx.hash} href={`/app/explorer/detail/?type=tx&id=${tx.hash}&chain=${selectedChain}`} className="flex items-center justify-between p-4 hover:bg-[var(--background-tertiary)] transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-[var(--background-secondary)]">
                                        <Layers className="w-4 h-4 text-[var(--foreground-muted)]" />
                                    </div>
                                    <div>
                                        <p className="font-mono text-sm text-[var(--primary)]">{tx.hash.slice(0, 16)}...</p>
                                        <p className="text-xs text-[var(--foreground-muted)]">From: {tx.from.slice(0, 8)}...</p>
                                    </div>
                                </div>
                                <p className="font-mono text-sm">{parseFloat(tx.value).toFixed(4)} ETH</p>
                            </Link>
                        ))}
                    </div>
                )}
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
                    <h2 className="text-xl font-bold mb-2">Transaction Not Found</h2>
                    <p className="text-[var(--foreground-muted)] mb-4">Could not find on {selectedChain}. Try another chain.</p>
                    <div className="flex items-center justify-center gap-2 mb-4 flex-wrap">
                        {selectedChains.filter(c => c !== 'solana').map((chain) => (
                            <button key={chain} onClick={() => setSelectedChain(chain)} className={clsx('flex items-center gap-2 px-3 py-2 rounded-lg border transition-all', selectedChain === chain ? 'border-[var(--primary)] bg-[var(--primary)]/10' : 'border-[var(--border)]')}>
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
        <div className="p-4 sm:p-6 max-w-6xl mx-auto pb-20 lg:pb-6">
            <Breadcrumb items={[{ label: 'Transaction' }, { label: shortHash }]} />

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-3">
                    <div className={clsx('p-3 rounded-xl', isSuccess ? 'bg-[var(--accent-green)]/10' : 'bg-[var(--accent-red)]/10')}>
                        {isSuccess ? <CheckCircle className="w-6 h-6 text-[var(--accent-green)]" /> : <XCircle className="w-6 h-6 text-[var(--accent-red)]" />}
                    </div>
                    <div>
                        <h1 className="text-xl sm:text-2xl font-bold">Transaction Details</h1>
                        <p className="text-sm text-[var(--foreground-muted)]">{isSuccess ? 'Success' : 'Failed'}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-[var(--primary)] bg-[var(--primary)]/10">
                        <img src={chainLogos[selectedChain]} alt={selectedChain} className="w-5 h-5 rounded-full" />
                        <span className="text-sm font-medium capitalize">{selectedChain}</span>
                    </div>
                </div>
            </div>

            <div className="card p-4 sm:p-6 mb-6">
                <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><Hash className="w-5 h-5" /> Transaction Hash</h2>
                <div className="flex items-center gap-3 p-3 bg-[var(--background-tertiary)] rounded-xl">
                    <code className="flex-1 font-mono text-sm break-all">{hash}</code>
                    <CopyButton text={hash} />
                </div>
            </div>

            <div className="card p-4 sm:p-6 mb-6">
                <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><User className="w-5 h-5" /> Parties</h2>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                    <div className="flex-1 p-4 bg-[var(--background-tertiary)] rounded-xl">
                        <p className="text-xs text-[var(--foreground-muted)] mb-1">From</p>
                        <Link href={`/app/explorer/detail/?type=address&id=${transaction.from}`} className="font-mono text-sm text-[var(--primary)] hover:underline break-all">{transaction.from}</Link>
                    </div>
                    <ArrowRight className="w-5 h-5 text-[var(--foreground-muted)] hidden sm:block" />
                    <div className="flex-1 p-4 bg-[var(--background-tertiary)] rounded-xl">
                        <p className="text-xs text-[var(--foreground-muted)] mb-1">To</p>
                        {transaction.to ? (
                            <Link href={`/app/explorer/detail/?type=address&id=${transaction.to}`} className="font-mono text-sm text-[var(--primary)] hover:underline break-all">{transaction.to}</Link>
                        ) : <span className="text-sm text-[var(--foreground-muted)]">Contract Creation</span>}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                <div className="card p-4">
                    <p className="text-xs text-[var(--foreground-muted)] mb-1">Value</p>
                    <p className="font-bold text-lg">{parseFloat(transaction.value).toFixed(6)} ETH</p>
                </div>
                <div className="card p-4">
                    <p className="text-xs text-[var(--foreground-muted)] mb-1">Block</p>
                    <Link href={`/app/explorer/detail/?type=block&id=${transaction.blockNumber}`} className="font-bold text-lg text-[var(--primary)] hover:underline">{transaction.blockNumber}</Link>
                </div>
                <div className="card p-4">
                    <p className="text-xs text-[var(--foreground-muted)] mb-1">Fee</p>
                    <p className="font-bold text-lg">{txFee.toFixed(6)} ETH</p>
                </div>
            </div>

            <div className="card p-4 sm:p-6">
                <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><Fuel className="w-5 h-5" /> Gas Details</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    <div><p className="text-xs text-[var(--foreground-muted)] mb-1">Gas Used</p><p className="font-mono text-sm">{gasUsed.toLocaleString()}</p></div>
                    <div><p className="text-xs text-[var(--foreground-muted)] mb-1">Gas Price</p><p className="font-mono text-sm">{(gasPrice / 1e9).toFixed(2)} Gwei</p></div>
                    <div><p className="text-xs text-[var(--foreground-muted)] mb-1">Nonce</p><p className="font-mono text-sm">{transaction.nonce || 0}</p></div>
                </div>
            </div>
        </div>
    );
}

// ============ ADDRESS DETAIL ============
function AddressDetail({ address, initialChain }: { address: string; initialChain?: ChainId }) {
    const { selectedChains } = useAppStore();
    const [balance, setBalance] = useState<string>('0');
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);

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
                const txs = await alchemyService.getAddressTransactions(selectedChain, address);
                setTransactions(txs);
            } catch (error) {
                console.error('Error fetching address:', error);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, [address, selectedChain, isEvmAddress]);

    const chainLogos: Record<ChainId, string> = {
        ethereum: 'https://i.imgur.com/NKQlhQj.png',
        base: 'https://i.imgur.com/zn5hpMs.png',
        arbitrum: 'https://i.imgur.com/jmOXWlA.png',
        solana: 'https://i.imgur.com/xp7PYKk.png',
    };

    const shortAddress = `${address.slice(0, 6)}...${address.slice(-4)}`;
    const usdBalance = parseFloat(balance) * nativePrice;

    return (
        <div className="p-4 sm:p-6 max-w-6xl mx-auto pb-20 lg:pb-6">
            <Breadcrumb items={[{ label: 'Address' }, { label: shortAddress }]} />

            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
                <div className="flex items-start gap-3">
                    <div className="p-3 rounded-xl bg-gradient-to-br from-[var(--primary)]/20 to-[var(--accent-purple)]/20">
                        <User className="w-6 h-6 text-[var(--primary)]" />
                    </div>
                    <div>
                        <h1 className="text-xl sm:text-2xl font-bold mb-1">Address</h1>
                        <div className="flex items-center gap-2">
                            <code className="font-mono text-sm text-[var(--foreground-muted)] break-all">{address}</code>
                            <CopyButton text={address} />
                        </div>
                    </div>
                </div>
                {/* Only show chain selector if no chain was explicitly provided */}
                {initialChain ? (
                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-[var(--primary)] bg-[var(--primary)]/10">
                        <img src={chainLogos[selectedChain]} alt={selectedChain} className="w-5 h-5 rounded-full" />
                        <span className="text-sm font-medium capitalize">{selectedChain}</span>
                    </div>
                ) : (
                    <div className="flex items-center gap-2 flex-wrap">
                        {selectedChains.filter(c => c !== 'solana').map((chain) => (
                            <button key={chain} onClick={() => setSelectedChain(chain)} className={clsx('flex items-center gap-2 px-3 py-2 rounded-lg border transition-all', selectedChain === chain ? 'border-[var(--primary)] bg-[var(--primary)]/10' : 'border-[var(--border)]')}>
                                <img src={chainLogos[chain]} alt={chain} className="w-5 h-5 rounded-full" />
                                <span className="text-sm capitalize">{chain}</span>
                            </button>
                        ))}
                    </div>
                )}
            </div>

            <div className="card p-6 mb-6 bg-gradient-to-br from-[var(--background-secondary)] to-[var(--background-tertiary)]">
                <div className="flex items-center gap-2 mb-4">
                    <Wallet className="w-5 h-5 text-[var(--foreground-muted)]" />
                    <span className="text-sm text-[var(--foreground-muted)] capitalize">Balance on {selectedChain}</span>
                </div>
                {loading ? (
                    <div className="h-12 w-48 bg-[var(--background-tertiary)] rounded animate-pulse" />
                ) : (
                    <>
                        <p className="text-3xl sm:text-4xl font-bold font-mono mb-1">{parseFloat(balance).toFixed(4)} <span className="text-lg">{nativeSymbol}</span></p>
                        <p className="text-lg text-[var(--foreground-muted)]">≈ ${usdBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                    </>
                )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                <div className="card p-4">
                    <div className="flex items-center gap-2 mb-2 text-[var(--foreground-muted)]"><ArrowRightLeft className="w-5 h-5" /><span className="text-xs">Transactions</span></div>
                    <p className="font-bold text-xl font-mono">{transactions.length}</p>
                </div>
                <div className="card p-4">
                    <div className="flex items-center gap-2 mb-2 text-[var(--foreground-muted)]"><ArrowUpRight className="w-5 h-5 text-[var(--accent-red)]" /><span className="text-xs">Sent</span></div>
                    <p className="font-bold text-xl font-mono">{transactions.filter(tx => tx.from.toLowerCase() === address.toLowerCase()).length}</p>
                </div>
                <div className="card p-4">
                    <div className="flex items-center gap-2 mb-2 text-[var(--foreground-muted)]"><ArrowDownLeft className="w-5 h-5 text-[var(--accent-green)]" /><span className="text-xs">Received</span></div>
                    <p className="font-bold text-xl font-mono">{transactions.filter(tx => tx.to?.toLowerCase() === address.toLowerCase()).length}</p>
                </div>
                <div className="card p-4">
                    <div className="flex items-center gap-2 mb-2 text-[var(--foreground-muted)]"><Coins className="w-5 h-5 text-[var(--accent-yellow)]" /><span className="text-xs">Tokens</span></div>
                    <p className="font-bold text-xl font-mono">—</p>
                </div>
            </div>

            <div className="card p-0 overflow-hidden">
                <div className="p-4 border-b border-[var(--border)]">
                    <h2 className="font-bold flex items-center gap-2"><Activity className="w-5 h-5 text-[var(--accent-green)]" /> Recent Transactions</h2>
                </div>
                {loading ? (
                    <div className="p-8 text-center">
                        <div className="w-8 h-8 rounded-full border-2 border-[var(--primary)] border-t-transparent animate-spin mx-auto mb-4" />
                    </div>
                ) : transactions.length === 0 ? (
                    <div className="p-12 text-center text-[var(--foreground-muted)]"><ArrowRightLeft className="w-12 h-12 mx-auto mb-4 opacity-50" /><p>No transactions found</p></div>
                ) : (
                    <div className="divide-y divide-[var(--border)] max-h-[500px] overflow-y-auto">
                        {transactions.map((tx) => {
                            const isSent = tx.from.toLowerCase() === address.toLowerCase();
                            return (
                                <Link key={tx.hash} href={`/app/explorer/detail/?type=tx&id=${tx.hash}`} className="flex items-center gap-4 p-4 hover:bg-[var(--background-tertiary)] transition-colors">
                                    <div className={clsx('p-2 rounded-full', isSent ? 'bg-[var(--accent-red)]/10' : 'bg-[var(--accent-green)]/10')}>
                                        {isSent ? <ArrowUpRight className="w-5 h-5 text-[var(--accent-red)]" /> : <ArrowDownLeft className="w-5 h-5 text-[var(--accent-green)]" />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="font-medium text-sm">{isSent ? 'Sent' : 'Received'}</span>
                                            <span className={clsx('font-mono text-sm font-medium', isSent ? 'text-[var(--accent-red)]' : 'text-[var(--accent-green)]')}>{isSent ? '-' : '+'}{parseFloat(tx.value).toFixed(4)} ETH</span>
                                        </div>
                                        <div className="flex items-center justify-between text-xs text-[var(--foreground-muted)]">
                                            <span className="font-mono truncate">{isSent ? `To: ${tx.to?.slice(0, 12)}...` : `From: ${tx.from.slice(0, 12)}...`}</span>
                                            <span className="flex items-center gap-1 whitespace-nowrap"><Clock className="w-3 h-3" />{formatDistanceToNow(tx.timestamp * 1000, { addSuffix: true })}</span>
                                        </div>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                )}
            </div>
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
        <button onClick={handleCopy} className="p-1 rounded hover:bg-[var(--background-tertiary)] transition-colors">
            {copied ? <Check className="w-3.5 h-3.5 text-[var(--accent-green)]" /> : <Copy className="w-3.5 h-3.5 text-[var(--foreground-muted)]" />}
        </button>
    );
}
