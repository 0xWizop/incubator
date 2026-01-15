import type { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
    const baseUrl = 'https://incubatorprotocol-c31de.web.app';

    // Static pages
    const staticPages = [
        '',
        '/app',
        '/app/dashboard',
        '/app/trade',
        '/app/screener',
        '/app/heatmap',
        '/app/watchlists/discover',
        '/app/news',
        '/app/rewards',
        '/app/tracker',
        '/app/settings',
        '/app/portfolio-history',
        '/app/explorer',
        '/app/explorer/ethereum',
        '/app/explorer/solana',
        '/app/explorer/base',
        '/app/explorer/arbitrum',
        '/docs',
    ];

    return staticPages.map((route) => ({
        url: `${baseUrl}${route}`,
        lastModified: new Date(),
        changeFrequency: route === '' ? 'weekly' : 'daily',
        priority: route === '' ? 1 : route === '/app' ? 0.9 : 0.8,
    }));
}
