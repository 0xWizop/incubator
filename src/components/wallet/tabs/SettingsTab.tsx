'use client';

import { useState } from 'react';
import {
    Wallet,
    Plus,
    Key,
    Lock,
    LogOut,
    ChevronRight,
    AlertTriangle,
    Eye,
    EyeOff,
    Check,
    Download,
    Trash2,
    Sun,
    Moon,
    Monitor
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { useEffect } from 'react';
import { clsx } from 'clsx';
import { useWalletStore } from '@/store/walletStore';
import { getSessionKey, getStoredWalletData, clearStoredWalletData } from '@/lib/wallet';

interface SettingsTabProps {
    onLock: () => void;
}

export function SettingsTab({ onLock }: SettingsTabProps) {
    const { wallets, activeWallet, setActiveWallet, openModal, initialize } = useWalletStore();
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);
    const [showPrivateKey, setShowPrivateKey] = useState(false);
    const [privateKeyVisible, setPrivateKeyVisible] = useState(false);
    const [confirmLock, setConfirmLock] = useState(false);
    const [revealedKey, setRevealedKey] = useState<string | null>(null);

    useEffect(() => {
        setMounted(true);
    }, []);

    const handleExportKey = () => {
        if (!activeWallet) return;

        const key = getSessionKey(activeWallet.address);
        if (key) {
            setRevealedKey(key);
            setShowPrivateKey(true);
        } else {
            // Should not happen if unlocked, but handle gracefully
            alert('Session expired. Please lock and unlock your wallet.');
        }
    };

    const handleBackup = () => {
        const data = getStoredWalletData();
        if (!data) return;

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `cypherx-wallet-backup-${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const handleResetWallet = () => {
        if (window.confirm('Are you sure you want to completely erase your wallet? This action cannot be undone. Make sure you have a backup.')) {
            clearStoredWalletData();
            window.location.reload();
        }
    };

    const handleLockWallet = () => {
        if (confirmLock) {
            onLock();
        } else {
            setConfirmLock(true);
            setTimeout(() => setConfirmLock(false), 3000);
        }
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
                        <button
                            key={wallet.address}
                            onClick={() => setActiveWallet(wallet.address)}
                            className={clsx(
                                'w-full flex items-center gap-3 p-3 rounded-xl transition-all',
                                wallet.address === activeWallet?.address
                                    ? 'bg-[var(--primary)]/10 border-2 border-[var(--primary)]'
                                    : 'bg-[var(--background-tertiary)] border border-[var(--border)] hover:border-[var(--primary)]/50'
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
                                <p className="font-medium text-sm truncate">{wallet.name}</p>
                                <p className="text-xs text-[var(--foreground-muted)] font-mono truncate">
                                    {wallet.address}
                                </p>
                            </div>
                            {wallet.address === activeWallet?.address && (
                                <Check className="w-5 h-5 text-[var(--primary)] flex-shrink-0" />
                            )}
                        </button>
                    ))}

                    {/* Add Wallet */}
                    <button
                        onClick={() => openModal('create')}
                        className="w-full flex items-center gap-3 p-3 rounded-xl bg-[var(--background-tertiary)] border border-dashed border-[var(--border)] hover:border-[var(--primary)] transition-all"
                    >
                        <div className="w-10 h-10 rounded-xl bg-[var(--primary)]/10 flex items-center justify-center">
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
                                ? 'bg-[var(--primary)]/10 border-[var(--primary)] text-[var(--primary)]'
                                : 'bg-[var(--background-tertiary)] border-[var(--border)] text-[var(--foreground-muted)] hover:border-[var(--primary)]/50 hover:text-[var(--foreground)]'
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
                                ? 'bg-[var(--primary)]/10 border-[var(--primary)] text-[var(--primary)]'
                                : 'bg-[var(--background-tertiary)] border-[var(--border)] text-[var(--foreground-muted)] hover:border-[var(--primary)]/50 hover:text-[var(--foreground)]'
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
                                ? 'bg-[var(--primary)]/10 border-[var(--primary)] text-[var(--primary)]'
                                : 'bg-[var(--background-tertiary)] border-[var(--border)] text-[var(--foreground-muted)] hover:border-[var(--primary)]/50 hover:text-[var(--foreground)]'
                        )}
                    >
                        <Monitor className="w-5 h-5" />
                        <span className="text-xs font-medium">System</span>
                    </button>
                </div>
            </div>

            {/* Security */}
            <div>
                <h4 className="text-xs text-[var(--foreground-muted)] uppercase tracking-wider mb-3 px-1">
                    Security & Backup
                </h4>
                <div className="space-y-2">
                    {/* Backup JSON */}
                    <button
                        onClick={handleBackup}
                        className="w-full flex items-center gap-3 p-3 rounded-xl bg-[var(--background-tertiary)] border border-[var(--border)] hover:border-[var(--primary)] transition-all group"
                    >
                        <div className="w-10 h-10 rounded-xl bg-[var(--primary)]/10 flex items-center justify-center">
                            <Download className="w-5 h-5 text-[var(--primary)]" />
                        </div>
                        <div className="flex-1 text-left">
                            <p className="font-medium text-sm">Download Backup</p>
                            <p className="text-xs text-[var(--foreground-muted)]">Save encrypted wallet file (JSON)</p>
                        </div>
                    </button>

                    {/* Export Private Key */}
                    <button
                        onClick={handleExportKey}
                        className="w-full flex items-center gap-3 p-3 rounded-xl bg-[var(--background-tertiary)] border border-[var(--border)] hover:border-[var(--accent-red)]/50 transition-all group"
                    >
                        <div className="w-10 h-10 rounded-xl bg-[var(--accent-red)]/10 flex items-center justify-center">
                            <Key className="w-5 h-5 text-[var(--accent-red)]" />
                        </div>
                        <div className="flex-1 text-left">
                            <p className="font-medium text-sm">Export Private Key</p>
                            <p className="text-xs text-[var(--foreground-muted)]">View and copy your private key</p>
                        </div>
                        <ChevronRight className="w-5 h-5 text-[var(--foreground-muted)] group-hover:text-[var(--accent-red)]" />
                    </button>

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

                    {/* Reset Wallet */}
                    <button
                        onClick={handleResetWallet}
                        className="w-full flex items-center gap-3 p-3 rounded-xl bg-[var(--background-tertiary)] border border-[var(--border)] hover:bg-[var(--accent-red)]/10 hover:border-[var(--accent-red)] transition-all group"
                    >
                        <div className="w-10 h-10 rounded-xl bg-[var(--accent-red)]/5 flex items-center justify-center">
                            <Trash2 className="w-5 h-5 text-[var(--accent-red)]" />
                        </div>
                        <div className="flex-1 text-left">
                            <p className="font-medium text-sm text-[var(--accent-red)]">Reset App</p>
                            <p className="text-xs text-[var(--foreground-muted)]">Delete all data from browser</p>
                        </div>
                    </button>
                </div>
            </div>

            {/* Private Key Modal */}
            {
                showPrivateKey && (
                    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 animate-fade-in">
                        <div
                            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                            onClick={() => {
                                setShowPrivateKey(false);
                                setPrivateKeyVisible(false);
                            }}
                        />
                        <div className="relative w-full max-w-md bg-[var(--background-secondary)] border border-[var(--border)] rounded-2xl p-6 shadow-2xl">
                            <div className="flex gap-3 p-3 rounded-xl bg-[var(--accent-red)]/10 border border-[var(--accent-red)]/20 mb-4">
                                <AlertTriangle className="w-5 h-5 text-[var(--accent-red)] flex-shrink-0" />
                                <div className="text-xs text-[var(--foreground-muted)]">
                                    <p className="font-medium text-[var(--accent-red)] mb-1">Warning</p>
                                    <p>Never share your private key. Anyone with this key has full control of your wallet.</p>
                                </div>
                            </div>

                            <div className="p-4 rounded-xl bg-[var(--background-tertiary)] border border-[var(--border)]">
                                <div className="flex justify-between items-center mb-2">
                                    <p className="text-xs text-[var(--foreground-muted)]">
                                        {activeWallet?.type === 'solana' ? 'Private Key (Base58)' : 'Private Key'}
                                    </p>
                                    <button
                                        onClick={() => setPrivateKeyVisible(!privateKeyVisible)}
                                        className="p-1.5 hover:bg-[var(--border)] rounded-lg transition-colors"
                                    >
                                        {privateKeyVisible ? (
                                            <EyeOff className="w-4 h-4 text-[var(--foreground-muted)]" />
                                        ) : (
                                            <Eye className="w-4 h-4 text-[var(--foreground-muted)]" />
                                        )}
                                    </button>
                                </div>
                                <div className="relative min-h-[40px] flex items-center">
                                    <p className="font-mono text-sm break-all w-full leading-5">
                                        {privateKeyVisible
                                            ? revealedKey
                                            : '•'.repeat(Math.min(revealedKey?.length || 64, 64))
                                        }
                                    </p>
                                    {privateKeyVisible && (
                                        <button
                                            onClick={() => {
                                                navigator.clipboard.writeText(revealedKey || '');
                                                alert('Copied to clipboard');
                                            }}
                                            className="absolute right-0 bottom-0 p-1.5 bg-[var(--background-tertiary)] hover:bg-[var(--background)] rounded-lg border border-[var(--border)] shadow-sm"
                                            title="Copy"
                                        >
                                            <Key className="w-3 h-3" />
                                        </button>
                                    )}
                                </div>
                            </div>

                            <button
                                onClick={() => {
                                    setShowPrivateKey(false);
                                    setPrivateKeyVisible(false);
                                }}
                                className="w-full mt-4 py-3 rounded-xl bg-[var(--background-tertiary)] border border-[var(--border)] font-medium hover:border-[var(--primary)] transition-all"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                )
            }
        </div >
    );
}

