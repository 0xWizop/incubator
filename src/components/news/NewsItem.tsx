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
            className="group block border-b border-[var(--border)] p-3 hover:bg-[var(--primary)]/5 transition-colors relative pl-4 font-mono"
        >
            {/* Active Indicator on Hover */}
            <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-[var(--primary)] opacity-0 group-hover:opacity-100 transition-opacity" />

            <div className="flex items-start gap-3">
                {/* Terminal Prefix */}
                <span className="text-[var(--primary)] text-xs mt-0.5 shrink-0 opacity-50 group-hover:opacity-100 select-none">{`>`}</span>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        <span className="text-[10px] text-[var(--primary)] border border-[var(--primary)]/30 px-1.5 py-0.5 rounded-sm uppercase tracking-wider bg-[var(--primary)]/5">
                            {article.source.name}
                        </span>
                        <span className="text-[10px] text-[var(--foreground-muted)]">
                            {timeAgo}
                        </span>
                    </div>

                    <h3 className="text-sm leading-snug text-[var(--foreground)] group-hover:text-[var(--primary)] transition-colors line-clamp-2 mb-1">
                        {article.title}
                    </h3>

                    {article.description && (
                        <p className="text-xs text-[var(--foreground-muted)] line-clamp-1 opacity-70 group-hover:opacity-100 transition-opacity">
                            {article.description}
                        </p>
                    )}
                </div>
            </div>
        </a>
    );
}
