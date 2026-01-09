'use client';

import { Wallet } from 'lucide-react';

interface ConnectPromptProps {
    message?: string;
    onConnect: () => void;
}

/**
 * Shared Connect Wallet prompt component
 * Displays a card with wallet icon, message, and connect button
 */
export function ConnectPrompt({ message, onConnect }: ConnectPromptProps) {
    return (
        <div className="flex flex-col items-center justify-center py-8 text-center rounded-xl border border-[var(--border)] bg-[var(--background-secondary)]">
            <Wallet className="w-8 h-8 text-[var(--foreground-muted)] mb-3" />
            <p className="text-[var(--foreground-muted)] mb-4">
                {message || 'Connect wallet to view your data'}
            </p>
            <button
                onClick={onConnect}
                className="px-6 py-2.5 rounded-xl bg-[var(--primary)] text-black font-bold text-sm hover:opacity-90 transition-all shadow-[0_0_15px_var(--primary-glow)]"
            >
                Connect
            </button>
        </div>
    );
}
