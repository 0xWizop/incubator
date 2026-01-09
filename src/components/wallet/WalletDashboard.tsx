'use client';

import { useState } from 'react';
import {
    Wallet,
    Settings,
    Copy,
    Check,
    X,
    TrendingUp,
    Activity,
    ChevronDown,
    Shield,
} from 'lucide-react';
import { clsx } from 'clsx';
import { useWalletStore } from '@/store/walletStore';
import { usePreferences } from '@/hooks/usePreferences';
import { useCurrency } from '@/hooks/useCurrency';
import { CHAINS } from '@/lib/wallet';

// Tab components
import { PortfolioTab } from './tabs/PortfolioTab';
import { ActivityTab } from './tabs/ActivityTab';
import { SettingsTab } from './tabs/SettingsTab';
import { WalletSecurityTab } from './tabs/WalletSecurityTab';

type TabId = 'assets' | 'activity' | 'security' | 'settings';

interface WalletDashboardProps {
    onClose: () => void;
}

export function WalletDashboard({ onClose }: WalletDashboardProps) {
    const { hideBalances } = usePreferences();
    const { formatCurrency } = useCurrency();
    const { activeWallet, wallets, balances, activeChain, lock, setActiveWallet } = useWalletStore();
    const [activeTab, setActiveTab] = useState<TabId>('assets');
    const [copied, setCopied] = useState(false);
    const [showWalletSelector, setShowWalletSelector] = useState(false);

    const handleCopy = () => {
        if (activeWallet) {
            navigator.clipboard.writeText(activeWallet.address);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const currentBalance = activeWallet
        ? balances[`${activeWallet.address}-${activeChain}`] || '0'
        : '0';

    const chainConfig = activeWallet?.type === 'solana' ? CHAINS.solana : CHAINS[activeChain];

    // Calculate total USD value (mock price for now)
    const tokenPrice = activeWallet?.type === 'solana' ? 180 : 3500;
    const totalUsdValue = parseFloat(currentBalance) * tokenPrice;

    const formatAddress = (address: string) => {
        return `${address.slice(0, 6)}...${address.slice(-4)}`;
    };

    const renderTabContent = () => {
        switch (activeTab) {
            case 'assets':
                return <PortfolioTab />;
            case 'activity':
                return <ActivityTab />;
            case 'security':
                return <WalletSecurityTab onLock={lock} />;
            case 'settings':
                return <SettingsTab onLock={lock} />;
            default:
                return <PortfolioTab />;
        }
    };

    return (
        <div className="flex flex-col h-full max-h-[85vh] bg-[var(--background-secondary)]">
            {/* Header with Wallet Selector */}
            <div className="flex items-center justify-between px-4 pt-4 pb-2">
                <div className="relative">
                    <button
                        onClick={() => setShowWalletSelector(!showWalletSelector)}
                        className="flex items-center gap-2 hover:opacity-80 transition-opacity"
                    >
                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[var(--primary)] to-[var(--accent-purple)] flex items-center justify-center">
                            <Wallet className="w-3 h-3 text-white" />
                        </div>
                        <span className="text-sm font-medium">
                            {activeWallet?.name || formatAddress(activeWallet?.address || '')}
                        </span>
                        <ChevronDown className={clsx("w-4 h-4 text-[var(--foreground-muted)] transition-transform", showWalletSelector && "rotate-180")} />
                    </button>

                    {/* Wallet Selector Dropdown */}
                    {showWalletSelector && (
                        <div className="absolute top-full left-0 mt-2 w-64 bg-[var(--background-tertiary)] border border-[var(--border)] rounded-xl shadow-xl z-50 overflow-hidden">
                            <div className="p-2">
                                <p className="text-xs text-[var(--foreground-muted)] px-2 py-1 mb-1">Your Wallets</p>
                                {wallets.map((wallet) => (
                                    <button
                                        key={wallet.address}
                                        onClick={() => {
                                            setActiveWallet(wallet.address);
                                            setShowWalletSelector(false);
                                        }}
                                        className={clsx(
                                            "w-full flex items-center gap-3 p-2.5 rounded-lg transition-colors",
                                            wallet.address === activeWallet?.address
                                                ? "bg-[var(--background-secondary)] border border-[var(--border-hover)]"
                                                : "hover:bg-[var(--background-secondary)]"
                                        )}
                                    >
                                        <div className={clsx(
                                            "w-8 h-8 rounded-full flex items-center justify-center",
                                            wallet.type === 'solana'
                                                ? "bg-gradient-to-br from-purple-500 to-green-400"
                                                : "bg-gradient-to-br from-blue-500 to-purple-500"
                                        )}>
                                            <Wallet className="w-4 h-4 text-white" />
                                        </div>
                                        <div className="flex-1 text-left min-w-0">
                                            <p className="text-sm font-medium truncate">{wallet.name}</p>
                                            <p className="text-xs text-[var(--foreground-muted)] font-mono">
                                                {formatAddress(wallet.address)}
                                            </p>
                                        </div>
                                        {wallet.address === activeWallet?.address && (
                                            <div className="w-2 h-2 rounded-full bg-[var(--primary)]" />
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-1">
                    <button
                        onClick={handleCopy}
                        className="p-2 rounded-full hover:bg-[var(--background-tertiary)] transition-colors text-[var(--foreground-muted)]"
                        title="Copy Address"
                    >
                        {copied ? <Check className="w-4 h-4 text-[var(--accent-green)]" /> : <Copy className="w-4 h-4" />}
                    </button>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-full hover:bg-[var(--background-tertiary)] transition-colors text-[var(--foreground-muted)]"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Total Balance Display - Only show on assets tab */}
            {activeTab === 'assets' && (
                <div className="px-4 py-4">
                    <p className="text-3xl font-bold">
                        {hideBalances
                            ? '*****'
                            : formatCurrency(totalUsdValue).formatted
                        }
                    </p>
                </div>
            )}

            {/* Main Content Area */}
            <div className="flex-1 overflow-y-auto">
                {renderTabContent()}
            </div>

            {/* Bottom Navigation Bar - 4 tabs */}
            <div className="grid grid-cols-4 border-t border-[var(--border)] bg-[var(--background-secondary)]">
                <button
                    onClick={() => setActiveTab('assets')}
                    className={clsx(
                        "flex flex-col items-center justify-center py-3 gap-1 transition-colors",
                        activeTab === 'assets' ? "text-[var(--primary)]" : "text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
                    )}
                >
                    <TrendingUp className="w-5 h-5" />
                    <span className="text-[10px] font-medium">Assets</span>
                </button>

                <button
                    onClick={() => setActiveTab('activity')}
                    className={clsx(
                        "flex flex-col items-center justify-center py-3 gap-1 transition-colors",
                        activeTab === 'activity' ? "text-[var(--primary)]" : "text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
                    )}
                >
                    <Activity className="w-5 h-5" />
                    <span className="text-[10px] font-medium">Activity</span>
                </button>

                <button
                    onClick={() => setActiveTab('security')}
                    className={clsx(
                        "flex flex-col items-center justify-center py-3 gap-1 transition-colors",
                        activeTab === 'security' ? "text-[var(--primary)]" : "text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
                    )}
                >
                    <Shield className="w-5 h-5" />
                    <span className="text-[10px] font-medium">Security</span>
                </button>

                <button
                    onClick={() => setActiveTab('settings')}
                    className={clsx(
                        "flex flex-col items-center justify-center py-3 gap-1 transition-colors",
                        activeTab === 'settings' ? "text-[var(--primary)]" : "text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
                    )}
                >
                    <Settings className="w-5 h-5" />
                    <span className="text-[10px] font-medium">Settings</span>
                </button>
            </div>
        </div>
    );
}
