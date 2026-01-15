import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
    const baseUrl = 'https://incubatorprotocol-c31de.web.app';

    return {
        rules: [
            {
                userAgent: '*',
                allow: '/',
                disallow: ['/api/', '/_next/', '/static/'],
            },
        ],
        sitemap: `${baseUrl}/sitemap.xml`,
    };
}
