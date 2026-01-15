import { clsx } from 'clsx';
import React from 'react';

interface LoadingProps {
    className?: string;
    size?: 'sm' | 'md' | 'lg' | 'xl';
    text?: string;
    fullHeight?: boolean;
}

export function LoadingSpinner({ className, size = 'md', text, fullHeight }: LoadingProps) {
    const sizeClasses = {
        sm: 'w-4 h-4 border-2',
        md: 'w-8 h-8 border-2',
        lg: 'w-12 h-12 border-3',
        xl: 'w-16 h-16 border-4',
    };

    const containerClasses = fullHeight
        ? 'flex flex-col items-center justify-center min-h-[300px] w-full h-full'
        : 'flex flex-col items-center justify-center p-4';

    return (
        <div className={clsx(containerClasses, className)}>
            <div
                className={clsx(
                    'rounded-full border-[var(--primary)] border-t-transparent animate-spin',
                    sizeClasses[size]
                )}
            />
            {text && (
                <p className="mt-3 text-[var(--foreground-muted)] text-sm animate-pulse">
                    {text}
                </p>
            )}
        </div>
    );
}

export function LoadingOverlay() {
    return (
        <div className="absolute inset-0 bg-[var(--background)]/50 backdrop-blur-sm z-50 flex items-center justify-center">
            <LoadingSpinner size="lg" />
        </div>
    );
}
