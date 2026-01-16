const CRYPTOCOMPARE_API = 'https://min-api.cryptocompare.com/data/v2';

import { getSentiment } from '@/lib/utils/sentiment';
import { SentimentType } from '@/types';

export interface NewsArticle {
    id: string;
    title: string;
    description: string;
    url: string;
    imageUrl?: string;
    publishedAt: string;
    source: {
        name: string;
        logo?: string;
    };
    categories?: string[];
    sentiment?: SentimentType;
}

export async function getLatestNews(limit = 20): Promise<NewsArticle[]> {
    try {
        const response = await fetch(
            `${CRYPTOCOMPARE_API}/news/?lang=EN`
        );

        if (!response.ok) {
            throw new Error('Failed to fetch news');
        }

        const data = await response.json();

        // Transform API response to our format
        const articles = data.Data?.slice(0, limit).map((article: any) => {
            const title = article.title;
            const description = article.body || '';

            return {
                id: article.id || article.guid,
                title,
                description,
                url: article.url || article.guid,
                imageUrl: article.imageurl,
                publishedAt: new Date(article.published_on * 1000).toISOString(),
                source: {
                    name: article.source_info?.name || article.source || 'CryptoCompare',
                    logo: article.source_info?.img,
                },
                categories: article.categories?.split('|') || [],
                sentiment: getSentiment(title, description),
            };
        }) || [];

        return articles;
    } catch (error) {
        console.error('Error fetching news:', error);
        return [];
    }
}

export async function searchNews(query: string): Promise<NewsArticle[]> {
    try {
        // CryptoCompare doesn't have a search endpoint, so we filter client-side
        const allNews = await getLatestNews(50);
        const lowerQuery = query.toLowerCase();

        return allNews.filter(article =>
            article.title.toLowerCase().includes(lowerQuery) ||
            article.description.toLowerCase().includes(lowerQuery)
        );
    } catch (error) {
        console.error('Error searching news:', error);
        return [];
    }
}
