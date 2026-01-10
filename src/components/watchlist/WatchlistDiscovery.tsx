'use client';

import { useState, useEffect } from 'react';
import { Search, Users, Eye, Star, ChevronRight, RefreshCw, Globe } from 'lucide-react';
import { clsx } from 'clsx';
import { useWatchlistStore } from '@/store';
import { useAuth } from '@/context/AuthContext';
import type { SharedWatchlist } from '@/types';

interface WatchlistDiscoveryProps {
    onSelectWatchlist?: (watchlist: SharedWatchlist) => void;
}

export function WatchlistDiscovery({ onSelectWatchlist }: WatchlistDiscoveryProps) {
    const { firebaseUser } = useAuth();
    const {
        publicWatchlists,
        followedWatchlists,
        isLoading,
        discoverWatchlists,
        searchPublicWatchlists,
        followWatchlist,
        unfollowWatchlist,
        loadFollowedWatchlists,
    } = useWatchlistStore();

    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState<'discover' | 'following'>('discover');

    useEffect(() => {
        discoverWatchlists();
        if (firebaseUser?.uid) {
            loadFollowedWatchlists(firebaseUser.uid);
        }
    }, [firebaseUser?.uid]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            searchPublicWatchlists(searchQuery);
        } else {
            discoverWatchlists();
        }
    };

    const handleFollow = async (watchlist: SharedWatchlist) => {
        if (!firebaseUser?.uid) return;
        await followWatchlist(watchlist.id, watchlist.ownerId);
    };

    const handleUnfollow = async (watchlist: SharedWatchlist) => {
        if (!firebaseUser?.uid) return;
        await unfollowWatchlist(watchlist.id, watchlist.ownerId);
    };

    const isFollowingWatchlist = (watchlistId: string) => {
        return followedWatchlists.some(w => w.id === watchlistId);
    };

    const displayedWatchlists = activeTab === 'discover' ? publicWatchlists : followedWatchlists;

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="px-6 py-4 border-b border-[var(--border)]">
                <h2 className="text-xl font-bold flex items-center gap-2">
                    <Globe className="w-5 h-5 text-[var(--primary)]" />
                    Discover Watchlists
                </h2>
                <p className="text-sm text-[var(--foreground-muted)] mt-1">
                    Browse and follow public watchlists from other traders
                </p>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-[var(--border)]">
                <button
                    onClick={() => setActiveTab('discover')}
                    className={clsx(
                        'flex-1 px-4 py-3 text-sm font-medium transition-colors',
                        activeTab === 'discover'
                            ? 'text-[var(--primary)] border-b-2 border-[var(--primary)]'
                            : 'text-[var(--foreground-muted)] hover:text-white'
                    )}
                >
                    Discover
                </button>
                <button
                    onClick={() => setActiveTab('following')}
                    className={clsx(
                        'flex-1 px-4 py-3 text-sm font-medium transition-colors',
                        activeTab === 'following'
                            ? 'text-[var(--primary)] border-b-2 border-[var(--primary)]'
                            : 'text-[var(--foreground-muted)] hover:text-white'
                    )}
                >
                    Following ({followedWatchlists.length})
                </button>
            </div>

            {/* Search */}
            {activeTab === 'discover' && (
                <form onSubmit={handleSearch} className="p-4 border-b border-[var(--border)]">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--foreground-muted)]" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search by name, description, or tags..."
                            className="w-full pl-10 pr-4 py-2.5 bg-[var(--background-tertiary)] border border-[var(--border)] rounded-lg text-sm focus:border-[var(--border-hover)] focus:outline-none"
                        />
                    </div>
                </form>
            )}

            {/* Watchlist Grid */}
            <div className="flex-1 overflow-y-auto p-4">
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-12">
                        <RefreshCw className="w-6 h-6 animate-spin text-[var(--primary)]" />
                        <p className="text-sm text-[var(--foreground-muted)] mt-2">Loading watchlists...</p>
                    </div>
                ) : displayedWatchlists.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                        <Eye className="w-10 h-10 text-[var(--foreground-muted)] mb-3" />
                        <p className="text-[var(--foreground-muted)]">
                            {activeTab === 'discover'
                                ? 'No public watchlists found'
                                : "You're not following any watchlists yet"}
                        </p>
                    </div>
                ) : (
                    <div className="grid gap-3">
                        {displayedWatchlists.map((watchlist) => (
                            <WatchlistCard
                                key={watchlist.id}
                                watchlist={watchlist}
                                isFollowing={isFollowingWatchlist(watchlist.id)}
                                onFollow={() => handleFollow(watchlist)}
                                onUnfollow={() => handleUnfollow(watchlist)}
                                onSelect={() => onSelectWatchlist?.(watchlist)}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

interface WatchlistCardProps {
    watchlist: SharedWatchlist;
    isFollowing: boolean;
    onFollow: () => void;
    onUnfollow: () => void;
    onSelect: () => void;
}

function WatchlistCard({ watchlist, isFollowing, onFollow, onUnfollow, onSelect }: WatchlistCardProps) {
    return (
        <div className="p-4 bg-[var(--background-secondary)] border border-[var(--border)] rounded-xl hover:border-[var(--border-hover)] transition-colors">
            <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0 cursor-pointer" onClick={onSelect}>
                    <h3 className="font-semibold truncate">{watchlist.name}</h3>
                    {watchlist.description && (
                        <p className="text-sm text-[var(--foreground-muted)] mt-1 line-clamp-2">
                            {watchlist.description}
                        </p>
                    )}
                    <div className="flex items-center gap-3 mt-2 text-xs text-[var(--foreground-muted)]">
                        <span className="flex items-center gap-1">
                            <Star className="w-3 h-3" />
                            {watchlist.tokens.length} tokens
                        </span>
                        <span className="flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            {watchlist.followers} followers
                        </span>
                    </div>
                    {watchlist.tags && watchlist.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                            {watchlist.tags.slice(0, 3).map((tag) => (
                                <span
                                    key={tag}
                                    className="px-2 py-0.5 bg-[var(--background-tertiary)] rounded text-xs"
                                >
                                    {tag}
                                </span>
                            ))}
                        </div>
                    )}
                </div>
                <div className="flex items-center gap-2 ml-3">
                    <button
                        onClick={isFollowing ? onUnfollow : onFollow}
                        className={clsx(
                            'px-3 py-1.5 text-sm font-medium rounded-lg transition-colors',
                            isFollowing
                                ? 'bg-[var(--background-tertiary)] text-white hover:bg-[var(--accent-red)]/20 hover:text-[var(--accent-red)]'
                                : 'bg-[var(--primary)] text-black hover:shadow-[0_0_10px_var(--primary-glow)]'
                        )}
                    >
                        {isFollowing ? 'Unfollow' : 'Follow'}
                    </button>
                    <button onClick={onSelect} className="p-2 hover:bg-[var(--background-tertiary)] rounded-lg">
                        <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
}
