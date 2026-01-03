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
import { ChainId, UserPreferences } from '@/types';

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
    const [activeTab, setActiveTab] = useState('profile');
    const [displayName, setDisplayName] = useState('');
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

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

    const handleSaveProfile = async () => {
        if (!firebaseUser) return;
        setSaving(true);

        await updateUserProfile(firebaseUser.uid, { displayName });

        setSaving(false);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    };

    const handleToggleDarkMode = async (value: boolean) => {
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
        <div className="p-4 lg:p-6 max-w-4xl mx-auto pb-24 lg:pb-6">
            <h1 className="text-2xl font-bold mb-6">Settings</h1>

            <div className="flex flex-col lg:flex-row gap-6">
                {/* Sidebar tabs */}
                <div className="lg:w-56 flex-shrink-0">
                    <nav className="flex lg:flex-col gap-1 overflow-x-auto pb-2 lg:pb-0">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={clsx(
                                    'flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap',
                                    activeTab === tab.id
                                        ? 'bg-[var(--primary)]/10 text-[var(--primary)]'
                                        : 'text-[var(--foreground-muted)] hover:bg-[var(--background-tertiary)]'
                                )}
                            >
                                <tab.icon className="w-4 h-4" />
                                {tab.label}
                            </button>
                        ))}
                    </nav>
                </div>

                {/* Content area */}
                <div className="flex-1">
                    {activeTab === 'profile' && (
                        <div className="card p-6">
                            <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
                                <User className="w-5 h-5" />
                                Profile Information
                            </h2>

                            <div className="space-y-6">
                                {/* Avatar */}
                                <div className="flex items-center gap-4">
                                    {firebaseUser.photoURL ? (
                                        <img
                                            src={firebaseUser.photoURL}
                                            alt=""
                                            className="w-16 h-16 rounded-full"
                                        />
                                    ) : (
                                        <div className="w-16 h-16 rounded-full bg-[var(--primary)]/20 flex items-center justify-center">
                                            <User className="w-8 h-8 text-[var(--primary)]" />
                                        </div>
                                    )}
                                    <div>
                                        <p className="font-medium">{firebaseUser.displayName || 'User'}</p>
                                        <p className="text-sm text-[var(--foreground-muted)]">{firebaseUser.email}</p>
                                    </div>
                                </div>

                                {/* Display Name */}
                                <div>
                                    <label className="block text-sm font-medium mb-2">Display Name</label>
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
                                    <label className="block text-sm font-medium mb-2">Email</label>
                                    <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-[var(--background-tertiary)] border border-[var(--border)] text-[var(--foreground-muted)]">
                                        <Mail className="w-4 h-4" />
                                        <span>{firebaseUser.email}</span>
                                        {firebaseUser.emailVerified && (
                                            <span className="ml-auto text-xs text-[var(--accent-green)] flex items-center gap-1">
                                                <Check className="w-3 h-3" /> Verified
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* User ID */}
                                <div>
                                    <label className="block text-sm font-medium mb-2">User ID</label>
                                    <div className="px-4 py-3 rounded-xl bg-[var(--background-tertiary)] border border-[var(--border)] font-mono text-sm text-[var(--foreground-muted)] truncate">
                                        {firebaseUser.uid}
                                    </div>
                                </div>

                                {/* Save button */}
                                <button
                                    onClick={handleSaveProfile}
                                    disabled={saving}
                                    className={clsx(
                                        'flex items-center gap-2 px-6 py-2.5 rounded-lg font-bold transition-all',
                                        saving || saved
                                            ? 'bg-[var(--background-tertiary)] text-[var(--foreground-muted)]'
                                            : 'bg-[var(--primary)] text-black hover:bg-[var(--primary)]/90'
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
                        <div className="card p-6">
                            <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
                                <Wallet className="w-5 h-5" />
                                Connected Wallets
                            </h2>
                            <p className="text-[var(--foreground-muted)] text-sm mb-4">
                                Link your wallet addresses to your account for tracking and rewards.
                            </p>
                            <div className="p-8 rounded-xl border-2 border-dashed border-[var(--border)] text-center">
                                <Wallet className="w-8 h-8 mx-auto mb-3 text-[var(--foreground-muted)]" />
                                <p className="text-sm text-[var(--foreground-muted)]">No wallets connected yet</p>
                                <p className="text-xs text-[var(--foreground-muted)] mt-1">Use the Connect Wallet button in the header</p>
                            </div>
                        </div>
                    )}

                    {activeTab === 'preferences' && (
                        <div className="card p-6">
                            <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
                                <Palette className="w-5 h-5" />
                                Preferences
                            </h2>
                            <div className="space-y-4">
                                {/* Dark Mode Toggle */}
                                <div className="flex items-center justify-between p-4 rounded-xl bg-[var(--background-tertiary)]">
                                    <div>
                                        <p className="font-medium">Dark Mode</p>
                                        <p className="text-sm text-[var(--foreground-muted)]">Use dark theme</p>
                                    </div>
                                    <button
                                        onClick={() => handleToggleDarkMode(!preferences.darkMode)}
                                        className={clsx(
                                            'w-12 h-6 rounded-full relative transition-colors',
                                            preferences.darkMode ? 'bg-[var(--primary)]' : 'bg-[var(--background)] border border-[var(--border)]'
                                        )}
                                    >
                                        <div className={clsx(
                                            'absolute top-1 w-4 h-4 rounded-full transition-all',
                                            preferences.darkMode ? 'right-1 bg-white' : 'left-1 bg-[var(--foreground-muted)]'
                                        )} />
                                    </button>
                                </div>

                                {/* Default Chain */}
                                <div className="p-4 rounded-xl bg-[var(--background-tertiary)]">
                                    <p className="font-medium mb-3">Default Chain</p>
                                    <div className="grid grid-cols-2 gap-2">
                                        {chainOptions.map((chain) => (
                                            <button
                                                key={chain.id}
                                                onClick={() => handleChangeDefaultChain(chain.id)}
                                                className={clsx(
                                                    'flex items-center gap-2 p-3 rounded-lg transition-all',
                                                    preferences.defaultChain === chain.id
                                                        ? 'bg-[var(--primary)]/10 border-2 border-[var(--primary)]'
                                                        : 'bg-[var(--background)] border border-[var(--border)] hover:border-[var(--primary)]/50'
                                                )}
                                            >
                                                <img src={chain.logo} alt={chain.name} className="w-5 h-5 rounded-full" />
                                                <span className="text-sm font-medium">{chain.name}</span>
                                                {preferences.defaultChain === chain.id && (
                                                    <Check className="w-4 h-4 text-[var(--primary)] ml-auto" />
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'notifications' && (
                        <div className="card p-6">
                            <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
                                <Bell className="w-5 h-5" />
                                Notifications
                            </h2>
                            <div className="space-y-4">
                                {/* Trade Alerts */}
                                <div className="flex items-center justify-between p-4 rounded-xl bg-[var(--background-tertiary)]">
                                    <div>
                                        <p className="font-medium">Trade Alerts</p>
                                        <p className="text-sm text-[var(--foreground-muted)]">Get notified on price movements</p>
                                    </div>
                                    <button
                                        onClick={() => handleToggleNotification('tradeAlerts', !preferences.notifications.tradeAlerts)}
                                        className={clsx(
                                            'w-12 h-6 rounded-full relative transition-colors',
                                            preferences.notifications.tradeAlerts ? 'bg-[var(--primary)]' : 'bg-[var(--background)] border border-[var(--border)]'
                                        )}
                                    >
                                        <div className={clsx(
                                            'absolute top-1 w-4 h-4 rounded-full transition-all',
                                            preferences.notifications.tradeAlerts ? 'right-1 bg-white' : 'left-1 bg-[var(--foreground-muted)]'
                                        )} />
                                    </button>
                                </div>

                                {/* Reward Updates */}
                                <div className="flex items-center justify-between p-4 rounded-xl bg-[var(--background-tertiary)]">
                                    <div>
                                        <p className="font-medium">Reward Updates</p>
                                        <p className="text-sm text-[var(--foreground-muted)]">New rewards and tier progress</p>
                                    </div>
                                    <button
                                        onClick={() => handleToggleNotification('rewardUpdates', !preferences.notifications.rewardUpdates)}
                                        className={clsx(
                                            'w-12 h-6 rounded-full relative transition-colors',
                                            preferences.notifications.rewardUpdates ? 'bg-[var(--primary)]' : 'bg-[var(--background)] border border-[var(--border)]'
                                        )}
                                    >
                                        <div className={clsx(
                                            'absolute top-1 w-4 h-4 rounded-full transition-all',
                                            preferences.notifications.rewardUpdates ? 'right-1 bg-white' : 'left-1 bg-[var(--foreground-muted)]'
                                        )} />
                                    </button>
                                </div>

                                {/* Price Alerts */}
                                <div className="flex items-center justify-between p-4 rounded-xl bg-[var(--background-tertiary)]">
                                    <div>
                                        <p className="font-medium">Price Alerts</p>
                                        <p className="text-sm text-[var(--foreground-muted)]">Custom price target notifications</p>
                                    </div>
                                    <button
                                        onClick={() => handleToggleNotification('priceAlerts', !preferences.notifications.priceAlerts)}
                                        className={clsx(
                                            'w-12 h-6 rounded-full relative transition-colors',
                                            preferences.notifications.priceAlerts ? 'bg-[var(--primary)]' : 'bg-[var(--background)] border border-[var(--border)]'
                                        )}
                                    >
                                        <div className={clsx(
                                            'absolute top-1 w-4 h-4 rounded-full transition-all',
                                            preferences.notifications.priceAlerts ? 'right-1 bg-white' : 'left-1 bg-[var(--foreground-muted)]'
                                        )} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
