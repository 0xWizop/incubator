'use client';

import { useState } from 'react';
import {
    Wallet,
    Plus,
    Lock,
    Check,
    Sun,
    Moon,
    Monitor,
    Edit2,
    CheckCircle2,
    X
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { useEffect } from 'react';
import { clsx } from 'clsx';
import { useWalletStore } from '@/store/walletStore';

interface SettingsTabProps {
    onLock: () => void;
}

export function SettingsTab({ onLock }: SettingsTabProps) {
    const { wallets, activeWallet, setActiveWallet, openModal, renameWallet } = useWalletStore();
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);
    const [confirmLock, setConfirmLock] = useState(false);

    // Rename state
    const [editingWallet, setEditingWallet] = useState<string | null>(null);
    const [editName, setEditName] = useState('');

    useEffect(() => {
        setMounted(true);
    }, []);

    const handleLockWallet = () => {
        if (confirmLock) {
            onLock();
        } else {
            setConfirmLock(true);
            setTimeout(() => setConfirmLock(false), 3000);
        }
    };

    const handleRename = (address: string) => {
        if (!editName.trim()) return;
        renameWallet(address, editName);
        setEditingWallet(null);
        setEditName('');
    };

    const startEditing = (e: React.MouseEvent, wallet: { address: string; name: string }) => {
        e.stopPropagation();
        setEditingWallet(wallet.address);
        setEditName(wallet.name);
    };

    return (
        <div className="space-y-6 pt-2">
            {/* Wallet Management */}
            <div>
                <h4 className="text-xs text-[var(--foreground-muted)] uppercase tracking-wider mb-3 px-1">
                    Wallet Management
                </h4>
                <div className="space-y-2">
                    {/* Current Wallets */}
                    {wallets.map((wallet) => (
                        <div
                            key={wallet.address}
                            onClick={() => setActiveWallet(wallet.address)}
                            className={clsx(
                                'w-full flex items-center gap-3 p-3 rounded-xl transition-all cursor-pointer',
                                wallet.address === activeWallet?.address
                                    ? 'bg-[var(--background-tertiary)] border border-[var(--border-hover)]'
                                    : 'bg-[var(--background-tertiary)] border border-[var(--border)] hover:border-[var(--border-hover)]/50'
                            )}
                        >
                            <div className={clsx(
                                'w-10 h-10 rounded-xl flex items-center justify-center',
                                wallet.type === 'solana' ? 'bg-[var(--solana)]/20' : 'bg-[var(--ethereum)]/20'
                            )}>
                                <Wallet className={clsx(
                                    'w-5 h-5',
                                    wallet.type === 'solana' ? 'text-[var(--solana)]' : 'text-[var(--ethereum)]'
                                )} />
                            </div>
                            <div className="flex-1 text-left min-w-0">
                                {editingWallet === wallet.address ? (
                                    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                                        <input
                                            type="text"
                                            value={editName}
                                            onChange={(e) => setEditName(e.target.value)}
                                            className="w-full bg-[var(--background)] border border-[var(--border)] rounded px-2 py-1 text-sm"
                                            autoFocus
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') handleRename(wallet.address);
                                                if (e.key === 'Escape') setEditingWallet(null);
                                            }}
                                            onClick={(e) => e.stopPropagation()}
                                        />
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleRename(wallet.address);
                                            }}
                                            className="p-1 hover:text-[var(--primary)]"
                                        >
                                            <CheckCircle2 className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setEditingWallet(null);
                                            }}
                                            className="p-1 hover:text-[var(--accent-red)]"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2 group/name">
                                        <p className="font-medium text-sm truncate">{wallet.name}</p>
                                        <button
                                            onClick={(e) => startEditing(e, wallet)}
                                            className="opacity-0 group-hover/name:opacity-100 p-1 text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-opacity"
                                        >
                                            <Edit2 className="w-3 h-3" />
                                        </button>
                                    </div>
                                )}
                                <p className="text-xs text-[var(--foreground-muted)] font-mono truncate">
                                    {wallet.address}
                                </p>
                            </div>
                            {wallet.address === activeWallet?.address && (
                                <Check className="w-5 h-5 text-[var(--primary)] flex-shrink-0" />
                            )}
                        </div>
                    ))}

                    {/* Add Wallet */}
                    <button
                        onClick={() => openModal('create')}
                        className="w-full flex items-center gap-3 p-3 rounded-xl bg-[var(--background-tertiary)] border border-dashed border-[var(--border)] hover:border-[var(--border-hover)] transition-all"
                    >
                        <div className="w-10 h-10 rounded-xl bg-[var(--background-tertiary)] flex items-center justify-center">
                            <Plus className="w-5 h-5 text-[var(--primary)]" />
                        </div>
                        <span className="font-medium text-sm">Add New Wallet</span>
                    </button>
                </div>
            </div>

            {/* Appearance */}
            <div>
                <h4 className="text-xs text-[var(--foreground-muted)] uppercase tracking-wider mb-3 px-1">
                    Appearance
                </h4>
                <div className="grid grid-cols-3 gap-3">
                    <button
                        onClick={() => setTheme('light')}
                        className={clsx(
                            'flex flex-col items-center gap-2 p-3 rounded-xl border transition-all',
                            mounted && theme === 'light'
                                ? 'bg-[var(--background-tertiary)] border-[var(--primary)] text-[var(--primary)]'
                                : 'bg-[var(--background-tertiary)] border-[var(--border)] text-[var(--foreground-muted)] hover:border-[var(--border-hover)]/50 hover:text-[var(--foreground)]'
                        )}
                    >
                        <Sun className="w-5 h-5" />
                        <span className="text-xs font-medium">Light</span>
                    </button>
                    <button
                        onClick={() => setTheme('dark')}
                        className={clsx(
                            'flex flex-col items-center gap-2 p-3 rounded-xl border transition-all',
                            mounted && theme === 'dark'
                                ? 'bg-[var(--background-tertiary)] border-[var(--primary)] text-[var(--primary)]'
                                : 'bg-[var(--background-tertiary)] border-[var(--border)] text-[var(--foreground-muted)] hover:border-[var(--border-hover)]/50 hover:text-[var(--foreground)]'
                        )}
                    >
                        <Moon className="w-5 h-5" />
                        <span className="text-xs font-medium">Dark</span>
                    </button>
                    <button
                        onClick={() => setTheme('system')}
                        className={clsx(
                            'flex flex-col items-center gap-2 p-3 rounded-xl border transition-all',
                            mounted && theme === 'system'
                                ? 'bg-[var(--background-tertiary)] border-[var(--primary)] text-[var(--primary)]'
                                : 'bg-[var(--background-tertiary)] border-[var(--border)] text-[var(--foreground-muted)] hover:border-[var(--border-hover)]/50 hover:text-[var(--foreground)]'
                        )}
                    >
                        <Monitor className="w-5 h-5" />
                        <span className="text-xs font-medium">System</span>
                    </button>
                </div>
            </div>

            {/* Quick Actions */}
            <div>
                <h4 className="text-xs text-[var(--foreground-muted)] uppercase tracking-wider mb-3 px-1">
                    Quick Actions
                </h4>
                <div className="space-y-2">
                    {/* Lock Wallet */}
                    <button
                        onClick={handleLockWallet}
                        className={clsx(
                            'w-full flex items-center gap-3 p-3 rounded-xl transition-all',
                            confirmLock
                                ? 'bg-[var(--accent-red)]/10 border-2 border-[var(--accent-red)]'
                                : 'bg-[var(--background-tertiary)] border border-[var(--border)] hover:border-[var(--accent-yellow)]/50'
                        )}
                    >
                        <div className="w-10 h-10 rounded-xl bg-[var(--accent-yellow)]/10 flex items-center justify-center">
                            <Lock className="w-5 h-5 text-[var(--accent-yellow)]" />
                        </div>
                        <div className="flex-1 text-left">
                            <p className="font-medium text-sm">
                                {confirmLock ? 'Click again to confirm' : 'Lock Wallet'}
                            </p>
                            <p className="text-xs text-[var(--foreground-muted)]">
                                Require password to access
                            </p>
                        </div>
                    </button>
                </div>
            </div>

            {/* Security Notice */}
            <div className="p-3 rounded-xl bg-[var(--background-tertiary)] border border-[var(--border)]">
                <p className="text-xs text-[var(--foreground-muted)]">
                    For private keys, backups, and advanced security options, visit the <span className="text-[var(--primary)] font-medium">Security</span> tab.
                </p>
            </div>
        </div >
    );
}

