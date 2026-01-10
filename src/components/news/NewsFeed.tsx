'use client';

import { useLatestNews } from '@/hooks/useNews';
import { NewsItem } from './NewsItem';
import { NewsHeader } from './NewsHeader';
import { NewsSkeleton } from './NewsSkeleton';
import { Newspaper } from 'lucide-react';

export function NewsFeed() {
    // Notifications are now handled globally by NewsMonitor
    const { data: articles, isLoading, isRefetching, refetch } = useLatestNews(20, false);

    return (
        <div className="flex flex-col h-full bg-[var(--background)] overflow-hidden">
            <div className="flex-shrink-0">
                <NewsHeader isRefreshing={isRefetching} onRefresh={() => refetch()} />
            </div>

            <div className="flex-1 overflow-y-auto overscroll-contain">
                {isLoading ? (
                    // Loading state
                    <>
                        {Array.from({ length: 5 }).map((_, i) => (
                            <NewsSkeleton key={i} />
                        ))}
                    </>
                ) : articles && articles.length > 0 ? (
                    // News items
                    articles.map((article) => (
                        <NewsItem key={article.id} article={article} />
                    ))
                ) : (
                    // Empty state
                    <div className="flex flex-col items-center justify-center p-8 text-center text-[var(--foreground-muted)]">
                        <Newspaper className="w-12 h-12 mb-3 opacity-30" />
                        <p className="text-sm">No news available</p>
                        <p className="text-xs mt-1">Check back later for updates</p>
                    </div>
                )}
            </div>
        </div>
    );
}
