'use client';

import { NewsFeed } from '@/components/news';

export default function NewsPage() {
    return (
        <div className="h-full flex flex-col">
            <div className="p-4 border-b border-[var(--border)]">
                <h1 className="text-2xl font-bold">Crypto News</h1>
                <p className="text-sm text-[var(--foreground-muted)] mt-1">
                    Latest cryptocurrency news and updates
                </p>
            </div>

            <div className="flex-1 overflow-hidden">
                <NewsFeed />
            </div>
        </div>
    );
}
