'use client';

import { useState } from 'react';
import {
    Key,
    Download,
    Shield,
    Eye,
    EyeOff,
    Copy,
    Check,
    AlertTriangle,
    FileDown,
    Trash2,
    Lock,
    ChevronRight,
    X
} from 'lucide-react';
import { clsx } from 'clsx';
import { useWalletStore } from '@/store/walletStore';
import { getSessionKey, getStoredWalletData, clearStoredWalletData } from '@/lib/wallet';

interface WalletSecurityTabProps {
    onLock: () => void;
}

export function WalletSecurityTab({ onLock }: WalletSecurityTabProps) {
    const { activeWallet } = useWalletStore();

    const [showPrivateKey, setShowPrivateKey] = useState(false);
    const [privateKeyVisible, setPrivateKeyVisible] = useState(false);
    const [revealedKey, setRevealedKey] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);
    const [confirmReset, setConfirmReset] = useState(false);
    const [confirmLock, setConfirmLock] = useState(false);

    const handleExportKey = () => {
        if (!activeWallet) return;

        const key = getSessionKey(activeWallet.address);
        if (key) {
            setRevealedKey(key);
            setShowPrivateKey(true);
        } else {
            alert('Session expired. Please lock and unlock your wallet.');
        }
    };

    const handleCopyKey = () => {
        if (revealedKey) {
            navigator.clipboard.writeText(revealedKey);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const handleBackupJson = () => {
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

    const handleBackupTxt = () => {
        if (!activeWallet) return;
        const key = getSessionKey(activeWallet.address);
        if (!key) {
            alert('Session expired. Please lock and unlock your wallet.');
            return;
        }

        const content = `CypherX Wallet Backup
========================
Date: ${new Date().toISOString()}
Wallet Name: ${activeWallet.name}
Wallet Type: ${activeWallet.type.toUpperCase()}
Address: ${activeWallet.address}

PRIVATE KEY (KEEP SECRET!):
${key}

========================
WARNING: Never share this file or private key with anyone!
Anyone with this key has full control of your wallet.`;

        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `cypherx-private-key-backup-${activeWallet.name.replace(/\s+/g, '-')}-${new Date().toISOString().slice(0, 10)}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const handleLockWallet = () => {
        if (confirmLock) {
            onLock();
        } else {
            setConfirmLock(true);
            setTimeout(() => setConfirmLock(false), 3000);
        }
    };

    const handleResetWallet = () => {
        if (confirmReset) {
            if (window.confirm('FINAL WARNING: This will permanently delete all wallet data. Are you absolutely sure?')) {
                clearStoredWalletData();
                window.location.reload();
            }
        } else {
            setConfirmReset(true);
            setTimeout(() => setConfirmReset(false), 5000);
        }
    };

    return (
        <div className="space-y-5 p-1">
            {/* Header */}
            <div className="flex items-center gap-3 px-1">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--primary)] to-[var(--accent-purple)] flex items-center justify-center">
                    <Shield className="w-5 h-5 text-white" />
                </div>
                <div>
                    <h3 className="font-bold text-base">Wallet Security</h3>
                    <p className="text-xs text-[var(--foreground-muted)]">Manage your wallet keys and backups</p>
                </div>
            </div>

            {/* Warning Banner */}
            <div className="flex gap-3 p-3 rounded-xl bg-[var(--accent-red)]/10 border border-[var(--accent-red)]/20">
                <AlertTriangle className="w-5 h-5 text-[var(--accent-red)] flex-shrink-0 mt-0.5" />
                <div className="text-xs text-[var(--foreground-muted)]">
                    <p className="font-medium text-[var(--accent-red)] mb-1">Keep your keys safe!</p>
                    <p>Never share your private key or seed phrase. Anyone with access to these can steal your funds.</p>
                </div>
            </div>

            {/* Private Key Section */}
            <div className="space-y-2">
                <h4 className="text-xs text-[var(--foreground-muted)] uppercase tracking-wider px-1">
                    Private Key
                </h4>
                <button
                    onClick={handleExportKey}
                    className="w-full flex items-center gap-3 p-4 rounded-xl bg-[var(--background-tertiary)] border border-[var(--border)] hover:border-[var(--accent-red)]/50 transition-all group"
                >
                    <div className="w-10 h-10 rounded-xl bg-[var(--accent-red)]/10 flex items-center justify-center">
                        <Key className="w-5 h-5 text-[var(--accent-red)]" />
                    </div>
                    <div className="flex-1 text-left">
                        <p className="font-medium text-sm">View Private Key</p>
                        <p className="text-xs text-[var(--foreground-muted)]">
                            {activeWallet?.type === 'solana' ? 'Base58 encoded' : 'Hex format'}
                        </p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-[var(--foreground-muted)] group-hover:text-[var(--accent-red)]" />
                </button>
            </div>

            {/* Backup Options */}
            <div className="space-y-2">
                <h4 className="text-xs text-[var(--foreground-muted)] uppercase tracking-wider px-1">
                    Backup Options
                </h4>
                <div className="space-y-2">
                    <button
                        onClick={handleBackupJson}
                        className="w-full flex items-center gap-3 p-4 rounded-xl bg-[var(--background-tertiary)] border border-[var(--border)] hover:border-[var(--border-hover)] transition-all group"
                    >
                        <div className="w-10 h-10 rounded-xl bg-[var(--primary)]/10 flex items-center justify-center">
                            <Download className="w-5 h-5 text-[var(--primary)]" />
                        </div>
                        <div className="flex-1 text-left">
                            <p className="font-medium text-sm">Download Encrypted Backup</p>
                            <p className="text-xs text-[var(--foreground-muted)]">JSON file with encrypted keys</p>
                        </div>
                    </button>

                    <button
                        onClick={handleBackupTxt}
                        className="w-full flex items-center gap-3 p-4 rounded-xl bg-[var(--background-tertiary)] border border-[var(--border)] hover:border-[var(--accent-yellow)]/50 transition-all group"
                    >
                        <div className="w-10 h-10 rounded-xl bg-[var(--accent-yellow)]/10 flex items-center justify-center">
                            <FileDown className="w-5 h-5 text-[var(--accent-yellow)]" />
                        </div>
                        <div className="flex-1 text-left">
                            <p className="font-medium text-sm">Export Private Key File</p>
                            <p className="text-xs text-[var(--foreground-muted)]">Plain text backup (handle with care!)</p>
                        </div>
                    </button>
                </div>
            </div>

            {/* Security Actions */}
            <div className="space-y-2">
                <h4 className="text-xs text-[var(--foreground-muted)] uppercase tracking-wider px-1">
                    Security Actions
                </h4>
                <div className="space-y-2">
                    <button
                        onClick={handleLockWallet}
                        className={clsx(
                            'w-full flex items-center gap-3 p-4 rounded-xl transition-all',
                            confirmLock
                                ? 'bg-[var(--accent-yellow)]/10 border-2 border-[var(--accent-yellow)]'
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

                    <button
                        onClick={handleResetWallet}
                        className={clsx(
                            'w-full flex items-center gap-3 p-4 rounded-xl transition-all',
                            confirmReset
                                ? 'bg-[var(--accent-red)]/10 border-2 border-[var(--accent-red)]'
                                : 'bg-[var(--background-tertiary)] border border-[var(--border)] hover:border-[var(--accent-red)]/50'
                        )}
                    >
                        <div className="w-10 h-10 rounded-xl bg-[var(--accent-red)]/10 flex items-center justify-center">
                            <Trash2 className="w-5 h-5 text-[var(--accent-red)]" />
                        </div>
                        <div className="flex-1 text-left">
                            <p className="font-medium text-sm text-[var(--accent-red)]">
                                {confirmReset ? 'Click again to DELETE ALL DATA' : 'Reset Wallet'}
                            </p>
                            <p className="text-xs text-[var(--foreground-muted)]">
                                Permanently delete all wallet data
                            </p>
                        </div>
                    </button>
                </div>
            </div>

            {/* Private Key Modal */}
            {showPrivateKey && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 animate-fade-in">
                    <div
                        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                        onClick={() => {
                            setShowPrivateKey(false);
                            setPrivateKeyVisible(false);
                            setRevealedKey(null);
                        }}
                    />
                    <div className="relative w-full max-w-md bg-[var(--background-secondary)] border border-[var(--border)] rounded-2xl p-6 shadow-2xl">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-[var(--accent-red)]/10 flex items-center justify-center">
                                    <Key className="w-5 h-5 text-[var(--accent-red)]" />
                                </div>
                                <div>
                                    <h3 className="font-bold">Private Key</h3>
                                    <p className="text-xs text-[var(--foreground-muted)]">{activeWallet?.name}</p>
                                </div>
                            </div>
                            <button
                                onClick={() => {
                                    setShowPrivateKey(false);
                                    setPrivateKeyVisible(false);
                                    setRevealedKey(null);
                                }}
                                className="p-2 hover:bg-[var(--background-tertiary)] rounded-lg transition-colors"
                            >
                                <X className="w-5 h-5 text-[var(--foreground-muted)]" />
                            </button>
                        </div>

                        {/* Warning */}
                        <div className="flex gap-3 p-3 rounded-xl bg-[var(--accent-red)]/10 border border-[var(--accent-red)]/20 mb-4">
                            <AlertTriangle className="w-5 h-5 text-[var(--accent-red)] flex-shrink-0" />
                            <p className="text-xs text-[var(--foreground-muted)]">
                                <span className="font-medium text-[var(--accent-red)]">Never share this key!</span> Anyone with access can steal your funds.
                            </p>
                        </div>

                        {/* Key Display */}
                        <div className="p-4 rounded-xl bg-[var(--background-tertiary)] border border-[var(--border)]">
                            <div className="flex justify-between items-center mb-3">
                                <p className="text-xs text-[var(--foreground-muted)]">
                                    {activeWallet?.type === 'solana' ? 'Private Key (Base58)' : 'Private Key (Hex)'}
                                </p>
                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={() => setPrivateKeyVisible(!privateKeyVisible)}
                                        className="p-1.5 hover:bg-[var(--border)] rounded-lg transition-colors"
                                        title={privateKeyVisible ? 'Hide' : 'Show'}
                                    >
                                        {privateKeyVisible ? (
                                            <EyeOff className="w-4 h-4 text-[var(--foreground-muted)]" />
                                        ) : (
                                            <Eye className="w-4 h-4 text-[var(--foreground-muted)]" />
                                        )}
                                    </button>
                                    <button
                                        onClick={handleCopyKey}
                                        className="p-1.5 hover:bg-[var(--border)] rounded-lg transition-colors"
                                        title="Copy"
                                    >
                                        {copied ? (
                                            <Check className="w-4 h-4 text-[var(--accent-green)]" />
                                        ) : (
                                            <Copy className="w-4 h-4 text-[var(--foreground-muted)]" />
                                        )}
                                    </button>
                                </div>
                            </div>
                            <p className="font-mono text-sm break-all leading-6 select-all">
                                {privateKeyVisible
                                    ? revealedKey
                                    : '•'.repeat(Math.min(revealedKey?.length || 64, 64))
                                }
                            </p>
                        </div>

                        {/* Close Button */}
                        <button
                            onClick={() => {
                                setShowPrivateKey(false);
                                setPrivateKeyVisible(false);
                                setRevealedKey(null);
                            }}
                            className="w-full mt-4 py-3 rounded-xl bg-[var(--background-tertiary)] border border-[var(--border)] font-medium hover:border-[var(--border-hover)] transition-all"
                        >
                            Done
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
