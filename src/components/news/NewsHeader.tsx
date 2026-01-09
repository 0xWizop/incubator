'use client';

import { RefreshCw } from 'lucide-react';
import { clsx } from 'clsx';

interface NewsHeaderProps {
    isRefreshing: boolean;
    onRefresh: () => void;
}

export function NewsHeader({ isRefreshing, onRefresh }: NewsHeaderProps) {
    return (
        <div className="flex items-center justify-between p-3 border-b border-[var(--border)] bg-[var(--background-secondary)]">
            <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5">
                    <div className={clsx(
                        "w-2 h-2 rounded-full",
                        isRefreshing ? "bg-[var(--accent-green)] animate-pulse" : "bg-[var(--accent-green)]"
                    )} />
                    <span className="text-xs font-bold text-[var(--accent-green)] uppercase tracking-wide">
                        Live
                    </span>
                </div>
            </div>

            <button
                onClick={onRefresh}
                disabled={isRefreshing}
                className="p-1.5 rounded-lg hover:bg-[var(--background-tertiary)] transition-colors disabled:opacity-50"
                title="Refresh news"
            >
                <RefreshCw className={clsx(
                    "w-4 h-4 text-[var(--foreground-muted)]",
                    isRefreshing && "animate-spin"
                )} />
            </button>
        </div>
    );
}
