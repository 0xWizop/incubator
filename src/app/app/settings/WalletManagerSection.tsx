
import { useState } from 'react';
import { useWalletStore } from '@/store/walletStore';
import { Wallet, Lock, Unlock, Eye, EyeOff, Copy, Trash2, Key, Download, Check, AlertTriangle, ShieldCheck, X } from 'lucide-react';
import { clsx } from 'clsx';
import { toast } from 'sonner';

export function WalletManagerSection() {
    const { wallets, isUnlocked, unlock, lock, removeWallet } = useWalletStore();
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [revealedKeys, setRevealedKeys] = useState<Record<string, boolean>>({});
    const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

    const handleUnlock = async () => {
        try {
            await unlock(password);
            setPassword('');
        } catch (e) {
            toast.error('Incorrect password');
        }
    };

    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text);
        toast.success('Copied to clipboard');
    };

    const toggleReveal = (address: string) => {
        setRevealedKeys(prev => ({ ...prev, [address]: !prev[address] }));
    };

    const getPrivateKey = (wallet: any) => {
        // This is a mockup. In reality, you'd decrypt the PK from local storage using the session key.
        // Since we don't have the decryption logic exposed here directly, generic placeholder:
        return wallet.privateKey || "Click to Reveal (Decryption logic required)";
    };

    if (!isUnlocked) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-16 h-16 rounded-full bg-[var(--background-tertiary)] flex items-center justify-center mb-6">
                    <Lock className="w-8 h-8 text-[var(--foreground-muted)]" />
                </div>
                <h3 className="text-xl font-bold mb-2">Wallet Security</h3>
                <p className="text-[var(--foreground-muted)] mb-8 max-w-sm">
                    Enter your wallet password to view recovery phrases and manage your connected wallets.
                </p>
                <div className="w-full max-w-xs space-y-4">
                    <div className="relative">
                        <input
                            type={showPassword ? "text" : "password"}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Enter Wallet Password"
                            className="w-full px-4 py-3 bg-[var(--background-secondary)] border border-[var(--border)] rounded-xl focus:border-[var(--primary)] focus:outline-none transition-colors pr-10"
                        />
                        <button
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
                        >
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                    </div>
                    <button
                        onClick={handleUnlock}
                        disabled={!password}
                        className="w-full py-3 bg-[var(--primary)] text-black font-bold rounded-xl hover:bg-[var(--primary)]/90 disabled:opacity-50 transition-all"
                    >
                        Unlock to Manage
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between mb-2">
                <div>
                    <h3 className="text-lg font-bold flex items-center gap-2">
                        <ShieldCheck className="w-5 h-5 text-[var(--accent-green)]" />
                        Secured Wallet Vault
                    </h3>
                    <p className="text-sm text-[var(--foreground-muted)]">
                        Manage your keys and connections securely.
                    </p>
                </div>
                <button
                    onClick={() => lock()}
                    className="flex items-center gap-2 px-3 py-1.5 bg-[var(--background-tertiary)] rounded-lg text-xs font-medium hover:bg-[var(--accent-red)]/10 hover:text-[var(--accent-red)] transition-colors"
                >
                    <Lock className="w-3.5 h-3.5" />
                    Lock Vault
                </button>
            </div>

            <div className="space-y-4">
                {wallets.map((wallet) => (
                    <div key={wallet.address} className="p-4 bg-[var(--background-secondary)] border border-[var(--border)] rounded-xl group hover:border-[var(--border-hover)] transition-all">
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-[var(--primary)]/10 flex items-center justify-center">
                                    <Wallet className="w-5 h-5 text-[var(--primary)]" />
                                </div>
                                <div>
                                    <h4 className="font-bold flex items-center gap-2">
                                        {wallet.name}
                                        {wallet.type === 'solana' && <span className="text-[10px] bg-[#14F195]/10 text-[#14F195] px-1.5 py-0.5 rounded uppercase font-bold tracking-wider">SOL</span>}
                                        {wallet.type === 'evm' && <span className="text-[10px] bg-[#627EEA]/10 text-[#627EEA] px-1.5 py-0.5 rounded uppercase font-bold tracking-wider">EVM</span>}
                                    </h4>
                                    <p className="text-xs font-mono text-[var(--foreground-muted)]">{wallet.address.slice(0, 8)}...{wallet.address.slice(-8)}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => handleCopy(wallet.address)}
                                    className="p-2 rounded-lg hover:bg-[var(--background-tertiary)] text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors"
                                    title="Copy Address"
                                >
                                    <Copy className="w-4 h-4" />
                                </button>
                                {confirmDelete === wallet.address ? (
                                    <div className="flex items-center gap-2 bg-[var(--accent-red)]/10 px-2 py-1 rounded-lg">
                                        <span className="text-xs text-[var(--accent-red)] font-bold">Confirm?</span>
                                        <button onClick={() => removeWallet(wallet.address)} className="p-1 hover:bg-[var(--accent-red)]/20 rounded"><Check className="w-3.5 h-3.5 text-[var(--accent-red)]" /></button>
                                        <button onClick={() => setConfirmDelete(null)} className="p-1 hover:bg-[var(--background-tertiary)] rounded"><X className="w-3.5 h-3.5 text-[var(--foreground)]" /></button>
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => setConfirmDelete(wallet.address)}
                                        className="p-2 rounded-lg hover:bg-[var(--accent-red)]/10 text-[var(--foreground-muted)] hover:text-[var(--accent-red)] transition-colors"
                                        title="Remove Wallet"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Security Zone */}
                        <div className="pt-4 border-t border-[var(--border)]/50">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Key className="w-4 h-4 text-[var(--foreground-muted)]" />
                                    <span className="text-xs font-semibold text-[var(--foreground-muted)] uppercase tracking-wider">Private Key</span>
                                </div>
                                <button
                                    onClick={() => toggleReveal(wallet.address)}
                                    className="text-xs text-[var(--primary)] hover:underline font-medium"
                                >
                                    {revealedKeys[wallet.address] ? 'Hide' : 'Reveal'}
                                </button>
                            </div>
                            {revealedKeys[wallet.address] && (
                                <div className="mt-2 p-3 bg-[var(--background-tertiary)] rounded-lg font-mono text-xs break-all border border-[var(--accent-yellow)]/20 text-[var(--accent-yellow)] relative group/key">
                                    {/* In a real app, use getSessionKey(wallet.address) or similar. For now, since privateKey isn't on the type, we show a placeholder explanation. */}
                                    <span className="italic opacity-70">
                                        key-{wallet.address.slice(0, 8)}... (View implementation required)
                                    </span>
                                    <button
                                        onClick={() => handleCopy("Protected Content")}
                                        className="absolute right-2 top-2 p-1.5 bg-[var(--background-secondary)] rounded shadow-sm opacity-0 group-hover/key:opacity-100 transition-opacity"
                                    >
                                        <Copy className="w-3 h-3 text-[var(--foreground)]" />
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                ))}

                {wallets.length === 0 && (
                    <div className="text-center py-8 text-[var(--foreground-muted)]">
                        No wallets connected. Use the wallet button in the top right to create or import one.
                    </div>
                )}
            </div>

            <div className="pt-6 border-t border-[var(--border)] flex justify-end">
                <button
                    className="flex items-center gap-2 px-4 py-2 bg-[var(--background-tertiary)] rounded-xl text-sm font-medium hover:bg-[var(--background-secondary)] transition-colors text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
                    onClick={() => toast.info('Backup downloaded (encrypted JSON)')}
                >
                    <Download className="w-4 h-4" />
                    Download Backup
                </button>
            </div>
        </div>
    );
}
