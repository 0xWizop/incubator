'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import {
    User,
    Mail,
    Bell,
    Palette,
    Wallet,
    Save,
    Loader2,
    Check,
} from 'lucide-react';
import { clsx } from 'clsx';
import { updateUserPreferences, updateUserProfile, defaultPreferences } from '@/lib/firebase/collections';
import { useTheme } from 'next-themes';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '@/lib/firebase/config';
import { Camera } from 'lucide-react';
import { updateProfile } from 'firebase/auth';

import { ChainId, UserPreferences, CurrencyDisplay } from '@/types';
import { Eye, EyeOff, DollarSign, Percent, Shield, Zap, LayoutTemplate } from 'lucide-react';
import { WalletManagerSection } from './WalletManagerSection';

const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'wallets', label: 'Wallets', icon: Wallet },
    { id: 'preferences', label: 'Preferences', icon: Palette },
    { id: 'notifications', label: 'Notifications', icon: Bell },
];

const chainOptions: { id: ChainId; name: string; logo: string }[] = [
    { id: 'solana', name: 'Solana', logo: 'https://i.imgur.com/xp7PYKk.png' },
    { id: 'ethereum', name: 'Ethereum', logo: 'https://i.imgur.com/NKQlhQj.png' },
    { id: 'base', name: 'Base', logo: 'https://i.imgur.com/zn5hpMs.png' },
    { id: 'arbitrum', name: 'Arbitrum', logo: 'https://i.imgur.com/jmOXWlA.png' },
];

export default function SettingsPage() {
    const { firebaseUser, user, loading } = useAuth();
    const router = useRouter();
    const { setTheme } = useTheme();
    const [activeTab, setActiveTab] = useState('profile');
    const [displayName, setDisplayName] = useState('');
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [uploading, setUploading] = useState(false);

    // Preferences state
    const [preferences, setPreferences] = useState<UserPreferences>(defaultPreferences);

    useEffect(() => {
        if (!loading && !firebaseUser) {
            router.push('/app/dashboard/');
        }
        if (firebaseUser?.displayName) {
            setDisplayName(firebaseUser.displayName);
        }
        if (user?.preferences) {
            setPreferences(user.preferences);
        }
    }, [firebaseUser, user, loading, router]);

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || !e.target.files[0] || !firebaseUser) return;

        const file = e.target.files[0];
        if (file.size > 5 * 1024 * 1024) {
            alert('File size must be less than 5MB');
            return;
        }

        try {
            setUploading(true);
            const storageRef = ref(storage, `users/${firebaseUser.uid}/profile_pic`);
            await uploadBytes(storageRef, file);
            const downloadURL = await getDownloadURL(storageRef);

            // Update Auth and Firestore
            await updateProfile(firebaseUser, { photoURL: downloadURL });
            await updateUserProfile(firebaseUser.uid, { photoURL: downloadURL });

            // Reload to reflect changes immediately
            window.location.reload();
        } catch (error) {
            console.error('Error uploading image:', error);
            alert('Failed to upload image. Please try again.');
        } finally {
            setUploading(false);
        }
    };

    const handleSaveProfile = async () => {
        if (!firebaseUser) return;
        setSaving(true);

        try {
            // Update Auth and Firestore
            if (displayName !== firebaseUser.displayName) {
                await updateProfile(firebaseUser, { displayName });
            }
            await updateUserProfile(firebaseUser.uid, { displayName });

            setSaving(false);
            setSaved(true);
            setTimeout(() => setSaved(false), 2000);
        } catch (error) {
            console.error('Error saving profile:', error);
            setSaving(false);
        }
    };

    const handleToggleDarkMode = async (value: boolean) => {
        // Immediate UI update via next-themes
        setTheme(value ? 'dark' : 'light');

        if (!firebaseUser) return;
        const newPrefs = { ...preferences, darkMode: value };
        setPreferences(newPrefs);
        await updateUserPreferences(firebaseUser.uid, { darkMode: value });
    };

    const handleChangeDefaultChain = async (chain: ChainId) => {
        if (!firebaseUser) return;
        const newPrefs = { ...preferences, defaultChain: chain };
        setPreferences(newPrefs);
        await updateUserPreferences(firebaseUser.uid, { defaultChain: chain });
    };

    const handleToggleNotification = async (key: keyof UserPreferences['notifications'], value: boolean) => {
        if (!firebaseUser) return;
        const newNotifications = { ...preferences.notifications, [key]: value };
        const newPrefs = { ...preferences, notifications: newNotifications };
        setPreferences(newPrefs);
        await updateUserPreferences(firebaseUser.uid, { notifications: newNotifications });
    };

    const handleChangeSlippage = async (value: number) => {
        if (!firebaseUser) return;
        const newPrefs = { ...preferences, defaultSlippage: value, customSlippage: value === 0 ? preferences.customSlippage : undefined };
        setPreferences(newPrefs);
        await updateUserPreferences(firebaseUser.uid, { defaultSlippage: value });
    };

    const handleChangeCustomSlippage = async (value: number) => {
        if (!firebaseUser) return;
        const newPrefs = { ...preferences, defaultSlippage: 'custom' as any, customSlippage: value }; // Cast to any to bypass strict type check if needed or adjust type
        // Actually typical pattern is just setting customSlippage and maybe a specific flag or just using customSlippage if default is set to a specific value
        // Let's stick to the type definition: defaultSlippage is number.
        // If we want "custom", we might need to handle it.
        // Let's assume defaultSlippage stores the actual number used, and customSlippage is strictly for the input persistence.
        // Wait, the type says: defaultSlippage: number.
        // So we just set defaultSlippage to the value.
        // But the UI needs to know if it's one of the presets (0.5, 1, 3) or custom.

        setPreferences({ ...preferences, customSlippage: value, defaultSlippage: value });
        await updateUserPreferences(firebaseUser.uid, { customSlippage: value, defaultSlippage: value });
    };

    // Better handler for slippage
    const handleSlippageSelect = async (value: number | 'custom') => {
        if (!firebaseUser) return;

        let newPrefs: UserPreferences;

        if (value === 'custom') {
            // Don't update backend yet, just local state if needed or focus input
            // We'll let the input change handler do the actual update
            return;
        } else {
            newPrefs = { ...preferences, defaultSlippage: value };
            setPreferences(newPrefs);
            await updateUserPreferences(firebaseUser.uid, { defaultSlippage: value });
        }
    };

    // Input handler for custom slippage
    const handleCustomSlippageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = parseFloat(e.target.value);
        if (isNaN(val) || val < 0 || val > 50) return;

        if (!firebaseUser) return;
        const newPrefs = { ...preferences, defaultSlippage: val, customSlippage: val };
        setPreferences(newPrefs);
        // Debounce this in a real app, but for now simple update
        await updateUserPreferences(firebaseUser.uid, { defaultSlippage: val, customSlippage: val });
    };

    const handleChangeCurrency = async (currency: CurrencyDisplay) => {
        if (!firebaseUser) return;
        const newPrefs = { ...preferences, currencyDisplay: currency };
        setPreferences(newPrefs);
        await updateUserPreferences(firebaseUser.uid, { currencyDisplay: currency });
    };

    const handleToggleHideBalances = async (value: boolean) => {
        if (!firebaseUser) return;
        const newPrefs = { ...preferences, hideBalances: value };
        setPreferences(newPrefs);
        await updateUserPreferences(firebaseUser.uid, { hideBalances: value });
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="w-8 h-8 rounded-full border-2 border-[var(--primary)] border-t-transparent animate-spin" />
            </div>
        );
    }

    if (!firebaseUser) {
        return null;
    }

    return (
        <div className="h-[calc(100vh-5rem)] p-4 lg:p-6 max-w-7xl mx-auto flex flex-col overflow-hidden">
            <h1 className="text-xl font-bold mb-4 flex-shrink-0">Settings</h1>

            <div className="flex-1 flex flex-col lg:flex-row gap-4 min-h-0">
                {/* Sidebar tabs */}
                <div className="lg:w-60 flex-shrink-0 bg-[var(--background-secondary)] rounded-2xl border border-[var(--border)] overflow-hidden flex flex-col">
                    <div className="p-2 space-y-1">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={clsx(
                                    'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
                                    activeTab === tab.id
                                        ? 'bg-[var(--primary)]/10 text-[var(--primary)]'
                                        : 'text-[var(--foreground-muted)] hover:bg-[var(--background-tertiary)] hover:text-[var(--foreground)]'
                                )}
                            >
                                <tab.icon className={clsx("w-4 h-4", activeTab === tab.id && "text-[var(--primary)]")} />
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Content area */}
                <div className="flex-1 bg-[var(--background-secondary)] rounded-2xl border border-[var(--border)] overflow-hidden flex flex-col min-w-0">
                    <div className="h-full overflow-y-auto p-4 lg:p-6 custom-scrollbar">
                        {activeTab === 'profile' && (
                            <div className="max-w-2xl mx-auto">
                                <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
                                    <User className="w-5 h-5 text-[var(--primary)]" />
                                    Profile Information
                                </h2>

                                <div className="space-y-6">
                                    {/* Avatar */}
                                    <div className="flex items-center gap-4 p-4 rounded-xl bg-[var(--background-tertiary)]/50 border border-[var(--border)]">
                                        <div className="relative group">
                                            {firebaseUser.photoURL ? (
                                                <img
                                                    src={firebaseUser.photoURL}
                                                    alt=""
                                                    className="w-16 h-16 rounded-full ring-2 ring-[var(--border)] object-cover"
                                                />
                                            ) : (
                                                <div className="w-16 h-16 rounded-full bg-[var(--primary)]/20 flex items-center justify-center ring-2 ring-[var(--border)]">
                                                    <User className="w-8 h-8 text-[var(--primary)]" />
                                                </div>
                                            )}
                                            <label className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
                                                <Camera className="w-6 h-6 text-white" />
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    className="hidden"
                                                    onChange={handleImageUpload}
                                                    disabled={uploading}
                                                />
                                            </label>
                                            {uploading && (
                                                <div className="absolute inset-0 flex items-center justify-center bg-black/70 rounded-full">
                                                    <Loader2 className="w-6 h-6 text-white animate-spin" />
                                                </div>
                                            )}
                                        </div>
                                        <div>
                                            <p className="font-bold text-lg">{firebaseUser.displayName || 'User'}</p>
                                            <p className="text-sm text-[var(--foreground-muted)]">{firebaseUser.email}</p>
                                        </div>
                                    </div>

                                    {/* Display Name */}
                                    <div>
                                        <label className="block text-xs font-semibold text-[var(--foreground-muted)] uppercase tracking-wider mb-2">Display Name</label>
                                        <input
                                            type="text"
                                            value={displayName}
                                            onChange={(e) => setDisplayName(e.target.value)}
                                            className="w-full px-4 py-3 rounded-xl bg-[var(--background-tertiary)] border border-[var(--border)] focus:border-[var(--primary)] outline-none transition-colors"
                                            placeholder="Your display name"
                                        />
                                    </div>

                                    {/* Email (read-only) */}
                                    <div>
                                        <label className="block text-xs font-semibold text-[var(--foreground-muted)] uppercase tracking-wider mb-2">Email</label>
                                        <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-[var(--background-tertiary)] border border-[var(--border)] text-[var(--foreground-muted)]">
                                            <Mail className="w-4 h-4" />
                                            <span>{firebaseUser.email}</span>
                                            {firebaseUser.emailVerified && (
                                                <span className="ml-auto text-xs text-[var(--accent-green)] flex items-center gap-1 bg-[var(--accent-green)]/10 px-2 py-0.5 rounded-full">
                                                    <Check className="w-3 h-3" /> Verified
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* User ID */}
                                    <div>
                                        <label className="block text-xs font-semibold text-[var(--foreground-muted)] uppercase tracking-wider mb-2">User ID</label>
                                        <div className="px-4 py-3 rounded-xl bg-[var(--background-tertiary)] border border-[var(--border)] font-mono text-sm text-[var(--foreground-muted)] truncate">
                                            {firebaseUser.uid}
                                        </div>
                                    </div>

                                    {/* Save button */}
                                    <button
                                        onClick={handleSaveProfile}
                                        disabled={saving}
                                        className={clsx(
                                            'w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold transition-all transform active:scale-95',
                                            saving || saved
                                                ? 'bg-[var(--background-tertiary)] text-[var(--foreground-muted)]'
                                                : 'bg-[var(--primary)] text-black hover:bg-[var(--primary)]/90 shadow-lg shadow-[var(--primary)]/20'
                                        )}
                                    >
                                        {saving ? (
                                            <>
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                Saving...
                                            </>
                                        ) : saved ? (
                                            <>
                                                <Check className="w-4 h-4" />
                                                Saved!
                                            </>
                                        ) : (
                                            <>
                                                <Save className="w-4 h-4" />
                                                Save Changes
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        )}

                        {activeTab === 'wallets' && (
                            <div className="max-w-2xl mx-auto py-8">
                                <WalletManagerSection />
                            </div>
                        )}

                        {activeTab === 'preferences' && (
                            <div className="h-full flex flex-col">
                                <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
                                    <Palette className="w-5 h-5 text-[var(--primary)]" />
                                    Preferences
                                </h2>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Left Column: Trading & Chains */}
                                    <div className="space-y-6">
                                        {/* Slippage Settings */}
                                        <section className="space-y-3">
                                            <h3 className="text-xs font-semibold text-[var(--foreground-muted)] uppercase tracking-wider px-1">Trading</h3>
                                            <div className="p-4 rounded-xl bg-[var(--background-tertiary)]/50 border border-[var(--border)] hover:border-[var(--primary)]/30 transition-colors">
                                                <div className="flex items-center gap-2 mb-4">
                                                    <div className="p-1.5 rounded-lg bg-[var(--background)]">
                                                        <Percent className="w-4 h-4 text-[var(--primary)]" />
                                                    </div>
                                                    <p className="font-medium">Default Slippage</p>
                                                </div>
                                                <div className="grid grid-cols-4 gap-2 mb-3">
                                                    {[0.5, 1, 3].map((val) => (
                                                        <button
                                                            key={val}
                                                            onClick={() => handleSlippageSelect(val)}
                                                            className={clsx(
                                                                'py-2 rounded-lg text-sm font-medium transition-all',
                                                                preferences.defaultSlippage === val
                                                                    ? 'bg-[var(--primary)] text-black font-bold shadow-sm'
                                                                    : 'bg-[var(--background)] border border-[var(--border)] hover:border-[var(--primary)] text-[var(--foreground-muted)]'
                                                            )}
                                                        >
                                                            {val}%
                                                        </button>
                                                    ))}
                                                    <div className="relative">
                                                        <input
                                                            type="number"
                                                            placeholder="Custom"
                                                            value={preferences.defaultSlippage && ![0.5, 1, 3].includes(preferences.defaultSlippage) ? preferences.defaultSlippage : ''}
                                                            onChange={handleCustomSlippageChange}
                                                            className={clsx(
                                                                "w-full h-full px-2 rounded-lg bg-[var(--background)] border text-sm text-center focus:outline-none transition-colors",
                                                                ![0.5, 1, 3].includes(preferences.defaultSlippage)
                                                                    ? "border-[var(--primary)] text-[var(--primary)] font-bold"
                                                                    : "border-[var(--border)] focus:border-[var(--primary)]"
                                                            )}
                                                        />
                                                    </div>
                                                </div>
                                                <p className="text-xs text-[var(--foreground-muted)]">
                                                    Transaction reverts if price changes unfavorably by &gt;{preferences.defaultSlippage || 0}%.
                                                </p>
                                            </div>
                                        </section>

                                        {/* Default Chain */}
                                        <section className="space-y-3">
                                            <h3 className="text-xs font-semibold text-[var(--foreground-muted)] uppercase tracking-wider px-1">Default Chain</h3>
                                            <div className="grid grid-cols-2 gap-2">
                                                {chainOptions.map((chain) => (
                                                    <button
                                                        key={chain.id}
                                                        onClick={() => handleChangeDefaultChain(chain.id)}
                                                        className={clsx(
                                                            'flex items-center gap-3 p-3 rounded-xl transition-all text-left relative overflow-hidden group',
                                                            preferences.defaultChain === chain.id
                                                                ? 'bg-[var(--primary)]/10 border-2 border-[var(--primary)]'
                                                                : 'bg-[var(--background-tertiary)]/50 border border-[var(--border)] hover:border-[var(--primary)]/50'
                                                        )}
                                                    >
                                                        <img src={chain.logo} alt={chain.name} className="w-6 h-6 rounded-full" />
                                                        <span className={clsx("text-sm font-medium", preferences.defaultChain === chain.id ? "text-[var(--foreground)]" : "text-[var(--foreground-muted)]")}>
                                                            {chain.name}
                                                        </span>
                                                        {preferences.defaultChain === chain.id && (
                                                            <div className="absolute right-0 top-0 bottom-0 w-1 bg-[var(--primary)]" />
                                                        )}
                                                    </button>
                                                ))}
                                            </div>
                                        </section>

                                        {/* Pro / Appearance Settings */}
                                        <section className="space-y-3 pt-6 border-t border-[var(--border)]">
                                            <h3 className="text-xs font-semibold text-[var(--foreground-muted)] uppercase tracking-wider px-1">Interface</h3>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {/* Compact Mode */}
                                                <div className="p-4 rounded-xl bg-[var(--background-tertiary)]/30 border border-[var(--border)] flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <div className="p-2 rounded-lg bg-[var(--background)]">
                                                            <LayoutTemplate className="w-4 h-4 text-[var(--foreground)]" />
                                                        </div>
                                                        <div>
                                                            <p className="font-medium text-sm">Compact Mode</p>
                                                            <p className="text-[10px] text-[var(--foreground-muted)]">Denser lists & tables</p>
                                                        </div>
                                                    </div>
                                                    <div className="w-10 h-6 rounded-full bg-[var(--background)] border border-[var(--border)] relative cursor-pointer">
                                                        <div className="absolute top-1 left-1 w-3.5 h-3.5 rounded-full bg-[var(--foreground-muted)]" />
                                                    </div>
                                                </div>

                                                {/* Reduced Motion */}
                                                <div className="p-4 rounded-xl bg-[var(--background-tertiary)]/30 border border-[var(--border)] flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <div className="p-2 rounded-lg bg-[var(--background)]">
                                                            <Zap className="w-4 h-4 text-[var(--foreground)]" />
                                                        </div>
                                                        <div>
                                                            <p className="font-medium text-sm">Reduced Motion</p>
                                                            <p className="text-[10px] text-[var(--foreground-muted)]">Minimize animations</p>
                                                        </div>
                                                    </div>
                                                    <div className="w-10 h-6 rounded-full bg-[var(--background)] border border-[var(--border)] relative cursor-pointer">
                                                        <div className="absolute top-1 left-1 w-3.5 h-3.5 rounded-full bg-[var(--foreground-muted)]" />
                                                    </div>
                                                </div>
                                            </div>
                                        </section>
                                    </div>

                                    {/* Right Column: Display & Theme */}
                                    <div className="space-y-6">
                                        <section className="space-y-3">
                                            <h3 className="text-xs font-semibold text-[var(--foreground-muted)] uppercase tracking-wider px-1">Display</h3>

                                            {/* Currency Display */}
                                            <div className="p-4 rounded-xl bg-[var(--background-tertiary)]/50 border border-[var(--border)] hover:border-[var(--primary)]/30 transition-colors">
                                                <div className="flex items-center gap-2 mb-4">
                                                    <div className="p-1.5 rounded-lg bg-[var(--background)]">
                                                        <DollarSign className="w-4 h-4 text-[var(--accent-green)]" />
                                                    </div>
                                                    <p className="font-medium">Currency Display</p>
                                                </div>
                                                <div className="grid grid-cols-4 gap-2">
                                                    {(['USD', 'EUR', 'GBP', 'BTC'] as CurrencyDisplay[]).map((curr) => (
                                                        <button
                                                            key={curr}
                                                            onClick={() => handleChangeCurrency(curr)}
                                                            className={clsx(
                                                                'px-2 py-2 rounded-lg text-sm font-medium transition-all',
                                                                preferences.currencyDisplay === curr
                                                                    ? 'bg-[var(--primary)] text-black font-bold shadow-sm'
                                                                    : 'bg-[var(--background)] border border-[var(--border)] hover:border-[var(--primary)] text-[var(--foreground-muted)]'
                                                            )}
                                                        >
                                                            {curr}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Toggles Grid */}
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                                                {/* Hide Balances */}
                                                <div className="p-3 rounded-xl bg-[var(--background-tertiary)]/50 border border-[var(--border)] flex items-center justify-between hover:border-[var(--primary)]/30 transition-colors">
                                                    <div className="flex items-center gap-3">
                                                        <div className="p-1.5 rounded-lg bg-[var(--background)]">
                                                            {preferences.hideBalances ? (
                                                                <EyeOff className="w-4 h-4 text-[var(--primary)]" />
                                                            ) : (
                                                                <Eye className="w-4 h-4 text-[var(--foreground-muted)]" />
                                                            )}
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-medium">Hide Balances</p>
                                                            <p className="text-[10px] text-[var(--foreground-muted)]">Mask values</p>
                                                        </div>
                                                    </div>
                                                    <button
                                                        onClick={() => handleToggleHideBalances(!preferences.hideBalances)}
                                                        className={clsx(
                                                            'w-10 h-6 rounded-full relative transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20',
                                                            preferences.hideBalances ? 'bg-[var(--primary)]' : 'bg-[var(--background)] border border-[var(--border)]'
                                                        )}
                                                    >
                                                        <div className={clsx(
                                                            'absolute top-1 w-4 h-4 rounded-full transition-all shadow-sm',
                                                            preferences.hideBalances ? 'right-1 bg-white' : 'left-1 bg-[var(--foreground-muted)]'
                                                        )} />
                                                    </button>
                                                </div>

                                                {/* Dark Mode */}
                                                <div className="p-3 rounded-xl bg-[var(--background-tertiary)]/50 border border-[var(--border)] flex items-center justify-between hover:border-[var(--primary)]/30 transition-colors">
                                                    <div className="flex items-center gap-3">
                                                        <div className="p-1.5 rounded-lg bg-[var(--background)]">
                                                            <Palette className="w-4 h-4 text-[var(--secondary)]" />
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-medium">Dark Mode</p>
                                                            <p className="text-[10px] text-[var(--foreground-muted)]">Theme</p>
                                                        </div>
                                                    </div>
                                                    <button
                                                        onClick={() => handleToggleDarkMode(!preferences.darkMode)}
                                                        className={clsx(
                                                            'w-10 h-6 rounded-full relative transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20',
                                                            preferences.darkMode ? 'bg-[var(--primary)]' : 'bg-[var(--background)] border border-[var(--border)]'
                                                        )}
                                                    >
                                                        <div className={clsx(
                                                            'absolute top-1 w-4 h-4 rounded-full transition-all shadow-sm',
                                                            preferences.darkMode ? 'right-1 bg-white' : 'left-1 bg-[var(--foreground-muted)]'
                                                        )} />
                                                    </button>
                                                </div>
                                            </div>
                                        </section>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'notifications' && (
                            <div className="max-w-2xl mx-auto py-6 space-y-8">
                                <div className="p-5 bg-[var(--background-secondary)] rounded-xl border border-[var(--border)]">
                                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                                        <Bell className="w-5 h-5 text-[var(--primary)]" />
                                        Notification Preferences
                                    </h3>

                                    <div className="space-y-4">
                                        {[
                                            { id: 'wallet_activity', label: 'Wallet Activity', desc: 'Get notified when your tracked wallets make a trade' },
                                            { id: 'price_alerts', label: 'Price Alerts', desc: 'Receive alerts when tokens hit your targets' },
                                            { id: 'news_digest', label: 'Daily News Digest', desc: 'Morning summary of market moving news' },
                                            { id: 'security_alerts', label: 'Security Alerts', desc: 'Login attempts and major security events' }
                                        ].map((item) => (
                                            <div key={item.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-[var(--background-tertiary)] transition-colors">
                                                <div>
                                                    <p className="font-medium text-sm">{item.label}</p>
                                                    <p className="text-xs text-[var(--foreground-muted)]">{item.desc}</p>
                                                </div>
                                                <button className="relative w-11 h-6 bg-[var(--background-tertiary)] border border-[var(--border)] rounded-full transition-colors data-[state=checked]:bg-[var(--primary)] data-[state=checked]:border-[var(--primary)]">
                                                    <span className="block w-4 h-4 bg-white rounded-full shadow-sm transform translate-x-1 transition-transform data-[state=checked]:translate-x-6" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
