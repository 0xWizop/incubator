'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { clsx } from 'clsx';
import { Star, List, Bell, Plus, Trash2, X, ChevronRight, TrendingUp, TrendingDown, AlertCircle, ChevronDown, Filter } from 'lucide-react';
import { useWatchlistStore } from '@/store';
import { useAuth } from '@/context/AuthContext';
import { Watchlist, WatchlistToken, PriceAlert, ChainId } from '@/types';
import { formatDistanceToNow } from 'date-fns';

interface WatchlistPanelProps {
    isOpen: boolean;
    onClose: () => void;
}

export function WatchlistPanel({ isOpen, onClose }: WatchlistPanelProps) {
    const panelRef = useRef<HTMLDivElement>(null);
    const { firebaseUser } = useAuth();
    const {
        watchlists,
        alerts,
        isLoading,
        isInitialized,
        activeTab,
        setActiveTab,
        initialize,
        toggleFavorite,
        removeToken,
        createList,
        deleteList,
        removeAlert,
    } = useWatchlistStore();

    const [newListName, setNewListName] = useState('');
    const [showCreateList, setShowCreateList] = useState(false);
    const [chainFilter, setChainFilter] = useState<ChainId | 'all'>('all');
    const [showChainDropdown, setShowChainDropdown] = useState(false);

    const CHAIN_OPTIONS: { id: ChainId | 'all'; label: string; color: string }[] = [
        { id: 'all', label: 'All Chains', color: 'var(--foreground)' },
        { id: 'solana', label: 'Solana', color: 'var(--solana)' },
        { id: 'ethereum', label: 'Ethereum', color: 'var(--ethereum)' },
        { id: 'base', label: 'Base', color: 'var(--base, #0052FF)' },
        { id: 'arbitrum', label: 'Arbitrum', color: 'var(--arbitrum, #28A0F0)' },
    ];

    // Initialize store when user is authenticated
    useEffect(() => {
        if (firebaseUser?.uid && !isInitialized) {
            initialize(firebaseUser.uid);
        }
    }, [firebaseUser?.uid, isInitialized, initialize]);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
                onClose();
            }
        };
        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const favorites = watchlists.find(w => w.id === 'favorites');
    const customLists = watchlists.filter(w => w.id !== 'favorites');

    // Filter tokens by chain
    const filterByChain = <T extends { chainId: ChainId }>(items: T[]): T[] => {
        if (chainFilter === 'all') return items;
        return items.filter(item => item.chainId === chainFilter);
    };

    const filteredFavorites = filterByChain(favorites?.tokens || []);
    const filteredAlerts = filterByChain(alerts);

    const handleCreateList = async () => {
        if (newListName.trim() && firebaseUser?.uid) {
            await createList(firebaseUser.uid, newListName.trim());
            setNewListName('');
            setShowCreateList(false);
        }
    };

    const tabs = [
        { id: 'favorites' as const, label: 'Favorites', icon: Star, count: filteredFavorites.length },
        { id: 'watchlists' as const, label: 'Lists', icon: List, count: customLists.length },
        { id: 'alerts' as const, label: 'Alerts', icon: Bell, count: filteredAlerts.filter(a => !a.triggered).length },
    ];

    return (
        <div
            ref={panelRef}
            className="fixed sm:absolute inset-x-4 sm:inset-x-auto sm:right-0 top-16 sm:top-full sm:mt-2 sm:w-96 bg-[var(--background-secondary)] border border-[var(--border)] rounded-xl shadow-2xl z-50 overflow-hidden"
        >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
                <h3 className="font-semibold text-sm">Watchlist</h3>
                <div className="flex items-center gap-2">
                    {/* Chain Filter */}
                    <div className="relative">
                        <button
                            onClick={() => setShowChainDropdown(!showChainDropdown)}
                            className="flex items-center gap-1.5 px-2 py-1 text-xs rounded-lg bg-[var(--background-tertiary)] border border-[var(--border)] hover:border-[var(--border-hover)] transition-colors"
                        >
                            <Filter className="w-3 h-3" />
                            <span style={{ color: CHAIN_OPTIONS.find(c => c.id === chainFilter)?.color }}>
                                {CHAIN_OPTIONS.find(c => c.id === chainFilter)?.label}
                            </span>
                            <ChevronDown className="w-3 h-3" />
                        </button>
                        {showChainDropdown && (
                            <div className="absolute right-0 top-full mt-1 w-36 bg-[var(--background-secondary)] border border-[var(--border)] rounded-lg shadow-xl z-50 overflow-hidden">
                                {CHAIN_OPTIONS.map(chain => (
                                    <button
                                        key={chain.id}
                                        onClick={() => {
                                            setChainFilter(chain.id);
                                            setShowChainDropdown(false);
                                        }}
                                        className={clsx(
                                            'w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-[var(--background-tertiary)] transition-colors',
                                            chainFilter === chain.id && 'bg-[var(--background-tertiary)]'
                                        )}
                                    >
                                        <span
                                            className="w-2 h-2 rounded-full"
                                            style={{ backgroundColor: chain.color }}
                                        />
                                        <span>{chain.label}</span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                    <button onClick={onClose} className="p-1 hover:bg-[var(--background-tertiary)] rounded">
                        <X className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-[var(--border)]">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={clsx(
                            'flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium transition-colors',
                            activeTab === tab.id
                                ? 'text-[var(--primary)] border-b-2 border-[var(--primary)]'
                                : 'text-[var(--foreground-muted)] hover:text-[var(--foreground)]'
                        )}
                    >
                        <tab.icon className="w-3.5 h-3.5" />
                        <span>{tab.label}</span>
                        {tab.count > 0 && (
                            <span className="ml-1 px-1.5 py-0.5 bg-[var(--background-tertiary)] rounded-full text-[10px]">
                                {tab.count}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {/* Content */}
            <div className="max-h-[400px] overflow-y-auto">
                {!firebaseUser ? (
                    <div className="p-8 text-center text-[var(--foreground-muted)]">
                        <Star className="w-8 h-8 mx-auto mb-3 opacity-50" />
                        <p className="text-sm font-medium mb-1">Sign in to save favorites</p>
                        <p className="text-xs">Your watchlists will sync across devices</p>
                    </div>
                ) : isLoading ? (
                    <div className="p-8 text-center">
                        <div className="w-6 h-6 border border-[var(--border-hover)] border-t-transparent rounded-full animate-spin mx-auto" />
                    </div>
                ) : (
                    <>
                        {activeTab === 'favorites' && (
                            <FavoritesTab
                                tokens={filteredFavorites}
                                onRemove={(pairAddress) => firebaseUser?.uid && removeToken(firebaseUser.uid, 'favorites', pairAddress)}
                            />
                        )}
                        {activeTab === 'watchlists' && (
                            <WatchlistsTab
                                lists={customLists}
                                showCreate={showCreateList}
                                newName={newListName}
                                onNewNameChange={setNewListName}
                                onToggleCreate={() => setShowCreateList(!showCreateList)}
                                onCreate={handleCreateList}
                                onDelete={(listId) => firebaseUser?.uid && deleteList(firebaseUser.uid, listId)}
                            />
                        )}
                        {activeTab === 'alerts' && (
                            <AlertsTab alerts={filteredAlerts} onRemove={removeAlert} />
                        )}
                    </>
                )}
            </div>
        </div>
    );
}

function FavoritesTab({ tokens, onRemove }: { tokens: WatchlistToken[]; onRemove: (pairAddress: string) => void }) {
    if (tokens.length === 0) {
        return (
            <div className="p-8 text-center text-[var(--foreground-muted)]">
                <Star className="w-8 h-8 mx-auto mb-3 opacity-50" />
                <p className="text-sm font-medium mb-1">No favorites yet</p>
                <p className="text-xs">Click the star on any token to add it here</p>
            </div>
        );
    }

    return (
        <div className="divide-y divide-[var(--border)]/50">
            {tokens.map((token) => (
                <TokenRow key={token.pairAddress} token={token} onRemove={() => onRemove(token.pairAddress)} />
            ))}
        </div>
    );
}

function TokenRow({ token, onRemove }: { token: WatchlistToken; onRemove: () => void }) {
    return (
        <div className="flex items-center gap-3 px-4 py-3 hover:bg-[var(--background-tertiary)]/50 transition-colors group">
            <div className="w-8 h-8 rounded-full bg-[var(--background-tertiary)] flex items-center justify-center overflow-hidden">
                {token.logo ? (
                    <img src={token.logo} alt="" className="w-full h-full object-cover" />
                ) : (
                    <span className="text-[10px] font-bold">{token.symbol.slice(0, 2)}</span>
                )}
            </div>
            <div className="flex-1 min-w-0">
                <Link
                    href={`/app/trade/?chain=${token.chainId}&pair=${token.pairAddress}`}
                    className="font-medium text-sm hover:text-[var(--primary)] transition-colors"
                >
                    {token.symbol}
                </Link>
                <p className="text-xs text-[var(--foreground-muted)] truncate">{token.name}</p>
            </div>
            <button
                onClick={onRemove}
                className="p-1.5 text-[var(--foreground-muted)] hover:text-[var(--accent-red)] hover:bg-[var(--accent-red)]/10 rounded opacity-0 group-hover:opacity-100 transition-all"
            >
                <Trash2 className="w-3.5 h-3.5" />
            </button>
            <ChevronRight className="w-4 h-4 text-[var(--foreground-muted)]" />
        </div>
    );
}

function WatchlistsTab({
    lists,
    showCreate,
    newName,
    onNewNameChange,
    onToggleCreate,
    onCreate,
    onDelete,
}: {
    lists: Watchlist[];
    showCreate: boolean;
    newName: string;
    onNewNameChange: (name: string) => void;
    onToggleCreate: () => void;
    onCreate: () => void;
    onDelete: (listId: string) => void;
}) {
    return (
        <div className="divide-y divide-[var(--border)]/50">
            {/* Create new list */}
            {showCreate ? (
                <div className="px-4 py-3 flex gap-2">
                    <input
                        type="text"
                        value={newName}
                        onChange={(e) => onNewNameChange(e.target.value)}
                        placeholder="List name..."
                        className="flex-1 px-3 py-1.5 text-sm bg-[var(--background-tertiary)] border border-[var(--border)] rounded-lg focus:border-[var(--border-hover)] focus:outline-none"
                        autoFocus
                        onKeyDown={(e) => e.key === 'Enter' && onCreate()}
                    />
                    <button
                        onClick={onCreate}
                        disabled={!newName.trim()}
                        className="px-3 py-1.5 bg-[var(--primary)] text-black text-sm font-medium rounded-lg disabled:opacity-50"
                    >
                        Add
                    </button>
                </div>
            ) : (
                <button
                    onClick={onToggleCreate}
                    className="w-full flex items-center gap-2 px-4 py-3 text-sm text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:bg-[var(--background-tertiary)]/50 transition-colors"
                >
                    <Plus className="w-4 h-4" />
                    <span>Create new list</span>
                </button>
            )}

            {/* Lists */}
            {lists.length === 0 && !showCreate ? (
                <div className="p-8 text-center text-[var(--foreground-muted)]">
                    <List className="w-8 h-8 mx-auto mb-3 opacity-50" />
                    <p className="text-sm font-medium mb-1">No custom lists</p>
                    <p className="text-xs">Create lists to organize your tokens</p>
                </div>
            ) : (
                lists.map((list) => (
                    <div
                        key={list.id}
                        className="flex items-center justify-between px-4 py-3 hover:bg-[var(--background-tertiary)]/50 transition-colors group"
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-[var(--background-tertiary)] flex items-center justify-center">
                                <List className="w-4 h-4 text-[var(--foreground-muted)]" />
                            </div>
                            <div>
                                <p className="font-medium text-sm">{list.name}</p>
                                <p className="text-xs text-[var(--foreground-muted)]">
                                    {list.tokens.length} token{list.tokens.length !== 1 ? 's' : ''}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={() => onDelete(list.id)}
                            className="p-1.5 text-[var(--foreground-muted)] hover:text-[var(--accent-red)] hover:bg-[var(--accent-red)]/10 rounded opacity-0 group-hover:opacity-100 transition-all"
                        >
                            <Trash2 className="w-3.5 h-3.5" />
                        </button>
                    </div>
                ))
            )}
        </div>
    );
}

function AlertsTab({ alerts, onRemove }: { alerts: PriceAlert[]; onRemove: (id: string) => void }) {
    if (alerts.length === 0) {
        return (
            <div className="p-8 text-center text-[var(--foreground-muted)]">
                <Bell className="w-8 h-8 mx-auto mb-3 opacity-50" />
                <p className="text-sm font-medium mb-1">No price alerts</p>
                <p className="text-xs">Set alerts from the trade page</p>
            </div>
        );
    }

    const activeAlerts = alerts.filter(a => !a.triggered);
    const triggeredAlerts = alerts.filter(a => a.triggered);

    return (
        <div className="divide-y divide-[var(--border)]/50">
            {activeAlerts.map((alert) => (
                <AlertRow key={alert.id} alert={alert} onRemove={() => onRemove(alert.id)} />
            ))}
            {triggeredAlerts.length > 0 && (
                <>
                    <div className="px-4 py-2 text-xs font-medium text-[var(--foreground-muted)] bg-[var(--background-tertiary)]/30">
                        Triggered
                    </div>
                    {triggeredAlerts.map((alert) => (
                        <AlertRow key={alert.id} alert={alert} onRemove={() => onRemove(alert.id)} triggered />
                    ))}
                </>
            )}
        </div>
    );
}

function AlertRow({ alert, onRemove, triggered }: { alert: PriceAlert; onRemove: () => void; triggered?: boolean }) {
    const isAbove = alert.condition === 'above';

    return (
        <div className={clsx(
            'flex items-center gap-3 px-4 py-3 transition-colors group',
            triggered ? 'opacity-60' : 'hover:bg-[var(--background-tertiary)]/50'
        )}>
            <div className="w-8 h-8 rounded-full bg-[var(--background-tertiary)] flex items-center justify-center overflow-hidden">
                {alert.logo ? (
                    <img src={alert.logo} alt="" className="w-full h-full object-cover" />
                ) : (
                    <span className="text-[10px] font-bold">{alert.symbol.slice(0, 2)}</span>
                )}
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                    <span className="font-medium text-sm">{alert.symbol}</span>
                    {isAbove ? (
                        <TrendingUp className="w-3.5 h-3.5 text-[var(--accent-green)]" />
                    ) : (
                        <TrendingDown className="w-3.5 h-3.5 text-[var(--accent-red)]" />
                    )}
                </div>
                <p className="text-xs text-[var(--foreground-muted)]">
                    {isAbove ? 'Above' : 'Below'} ${alert.targetPrice.toFixed(alert.targetPrice < 1 ? 6 : 2)}
                </p>
            </div>
            {triggered && (
                <AlertCircle className="w-4 h-4 text-[var(--primary)]" />
            )}
            <button
                onClick={onRemove}
                className="p-1.5 text-[var(--foreground-muted)] hover:text-[var(--accent-red)] hover:bg-[var(--accent-red)]/10 rounded opacity-0 group-hover:opacity-100 transition-all"
            >
                <Trash2 className="w-3.5 h-3.5" />
            </button>
        </div>
    );
}

export default WatchlistPanel;
