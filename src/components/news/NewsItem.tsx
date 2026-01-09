'use client';

import { formatDistanceToNow } from 'date-fns';
import { ExternalLink } from 'lucide-react';
import type { NewsArticle } from '@/lib/api/coindesk';

interface NewsItemProps {
    article: NewsArticle;
}

export function NewsItem({ article }: NewsItemProps) {
    const timeAgo = formatDistanceToNow(new Date(article.publishedAt), { addSuffix: true });

    return (
        <a
            href={article.url}
            target="_blank"
            rel="noopener noreferrer"
            className="block p-3 hover:bg-[var(--background-tertiary)] transition-colors border-b border-[var(--border)] last:border-b-0 group"
        >
            <div className="flex gap-2.5">
                {/* Image thumbnail */}
                {article.imageUrl && (
                    <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-[var(--background-tertiary)]">
                        <img
                            src={article.imageUrl}
                            alt=""
                            className="w-full h-full object-cover"
                            loading="lazy"
                        />
                    </div>
                )}

                {/* Content */}
                <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium leading-snug mb-1 line-clamp-2 group-hover:text-[var(--primary)] transition-colors">
                        {article.title}
                    </h3>

                    {article.description && (
                        <p className="text-xs text-[var(--foreground-muted)] line-clamp-2 mb-1.5">
                            {article.description}
                        </p>
                    )}

                    <div className="flex items-center gap-2 text-[10px] text-[var(--foreground-muted)]">
                        <span className="font-medium">{article.source.name}</span>
                        <span>•</span>
                        <span>{timeAgo}</span>
                        <ExternalLink className="w-3 h-3 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                </div>
            </div>
        </a>
    );
}
