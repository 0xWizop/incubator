'use client';

import { useState } from 'react';
import {
    Wallet,
    ArrowUpRight,
    ArrowDownLeft,
    RefreshCw,
    Settings,
    Copy,
    Check,
    X,
    TrendingUp,
    Activity,
    ChevronDown,
    Plus
} from 'lucide-react';
import { clsx } from 'clsx';
import { useWalletStore } from '@/store/walletStore';
import { CHAINS } from '@/lib/wallet';

// Tab components
import { PortfolioTab } from './tabs/PortfolioTab';
import { ActivityTab } from './tabs/ActivityTab';
import { SwapTab } from './tabs/SwapTab';
import { SettingsTab } from './tabs/SettingsTab';

type TabId = 'assets' | 'swap' | 'activity' | 'settings';

interface WalletDashboardProps {
    onClose: () => void;
}

export function WalletDashboard({ onClose }: WalletDashboardProps) {
    const { activeWallet, balances, activeChain, lock } = useWalletStore();
    const [activeTab, setActiveTab] = useState<TabId>('assets');
    const [copied, setCopied] = useState(false);

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

    const renderTabContent = () => {
        switch (activeTab) {
            case 'assets':
                return <PortfolioTab />;
            case 'activity':
                return <ActivityTab />;
            case 'swap':
                return <SwapTab />;
            case 'settings':
                return <SettingsTab onLock={lock} />;
            default:
                return <PortfolioTab />;
        }
    };

    return (
        <div className="flex flex-col h-full max-h-[85vh] bg-[var(--background-secondary)]">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-[var(--border)]">
                <div className="flex items-center gap-2">
                    {/* Simplified Wallet Selector Look for Dashboard Header */}
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--background-tertiary)] border border-[var(--border)]">
                        <div className="w-5 h-5 rounded-full bg-gradient-to-br from-[var(--primary)] to-[#00a804] flex items-center justify-center">
                            <Wallet className="w-2.5 h-2.5 text-black" />
                        </div>
                        <span className="text-sm font-medium">{activeWallet?.name}</span>
                        <ChevronDown className="w-3.5 h-3.5 text-[var(--foreground-muted)]" />
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={handleCopy}
                        className="p-2 rounded-full hover:bg-[var(--background-tertiary)] transition-colors text-[var(--foreground-muted)]"
                        title="Copy Address"
                    >
                        {copied ? <Check className="w-5 h-5 text-[var(--accent-green)]" /> : <Copy className="w-5 h-5" />}
                    </button>
                    <button
                        onClick={() => setActiveTab('settings')}
                        className={clsx(
                            "p-2 rounded-full hover:bg-[var(--background-tertiary)] transition-colors",
                            activeTab === 'settings' ? "text-[var(--primary)] bg-[var(--primary)]/10" : "text-[var(--foreground-muted)]"
                        )}
                    >
                        <Settings className="w-5 h-5" />
                    </button>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-full hover:bg-[var(--background-tertiary)] transition-colors text-[var(--foreground-muted)]"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 overflow-y-auto">
                {renderTabContent()}
            </div>

            {/* Bottom Navigation Bar */}
            <div className="grid grid-cols-3 border-t border-[var(--border)] bg-[var(--background-secondary)] pb-2">
                <button
                    onClick={() => setActiveTab('assets')}
                    className={clsx(
                        "flex flex-col items-center justify-center pt-3 pb-1 gap-1 transition-colors relative",
                        activeTab === 'assets' ? "text-[var(--primary)]" : "text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
                    )}
                >
                    <TrendingUp className="w-6 h-6" />
                    <span className="text-[10px] font-medium">Assets</span>
                    {activeTab === 'assets' && <div className="absolute top-0 w-12 h-1 bg-[var(--primary)] rounded-b-full shadow-[0_2px_8px_var(--primary)]" />}
                </button>

                <button
                    onClick={() => setActiveTab('swap')}
                    className={clsx(
                        "flex flex-col items-center justify-center pt-3 pb-1 gap-1 transition-colors relative",
                        activeTab === 'swap' ? "text-[var(--primary)]" : "text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
                    )}
                >
                    <RefreshCw className="w-6 h-6" />
                    <span className="text-[10px] font-medium">Swap</span>
                    {activeTab === 'swap' && <div className="absolute top-0 w-12 h-1 bg-[var(--primary)] rounded-b-full shadow-[0_2px_8px_var(--primary)]" />}
                </button>

                <button
                    onClick={() => setActiveTab('activity')}
                    className={clsx(
                        "flex flex-col items-center justify-center pt-3 pb-1 gap-1 transition-colors relative",
                        activeTab === 'activity' ? "text-[var(--primary)]" : "text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
                    )}
                >
                    <Activity className="w-6 h-6" />
                    <span className="text-[10px] font-medium">Activity</span>
                    {activeTab === 'activity' && <div className="absolute top-0 w-12 h-1 bg-[var(--primary)] rounded-b-full shadow-[0_2px_8px_var(--primary)]" />}
                </button>
            </div>
        </div>
    );
}
