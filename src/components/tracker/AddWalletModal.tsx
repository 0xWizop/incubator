'use client';

import { useState } from 'react';
import { X, Eye, Bell } from 'lucide-react';
import { clsx } from 'clsx';
import { ChainId } from '@/types';

interface AddWalletModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAdd: (address: string, name: string, chainId: ChainId, notify: boolean) => Promise<any>;
    initialAddress?: string;
}

// Auto-detect chain from address format
function detectChain(address: string): ChainId {
    if (address.startsWith('0x') && address.length === 42) {
        return 'ethereum'; // EVM address - works across ETH, Base, Arbitrum
    }
    // Solana addresses are base58, typically 32-44 chars, no 0x prefix
    if (!address.startsWith('0x') && address.length >= 32 && address.length <= 44) {
        return 'solana';
    }
    return 'ethereum'; // Default to EVM
}

export function AddWalletModal({ isOpen, onClose, onAdd, initialAddress = '' }: AddWalletModalProps) {
    const [address, setAddress] = useState(initialAddress);
    const [name, setName] = useState('');
    const [notify, setNotify] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    if (!isOpen) return null;

    const detectedChain = detectChain(address);
    const isValidAddress = address.startsWith('0x') ? address.length === 42 : address.length >= 32;

    const handleSubmit = async () => {
        if (!address.trim()) {
            setError('Please enter a wallet address');
            return;
        }

        if (!isValidAddress) {
            setError('Invalid wallet address');
            return;
        }

        setIsSubmitting(true);
        setError('');

        try {
            const result = await onAdd(
                address,
                name || `Wallet ${address.slice(0, 6)}...${address.slice(-4)}`,
                detectedChain,
                notify
            );
            if (result) {
                setAddress('');
                setName('');
                onClose();
            } else {
                setError('Failed to add wallet. You may have reached the limit (10) or already tracking this address.');
            }
        } catch (err) {
            setError('Failed to add wallet');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="w-full max-w-md bg-[var(--background-secondary)] border border-[var(--border)] rounded-2xl shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)]">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-[var(--primary)] rounded-lg">
                            <Eye className="w-5 h-5 text-black" />
                        </div>
                        <div>
                            <h3 className="font-semibold">Track a Wallet</h3>
                            <p className="text-xs text-[var(--foreground-muted)]">Get notified on activity</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-[var(--background-tertiary)] rounded-lg transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-5 space-y-4">
                    {/* Address Input */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-[var(--foreground-muted)]">Wallet Address</label>
                        <input
                            type="text"
                            value={address}
                            onChange={(e) => setAddress(e.target.value.trim())}
                            placeholder="0x... or Solana address"
                            className="w-full px-4 py-3 bg-[var(--background-tertiary)] border border-[var(--border)] rounded-lg font-mono text-sm focus:border-[var(--border-hover)] focus:outline-none transition-colors"
                        />
                        {address && (
                            <p className="text-xs text-[var(--foreground-muted)]">
                                Detected: <span className="text-[var(--primary)] capitalize">{detectedChain}</span> {detectedChain === 'ethereum' && '(multi-chain EVM)'}
                            </p>
                        )}
                    </div>

                    {/* Name Input */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-[var(--foreground-muted)]">Nickname (optional)</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g. Whale Wallet, Dev Wallet"
                            className="w-full px-4 py-3 bg-[var(--background-tertiary)] border border-[var(--border)] rounded-lg text-sm focus:border-[var(--border-hover)] focus:outline-none transition-colors"
                        />
                    </div>

                    {/* Notify Toggle */}
                    <div className="flex items-center justify-between p-3 bg-[var(--background-tertiary)] rounded-lg">
                        <div className="flex items-center gap-2">
                            <Bell className="w-4 h-4 text-[var(--foreground-muted)]" />
                            <span className="text-sm">Notify on activity</span>
                        </div>
                        <button
                            onClick={() => setNotify(!notify)}
                            className={clsx(
                                'w-10 h-6 rounded-full transition-colors relative',
                                notify ? 'bg-[var(--primary)]' : 'bg-[var(--background)] border border-[var(--border)]'
                            )}
                        >
                            <div className={clsx(
                                'absolute top-1 w-4 h-4 rounded-full transition-all',
                                notify ? 'right-1 bg-white' : 'left-1 bg-[var(--foreground-muted)]'
                            )} />
                        </button>
                    </div>

                    {/* Error */}
                    {error && (
                        <p className="text-sm text-[var(--accent-red)] text-center">{error}</p>
                    )}

                    {/* Submit */}
                    <button
                        onClick={handleSubmit}
                        disabled={isSubmitting || !address || !isValidAddress}
                        className="w-full py-3 bg-[var(--primary)] text-black font-semibold rounded-lg hover:shadow-[0_0_15px_var(--primary-glow)] disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                    >
                        {isSubmitting ? (
                            <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                        ) : (
                            <>
                                <Eye className="w-4 h-4" />
                                Start Tracking
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
