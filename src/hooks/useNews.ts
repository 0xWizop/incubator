import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';
import { getLatestNews, searchNews, NewsArticle } from '@/lib/api/coindesk';

const SEEN_NEWS_KEY = 'seen_news_ids';

// Get already-seen news IDs from localStorage
function getSeenNewsIds(): Set<string> {
    if (typeof window === 'undefined') return new Set();
    try {
        const stored = localStorage.getItem(SEEN_NEWS_KEY);
        return new Set(stored ? JSON.parse(stored) : []);
    } catch {
        return new Set();
    }
}

// Save seen news IDs (keep last 100)
function markNewsAsSeen(ids: string[]) {
    if (typeof window === 'undefined') return;
    try {
        const existing = getSeenNewsIds();
        ids.forEach(id => existing.add(id));
        // Keep only last 100
        const arr = Array.from(existing).slice(-100);
        localStorage.setItem(SEEN_NEWS_KEY, JSON.stringify(arr));
    } catch {
        // Ignore storage errors
    }
}

// Show news notification
function showNewsNotification(article: NewsArticle) {
    if (typeof window === 'undefined') return;
    if (!('Notification' in window)) return;
    if (Notification.permission !== 'granted') return;

    const notification = new Notification('📰 Breaking Crypto News', {
        body: article.title,
        icon: article.imageUrl || '/icon.png',
        tag: `news-${article.id}`,
        requireInteraction: false,
    });

    notification.onclick = () => {
        window.open(article.url, '_blank');
        notification.close();
    };

    // Auto-close after 10 seconds
    setTimeout(() => notification.close(), 10000);
}

export function useLatestNews(limit = 20, enableNotifications = false) {
    const isFirstLoad = useRef(true);
    const previousNewsRef = useRef<string[]>([]);

    const query = useQuery({
        queryKey: ['news', 'latest', limit],
        queryFn: () => getLatestNews(limit),
        refetchInterval: 60000, // Refresh every 60 seconds
        staleTime: 30000,
        retry: 2,
    });

    // Handle notifications for new articles
    useEffect(() => {
        if (!enableNotifications || !query.data || query.data.length === 0) return;

        const currentIds = query.data.map(a => a.id);
        const seenIds = getSeenNewsIds();

        // On first load, just mark all as seen (don't spam notifications)
        if (isFirstLoad.current) {
            isFirstLoad.current = false;
            previousNewsRef.current = currentIds;
            markNewsAsSeen(currentIds);
            return;
        }

        // Find truly new articles (not in previous fetch AND not seen before)
        const newArticles = query.data.filter(article =>
            !previousNewsRef.current.includes(article.id) && !seenIds.has(article.id)
        );

        // Notify for new articles (max 3 to not spam)
        newArticles.slice(0, 3).forEach(article => {
            showNewsNotification(article);
        });

        // Mark new ones as seen
        if (newArticles.length > 0) {
            markNewsAsSeen(newArticles.map(a => a.id));
            console.log(`📰 ${newArticles.length} new news article(s)`);
        }

        previousNewsRef.current = currentIds;
    }, [query.data, enableNotifications]);

    return query;
}

export function useSearchNews(query: string) {
    return useQuery({
        queryKey: ['news', 'search', query],
        queryFn: () => searchNews(query),
        enabled: query.length >= 2,
        staleTime: 60000,
    });
}
