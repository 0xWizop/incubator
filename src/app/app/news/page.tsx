'use client';

import { useLatestNews } from '@/hooks/useNews';
import { NewsFeed } from '@/components/news';
import { clsx } from 'clsx';
import { RefreshCw, Lock, Sparkles } from 'lucide-react';
import { useSubscription } from '@/hooks/useSubscription';
import Link from 'next/link';

const FREE_ARTICLE_LIMIT = 50;

export default function NewsPage() {
    const { data: articles, isLoading, isRefetching, refetch } = useLatestNews(100, false);
    const { canAccessFullNews, isPro, isBetaTester, isAdmin } = useSubscription();

    // Determine how many articles to show
    const hasFullAccess = canAccessFullNews || isPro || isBetaTester || isAdmin;
    const visibleArticles = hasFullAccess ? articles : articles?.slice(0, FREE_ARTICLE_LIMIT);
    const hasMoreArticles = !hasFullAccess && articles && articles.length > FREE_ARTICLE_LIMIT;

    return (
        <div className="h-full flex flex-col font-mono">
            {/* Unified Header */}
            <div className="flex items-center justify-between p-4 border-b border-[var(--border)] bg-[var(--background)]">
                {/* Left: Title */}
                <div className="flex items-center gap-3">
                    <h1 className="text-xl font-bold tracking-tight flex items-center gap-2">
                        <span className="text-[var(--primary)] text-2xl">_</span>
                        NEWS
                    </h1>
                    {!hasFullAccess && (
                        <span className="text-xs text-gray-500 hidden sm:inline">
                            {FREE_ARTICLE_LIMIT} free articles/day
                        </span>
                    )}
                </div>

                {/* Right: Live Status & Refresh */}
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <span className="flex h-3 w-3 items-center justify-center">
                            <span className={clsx(
                                "h-2 w-2 rounded-full bg-[var(--accent-green)]",
                                "animate-pulse"
                            )} />
                        </span>
                        <span className="text-xs font-bold text-[var(--accent-green)] uppercase tracking-wider hidden sm:inline-block">
                            NEWS_FEED_LIVE
                        </span>
                    </div>

                    <button
                        onClick={() => refetch()}
                        disabled={isRefetching}
                        className="p-1.5 rounded-lg hover:bg-[var(--background-secondary)] transition-colors disabled:opacity-50 text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
                        title="Refresh feed"
                    >
                        <RefreshCw className={clsx(
                            "w-4 h-4",
                            isRefetching && "animate-spin"
                        )} />
                    </button>
                </div>
            </div>

            {/* Feed Content */}
            <div className="flex-1 overflow-hidden relative">
                <NewsFeed articles={visibleArticles} isLoading={isLoading} />

                {/* Upgrade prompt at bottom if limit reached */}
                {hasMoreArticles && (
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/95 to-transparent pt-20 pb-6 px-4">
                        <div className="max-w-md mx-auto text-center">
                            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-[var(--primary)]/10 border border-[var(--primary)]/30 mb-4">
                                <Lock className="w-5 h-5 text-[var(--primary)]" />
                            </div>
                            <h3 className="text-lg font-bold text-white mb-2">
                                You've reached your daily limit
                            </h3>
                            <p className="text-sm text-gray-400 mb-4">
                                Upgrade to Pro for unlimited news access
                            </p>
                            <Link
                                href="/#pricing"
                                className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[var(--primary)] text-black font-bold text-sm hover:scale-105 transition-transform"
                            >
                                <Sparkles className="w-4 h-4" />
                                Upgrade to Pro
                            </Link>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
