'use client';

import { useState, useEffect } from 'react';
import {
    Wallet,
    Copy,
    Check,
    Plus,
    Lock,
    Settings,
    ArrowUpRight,
    ArrowDownLeft,
    RefreshCw,
    ChevronDown,
    Search,
    X,
    ExternalLink,
    Home,
    Activity,
} from 'lucide-react';
import { clsx } from 'clsx';
import { useWalletStore } from '@/store/walletStore';
import { CHAINS } from '@/lib/wallet';
import { QRCodeSVG } from 'qrcode.react';

type TabId = 'home' | 'send' | 'receive' | 'swap' | 'search';

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
    const [activeTab, setActiveTab] = useState<TabId>('home');
    const [homeSubTab, setHomeSubTab] = useState<'tokens' | 'activity'>('tokens');
    const [searchQuery, setSearchQuery] = useState('');
    const [showWalletSwitcher, setShowWalletSwitcher] = useState(false);
    const [showSettings, setShowSettings] = useState(false);

    // Send state
    const [sendAmount, setSendAmount] = useState('');
    const [sendRecipient, setSendRecipient] = useState('');

    // Swap state
    const [swapAmount, setSwapAmount] = useState('');

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

    const closeDropdown = () => {
        setIsOpen(false);
        setActiveTab('home');
        setShowWalletSwitcher(false);
        setShowSettings(false);
        setSearchQuery('');
        setSendAmount('');
        setSendRecipient('');
        setSwapAmount('');
    };

    const currentBalance = activeWallet
        ? balances[`${activeWallet.address}-${activeChain}`] || '0'
        : '0';

    const chainConfig = activeWallet?.type === 'solana' ? CHAINS.solana : CHAINS[activeChain];
    const price = activeWallet?.type === 'solana' ? 180 : 3500;
    const usdValue = parseFloat(currentBalance) * price;

    // Mock tokens for demo
    const tokens = [
        { symbol: chainConfig.symbol, name: chainConfig.name, balance: currentBalance, usd: usdValue, logo: chainConfig.logo },
    ];

    const filteredTokens = tokens.filter(t =>
        t.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Not connected state
    if (!isUnlocked || !activeWallet) {
        return (
            <button
                onClick={() => openModal()}
                className="flex items-center gap-2 px-3 py-1.5 lg:px-4 lg:py-2 rounded-xl bg-[var(--primary)] text-black font-medium text-xs lg:text-sm hover:opacity-90 transition-all shadow-[0_0_15px_var(--primary-glow)]"
            >
                <Wallet className="w-4 h-4" />
                <span>{wallets.length > 0 ? 'Unlock' : 'Connect Wallet'}</span>
            </button>
        );
    }

    const tabs: { id: TabId; icon: any; label: string }[] = [
        { id: 'home', icon: Home, label: 'Home' },
        { id: 'send', icon: ArrowUpRight, label: 'Send' },
        { id: 'receive', icon: ArrowDownLeft, label: 'Receive' },
        { id: 'swap', icon: RefreshCw, label: 'Swap' },
        { id: 'search', icon: Search, label: 'Search' },
    ];

    return (
        <div className="relative">
            {/* Wallet Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-2 py-1 lg:px-3 lg:py-2 rounded-xl bg-[var(--background-tertiary)] border border-[var(--border)] hover:border-[var(--primary)] transition-all"
            >
                <img src={chainConfig.logo} alt={chainConfig.name} className="w-5 h-5 rounded-full" />
                <span className="font-bold text-sm">
                    ${usdValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                <ChevronDown className={clsx("w-4 h-4 text-[var(--foreground-muted)] transition-transform", isOpen && "rotate-180")} />
            </button>

            {/* Dropdown */}
            {isOpen && (
                <>
                    <div className="fixed inset-0 z-40" onClick={closeDropdown} />
                    <div className="absolute right-0 top-full mt-2 w-[360px] bg-[var(--background-secondary)] border border-[var(--border)] rounded-2xl shadow-2xl z-[70] overflow-hidden animate-fade-in flex flex-col" style={{ height: '480px' }}>

                        {/* Header */}
                        <div className="p-3 border-b border-[var(--border)] flex items-center justify-between flex-shrink-0">
                            <button
                                onClick={() => setShowWalletSwitcher(!showWalletSwitcher)}
                                className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-[var(--background-tertiary)] transition-colors"
                            >
                                <div className="w-7 h-7 rounded-full bg-[var(--primary)] flex items-center justify-center">
                                    <Wallet className="w-3.5 h-3.5 text-black" />
                                </div>
                                <div className="text-left">
                                    <p className="text-xs font-medium">{activeWallet.name}</p>
                                    <p className="text-[10px] text-[var(--foreground-muted)] font-mono">
                                        {activeWallet.address.slice(0, 6)}...{activeWallet.address.slice(-4)}
                                    </p>
                                </div>
                                <ChevronDown className={clsx("w-3 h-3 text-[var(--foreground-muted)]", showWalletSwitcher && "rotate-180")} />
                            </button>
                            <div className="flex items-center gap-1">
                                <button onClick={handleCopy} className="p-1.5 rounded-lg hover:bg-[var(--background-tertiary)]">
                                    {copied ? <Check className="w-4 h-4 text-[var(--accent-green)]" /> : <Copy className="w-4 h-4 text-[var(--foreground-muted)]" />}
                                </button>
                                <button onClick={() => setShowSettings(!showSettings)} className="p-1.5 rounded-lg hover:bg-[var(--background-tertiary)]">
                                    <Settings className="w-4 h-4 text-[var(--foreground-muted)]" />
                                </button>
                                <button onClick={() => { lock(); closeDropdown(); }} className="p-1.5 rounded-lg hover:bg-[var(--accent-red)]/10">
                                    <Lock className="w-4 h-4 text-[var(--accent-red)]" />
                                </button>
                            </div>
                        </div>

                        {/* Wallet Switcher Dropdown */}
                        {showWalletSwitcher && wallets.length > 0 && (
                            <div className="p-2 border-b border-[var(--border)] bg-[var(--background-tertiary)]/50 max-h-[120px] overflow-y-auto flex-shrink-0">
                                {wallets.map((wallet) => (
                                    <button
                                        key={wallet.address}
                                        onClick={() => { setActiveWallet(wallet.address); setShowWalletSwitcher(false); }}
                                        className={clsx(
                                            'w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-left text-xs',
                                            wallet.address === activeWallet.address ? 'bg-[var(--primary)]/10' : 'hover:bg-[var(--background)]'
                                        )}
                                    >
                                        <Wallet className="w-3.5 h-3.5" />
                                        <span className="flex-1 truncate">{wallet.name}</span>
                                        {wallet.address === activeWallet.address && <Check className="w-3 h-3 text-[var(--primary)]" />}
                                    </button>
                                ))}
                                <button
                                    onClick={() => { openModal('create'); closeDropdown(); }}
                                    className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs text-[var(--primary)] hover:bg-[var(--primary)]/5 mt-1"
                                >
                                    <Plus className="w-3.5 h-3.5" />
                                    Add Wallet
                                </button>
                            </div>
                        )}

                        {/* Settings Panel */}
                        {showSettings && (
                            <div className="p-2 border-b border-[var(--border)] bg-[var(--background-tertiary)]/50 flex-shrink-0">
                                <button
                                    onClick={() => { openModal('create'); closeDropdown(); }}
                                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-[var(--background)] text-xs"
                                >
                                    <Plus className="w-3.5 h-3.5" />
                                    Add Wallet
                                </button>
                                <a
                                    href="/app/settings/"
                                    onClick={closeDropdown}
                                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-[var(--background)] text-xs"
                                >
                                    <Settings className="w-3.5 h-3.5" />
                                    App Settings
                                    <ExternalLink className="w-3 h-3 ml-auto text-[var(--foreground-muted)]" />
                                </a>
                            </div>
                        )}

                        {/* Content Area */}
                        <div className="flex-1 overflow-y-auto">
                            {/* HOME TAB */}
                            {activeTab === 'home' && (
                                <div className="p-4">
                                    {/* Balance */}
                                    <div className="text-center mb-6">
                                        <p className="text-3xl font-bold mb-1">
                                            ${usdValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </p>
                                        <p className="text-xs text-[var(--foreground-muted)] flex items-center justify-center gap-1.5">
                                            <img src={chainConfig.logo} className="w-3.5 h-3.5 rounded-full" />
                                            {parseFloat(currentBalance).toFixed(4)} {chainConfig.symbol}
                                        </p>
                                    </div>

                                    {/* Quick Actions */}
                                    <div className="flex justify-center gap-6 mb-6">
                                        <button onClick={() => setActiveTab('send')} className="flex flex-col items-center gap-1.5 group">
                                            <div className="w-12 h-12 rounded-full bg-[var(--primary)]/10 flex items-center justify-center group-hover:bg-[var(--primary)]/20 transition-colors">
                                                <ArrowUpRight className="w-5 h-5 text-[var(--primary)]" />
                                            </div>
                                            <span className="text-[10px] font-medium">Send</span>
                                        </button>
                                        <button onClick={() => setActiveTab('receive')} className="flex flex-col items-center gap-1.5 group">
                                            <div className="w-12 h-12 rounded-full bg-[var(--primary)]/10 flex items-center justify-center group-hover:bg-[var(--primary)]/20 transition-colors">
                                                <ArrowDownLeft className="w-5 h-5 text-[var(--primary)]" />
                                            </div>
                                            <span className="text-[10px] font-medium">Receive</span>
                                        </button>
                                        <button onClick={() => setActiveTab('swap')} className="flex flex-col items-center gap-1.5 group">
                                            <div className="w-12 h-12 rounded-full bg-[var(--primary)]/10 flex items-center justify-center group-hover:bg-[var(--primary)]/20 transition-colors">
                                                <RefreshCw className="w-5 h-5 text-[var(--primary)]" />
                                            </div>
                                            <span className="text-[10px] font-medium">Swap</span>
                                        </button>
                                    </div>

                                    {/* Tokens / Activity Tab Selector */}
                                    <div className="-mx-4">
                                        <div className="flex border-b border-[var(--border)]">
                                            <button
                                                onClick={() => setHomeSubTab('tokens')}
                                                className={clsx(
                                                    'flex-1 py-2 text-xs font-medium transition-colors',
                                                    homeSubTab === 'tokens' ? 'text-[var(--primary)] border-b-2 border-[var(--primary)]' : 'text-[var(--foreground-muted)]'
                                                )}
                                            >
                                                Tokens
                                            </button>
                                            <button
                                                onClick={() => setHomeSubTab('activity')}
                                                className={clsx(
                                                    'flex-1 py-2 text-xs font-medium transition-colors',
                                                    homeSubTab === 'activity' ? 'text-[var(--primary)] border-b-2 border-[var(--primary)]' : 'text-[var(--foreground-muted)]'
                                                )}
                                            >
                                                Activity
                                            </button>
                                        </div>

                                        {/* Tab Content */}
                                        <div className="px-4">
                                            {homeSubTab === 'tokens' ? (
                                                <div>
                                                    {tokens.map((token) => (
                                                        <div key={token.symbol} className="flex items-center gap-3 p-3 hover:bg-[var(--background-tertiary)] rounded-xl cursor-pointer">
                                                            <img src={token.logo} className="w-9 h-9 rounded-full" />
                                                            <div className="flex-1">
                                                                <p className="text-sm font-medium">{token.symbol}</p>
                                                                <p className="text-[10px] text-[var(--foreground-muted)]">{token.name}</p>
                                                            </div>
                                                            <div className="text-right">
                                                                <p className="text-sm font-medium">{parseFloat(token.balance).toFixed(4)}</p>
                                                                <p className="text-[10px] text-[var(--foreground-muted)]">${token.usd.toFixed(2)}</p>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="flex flex-col items-center justify-center py-8 text-center">
                                                    <div className="w-10 h-10 rounded-full bg-[var(--background-tertiary)] flex items-center justify-center mb-2">
                                                        <Activity className="w-5 h-5 text-[var(--foreground-muted)]" />
                                                    </div>
                                                    <p className="text-xs text-[var(--foreground-muted)]">No recent activity</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* SEND TAB */}
                            {activeTab === 'send' && (
                                <div className="p-4">
                                    <h3 className="font-bold text-lg mb-4">Send</h3>

                                    <div className="space-y-3">
                                        {/* Asset */}
                                        <div className="p-3 rounded-xl bg-[var(--background-tertiary)] border border-[var(--border)]">
                                            <label className="text-[10px] text-[var(--foreground-muted)] block mb-2">Asset</label>
                                            <div className="flex items-center gap-3">
                                                <img src={chainConfig.logo} className="w-8 h-8 rounded-full" />
                                                <div className="flex-1">
                                                    <p className="text-sm font-medium">{chainConfig.symbol}</p>
                                                    <p className="text-[10px] text-[var(--foreground-muted)]">Balance: {parseFloat(currentBalance).toFixed(4)}</p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Amount */}
                                        <div className="p-3 rounded-xl bg-[var(--background-tertiary)] border border-[var(--border)]">
                                            <div className="flex justify-between mb-1">
                                                <label className="text-[10px] text-[var(--foreground-muted)]">Amount</label>
                                                <span className="text-[10px] text-[var(--foreground-muted)]">≈ ${(parseFloat(sendAmount || '0') * price).toFixed(2)}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="number"
                                                    value={sendAmount}
                                                    onChange={(e) => setSendAmount(e.target.value)}
                                                    placeholder="0.00"
                                                    className="flex-1 bg-transparent text-xl font-bold outline-none"
                                                />
                                                <span className="text-sm text-[var(--foreground-muted)]">{chainConfig.symbol}</span>
                                            </div>
                                            <div className="flex gap-2 mt-2">
                                                {[25, 50, 75, 100].map((pct) => (
                                                    <button
                                                        key={pct}
                                                        onClick={() => setSendAmount((parseFloat(currentBalance) * pct / 100).toFixed(6))}
                                                        className="flex-1 py-1 text-[10px] rounded-lg bg-[var(--background)] hover:bg-[var(--primary)]/10 transition-colors"
                                                    >
                                                        {pct === 100 ? 'MAX' : `${pct}%`}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Recipient */}
                                        <div className="p-3 rounded-xl bg-[var(--background-tertiary)] border border-[var(--border)]">
                                            <label className="text-[10px] text-[var(--foreground-muted)] block mb-1">Recipient Address</label>
                                            <input
                                                type="text"
                                                value={sendRecipient}
                                                onChange={(e) => setSendRecipient(e.target.value)}
                                                placeholder="Enter address..."
                                                className="w-full bg-transparent text-xs font-mono outline-none"
                                            />
                                        </div>

                                        <button
                                            disabled={!sendAmount || !sendRecipient}
                                            className="w-full py-3 rounded-xl bg-[var(--primary)] text-black font-bold text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Send {chainConfig.symbol}
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* RECEIVE TAB */}
                            {activeTab === 'receive' && (
                                <div className="p-4">
                                    <h3 className="font-bold text-lg mb-4">Receive</h3>

                                    <div className="flex flex-col items-center">
                                        <div className="p-4 bg-white rounded-xl mb-4">
                                            <QRCodeSVG value={activeWallet.address} size={160} />
                                        </div>

                                        <p className="text-[10px] text-[var(--foreground-muted)] mb-3">Your {chainConfig.name} Address</p>

                                        <div className="w-full p-3 bg-[var(--background-tertiary)] rounded-xl border border-[var(--border)]">
                                            <p className="text-xs font-mono break-all text-center mb-2">{activeWallet.address}</p>
                                            <button
                                                onClick={handleCopy}
                                                className="w-full py-2 rounded-lg bg-[var(--primary)] text-black font-medium text-xs flex items-center justify-center gap-2"
                                            >
                                                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                                                {copied ? 'Copied!' : 'Copy Address'}
                                            </button>
                                        </div>

                                        <p className="text-[10px] text-[var(--foreground-muted)] mt-4 text-center">
                                            Only send <strong>{chainConfig.symbol}</strong> and tokens on <strong>{chainConfig.name}</strong> to this address.
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* SWAP TAB */}
                            {activeTab === 'swap' && (
                                <div className="p-4">
                                    <h3 className="font-bold text-lg mb-4">Swap</h3>

                                    <div className="space-y-2">
                                        {/* From */}
                                        <div className="p-3 rounded-xl bg-[var(--background-tertiary)] border border-[var(--border)]">
                                            <div className="flex justify-between mb-1">
                                                <label className="text-[10px] text-[var(--foreground-muted)]">You pay</label>
                                                <span className="text-[10px] text-[var(--foreground-muted)]">Balance: {parseFloat(currentBalance).toFixed(4)}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="number"
                                                    value={swapAmount}
                                                    onChange={(e) => setSwapAmount(e.target.value)}
                                                    placeholder="0.00"
                                                    className="flex-1 bg-transparent text-xl font-bold outline-none"
                                                />
                                                <div className="flex items-center gap-1.5 px-2 py-1.5 bg-[var(--background)] rounded-lg border border-[var(--border)]">
                                                    <img src={chainConfig.logo} className="w-5 h-5 rounded-full" />
                                                    <span className="text-xs font-medium">{chainConfig.symbol}</span>
                                                    <ChevronDown className="w-3 h-3 text-[var(--foreground-muted)]" />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex justify-center -my-1 z-10 relative">
                                            <button className="w-8 h-8 rounded-full bg-[var(--background-secondary)] border border-[var(--border)] flex items-center justify-center hover:border-[var(--primary)] transition-colors">
                                                <RefreshCw className="w-4 h-4" />
                                            </button>
                                        </div>

                                        {/* To */}
                                        <div className="p-3 rounded-xl bg-[var(--background-tertiary)] border border-[var(--border)]">
                                            <label className="text-[10px] text-[var(--foreground-muted)] block mb-1">You receive</label>
                                            <div className="flex items-center gap-2">
                                                <span className="flex-1 text-xl font-bold text-[var(--foreground-muted)]">
                                                    {swapAmount ? (parseFloat(swapAmount) * price).toFixed(2) : '0.00'}
                                                </span>
                                                <div className="flex items-center gap-1.5 px-2 py-1.5 bg-[var(--background)] rounded-lg border border-[var(--border)]">
                                                    <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center text-white text-[10px] font-bold">$</div>
                                                    <span className="text-xs font-medium">USDC</span>
                                                    <ChevronDown className="w-3 h-3 text-[var(--foreground-muted)]" />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Swap Info */}
                                        {swapAmount && parseFloat(swapAmount) > 0 && (
                                            <div className="p-2 rounded-lg bg-[var(--background-tertiary)]/50 text-[10px] space-y-1">
                                                <div className="flex justify-between">
                                                    <span className="text-[var(--foreground-muted)]">Rate</span>
                                                    <span>1 {chainConfig.symbol} = ${price.toLocaleString()} USDC</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-[var(--foreground-muted)]">Network Fee</span>
                                                    <span>~$2.50</span>
                                                </div>
                                            </div>
                                        )}

                                        <button
                                            disabled={!swapAmount || parseFloat(swapAmount) <= 0}
                                            className="w-full py-3 rounded-xl bg-[var(--primary)] text-black font-bold text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Swap
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* SEARCH TAB */}
                            {activeTab === 'search' && (
                                <div className="p-4">
                                    <h3 className="font-bold text-lg mb-4">Search Tokens</h3>

                                    <div className="relative mb-4">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--foreground-muted)]" />
                                        <input
                                            type="text"
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            placeholder="Search by name or symbol..."
                                            autoFocus
                                            className="w-full pl-10 pr-4 py-3 text-sm bg-[var(--background-tertiary)] border border-[var(--border)] rounded-xl outline-none focus:border-[var(--primary)]"
                                        />
                                    </div>

                                    <div className="space-y-1">
                                        {filteredTokens.length === 0 ? (
                                            <p className="text-center text-xs text-[var(--foreground-muted)] py-8">No tokens found</p>
                                        ) : (
                                            filteredTokens.map((token) => (
                                                <div key={token.symbol} className="flex items-center gap-3 p-3 hover:bg-[var(--background-tertiary)] rounded-xl cursor-pointer">
                                                    <img src={token.logo} className="w-9 h-9 rounded-full" />
                                                    <div className="flex-1">
                                                        <p className="text-sm font-medium">{token.symbol}</p>
                                                        <p className="text-[10px] text-[var(--foreground-muted)]">{token.name}</p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-sm font-medium">{parseFloat(token.balance).toFixed(4)}</p>
                                                        <p className="text-[10px] text-[var(--foreground-muted)]">${token.usd.toFixed(2)}</p>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Bottom Tab Navigation */}
                        <div className="flex border-t border-[var(--border)] bg-[var(--background-tertiary)] flex-shrink-0">
                            {tabs.map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={clsx(
                                        "flex-1 flex flex-col items-center justify-center py-2 gap-0.5 transition-colors relative",
                                        activeTab === tab.id ? "text-[var(--primary)]" : "text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
                                    )}
                                >
                                    <tab.icon className="w-4 h-4" />
                                    <span className="text-[9px] font-medium">{tab.label}</span>
                                    {activeTab === tab.id && (
                                        <div className="absolute top-0 w-6 h-0.5 bg-[var(--primary)] rounded-b-full" />
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
