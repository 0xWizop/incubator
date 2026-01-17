'use client';

import { formatDistanceToNow } from 'date-fns';
import { Bookmark, BookmarkCheck, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { clsx } from 'clsx';
import type { NewsArticle } from '@/lib/api/coindesk';

interface NewsItemProps {
    article: NewsArticle;
    isSaved?: boolean;
    onToggleSave?: (article: NewsArticle) => void;
    showBookmark?: boolean;
    isLoggedIn?: boolean;
}

const sentimentConfig = {
    bullish: {
        bg: 'bg-[var(--accent-green)]/10',
        text: 'text-[var(--accent-green)]',
        border: 'border-[var(--accent-green)]/30',
        label: 'BULLISH',
        Icon: TrendingUp,
    },
    bearish: {
        bg: 'bg-[var(--accent-red)]/10',
        text: 'text-[var(--accent-red)]',
        border: 'border-[var(--accent-red)]/30',
        label: 'BEARISH',
        Icon: TrendingDown,
    },
    neutral: {
        bg: 'bg-gray-500/10',
        text: 'text-gray-400',
        border: 'border-gray-500/30',
        label: 'NEUTRAL',
        Icon: Minus,
    },
};

export function NewsItem({ article, isSaved = false, onToggleSave, showBookmark = true, isLoggedIn = false }: NewsItemProps) {
    const timeAgo = formatDistanceToNow(new Date(article.publishedAt), { addSuffix: true });
    const sentiment = article.sentiment || 'neutral';
    const sentimentInfo = sentimentConfig[sentiment];
    const SentimentIcon = sentimentInfo.Icon;

    const handleBookmarkClick = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (onToggleSave) {
            onToggleSave(article);
        }
    };

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
                {/* Content */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        {/* Source Badge */}
                        <span className="text-[10px] text-[var(--primary)] border border-[var(--primary)]/30 px-1.5 py-0.5 rounded-sm uppercase tracking-wider bg-[var(--primary)]/5">
                            {article.source.name}
                        </span>

                        {/* Sentiment Gauge */}
                        <span className={clsx(
                            'flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-sm uppercase tracking-wider border',
                            sentimentInfo.bg,
                            sentimentInfo.text,
                            sentimentInfo.border
                        )}>
                            <SentimentIcon className="w-2.5 h-2.5" />
                            {sentimentInfo.label}
                        </span>

                        {/* Time */}
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

                {/* Bookmark Button - Always visible */}
                {showBookmark && (
                    <button
                        type="button"
                        onClick={handleBookmarkClick}
                        disabled={!isLoggedIn && !onToggleSave}
                        className={clsx(
                            'p-1.5 rounded-lg transition-all shrink-0 relative z-10',
                            isSaved
                                ? 'text-[var(--primary)] bg-[var(--primary)]/10'
                                : 'text-[var(--foreground-muted)] hover:text-[var(--primary)] hover:bg-[var(--background-tertiary)]',
                            !isLoggedIn && !onToggleSave && 'opacity-50 cursor-not-allowed'
                        )}
                        title={
                            !isLoggedIn && !onToggleSave
                                ? 'Log in to save articles'
                                : isSaved
                                    ? 'Remove from saved'
                                    : 'Save article'
                        }
                    >
                        {isSaved ? (
                            <BookmarkCheck className="w-4 h-4" />
                        ) : (
                            <Bookmark className="w-4 h-4" />
                        )}
                    </button>
                )}
            </div>
        </a>
    );
}
