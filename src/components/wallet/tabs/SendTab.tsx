'use client';

import { useState } from 'react';
import { ArrowUpRight, ChevronDown, AlertTriangle, Clock, Loader2, CheckCircle, XCircle, ExternalLink } from 'lucide-react';
import { clsx } from 'clsx';
import { useWalletStore } from '@/store/walletStore';
import { CHAINS, sendEvmTransaction, sendSolanaTransaction, ChainType } from '@/lib/wallet';

export function SendTab() {
    const { activeWallet, balances, activeChain, refreshBalances } = useWalletStore();

    const [amount, setAmount] = useState('');
    const [recipient, setRecipient] = useState('');
    const [selectedToken, setSelectedToken] = useState(activeWallet?.type === 'solana' ? 'SOL' : 'ETH');
    const [isValidAddress, setIsValidAddress] = useState<boolean | null>(null);
    const [isSending, setIsSending] = useState(false);
    const [txResult, setTxResult] = useState<{ success: boolean; hash?: string; error?: string } | null>(null);

    const currentBalance = activeWallet
        ? balances[`${activeWallet.address}-${activeChain}`] || '0'
        : '0';

    const chainConfig = activeWallet?.type === 'solana' ? CHAINS.solana : CHAINS[activeChain];
    const price = activeWallet?.type === 'solana' ? 180 : 3500;
    const valueUsd = amount ? parseFloat(amount) * price : 0;

    // Validate address format
    const validateAddress = (address: string) => {
        if (!address) {
            setIsValidAddress(null);
            return;
        }

        if (activeWallet?.type === 'solana') {
            // Solana addresses are base58, 32-44 chars
            setIsValidAddress(address.length >= 32 && address.length <= 44);
        } else {
            // EVM addresses start with 0x and are 42 chars
            setIsValidAddress(/^0x[a-fA-F0-9]{40}$/.test(address));
        }
    };

    const handleSend = async () => {
        if (!activeWallet || !amount || !recipient || !isValidAddress) return;

        setIsSending(true);
        setTxResult(null);

        try {
            let result;
            if (activeWallet.type === 'solana') {
                result = await sendSolanaTransaction(activeWallet.address, recipient, amount);
            } else {
                result = await sendEvmTransaction(activeWallet.address, recipient, amount, activeChain as ChainType);
            }

            setTxResult(result);

            if (result.success) {
                // Clear form on success
                setAmount('');
                setRecipient('');
                setIsValidAddress(null);
                // Refresh balance
                refreshBalances();
            }
        } catch (error: any) {
            setTxResult({ success: false, error: error.message || 'Transaction failed' });
        } finally {
            setIsSending(false);
        }
    };

    const getExplorerUrl = (hash: string) => {
        if (activeWallet?.type === 'solana') {
            return `https://solscan.io/tx/${hash}`;
        }
        const explorers: Record<string, string> = {
            ethereum: `https://etherscan.io/tx/${hash}`,
            base: `https://basescan.org/tx/${hash}`,
            arbitrum: `https://arbiscan.io/tx/${hash}`,
        };
        return explorers[activeChain] || explorers.ethereum;
    };

    // Reset result when inputs change
    const handleAmountChange = (value: string) => {
        setAmount(value);
        setTxResult(null);
    };

    const handleRecipientChange = (value: string) => {
        setRecipient(value);
        validateAddress(value);
        setTxResult(null);
    };

    return (
        <div className="space-y-4">
            {/* Transaction Result */}
            {txResult && (
                <div className={clsx(
                    'p-4 rounded-xl border flex items-start gap-3',
                    txResult.success
                        ? 'bg-[var(--accent-green)]/10 border-[var(--accent-green)]/20'
                        : 'bg-[var(--accent-red)]/10 border-[var(--accent-red)]/20'
                )}>
                    {txResult.success ? (
                        <CheckCircle className="w-5 h-5 text-[var(--accent-green)] flex-shrink-0" />
                    ) : (
                        <XCircle className="w-5 h-5 text-[var(--accent-red)] flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                        <p className={clsx('font-medium text-sm', txResult.success ? 'text-[var(--accent-green)]' : 'text-[var(--accent-red)]')}>
                            {txResult.success ? 'Transaction Sent!' : 'Transaction Failed'}
                        </p>
                        {txResult.hash && (
                            <a
                                href={getExplorerUrl(txResult.hash)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-[var(--primary)] hover:underline flex items-center gap-1 mt-1"
                            >
                                View on Explorer <ExternalLink className="w-3 h-3" />
                            </a>
                        )}
                        {txResult.error && (
                            <p className="text-xs text-[var(--foreground-muted)] mt-1">{txResult.error}</p>
                        )}
                    </div>
                </div>
            )}

            {/* Token Selection */}
            <div className="p-4 rounded-2xl bg-[var(--background-tertiary)] border border-[var(--border)]">
                <label className="block text-xs text-[var(--foreground-muted)] mb-2">Asset to send</label>
                <button className="w-full flex items-center gap-3 p-3 rounded-xl bg-[var(--background)] border border-[var(--border)] hover:border-[var(--border-hover)] transition-all">
                    <img src={chainConfig.logo} alt={selectedToken} className="w-8 h-8 rounded-full" />
                    <div className="flex-1 text-left">
                        <p className="font-medium">{selectedToken}</p>
                        <p className="text-xs text-[var(--foreground-muted)]">
                            Balance: {parseFloat(currentBalance).toFixed(4)}
                        </p>
                    </div>
                    <ChevronDown className="w-5 h-5 text-[var(--foreground-muted)]" />
                </button>
            </div>

            {/* Amount Input */}
            <div className="p-4 rounded-2xl bg-[var(--background-tertiary)] border border-[var(--border)]">
                <div className="flex justify-between mb-2">
                    <label className="text-xs text-[var(--foreground-muted)]">Amount</label>
                    <span className="text-xs text-[var(--foreground-muted)]">
                        ≈ ${valueUsd.toFixed(2)} USD
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    <input
                        type="number"
                        value={amount}
                        onChange={(e) => handleAmountChange(e.target.value)}
                        placeholder="0.00"
                        disabled={isSending}
                        className="flex-1 bg-transparent text-2xl font-mono font-bold outline-none placeholder:text-[var(--foreground-muted)]/30 disabled:opacity-50"
                    />
                    <span className="text-lg font-medium text-[var(--foreground-muted)]">{selectedToken}</span>
                </div>
                {parseFloat(currentBalance) > 0 && (
                    <div className="flex gap-2 mt-3">
                        {[25, 50, 75, 100].map((pct) => (
                            <button
                                key={pct}
                                onClick={() => handleAmountChange((parseFloat(currentBalance) * pct / 100).toFixed(6))}
                                disabled={isSending}
                                className="flex-1 py-1.5 text-xs font-medium rounded-lg bg-[var(--background)] hover:bg-[var(--background-tertiary)] hover:text-[var(--primary)] transition-all disabled:opacity-50"
                            >
                                {pct === 100 ? 'MAX' : `${pct}%`}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Recipient Address */}
            <div className="p-4 rounded-2xl bg-[var(--background-tertiary)] border border-[var(--border)]">
                <label className="block text-xs text-[var(--foreground-muted)] mb-2">Recipient address</label>
                <input
                    type="text"
                    value={recipient}
                    onChange={(e) => handleRecipientChange(e.target.value)}
                    placeholder={activeWallet?.type === 'solana' ? 'Enter Solana address' : 'Enter 0x address'}
                    disabled={isSending}
                    className={clsx(
                        'w-full bg-transparent text-sm font-mono outline-none placeholder:text-[var(--foreground-muted)]/30 disabled:opacity-50',
                        isValidAddress === false && 'text-[var(--accent-red)]'
                    )}
                />
                {isValidAddress === false && (
                    <p className="text-xs text-[var(--accent-red)] mt-2 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        Invalid address format
                    </p>
                )}
            </div>

            {/* Network Fee */}
            {amount && recipient && isValidAddress && (
                <div className="p-3 rounded-xl bg-[var(--background-tertiary)]/50 border border-[var(--border)]">
                    <div className="flex justify-between text-sm">
                        <span className="text-[var(--foreground-muted)]">Network Fee</span>
                        <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-[var(--foreground-muted)]" />
                            ~${activeWallet?.type === 'solana' ? '0.01' : '2.50'}
                        </span>
                    </div>
                </div>
            )}

            {/* Warning */}
            <div className="flex gap-3 p-3 rounded-xl bg-[var(--accent-yellow)]/10 border border-[var(--accent-yellow)]/20">
                <AlertTriangle className="w-5 h-5 text-[var(--accent-yellow)] flex-shrink-0" />
                <p className="text-xs text-[var(--foreground-muted)]">
                    Always double-check the recipient address. Transactions cannot be reversed.
                </p>
            </div>

            {/* Send Button */}
            <button
                onClick={handleSend}
                disabled={!amount || !recipient || !isValidAddress || parseFloat(amount) <= 0 || isSending}
                className={clsx(
                    'w-full py-4 text-lg font-bold rounded-xl transition-all flex items-center justify-center gap-2',
                    amount && recipient && isValidAddress && parseFloat(amount) > 0 && !isSending
                        ? 'bg-[var(--primary)] text-black shadow-[0_4px_20px_var(--primary-glow)] hover:shadow-[0_6px_30px_var(--primary-glow)] hover:-translate-y-0.5'
                        : 'bg-[var(--background-tertiary)] text-[var(--foreground-muted)] cursor-not-allowed'
                )}
            >
                {isSending ? (
                    <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Sending...
                    </>
                ) : (
                    <>
                        <ArrowUpRight className="w-5 h-5" />
                        {!amount ? 'Enter Amount' : !recipient ? 'Enter Recipient' : !isValidAddress ? 'Invalid Address' : 'Send'}
                    </>
                )}
            </button>
        </div>
    );
}
