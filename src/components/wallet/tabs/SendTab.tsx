'use client';

import { useState } from 'react';
import { ArrowUpRight, ChevronDown, AlertTriangle, Clock, User } from 'lucide-react';
import { clsx } from 'clsx';
import { useWalletStore } from '@/store/walletStore';
import { CHAINS } from '@/lib/wallet';

export function SendTab() {
    const { activeWallet, balances, activeChain } = useWalletStore();

    const [amount, setAmount] = useState('');
    const [recipient, setRecipient] = useState('');
    const [selectedToken, setSelectedToken] = useState(activeWallet?.type === 'solana' ? 'SOL' : 'ETH');
    const [isValidAddress, setIsValidAddress] = useState<boolean | null>(null);

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

    const handleSend = () => {
        alert(`Send functionality coming soon! Would send ${amount} ${selectedToken} to ${recipient}`);
    };

    const recentRecipients = [
        // Would be populated from transaction history
    ];

    return (
        <div className="space-y-4">
            {/* Token Selection */}
            <div className="p-4 rounded-2xl bg-[var(--background-tertiary)] border border-[var(--border)]">
                <label className="block text-xs text-[var(--foreground-muted)] mb-2">Asset to send</label>
                <button className="w-full flex items-center gap-3 p-3 rounded-xl bg-[var(--background)] border border-[var(--border)] hover:border-[var(--primary)] transition-all">
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
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="0.00"
                        className="flex-1 bg-transparent text-2xl font-mono font-bold outline-none placeholder:text-[var(--foreground-muted)]/30"
                    />
                    <span className="text-lg font-medium text-[var(--foreground-muted)]">{selectedToken}</span>
                </div>
                {parseFloat(currentBalance) > 0 && (
                    <div className="flex gap-2 mt-3">
                        {[25, 50, 75, 100].map((pct) => (
                            <button
                                key={pct}
                                onClick={() => setAmount((parseFloat(currentBalance) * pct / 100).toFixed(6))}
                                className="flex-1 py-1.5 text-xs font-medium rounded-lg bg-[var(--background)] hover:bg-[var(--primary)]/10 hover:text-[var(--primary)] transition-all"
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
                    onChange={(e) => {
                        setRecipient(e.target.value);
                        validateAddress(e.target.value);
                    }}
                    placeholder={activeWallet?.type === 'solana' ? 'Enter Solana address' : 'Enter 0x address'}
                    className={clsx(
                        'w-full bg-transparent text-sm font-mono outline-none placeholder:text-[var(--foreground-muted)]/30',
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

            {/* Recent Recipients */}
            {recentRecipients.length > 0 && (
                <div>
                    <p className="text-xs text-[var(--foreground-muted)] mb-2">Recent</p>
                    <div className="space-y-2">
                        {/* Would render recent recipients here */}
                    </div>
                </div>
            )}

            {/* Network Fee */}
            {amount && recipient && isValidAddress && (
                <div className="p-3 rounded-xl bg-[var(--background-tertiary)]/50 border border-[var(--border)]">
                    <div className="flex justify-between text-sm">
                        <span className="text-[var(--foreground-muted)]">Network Fee</span>
                        <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-[var(--foreground-muted)]" />
                            ~$2.50
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
                disabled={!amount || !recipient || !isValidAddress || parseFloat(amount) <= 0}
                className={clsx(
                    'w-full py-4 text-lg font-bold rounded-xl transition-all flex items-center justify-center gap-2',
                    amount && recipient && isValidAddress && parseFloat(amount) > 0
                        ? 'bg-gradient-to-r from-[var(--primary)] to-[#00a804] text-black shadow-[0_4px_20px_rgba(0,200,5,0.3)] hover:shadow-[0_6px_30px_rgba(0,200,5,0.4)] hover:-translate-y-0.5'
                        : 'bg-[var(--background-tertiary)] text-[var(--foreground-muted)] cursor-not-allowed'
                )}
            >
                <ArrowUpRight className="w-5 h-5" />
                {!amount ? 'Enter Amount' : !recipient ? 'Enter Recipient' : !isValidAddress ? 'Invalid Address' : 'Send'}
            </button>
        </div>
    );
}
