'use client';

import { useState, useEffect } from 'react';
import {
    Wallet,
    Copy,
    Check,
    Plus,
    Lock,
    TrendingUp,
    Activity,
    RefreshCw,
    ChevronDown,
    MoreHorizontal,
    Maximize2
} from 'lucide-react';
import { clsx } from 'clsx';
import { useWalletStore } from '@/store/walletStore';
import { CHAINS } from '@/lib/wallet';

// Tab types
type TabId = 'assets' | 'swap' | 'activity';

export function WalletButton() {
    const {
        activeWallet,
        isUnlocked,
        balances,
        activeChain,
        wallets,
        openModal,
        lock,
        setActiveWallet,
    } = useWalletStore();

    const [isOpen, setIsOpen] = useState(false);
    const [copied, setCopied] = useState(false);
    const [activeTab, setActiveTab] = useState<TabId>('assets');
    const [showWalletSwitcher, setShowWalletSwitcher] = useState(false);
    const [showMenu, setShowMenu] = useState(false);

    // Initialize wallet on mount
    useEffect(() => {
        useWalletStore.getState().initialize();
    }, []);

    const handleCopy = (e?: React.MouseEvent) => {
        e?.stopPropagation();
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
    const price = activeWallet?.type === 'solana' ? 180 : 3500;
    const usdValue = parseFloat(currentBalance) * price;

    // Not connected state
    if (!isUnlocked || !activeWallet) {
        return (
            <button
                onClick={() => openModal()}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--primary)] text-black font-medium text-sm hover:opacity-90 transition-all shadow-[0_0_15px_var(--primary-glow)]"
            >
                <Wallet className="w-4 h-4" />
                <span>{wallets.length > 0 ? 'Unlock' : 'Connect Wallet'}</span>
            </button>
        );
    }

    // Connected state - show value and chain
    return (
        <div className="relative">
            {/* Wallet Button - Shows USD Value + Chain */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[var(--background-tertiary)] border border-[var(--border)] hover:border-[var(--primary)] transition-all"
            >
                <img
                    src={chainConfig.logo}
                    alt={chainConfig.name}
                    className="w-5 h-5 rounded-full"
                />
                <span className="font-bold text-sm">
                    ${usdValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                <ChevronDown className={clsx(
                    "w-4 h-4 text-[var(--foreground-muted)] transition-transform",
                    isOpen && "rotate-180"
                )} />
            </button>

            {/* Dropdown Panel */}
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 z-40"
                        onClick={() => {
                            setIsOpen(false);
                            setShowWalletSwitcher(false);
                            setShowMenu(false);
                        }}
                    />

                    {/* Dropdown */}
                    <div className="absolute right-0 top-full mt-4 w-[360px] bg-[var(--background-secondary)] border border-[var(--border)] rounded-2xl shadow-2xl z-50 overflow-hidden animate-fade-in flex flex-col">
                        {/* Header - Wallet Selector */}
                        <div className="p-3 border-b border-[var(--border)]">
                            <div className="flex items-center justify-between">
                                {/* Wallet Selector Button */}
                                <button
                                    onClick={() => setShowWalletSwitcher(!showWalletSwitcher)}
                                    className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-[var(--background-tertiary)] transition-colors flex-1"
                                >
                                    <div className="w-8 h-8 rounded-full bg-[var(--primary)] flex items-center justify-center">
                                        <Wallet className="w-4 h-4 text-black" />
                                    </div>
                                    <div className="flex-1 text-left">
                                        <p className="font-medium text-sm">{activeWallet.name}</p>
                                        <p className="text-[10px] text-[var(--foreground-muted)] font-mono">
                                            {activeWallet.address.slice(0, 6)}...{activeWallet.address.slice(-4)}
                                        </p>
                                    </div>
                                    <ChevronDown className={clsx(
                                        "w-4 h-4 text-[var(--foreground-muted)] transition-transform",
                                        showWalletSwitcher && "rotate-180"
                                    )} />
                                </button>

                                {/* Actions Menu */}
                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={handleCopy}
                                        className="p-2 rounded-lg hover:bg-[var(--background-tertiary)] transition-colors"
                                        title="Copy Address"
                                    >
                                        {copied ? (
                                            <Check className="w-4 h-4 text-[var(--accent-green)]" />
                                        ) : (
                                            <Copy className="w-4 h-4 text-[var(--foreground-muted)]" />
                                        )}
                                    </button>
                                    <div className="relative">
                                        <button
                                            onClick={() => setShowMenu(!showMenu)}
                                            className="p-2 rounded-lg hover:bg-[var(--background-tertiary)] transition-colors"
                                        >
                                            <MoreHorizontal className="w-4 h-4 text-[var(--foreground-muted)]" />
                                        </button>

                                        {/* Menu Dropdown */}
                                        {showMenu && (
                                            <div className="absolute right-0 top-full mt-1 w-40 bg-[var(--background)] border border-[var(--border)] rounded-xl shadow-lg z-10 overflow-hidden">
                                                <button
                                                    onClick={() => {
                                                        openModal('create');
                                                        setIsOpen(false);
                                                    }}
                                                    className="w-full flex items-center gap-2 px-3 py-2 hover:bg-[var(--background-tertiary)] transition-colors text-sm"
                                                >
                                                    <Plus className="w-4 h-4" />
                                                    Add Wallet
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        openModal(); // This will trigger the dashboard modal view now
                                                        setIsOpen(false);
                                                    }}
                                                    className="w-full flex items-center gap-2 px-3 py-2 hover:bg-[var(--background-tertiary)] transition-colors text-sm"
                                                >
                                                    <Maximize2 className="w-4 h-4" />
                                                    Expand View
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        lock();
                                                        setIsOpen(false);
                                                    }}
                                                    className="w-full flex items-center gap-2 px-3 py-2 hover:bg-[var(--accent-red)]/10 text-[var(--accent-red)] transition-colors text-sm"
                                                >
                                                    <Lock className="w-4 h-4" />
                                                    Lock Wallet
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Wallet Switcher Dropdown */}
                            {showWalletSwitcher && wallets.length > 0 && (
                                <div className="mt-2 p-2 rounded-xl bg-[var(--background-tertiary)] border border-[var(--border)]">
                                    <p className="text-[10px] text-[var(--foreground-muted)] uppercase tracking-wider px-2 mb-2">
                                        Your Wallets
                                    </p>
                                    <div className="space-y-1 max-h-[150px] overflow-y-auto">
                                        {wallets.map((wallet) => (
                                            <button
                                                key={wallet.address}
                                                onClick={() => {
                                                    setActiveWallet(wallet.address);
                                                    setShowWalletSwitcher(false);
                                                }}
                                                className={clsx(
                                                    'w-full flex items-center gap-2 px-2 py-2 rounded-lg transition-colors text-left',
                                                    wallet.address === activeWallet.address
                                                        ? 'bg-[var(--primary)]/10 border border-[var(--primary)]/30'
                                                        : 'hover:bg-[var(--background)]'
                                                )}
                                            >
                                                <div className={clsx(
                                                    'w-7 h-7 rounded-full flex items-center justify-center',
                                                    wallet.type === 'solana' ? 'bg-[var(--solana)]/20' : 'bg-[var(--ethereum)]/20'
                                                )}>
                                                    <Wallet className={clsx(
                                                        'w-3.5 h-3.5',
                                                        wallet.type === 'solana' ? 'text-[var(--solana)]' : 'text-[var(--ethereum)]'
                                                    )} />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-xs font-medium truncate">{wallet.name}</p>
                                                    <p className="text-[10px] text-[var(--foreground-muted)] font-mono">
                                                        {wallet.address.slice(0, 6)}...{wallet.address.slice(-4)}
                                                    </p>
                                                </div>
                                                {wallet.address === activeWallet.address && (
                                                    <Check className="w-4 h-4 text-[var(--primary)]" />
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                    <button
                                        onClick={() => {
                                            openModal('create');
                                            setIsOpen(false);
                                        }}
                                        className="w-full flex items-center gap-2 px-2 py-2 mt-2 rounded-lg border border-dashed border-[var(--border)] hover:border-[var(--primary)] hover:bg-[var(--primary)]/5 transition-colors text-xs"
                                    >
                                        <Plus className="w-4 h-4 text-[var(--primary)]" />
                                        <span>Create New Wallet</span>
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Balance Display */}
                        <div className="text-center py-6 px-4">
                            <p className="text-4xl font-bold font-mono">
                                ${usdValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </p>
                            <p className="text-sm text-[var(--foreground-muted)] mt-1 flex items-center justify-center gap-2">
                                <img src={chainConfig.logo} className="w-4 h-4 rounded-full" />
                                {parseFloat(currentBalance).toFixed(4)} {chainConfig.symbol}
                            </p>
                        </div>

                        {/* Tab Content */}
                        <div className="flex-1 px-4 pb-4 min-h-[180px] max-h-[250px] overflow-y-auto">
                            {activeTab === 'assets' && (
                                <PortfolioContent
                                    balance={currentBalance}
                                    chainConfig={chainConfig}
                                    usdValue={usdValue}
                                />
                            )}
                            {activeTab === 'activity' && <ActivityContent />}
                            {activeTab === 'swap' && <SwapContent chainConfig={chainConfig} />}
                        </div>

                        {/* Bottom Tab Navigation */}
                        <div className="grid grid-cols-3 border-t border-[var(--border)] bg-[var(--background-tertiary)] pb-1">
                            <button
                                onClick={() => setActiveTab('assets')}
                                className={clsx(
                                    "flex flex-col items-center justify-center pt-2 pb-1 gap-1 transition-colors relative",
                                    activeTab === 'assets' ? "text-[var(--primary)]" : "text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
                                )}
                            >
                                <TrendingUp className="w-5 h-5" />
                                <span className="text-[10px] font-medium">Assets</span>
                                {activeTab === 'assets' && <div className="absolute top-0 w-8 h-0.5 bg-[var(--primary)] rounded-b-full shadow-[0_2px_8px_var(--primary)]" />}
                            </button>

                            <button
                                onClick={() => setActiveTab('swap')}
                                className={clsx(
                                    "flex flex-col items-center justify-center pt-2 pb-1 gap-1 transition-colors relative",
                                    activeTab === 'swap' ? "text-[var(--primary)]" : "text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
                                )}
                            >
                                <RefreshCw className="w-5 h-5" />
                                <span className="text-[10px] font-medium">Swap</span>
                                {activeTab === 'swap' && <div className="absolute top-0 w-8 h-0.5 bg-[var(--primary)] rounded-b-full shadow-[0_2px_8px_var(--primary)]" />}
                            </button>

                            <button
                                onClick={() => setActiveTab('activity')}
                                className={clsx(
                                    "flex flex-col items-center justify-center pt-2 pb-1 gap-1 transition-colors relative",
                                    activeTab === 'activity' ? "text-[var(--primary)]" : "text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
                                )}
                            >
                                <Activity className="w-5 h-5" />
                                <span className="text-[10px] font-medium">Activity</span>
                                {activeTab === 'activity' && <div className="absolute top-0 w-8 h-0.5 bg-[var(--primary)] rounded-b-full shadow-[0_2px_8px_var(--primary)]" />}
                            </button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}

// Tab Content Components (Mini versions for dropdown)
function PortfolioContent({ balance, chainConfig, usdValue }: { balance: string; chainConfig: any; usdValue: number }) {
    if (parseFloat(balance) === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-6 text-center">
                <div className="w-12 h-12 rounded-full bg-[var(--background-tertiary)] flex items-center justify-center mb-3">
                    <Wallet className="w-6 h-6 text-[var(--foreground-muted)]" />
                </div>
                <p className="text-sm font-medium mb-1">No tokens yet</p>
                <p className="text-xs text-[var(--foreground-muted)]">
                    Deposit tokens to get started
                </p>
            </div>
        );
    }

    // Simplified list for dropdown
    return (
        <div className="space-y-1">
            <div className="flex items-center gap-3 p-2 hover:bg-[var(--background-tertiary)] rounded-xl transition-colors cursor-pointer">
                <img src={chainConfig.logo} alt={chainConfig.symbol} className="w-8 h-8 rounded-full" />
                <div className="flex-1">
                    <p className="font-medium text-sm">{chainConfig.name}</p>
                    <p className="text-xs text-[var(--foreground-muted)] font-mono">
                        {parseFloat(balance).toFixed(4)} {chainConfig.symbol}
                    </p>
                </div>
                <div className="text-right">
                    <p className="font-medium text-sm font-mono">
                        ${usdValue.toFixed(2)}
                    </p>
                </div>
            </div>
        </div>
    );
}

function ActivityContent() {
    return (
        <div className="flex flex-col items-center justify-center py-6 text-center">
            <div className="w-12 h-12 rounded-full bg-[var(--background-tertiary)] flex items-center justify-center mb-3">
                <Activity className="w-6 h-6 text-[var(--foreground-muted)]" />
            </div>
            <p className="text-sm font-medium mb-1">No activity</p>
            <p className="text-xs text-[var(--foreground-muted)]">
                Transactions will appear here
            </p>
        </div>
    );
}

function SwapContent({ chainConfig }: { chainConfig: any }) {
    const [fromAmount, setFromAmount] = useState('');

    return (
        <div className="space-y-2">
            <div className="p-2 rounded-xl bg-[var(--background-tertiary)] border border-[var(--border)]">
                <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] text-[var(--foreground-muted)]">You pay</span>
                </div>
                <div className="flex items-center gap-2">
                    <input
                        type="number"
                        value={fromAmount}
                        onChange={(e) => setFromAmount(e.target.value)}
                        placeholder="0.00"
                        className="flex-1 bg-transparent outline-none font-mono text-base font-bold w-full min-w-0"
                    />
                    <div className="flex items-center gap-1.5 px-1.5 py-1 rounded-lg bg-[var(--background)] shrink-0">
                        <img src={chainConfig.logo} className="w-3.5 h-3.5 rounded-full" />
                        <span className="text-[10px] font-medium">{chainConfig.symbol}</span>
                    </div>
                </div>
            </div>

            <div className="flex justify-center -my-1 relative z-10">
                <div className="w-6 h-6 rounded-full bg-[var(--background-tertiary)] border border-[var(--border)] flex items-center justify-center">
                    <RefreshCw className="w-3 h-3 text-[var(--foreground-muted)]" />
                </div>
            </div>

            <div className="p-2 rounded-xl bg-[var(--background-tertiary)] border border-[var(--border)]">
                <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] text-[var(--foreground-muted)]">You receive</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="flex-1 font-mono text-base font-bold text-[var(--foreground-muted)]">
                        {fromAmount ? (parseFloat(fromAmount) * 3500).toFixed(2) : '0.00'}
                    </span>
                    <div className="flex items-center gap-1.5 px-1.5 py-1 rounded-lg bg-[var(--background)] shrink-0">
                        <div className="w-3.5 h-3.5 rounded-full bg-blue-500 flex items-center justify-center text-white text-[8px] font-bold">$</div>
                        <span className="text-[10px] font-medium">USDC</span>
                    </div>
                </div>
            </div>

            <button
                disabled={!fromAmount}
                className="w-full py-2 rounded-xl bg-[var(--primary)] text-black font-medium disabled:opacity-50 disabled:cursor-not-allowed text-xs"
            >
                Swap
            </button>
        </div>
    );
}
