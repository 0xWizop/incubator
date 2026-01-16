'use client';

import { NewsItem } from './NewsItem';
import { Bookmark } from 'lucide-react';
import type { SavedArticle } from '@/types';
import type { NewsArticle } from '@/lib/api/coindesk';

interface SavedArticlesProps {
    articles: SavedArticle[];
    onToggleSave: (article: NewsArticle) => void;
    isLoading?: boolean;
}

// Convert SavedArticle to NewsArticle format for NewsItem
function toNewsArticle(saved: SavedArticle): NewsArticle {
    return {
        id: saved.articleId,
        title: saved.title,
        description: saved.description,
        url: saved.url,
        imageUrl: saved.imageUrl,
        publishedAt: saved.publishedAt,
        source: {
            name: saved.sourceName,
        },
        sentiment: saved.sentiment,
    };
}

export function SavedArticles({ articles, onToggleSave, isLoading }: SavedArticlesProps) {
    if (isLoading) {
        return (
            <div className="flex items-center justify-center p-12 text-[var(--foreground-muted)]">
                <span className="animate-pulse">Loading saved articles...</span>
            </div>
        );
    }

    if (articles.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-center text-[var(--foreground-muted)] font-mono">
                <Bookmark className="w-12 h-12 mb-3 opacity-20" />
                <p className="text-sm font-bold">NO_SAVED_ARTICLES</p>
                <p className="text-xs mt-1 opacity-50">
                    Click the bookmark icon on any article to save it for later.
                </p>
            </div>
        );
    }

    return (
        <div className="divide-y divide-[var(--border)]">
            {articles.map((saved) => (
                <NewsItem
                    key={saved.id}
                    article={toNewsArticle(saved)}
                    isSaved={true}
                    onToggleSave={onToggleSave}
                    showBookmark={true}
                />
            ))}
        </div>
    );
}
