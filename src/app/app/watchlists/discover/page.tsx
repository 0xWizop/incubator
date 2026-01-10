'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { WatchlistDiscovery } from '@/components/watchlist/WatchlistDiscovery';
import { ArrowLeft, Info, Lock } from 'lucide-react';
import type { SharedWatchlist } from '@/types';

export default function WatchlistDiscoverPage() {
    const { firebaseUser } = useAuth();
    const router = useRouter();
    const [selectedWatchlist, setSelectedWatchlist] = useState<SharedWatchlist | null>(null);

    const handleSelectWatchlist = (watchlist: SharedWatchlist) => {
        setSelectedWatchlist(watchlist);
    };

    return (
        <div className="min-h-screen bg-[var(--background)] text-white">
            {/* Top Navigation */}
            <div className="border-b border-[var(--border)] bg-[var(--background-secondary)]">
                <div className="max-w-7xl mx-auto px-6 py-4">
                    <button
                        onClick={() => router.back()}
                        className="flex items-center gap-2 text-[var(--foreground-muted)] hover:text-white transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        <span className="font-medium">Back</span>
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto p-6">
                <div className="grid lg:grid-cols-3 gap-6">
                    {/* Discovery Panel */}
                    <div className="lg:col-span-2">
                        <div className="bg-[var(--background-secondary)] border border-[var(--border)] rounded-2xl overflow-hidden shadow-xl min-h-[600px]">
                            <WatchlistDiscovery onSelectWatchlist={handleSelectWatchlist} />
                        </div>
                    </div>

                    {/* Details Panel */}
                    <div className="lg:col-span-1">
                        <div className="bg-[var(--background-secondary)] border border-[var(--border)] rounded-2xl overflow-hidden shadow-xl sticky top-6">
                            {selectedWatchlist ? (
                                <div className="p-6">
                                    <h3 className="text-lg font-bold mb-2">{selectedWatchlist.name}</h3>
                                    {selectedWatchlist.description && (
                                        <p className="text-sm text-[var(--foreground-muted)] mb-4">
                                            {selectedWatchlist.description}
                                        </p>
                                    )}

                                    <div className="border-t border-[var(--border)] pt-4 mt-4">
                                        <h4 className="text-sm font-medium text-[var(--foreground-muted)] mb-3">
                                            Tokens ({selectedWatchlist.tokens.length})
                                        </h4>
                                        <div className="space-y-2 max-h-80 overflow-y-auto">
                                            {selectedWatchlist.tokens.map((token, idx) => (
                                                <div
                                                    key={idx}
                                                    className="flex items-center gap-3 p-2 bg-[var(--background-tertiary)] rounded-lg"
                                                >
                                                    {token.logo ? (
                                                        <img
                                                            src={token.logo}
                                                            alt={token.symbol}
                                                            className="w-8 h-8 rounded-full"
                                                        />
                                                    ) : (
                                                        <div className="w-8 h-8 rounded-full bg-[var(--background)] flex items-center justify-center text-xs font-bold">
                                                            {token.symbol.slice(0, 2)}
                                                        </div>
                                                    )}
                                                    <div>
                                                        <p className="font-medium text-sm">{token.symbol}</p>
                                                        <p className="text-xs text-[var(--foreground-muted)]">
                                                            {token.chainId}
                                                        </p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="p-6 text-center text-[var(--foreground-muted)]">
                                    <Info className="w-10 h-10 mx-auto mb-3 opacity-50" />
                                    <p className="text-sm">Select a watchlist to view details</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Info Card */}
                {!firebaseUser && (
                    <div className="mt-6 p-4 bg-[var(--accent-yellow)]/10 border border-[var(--accent-yellow)]/30 rounded-xl">
                        <div className="flex items-start gap-3">
                            <Lock className="w-5 h-5 text-[var(--accent-yellow)] mt-0.5 flex-shrink-0" />
                            <div className="text-sm">
                                <p className="font-medium text-[var(--accent-yellow)] mb-1">Sign in to follow watchlists</p>
                                <p className="text-[var(--foreground-muted)]">
                                    Create an account to follow public watchlists and access them from anywhere.
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
