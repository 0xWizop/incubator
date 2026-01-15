'use client';

import { CheckCircle, ExternalLink, X } from 'lucide-react';
import { clsx } from 'clsx';

interface TransactionSuccessModalProps {
    isOpen: boolean;
    onClose: () => void;
    amount: string;
    token: string;
    recipient: string;
    txHash: string;
    explorerUrl: string;
    type?: 'sent' | 'received';
}

/**
 * Full-screen transaction success modal
 * Displays after a successful send/receive with checkmark, amount, and explorer link
 */
export function TransactionSuccessModal({
    isOpen,
    onClose,
    amount,
    token,
    recipient,
    txHash,
    explorerUrl,
    type = 'sent',
}: TransactionSuccessModalProps) {
    if (!isOpen) return null;

    // Truncate address for display
    const truncatedAddress = recipient
        ? `${recipient.slice(0, 6)}...${recipient.slice(-4)}`
        : '';

    return (
        <div className="absolute inset-0 z-50 flex flex-col bg-[var(--background)] animate-in fade-in duration-200">
            {/* Close button */}
            <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 rounded-full hover:bg-[var(--background-tertiary)] transition-colors"
            >
                <X className="w-5 h-5 text-[var(--foreground-muted)]" />
            </button>

            {/* Content - Centered */}
            <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
                {/* Success Checkmark */}
                <div className="w-20 h-20 rounded-full bg-[var(--accent-green)] flex items-center justify-center mb-6 shadow-[0_0_40px_var(--accent-green)]">
                    <CheckCircle className="w-10 h-10 text-black" strokeWidth={2.5} />
                </div>

                {/* Title */}
                <h2 className="text-2xl font-bold mb-4">
                    {type === 'sent' ? 'Sent!' : 'Received!'}
                </h2>

                {/* Amount */}
                <p className="text-lg font-mono font-medium text-[var(--primary)] mb-2">
                    {amount} {token}
                </p>

                {/* Description */}
                <p className="text-[var(--foreground-muted)] mb-4">
                    was successfully {type === 'sent' ? 'sent to' : 'received from'}
                </p>

                {/* Address */}
                <p className="font-mono text-lg font-medium mb-6">
                    {truncatedAddress}
                </p>

                {/* View Transaction Link */}
                <a
                    href={explorerUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[var(--primary)] hover:underline flex items-center gap-2 text-sm font-medium"
                >
                    View transaction
                    <ExternalLink className="w-4 h-4" />
                </a>
            </div>

            {/* Close Button - Bottom */}
            <div className="p-6">
                <button
                    onClick={onClose}
                    className="w-full py-4 text-lg font-bold rounded-xl bg-[var(--background-tertiary)] border border-[var(--border)] hover:bg-[var(--background-tertiary)]/80 transition-all"
                >
                    Close
                </button>
            </div>
        </div>
    );
}
