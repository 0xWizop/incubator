'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useLatestNews } from '@/hooks/useNews';
import { NewsFeed } from '@/components/news';
import { NewsSearchBar } from '@/components/news/NewsSearchBar';
import { SavedArticles } from '@/components/news/SavedArticles';
import { clsx } from 'clsx';
import { RefreshCw, Lock, Sparkles, Rss, Bookmark } from 'lucide-react';
import { useSubscription } from '@/hooks/useSubscription';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import * as firebase from '@/lib/firebase';
import type { NewsArticle } from '@/lib/api/coindesk';
import type { SavedArticle } from '@/types';

const FREE_ARTICLE_LIMIT = 50;

type TabId = 'feed' | 'saved';

export default function NewsPage() {
    const { data: articles, isLoading, isRefetching, refetch } = useLatestNews(100, false);
    const { canAccessFullNews, isPro, isBetaTester, isAdmin } = useSubscription();
    const { firebaseUser } = useAuth();

    // Local state
    const [activeTab, setActiveTab] = useState<TabId>('feed');
    const [searchQuery, setSearchQuery] = useState('');
    const [savedArticles, setSavedArticles] = useState<SavedArticle[]>([]);
    const [savedArticleIds, setSavedArticleIds] = useState<Set<string>>(new Set());
    const [isLoadingSaved, setIsLoadingSaved] = useState(false);

    // Determine how many articles to show
    const hasFullAccess = canAccessFullNews || isPro || isBetaTester || isAdmin;

    // Filter articles by search query
    const filteredArticles = useMemo(() => {
        if (!articles) return [];

        let result = hasFullAccess ? articles : articles.slice(0, FREE_ARTICLE_LIMIT);

        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            result = result.filter(
                (article) =>
                    article.title.toLowerCase().includes(query) ||
                    article.description.toLowerCase().includes(query) ||
                    article.source.name.toLowerCase().includes(query)
            );
        }

        return result;
    }, [articles, hasFullAccess, searchQuery]);

    const hasMoreArticles = !hasFullAccess && articles && articles.length > FREE_ARTICLE_LIMIT;

    // Load saved articles on mount
    useEffect(() => {
        if (firebaseUser?.uid) {
            loadSavedArticles();
        }
    }, [firebaseUser?.uid]);

    const loadSavedArticles = async () => {
        if (!firebaseUser?.uid) return;

        setIsLoadingSaved(true);
        try {
            const saved = await firebase.getSavedArticles(firebaseUser.uid);
            setSavedArticles(saved);
            setSavedArticleIds(new Set(saved.map(a => a.articleId)));
        } catch (error) {
            console.error('Error loading saved articles:', error);
        } finally {
            setIsLoadingSaved(false);
        }
    };

    const handleToggleSave = useCallback(async (article: NewsArticle) => {
        if (!firebaseUser?.uid) return;

        const isSaved = savedArticleIds.has(article.id);

        if (isSaved) {
            // Unsave
            const success = await firebase.unsaveArticle(firebaseUser.uid, article.id);
            if (success) {
                setSavedArticleIds((prev) => {
                    const next = new Set(prev);
                    next.delete(article.id);
                    return next;
                });
                setSavedArticles((prev) => prev.filter(a => a.articleId !== article.id));
            }
        } else {
            // Save
            const saved = await firebase.saveArticle(firebaseUser.uid, {
                articleId: article.id,
                title: article.title,
                description: article.description,
                url: article.url,
                imageUrl: article.imageUrl,
                publishedAt: article.publishedAt,
                sourceName: article.source.name,
                sentiment: article.sentiment,
            });
            if (saved) {
                setSavedArticleIds((prev) => new Set(prev).add(article.id));
                setSavedArticles((prev) => [saved, ...prev]);
            }
        }
    }, [firebaseUser?.uid, savedArticleIds]);

    const tabs = [
        { id: 'feed' as const, label: 'FEED', icon: Rss },
        { id: 'saved' as const, label: 'SAVED', icon: Bookmark, count: savedArticles.length },
    ];

    return (
        <div className="h-full flex flex-col font-mono">
            {/* Unified Header */}
            <div className="flex items-center justify-between p-4 border-b border-[var(--border)] bg-[var(--background)] gap-3">
                {/* Left: Title */}
                <div className="flex items-center gap-3 shrink-0">
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

                {/* Center: Search */}
                <div className="flex-1 max-w-md hidden sm:block">
                    <NewsSearchBar
                        value={searchQuery}
                        onChange={setSearchQuery}
                    />
                </div>

                {/* Right: Live Status & Refresh */}
                <div className="flex items-center gap-4 shrink-0">
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

            {/* Mobile Search */}
            <div className="p-3 border-b border-[var(--border)] sm:hidden">
                <NewsSearchBar
                    value={searchQuery}
                    onChange={setSearchQuery}
                />
            </div>

            {/* Tabs */}
            {firebaseUser && (
                <div className="flex gap-1 p-2 border-b border-[var(--border)]">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={clsx(
                                'flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all',
                                activeTab === tab.id
                                    ? 'bg-[var(--primary)] text-black'
                                    : 'text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:bg-[var(--background-tertiary)]'
                            )}
                        >
                            <tab.icon className="w-3.5 h-3.5" />
                            {tab.label}
                            {tab.count !== undefined && tab.count > 0 && (
                                <span className={clsx(
                                    'px-1.5 py-0.5 rounded-full text-[10px]',
                                    activeTab === tab.id
                                        ? 'bg-black/20 text-black'
                                        : 'bg-[var(--background-tertiary)] text-[var(--foreground-muted)]'
                                )}>
                                    {tab.count}
                                </span>
                            )}
                        </button>
                    ))}
                </div>
            )}

            {/* Feed Content */}
            <div className="flex-1 overflow-hidden relative">
                {activeTab === 'feed' ? (
                    <NewsFeed
                        articles={filteredArticles}
                        isLoading={isLoading}
                        savedArticleIds={savedArticleIds}
                        onToggleSave={firebaseUser ? handleToggleSave : undefined}
                        isLoggedIn={!!firebaseUser}
                    />
                ) : (
                    <div className="h-full overflow-y-auto">
                        <SavedArticles
                            articles={savedArticles}
                            onToggleSave={handleToggleSave}
                            isLoading={isLoadingSaved}
                        />
                    </div>
                )}

                {/* Upgrade prompt at bottom if limit reached */}
                {activeTab === 'feed' && hasMoreArticles && (
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
