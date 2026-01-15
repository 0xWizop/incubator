'use client';

import { useState } from 'react';
import {
    X,
    Plus,
    Star,
    StarOff,
    Trash2,
    Edit2,
    Check,
    Search,
    User,
    Loader2,
} from 'lucide-react';
import { clsx } from 'clsx';
import { useAddressBook } from '@/hooks/useAddressBook';
import type { AddressBookEntry, ChainId } from '@/types';

interface AddressBookModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect?: (entry: AddressBookEntry) => void;
    mode?: 'view' | 'select'; // 'select' mode allows picking an address
    currentChain?: ChainId;
}

export function AddressBookModal({
    isOpen,
    onClose,
    onSelect,
    mode = 'view',
    currentChain = 'ethereum',
}: AddressBookModalProps) {
    const { addresses, isLoading, addAddress, updateAddress, removeAddress } = useAddressBook();

    const [showAddForm, setShowAddForm] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    // Form state
    const [newName, setNewName] = useState('');
    const [newAddress, setNewAddress] = useState('');
    const [newChain, setNewChain] = useState<ChainId | 'all'>('all');
    const [isSaving, setIsSaving] = useState(false);

    if (!isOpen) return null;

    const filteredAddresses = addresses.filter((entry) => {
        const matchesSearch =
            entry.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            entry.address.toLowerCase().includes(searchQuery.toLowerCase());

        // In select mode, filter by compatible chain
        const matchesChain = mode === 'select'
            ? entry.chain === 'all' || entry.chain === currentChain
            : true;

        return matchesSearch && matchesChain;
    });

    const handleAddNew = async () => {
        if (!newName.trim() || !newAddress.trim()) return;

        setIsSaving(true);
        const id = await addAddress({
            name: newName.trim(),
            address: newAddress.trim(),
            chain: newChain,
        });

        if (id) {
            setNewName('');
            setNewAddress('');
            setNewChain('all');
            setShowAddForm(false);
        }
        setIsSaving(false);
    };

    const handleEdit = async (entry: AddressBookEntry) => {
        if (!newName.trim()) return;

        setIsSaving(true);
        await updateAddress(entry.id, { name: newName.trim() });
        setEditingId(null);
        setNewName('');
        setIsSaving(false);
    };

    const handleToggleFavorite = async (entry: AddressBookEntry) => {
        await updateAddress(entry.id, { isFavorite: !entry.isFavorite });
    };

    const handleDelete = async (id: string) => {
        if (window.confirm('Remove this address from your address book?')) {
            await removeAddress(id);
        }
    };

    const handleSelect = (entry: AddressBookEntry) => {
        if (mode === 'select' && onSelect) {
            onSelect(entry);
            onClose();
        }
    };

    const truncateAddress = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`;

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 animate-fade-in">
            <div
                className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                onClick={onClose}
            />
            <div className="relative w-full max-w-md max-h-[80vh] bg-[var(--background-secondary)] border border-[var(--border)] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-[var(--border)]">
                    <h3 className="font-bold text-lg">Address Book</h3>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-[var(--background-tertiary)] rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5 text-[var(--foreground-muted)]" />
                    </button>
                </div>

                {/* Search */}
                <div className="p-4 border-b border-[var(--border)]">
                    <div className="flex items-center gap-2 px-3 py-2 bg-[var(--background-tertiary)] rounded-xl border border-[var(--border)]">
                        <Search className="w-4 h-4 text-[var(--foreground-muted)]" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search addresses..."
                            className="flex-1 bg-transparent text-sm outline-none placeholder:text-[var(--foreground-muted)]/50"
                        />
                    </div>
                </div>

                {/* Address List */}
                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="w-6 h-6 animate-spin text-[var(--foreground-muted)]" />
                        </div>
                    ) : filteredAddresses.length === 0 ? (
                        <div className="text-center py-8 text-[var(--foreground-muted)]">
                            <User className="w-10 h-10 mx-auto mb-2 opacity-50" />
                            <p className="text-sm">No addresses saved yet</p>
                            <p className="text-xs mt-1">Add trusted addresses for quick access</p>
                        </div>
                    ) : (
                        filteredAddresses.map((entry) => (
                            <div
                                key={entry.id}
                                onClick={() => handleSelect(entry)}
                                className={clsx(
                                    'p-3 rounded-xl border transition-all',
                                    mode === 'select'
                                        ? 'cursor-pointer hover:border-[var(--primary)] hover:bg-[var(--primary)]/5'
                                        : '',
                                    'bg-[var(--background-tertiary)] border-[var(--border)]'
                                )}
                            >
                                {editingId === entry.id ? (
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="text"
                                            value={newName}
                                            onChange={(e) => setNewName(e.target.value)}
                                            className="flex-1 px-2 py-1 bg-[var(--background)] border border-[var(--border)] rounded-lg text-sm outline-none"
                                            autoFocus
                                        />
                                        <button
                                            onClick={() => handleEdit(entry)}
                                            disabled={isSaving}
                                            className="p-1.5 hover:bg-[var(--accent-green)]/10 rounded-lg"
                                        >
                                            <Check className="w-4 h-4 text-[var(--accent-green)]" />
                                        </button>
                                        <button
                                            onClick={() => { setEditingId(null); setNewName(''); }}
                                            className="p-1.5 hover:bg-[var(--accent-red)]/10 rounded-lg"
                                        >
                                            <X className="w-4 h-4 text-[var(--accent-red)]" />
                                        </button>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-3">
                                        {/* Favorite Star */}
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleToggleFavorite(entry); }}
                                            className="p-1 hover:bg-[var(--accent-yellow)]/10 rounded-lg"
                                        >
                                            {entry.isFavorite ? (
                                                <Star className="w-4 h-4 text-[var(--accent-yellow)] fill-[var(--accent-yellow)]" />
                                            ) : (
                                                <StarOff className="w-4 h-4 text-[var(--foreground-muted)]" />
                                            )}
                                        </button>

                                        {/* Address Info */}
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-sm truncate">{entry.name}</p>
                                            <p className="text-xs text-[var(--foreground-muted)] font-mono">
                                                {truncateAddress(entry.address)}
                                            </p>
                                        </div>

                                        {/* Chain Badge */}
                                        <span className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-[var(--primary)]/10 text-[var(--primary)] uppercase">
                                            {entry.chain}
                                        </span>

                                        {/* Actions */}
                                        {mode === 'view' && (
                                            <div className="flex items-center gap-1">
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); setEditingId(entry.id); setNewName(entry.name); }}
                                                    className="p-1.5 hover:bg-[var(--background)] rounded-lg"
                                                >
                                                    <Edit2 className="w-3.5 h-3.5 text-[var(--foreground-muted)]" />
                                                </button>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleDelete(entry.id); }}
                                                    className="p-1.5 hover:bg-[var(--accent-red)]/10 rounded-lg"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5 text-[var(--accent-red)]" />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>

                {/* Add New Form */}
                {showAddForm ? (
                    <div className="p-4 border-t border-[var(--border)] space-y-3">
                        <input
                            type="text"
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            placeholder="Name (e.g. My CEX, Friend's Wallet)"
                            className="w-full px-3 py-2 bg-[var(--background-tertiary)] border border-[var(--border)] rounded-xl text-sm outline-none"
                        />
                        <input
                            type="text"
                            value={newAddress}
                            onChange={(e) => setNewAddress(e.target.value)}
                            placeholder="Wallet address (0x...)"
                            className="w-full px-3 py-2 bg-[var(--background-tertiary)] border border-[var(--border)] rounded-xl text-sm font-mono outline-none"
                        />
                        <select
                            value={newChain}
                            onChange={(e) => setNewChain(e.target.value as ChainId | 'all')}
                            className="w-full px-3 py-2 bg-[var(--background-tertiary)] border border-[var(--border)] rounded-xl text-sm outline-none"
                        >
                            <option value="all">All EVM Chains</option>
                            <option value="ethereum">Ethereum</option>
                            <option value="base">Base</option>
                            <option value="arbitrum">Arbitrum</option>
                            <option value="solana">Solana</option>
                        </select>
                        <div className="flex gap-2">
                            <button
                                onClick={() => { setShowAddForm(false); setNewName(''); setNewAddress(''); }}
                                className="flex-1 py-2 rounded-xl bg-[var(--background-tertiary)] border border-[var(--border)] text-sm font-medium"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleAddNew}
                                disabled={!newName.trim() || !newAddress.trim() || isSaving}
                                className="flex-1 py-2 rounded-xl bg-[var(--primary)] text-black text-sm font-medium disabled:opacity-50"
                            >
                                {isSaving ? 'Saving...' : 'Save'}
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="p-4 border-t border-[var(--border)]">
                        <button
                            onClick={() => setShowAddForm(true)}
                            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-[var(--background-tertiary)] border border-[var(--border)] hover:border-[var(--primary)] text-sm font-medium transition-all"
                        >
                            <Plus className="w-4 h-4" />
                            Add New Address
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
