'use client';

import { useState, useCallback } from 'react';
import { Search, X } from 'lucide-react';
import { clsx } from 'clsx';

interface NewsSearchBarProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
}

export function NewsSearchBar({ value, onChange, placeholder = 'SEARCH_NEWS...' }: NewsSearchBarProps) {
    const [isFocused, setIsFocused] = useState(false);

    const handleClear = useCallback(() => {
        onChange('');
    }, [onChange]);

    return (
        <div
            className={clsx(
                'relative flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all font-mono',
                'bg-[var(--background-secondary)]',
                isFocused
                    ? 'border-[var(--primary)] ring-1 ring-[var(--primary)]/20'
                    : 'border-[var(--border)] hover:border-[var(--border-hover)]'
            )}
        >
            <Search className="w-3.5 h-3.5 text-[var(--foreground-muted)] shrink-0" />
            <input
                type="text"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                placeholder={placeholder}
                className="flex-1 bg-transparent text-sm outline-none placeholder:text-[var(--foreground-muted)]/50 min-w-[120px]"
            />
            {value && (
                <button
                    onClick={handleClear}
                    className="p-0.5 rounded hover:bg-[var(--background-tertiary)] text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors"
                >
                    <X className="w-3.5 h-3.5" />
                </button>
            )}
            <span className="text-[10px] text-[var(--foreground-muted)]/50 hidden sm:block">
                /
            </span>
        </div>
    );
}
