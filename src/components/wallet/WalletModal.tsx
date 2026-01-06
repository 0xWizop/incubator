'use client';

import { useState } from 'react';
import { X, Wallet, Key, Plus, ArrowLeft, Eye, EyeOff, Lock, AlertTriangle, CheckCircle } from 'lucide-react';
import { clsx } from 'clsx';
import { useWalletStore } from '@/store/walletStore';
import { WalletDashboard } from './WalletDashboard';

export function WalletModal() {
    const {
        isModalOpen,
        modalView,
        isLoading,
        error,
        isUnlocked,
        activeWallet,
        closeModal,
        openModal,
        createWallet,
        importWallet,
        unlock,
        setError,
    } = useWalletStore();

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [privateKey, setPrivateKey] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [walletType, setWalletType] = useState<'evm' | 'solana'>('evm');
    const [agreedToTerms, setAgreedToTerms] = useState(false);

    if (!isModalOpen) return null;

    const handleClose = () => {
        setPassword('');
        setConfirmPassword('');
        setPrivateKey('');
        setShowPassword(false);
        setAgreedToTerms(false);
        setError(null);
        closeModal();
    };

    const handleCreateWallet = async () => {
        if (password.length < 8) {
            setError('Password must be at least 8 characters');
            return;
        }
        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }
        if (!agreedToTerms) {
            setError('Please agree to the terms');
            return;
        }

        const success = await createWallet(password, walletType);
        if (success) {
            // Don't close - stay open to show dashboard
            setPassword('');
            setConfirmPassword('');
            setAgreedToTerms(false);
            setAgreedToTerms(false);
        }
    };

    const handleImportWallet = async () => {
        if (!privateKey) {
            setError('Please enter your private key');
            return;
        }
        if (password.length < 8) {
            setError('Password must be at least 8 characters');
            return;
        }

        const success = await importWallet(password, privateKey, walletType);
        if (success) {
            setPassword('');
            setConfirmPassword('');
            setPrivateKey('');
            setAgreedToTerms(false);
        }
    };

    const handleUnlock = async () => {
        if (!password) {
            setError('Please enter your password');
            return;
        }

        const success = await unlock(password);
        if (success) {
            setPassword('');
            // Don't close - stay open to show dashboard
        }
    };

    // Show dashboard if unlocked and has wallet
    const showDashboard = isUnlocked && activeWallet && modalView !== 'create' && modalView !== 'import';

    const renderMainView = () => (
        <div className="space-y-4">
            <div className="text-center mb-6">
                <div className="w-16 h-16 rounded-2xl bg-[var(--primary)]/20 flex items-center justify-center mx-auto mb-4">
                    <Wallet className="w-8 h-8 text-[var(--primary)]" />
                </div>
                <h2 className="text-xl font-bold">Get Started</h2>
                <p className="text-sm text-[var(--foreground-muted)] mt-1">
                    Create or import a wallet to start trading
                </p>
            </div>

            <button
                onClick={() => openModal('create')}
                className="w-full flex items-center gap-4 p-4 rounded-xl bg-[var(--background-tertiary)] border border-[var(--border)] hover:border-[var(--primary)] transition-all group"
            >
                <div className="w-12 h-12 rounded-xl bg-[var(--primary)]/10 flex items-center justify-center group-hover:bg-[var(--primary)]/20 transition-colors">
                    <Plus className="w-6 h-6 text-[var(--primary)]" />
                </div>
                <div className="text-left">
                    <p className="font-medium">Create New Wallet</p>
                    <p className="text-xs text-[var(--foreground-muted)]">
                        Generate a new secure wallet
                    </p>
                </div>
            </button>

            <button
                onClick={() => openModal('import')}
                className="w-full flex items-center gap-4 p-4 rounded-xl bg-[var(--background-tertiary)] border border-[var(--border)] hover:border-[var(--primary)] transition-all group"
            >
                <div className="w-12 h-12 rounded-xl bg-[var(--accent-yellow)]/10 flex items-center justify-center group-hover:bg-[var(--accent-yellow)]/20 transition-colors">
                    <Key className="w-6 h-6 text-[var(--accent-yellow)]" />
                </div>
                <div className="text-left">
                    <p className="font-medium">Import Wallet</p>
                    <p className="text-xs text-[var(--foreground-muted)]">
                        Use existing seed phrase or private key
                    </p>
                </div>
            </button>
        </div>
    );

    const renderCreateView = () => (
        <div className="space-y-4">
            <button
                onClick={() => openModal('main')}
                className="flex items-center gap-2 text-sm text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors"
            >
                <ArrowLeft className="w-4 h-4" />
                Back
            </button>

            <div className="text-center mb-4">
                <h2 className="text-xl font-bold">Create Wallet</h2>
                <p className="text-sm text-[var(--foreground-muted)] mt-1">
                    Set a password to secure your wallet
                </p>
            </div>

            {/* Wallet Type Selection */}
            <div className="flex gap-2 p-1 bg-[var(--background-tertiary)] rounded-lg">
                <button
                    onClick={() => setWalletType('evm')}
                    className={clsx(
                        'flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all',
                        walletType === 'evm'
                            ? 'bg-[var(--primary)] text-black'
                            : 'text-[var(--foreground-muted)] hover:text-[var(--foreground)]'
                    )}
                >
                    EVM (ETH/Base/Arb)
                </button>
                <button
                    onClick={() => setWalletType('solana')}
                    className={clsx(
                        'flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all',
                        walletType === 'solana'
                            ? 'bg-[var(--solana)] text-white'
                            : 'text-[var(--foreground-muted)] hover:text-[var(--foreground)]'
                    )}
                >
                    Solana
                </button>
            </div>

            {/* Password Input */}
            <div className="space-y-3">
                <div>
                    <label className="block text-xs text-[var(--foreground-muted)] mb-1.5">
                        Password (min 8 characters)
                    </label>
                    <div className="relative">
                        <input
                            type={showPassword ? 'text' : 'password'}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Enter a strong password"
                            className="input input-no-icon w-full pr-10"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
                        >
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                    </div>
                </div>

                <div>
                    <label className="block text-xs text-[var(--foreground-muted)] mb-1.5">
                        Confirm Password
                    </label>
                    <input
                        type={showPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Confirm your password"
                        className="input input-no-icon w-full"
                    />
                </div>
            </div>

            {/* Warning */}
            <div className="flex gap-3 p-3 rounded-lg bg-[var(--accent-yellow)]/10 border border-[var(--accent-yellow)]/20">
                <AlertTriangle className="w-5 h-5 text-[var(--accent-yellow)] flex-shrink-0 mt-0.5" />
                <div className="text-xs text-[var(--foreground-muted)]">
                    <p className="font-medium text-[var(--accent-yellow)] mb-1">Important</p>
                    <p>Your password encrypts your private keys locally. If you forget it, you'll need your seed phrase to recover access. We cannot recover your password.</p>
                </div>
            </div>

            {/* Terms */}
            <label className="flex items-start gap-3 cursor-pointer">
                <input
                    type="checkbox"
                    checked={agreedToTerms}
                    onChange={(e) => setAgreedToTerms(e.target.checked)}
                    className="mt-1 accent-[var(--primary)]"
                />
                <span className="text-xs text-[var(--foreground-muted)]">
                    I understand that my private keys are stored locally and encrypted with my password. I am responsible for backing up my wallet.
                </span>
            </label>

            {/* Error */}
            {error && (
                <div className="p-3 rounded-lg bg-[var(--accent-red)]/10 border border-[var(--accent-red)]/20 text-sm text-[var(--accent-red)]">
                    {error}
                </div>
            )}

            {/* Create Button */}
            <button
                onClick={handleCreateWallet}
                disabled={isLoading || !password || !confirmPassword || !agreedToTerms}
                className="btn btn-primary w-full py-3"
            >
                {isLoading ? (
                    <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                ) : (
                    <>
                        <CheckCircle className="w-4 h-4" />
                        Create Wallet
                    </>
                )}
            </button>
        </div>
    );

    const renderUnlockView = () => (
        <div className="space-y-4">
            <div className="text-center mb-6">
                <div className="w-16 h-16 rounded-2xl bg-[var(--primary)]/20 flex items-center justify-center mx-auto mb-4">
                    <Lock className="w-8 h-8 text-[var(--primary)]" />
                </div>
                <h2 className="text-xl font-bold">Unlock Wallet</h2>
                <p className="text-sm text-[var(--foreground-muted)] mt-1">
                    Enter your password to continue
                </p>
            </div>

            <div>
                <label className="block text-xs text-[var(--foreground-muted)] mb-1.5">
                    Password
                </label>
                <div className="relative">
                    <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleUnlock()}
                        placeholder="Enter your password"
                        className="input input-no-icon w-full pr-10"
                        autoFocus
                    />
                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
                    >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                </div>
            </div>

            {/* Error */}
            {error && (
                <div className="p-3 rounded-lg bg-[var(--accent-red)]/10 border border-[var(--accent-red)]/20 text-sm text-[var(--accent-red)]">
                    {error}
                </div>
            )}

            <button
                onClick={handleUnlock}
                disabled={isLoading || !password}
                className="btn btn-primary w-full py-3"
            >
                {isLoading ? (
                    <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                ) : (
                    'Unlock'
                )}
            </button>
        </div>
    );

    const renderImportView = () => (
        <div className="space-y-4">
            <button
                onClick={() => openModal('main')}
                className="flex items-center gap-2 text-sm text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors"
            >
                <ArrowLeft className="w-4 h-4" />
                Back
            </button>

            <div className="text-center mb-4">
                <h2 className="text-xl font-bold">Import Wallet</h2>
                <p className="text-sm text-[var(--foreground-muted)] mt-1">
                    Enter your private key to import
                </p>
            </div>

            {/* Wallet Type Selection */}
            <div className="flex gap-2 p-1 bg-[var(--background-tertiary)] rounded-lg">
                <button
                    onClick={() => setWalletType('evm')}
                    className={clsx(
                        'flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all',
                        walletType === 'evm'
                            ? 'bg-[var(--primary)] text-black'
                            : 'text-[var(--foreground-muted)] hover:text-[var(--foreground)]'
                    )}
                >
                    EVM (ETH/Base/Arb)
                </button>
                <button
                    onClick={() => setWalletType('solana')}
                    className={clsx(
                        'flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all',
                        walletType === 'solana'
                            ? 'bg-[var(--solana)] text-white'
                            : 'text-[var(--foreground-muted)] hover:text-[var(--foreground)]'
                    )}
                >
                    Solana
                </button>
            </div>

            <div className="space-y-3">
                {/* Private Key Input */}
                <div>
                    <label className="block text-xs text-[var(--foreground-muted)] mb-1.5">
                        {walletType === 'solana' ? 'Private Key (Base58)' : 'Private Key (0x...)'}
                    </label>
                    <div className="relative">
                        <textarea
                            value={privateKey}
                            onChange={(e) => setPrivateKey(e.target.value)}
                            placeholder="Paste your private key here"
                            className="input input-no-icon w-full h-24 py-2 resize-none font-mono text-xs"
                        />
                    </div>
                </div>

                {/* Password Input for Encryption */}
                <div>
                    <label className="block text-xs text-[var(--foreground-muted)] mb-1.5">
                        Set Password (to encrypt locally)
                    </label>
                    <div className="relative">
                        <input
                            type={showPassword ? 'text' : 'password'}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Enter a strong password"
                            className="input input-no-icon w-full pr-10"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
                        >
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Error */}
            {error && (
                <div className="p-3 rounded-lg bg-[var(--accent-red)]/10 border border-[var(--accent-red)]/20 text-sm text-[var(--accent-red)]">
                    {error}
                </div>
            )}

            <button
                onClick={handleImportWallet}
                disabled={isLoading || !privateKey || !password}
                className="btn btn-primary w-full py-3"
            >
                {isLoading ? (
                    <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                ) : (
                    <>
                        <Key className="w-4 h-4 mr-2" />
                        Import Wallet
                    </>
                )}
            </button>
        </div>
    );

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                onClick={handleClose}
            />

            {/* Modal - bigger when showing dashboard */}
            <div className={clsx(
                "relative bg-[var(--background-secondary)] border border-[var(--border)] rounded-2xl shadow-2xl animate-fade-in overflow-hidden",
                showDashboard
                    ? "w-full max-w-lg max-h-[90vh]"
                    : "w-full max-w-md p-6"
            )}>
                {/* Content */}
                {showDashboard ? (
                    <WalletDashboard onClose={handleClose} />
                ) : (
                    <>
                        {/* Close button */}
                        <button
                            onClick={handleClose}
                            className="absolute top-4 right-4 p-2 rounded-lg hover:bg-[var(--background-tertiary)] transition-colors z-10"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        {modalView === 'main' && renderMainView()}
                        {modalView === 'create' && renderCreateView()}
                        {modalView === 'unlock' && renderUnlockView()}
                        {modalView === 'import' && renderImportView()}
                    </>
                )}
            </div>
        </div>
    );
}
