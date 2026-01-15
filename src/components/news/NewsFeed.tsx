'use client';

import { NewsItem } from './NewsItem';
import { NewsSkeleton } from './NewsSkeleton';
import { Newspaper } from 'lucide-react';
import type { NewsArticle } from '@/lib/api/coindesk';

interface NewsFeedProps {
    articles?: NewsArticle[];
    isLoading?: boolean;
}

export function NewsFeed({ articles, isLoading }: NewsFeedProps) {
    return (
        <div className="flex flex-col h-full bg-[var(--background)] overflow-hidden font-mono">
            <div className="flex-1 overflow-y-auto overscroll-contain">
                {isLoading ? (
                    // Loading state
                    <div className="divide-y divide-[var(--border)]">
                        {Array.from({ length: 8 }).map((_, i) => (
                            <NewsSkeleton key={i} />
                        ))}
                    </div>
                ) : articles && articles.length > 0 ? (
                    // News items
                    <div className="divide-y divide-[var(--border)]">
                        {articles.map((article) => (
                            <NewsItem key={article.id} article={article} />
                        ))}
                    </div>
                ) : (
                    // Empty state
                    <div className="flex flex-col items-center justify-center p-8 text-center text-[var(--foreground-muted)] h-full">
                        <Newspaper className="w-12 h-12 mb-3 opacity-20" />
                        <p className="text-sm font-bold">NO_DATA_AVAILABLE</p>
                        <p className="text-xs mt-1 opacity-50">Stream offline.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
