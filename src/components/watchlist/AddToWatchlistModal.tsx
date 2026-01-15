'use client';

import React, { useState } from 'react';
import { X, Plus, Check, List, Star } from 'lucide-react';
import { useWatchlistStore } from '@/store';
import { useAuth } from '@/context/AuthContext';
import { WatchlistToken } from '@/types';
import { clsx } from 'clsx';

interface AddToWatchlistModalProps {
    isOpen: boolean;
    onClose: () => void;
    token: Omit<WatchlistToken, 'addedAt'>;
}

export function AddToWatchlistModal({ isOpen, onClose, token }: AddToWatchlistModalProps) {
    const { firebaseUser } = useAuth();
    const { watchlists, addToken, removeToken, createList, isInitialized } = useWatchlistStore();
    const [newListName, setNewListName] = useState('');
    const [isCreating, setIsCreating] = useState(false);
    const [loading, setLoading] = useState(false);

    if (!isOpen) return null;

    // Filter out favorites as it has its own dedicated button
    const customLists = watchlists.filter(w => w.id !== 'favorites');

    const handleCreateList = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newListName.trim() || !firebaseUser?.uid) return;

        setLoading(true);
        try {
            await createList(firebaseUser.uid, newListName.trim());
            setNewListName('');
            setIsCreating(false);
        } catch (error) {
            console.error('Failed to create list:', error);
        } finally {
            setLoading(false);
        }
    };

    const toggleTokenInList = async (listId: string) => {
        if (!firebaseUser?.uid) return;

        const list = watchlists.find(w => w.id === listId);
        if (!list) return;

        const isPresent = list.tokens.some(t => t.pairAddress === token.pairAddress);

        try {
            if (isPresent) {
                await removeToken(firebaseUser.uid, listId, token.pairAddress);
            } else {
                await addToken(firebaseUser.uid, listId, token);
            }
        } catch (error) {
            console.error('Failed to toggle token in list:', error);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-[var(--background-secondary)] border border-[var(--border)] rounded-xl shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in duration-200">
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
                    <h3 className="font-semibold flex items-center gap-2">
                        <List className="w-5 h-5 text-[var(--primary)]" />
                        Add to Watchlist
                    </h3>
                    <button onClick={onClose} className="p-1 hover:bg-[var(--background-tertiary)] rounded-lg transition-colors">
                        <X className="w-5 h-5 text-[var(--foreground-muted)]" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-4">
                    {/* Token Info */}
                    <div className="flex items-center gap-3 mb-4 p-3 bg-[var(--background-tertiary)]/50 rounded-lg">
                        <div className="w-8 h-8 rounded-full bg-[var(--background-tertiary)] flex items-center justify-center overflow-hidden">
                            {token.logo ? (
                                <img src={token.logo} alt="" className="w-full h-full object-cover" />
                            ) : (
                                <span className="text-xs font-bold">{token.symbol.slice(0, 2)}</span>
                            )}
                        </div>
                        <div>
                            <p className="font-medium text-sm">{token.symbol}</p>
                            <p className="text-xs text-[var(--foreground-muted)]">{token.name}</p>
                        </div>
                    </div>

                    {/* Lists */}
                    <div className="space-y-2 mb-4 max-h-[200px] overflow-y-auto pr-1">
                        {customLists.length === 0 && !isCreating && (
                            <p className="text-center text-sm text-[var(--foreground-muted)] py-4">
                                No custom lists yet. Create one below!
                            </p>
                        )}

                        {customLists.map(list => {
                            const isPresent = list.tokens.some(t => t.pairAddress === token.pairAddress);
                            return (
                                <button
                                    key={list.id}
                                    onClick={() => toggleTokenInList(list.id)}
                                    className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-[var(--background-tertiary)] transition-colors border border-transparent hover:border-[var(--border)]"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={clsx("w-5 h-5 rounded flex items-center justify-center border transition-colors", isPresent ? "bg-[var(--primary)] border-[var(--primary)] text-black" : "border-[var(--foreground-muted)]")}>
                                            {isPresent && <Check className="w-3.5 h-3.5" />}
                                        </div>
                                        <span className="text-sm font-medium">{list.name}</span>
                                    </div>
                                    <span className="text-xs text-[var(--foreground-muted)]">{list.tokens.length} items</span>
                                </button>
                            );
                        })}
                    </div>

                    {/* Create New List */}
                    {isCreating ? (
                        <form onSubmit={handleCreateList} className="flex gap-2">
                            <input
                                type="text"
                                value={newListName}
                                onChange={(e) => setNewListName(e.target.value)}
                                placeholder="List name..."
                                autoFocus
                                className="flex-1 px-3 py-2 text-sm bg-[var(--background-tertiary)] border border-[var(--border)] rounded-lg focus:border-[var(--primary)] focus:outline-none transition-colors"
                            />
                            <button
                                type="submit"
                                disabled={!newListName.trim() || loading}
                                className="px-3 py-2 bg-[var(--primary)] text-black rounded-lg disabled:opacity-50 hover:opacity-90 transition-opacity"
                            >
                                <Check className="w-5 h-5" />
                            </button>
                            <button
                                type="button"
                                onClick={() => setIsCreating(false)}
                                className="px-3 py-2 bg-[var(--background-tertiary)] text-[var(--foreground)] rounded-lg hover:bg-[var(--background-tertiary)]/80 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </form>
                    ) : (
                        <button
                            onClick={() => setIsCreating(true)}
                            className="w-full flex items-center justify-center gap-2 p-2 rounded-lg border border-dashed border-[var(--border)] text-[var(--foreground-muted)] hover:text-[var(--primary)] hover:border-[var(--primary)] hover:bg-[var(--primary)]/5 transition-all text-sm font-medium"
                        >
                            <Plus className="w-4 h-4" />
                            Create New List
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
