'use client';

import { ReactNode } from 'react';
import Link from 'next/link';
import { Lock, Sparkles, ArrowRight } from 'lucide-react';
import { useSubscription } from '@/hooks/useSubscription';

interface PaywallOverlayProps {
    /** What to show behind the paywall */
    children: ReactNode;
    /** Name of the feature for the CTA */
    featureName: string;
    /** If true, shows a blurred preview of the content */
    showPreview?: boolean;
    /** Custom message to display */
    message?: string;
    /** If true, bypasses the paywall (for admin testing) */
    bypassPaywall?: boolean;
}

export function PaywallOverlay({
    children,
    featureName,
    showPreview = true,
    message,
    bypassPaywall = false,
}: PaywallOverlayProps) {
    const { isPro, isBetaTester, isAdmin, isLoading } = useSubscription();

    // Show content if user has access, is beta tester, admin, or bypass is enabled
    if (isPro || isBetaTester || isAdmin || bypassPaywall) {
        return <>{children}</>;
    }

    // Show loading state briefly
    if (isLoading) {
        return (
            <div className="relative w-full h-full min-h-[400px] animate-pulse bg-[var(--background-secondary)] rounded-xl" />
        );
    }

    return (
        <div className="relative w-full h-full min-h-[300px] sm:min-h-[400px] overflow-hidden">
            {/* Extended black base to block any edge glows from layout */}
            <div className="absolute -inset-20 bg-black" />

            {/* Uniform heatmap-style gradient - green and red only, also extended */}
            <div className="absolute -inset-20 bg-gradient-to-br from-green-950/80 via-black to-red-950/80" />

            {/* Blurred content preview - only on larger screens where it fills properly */}
            {showPreview && (
                <div className="absolute inset-0 blur-3xl pointer-events-none select-none opacity-30 overflow-hidden hidden sm:block">
                    {children}
                </div>
            )}

            {/* Centered paywall card - Compact & Glassmorphic */}
            <div className="absolute inset-0 flex items-center justify-center z-10 p-4">
                <div className="text-center px-5 py-6 sm:px-8 sm:py-8 max-w-[300px] sm:max-w-sm bg-[var(--background-secondary)]/80 backdrop-blur-xl border border-[var(--primary)]/20 rounded-2xl shadow-2xl shadow-black/50">
                    {/* Lock icon - Smaller with glow */}
                    <div className="relative inline-flex mb-4 sm:mb-5">
                        <div className="absolute inset-0 bg-[var(--primary)]/30 blur-xl rounded-full" />
                        <div className="relative p-3 sm:p-4 bg-gradient-to-br from-[var(--primary)]/25 to-[var(--primary)]/5 border border-[var(--primary)]/40 rounded-xl">
                            <Lock className="w-7 h-7 sm:w-8 sm:h-8 text-[var(--primary)]" />
                        </div>
                    </div>

                    {/* Title */}
                    <h3 className="text-lg sm:text-xl font-bold text-white mb-2">
                        Unlock {featureName}
                    </h3>

                    {/* Message - Compact */}
                    <p className="text-gray-400 text-xs sm:text-sm mb-5 sm:mb-6 leading-relaxed">
                        {message || `${featureName} is a Pro feature. Upgrade to unlock unlimited access to professional trading tools.`}
                    </p>

                    {/* CTA Button - Smaller on mobile */}
                    <Link
                        href="/#pricing"
                        className="inline-flex items-center gap-2 px-5 py-2.5 sm:px-6 sm:py-3 rounded-full bg-gradient-to-r from-[var(--primary)] to-amber-500 text-black font-bold text-xs sm:text-sm hover:scale-105 hover:shadow-[0_0_30px_rgba(247,147,26,0.5)] transition-all"
                    >
                        <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        Upgrade to Pro
                        <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </Link>

                    {/* Beta tester callout */}
                    <p className="mt-4 text-[10px] sm:text-xs text-[var(--primary)]/70">
                        Beta testers get lifetime Pro access for free!
                    </p>
                </div>
            </div>
        </div>
    );
}

/**
 * Inline paywall for partial content gating (e.g., limited articles)
 */
interface InlinePaywallProps {
    /** Current count of items shown */
    currentCount: number;
    /** Max free items allowed */
    freeLimit: number;
    /** Feature name */
    featureName: string;
}

export function InlinePaywall({ currentCount, freeLimit, featureName }: InlinePaywallProps) {
    const { isPro } = useSubscription();

    if (isPro || currentCount < freeLimit) {
        return null;
    }

    return (
        <div className="p-6 rounded-xl border border-[var(--primary)]/30 bg-gradient-to-br from-[var(--primary)]/10 to-transparent text-center">
            <Lock className="w-6 h-6 text-[var(--primary)] mx-auto mb-3" />
            <p className="text-sm text-[var(--foreground-muted)] mb-3">
                You've reached your free limit of {freeLimit} {featureName.toLowerCase()}.
            </p>
            <Link
                href="/#pricing"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--primary)] text-black font-medium text-sm hover:scale-105 transition-transform"
            >
                <Sparkles className="w-3.5 h-3.5" />
                Unlock Unlimited
            </Link>
        </div>
    );
}

/**
 * Badge to show Pro status
 */
export function ProBadge({ className = '' }: { className?: string }) {
    return (
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gradient-to-r from-[var(--primary)] to-amber-400 text-black text-[10px] font-bold uppercase tracking-wider ${className}`}>
            <Sparkles className="w-3 h-3" />
            Pro
        </span>
    );
}

/**
 * Badge to show Beta Tester status
 */
export function BetaBadge({ className = '' }: { className?: string }) {
    return (
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white text-[10px] font-bold uppercase tracking-wider ${className}`}>
            ⚡ Beta Tester
        </span>
    );
}

/**
 * Badge to show Lifetime status
 */
export function LifetimeBadge({ className = '' }: { className?: string }) {
    return (
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gradient-to-r from-[#B9F2FF] to-cyan-400 text-black text-[10px] font-bold uppercase tracking-wider ${className}`}>
            👑 Lifetime
        </span>
    );
}
