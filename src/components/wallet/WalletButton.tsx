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
    ArrowDownUp,
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
import { TokenDetailView } from './TokenDetailView';

type TabId = 'home' | 'send' | 'receive' | 'swap' | 'search' | 'tokenDetail';

interface TokenData {
    symbol: string;
    name: string;
    logo: string;
    balance: string;
    usd: number;
    contractAddress?: string;
    isNative?: boolean;
}

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

    // Custom Token State
    const [showAddToken, setShowAddToken] = useState(false);
    const [newTokenAddress, setNewTokenAddress] = useState('');
    const [addingToken, setAddingToken] = useState(false);
    const [customTokens, setCustomTokens] = useState<string[]>([]);

    useEffect(() => {
        const saved = localStorage.getItem('custom_tokens');
        if (saved) setCustomTokens(JSON.parse(saved));
    }, []);

    const addCustomToken = async () => {
        if (!newTokenAddress || addingToken) return;
        setAddingToken(true);
        try {
            const { getErc20Balance } = await import('@/lib/wallet');
            // Validate
            await getErc20Balance(activeWallet!.address, newTokenAddress, activeChain as any);
            const newCustom = [...customTokens, newTokenAddress];
            setCustomTokens(newCustom);
            localStorage.setItem('custom_tokens', JSON.stringify(newCustom));
            setNewTokenAddress('');
            setShowAddToken(false);
        } catch (e) {
            console.error('Invalid token', e);
        } finally {
            setAddingToken(false);
        }
    };

    // Send state
    const [sendAmount, setSendAmount] = useState('');
    const [sendRecipient, setSendRecipient] = useState('');
    const [selectedSendToken, setSelectedSendToken] = useState<TokenData | null>(null);
    const [showSendTokenSelector, setShowSendTokenSelector] = useState(false);

    // Swap state
    const [swapAmount, setSwapAmount] = useState('');
    const [swapFromToken, setSwapFromToken] = useState<string>('');
    const [swapToToken, setSwapToToken] = useState<string>('USDC');
    const [showSwapFromSelector, setShowSwapFromSelector] = useState(false);
    const [showSwapToSelector, setShowSwapToSelector] = useState(false);

    // Token detail state
    const [selectedToken, setSelectedToken] = useState<TokenData | null>(null);

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
        setSelectedToken(null);
        setShowSendTokenSelector(false);
        setShowSwapFromSelector(false);
        setShowSwapToSelector(false);
    };

    const currentBalance = activeWallet
        ? balances[`${activeWallet.address}-${activeChain}`] || '0'
        : '0';

    const chainConfig = activeWallet?.type === 'solana' ? CHAINS.solana : CHAINS[activeChain];
    const price = activeWallet?.type === 'solana' ? 180 : 3500;
    const usdValue = parseFloat(currentBalance) * price;

    const [tokens, setTokens] = useState<TokenData[]>([]);

    // Define native token
    const nativeToken: TokenData = {
        symbol: chainConfig.symbol,
        name: chainConfig.name,
        logo: chainConfig.logo,
        balance: currentBalance,
        usd: usdValue,
        isNative: true,
    };

    // Fetch token balances
    useEffect(() => {
        if (!activeWallet || !isUnlocked) return;

        const fetchBalances = async () => {
            let discoveredTokens: TokenData[] = [];

            try {
                if (activeWallet.type === 'solana') {
                    const { getAllSplTokens } = await import('@/lib/services/solana');
                    const splTokens = await getAllSplTokens(activeWallet.address);

                    // For MVP, we map known SPL mints to metadata or just show symbol if available
                    // A proper implementation would use a token list provider
                    const KNOWN_MINTS: Record<string, any> = {
                        'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v': { symbol: 'USDC', name: 'USD Coin', logo: 'https://cryptologos.cc/logos/usd-coin-usdc-logo.png' },
                        'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB': { symbol: 'USDT', name: 'Tether', logo: 'https://cryptologos.cc/logos/tether-usdt-logo.png' },
                    };

                    discoveredTokens = splTokens.map(t => {
                        const meta = KNOWN_MINTS[t.mint];
                        return {
                            symbol: meta?.symbol || 'Unknown',
                            name: meta?.name || `Token ${t.mint.slice(0, 4)}...`,
                            logo: meta?.logo || '/placeholder-token.png',
                            balance: t.amount.toString(),
                            usd: t.amount * (meta ? 1 : 0), // Mock price
                            contractAddress: t.mint,
                        };
                    });

                } else {
                    // EVM Discovery via Alchemy
                    const { getTokenBalances, getTokenMetadata } = await import('@/lib/services/alchemy');
                    const rawBalances = await getTokenBalances(activeChain as any, activeWallet.address);

                    // Filter 0 balances immediately
                    const nonZero = rawBalances.filter(b => {
                        // hex balance to BigInt check
                        return b.tokenBalance !== '0x' && b.tokenBalance !== '0x0' && BigInt(b.tokenBalance) > BigInt(0);
                    });

                    // Fetch metadata in parallel
                    const tokenPromises = nonZero.map(async (b) => {
                        const meta = await getTokenMetadata(activeChain as any, b.contractAddress);
                        if (!meta) return null;

                        const balance = parseInt(b.tokenBalance, 16) / Math.pow(10, meta.decimals);

                        return {
                            symbol: meta.symbol,
                            name: meta.name,
                            logo: meta.logo || 'https://via.placeholder.com/32',
                            balance: balance.toFixed(4),
                            usd: balance * 1, // Mock price $1 for now
                            isNative: false,
                        } as TokenData;
                    });

                    const results = await Promise.all(tokenPromises);
                    discoveredTokens = results.filter((t): t is TokenData => t !== null);
                }
            } catch (e) {
                console.error("Discovery failed", e);
            }

            // Always include native token if balance > 0 or it's the main chain token
            setTokens([nativeToken, ...discoveredTokens]);
        };

        fetchBalances();
        // Refresh every 60s
        const interval = setInterval(fetchBalances, 60000);
        return () => clearInterval(interval);
    }, [activeWallet, isUnlocked, activeChain, currentBalance]);

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
                <span>{wallets.length > 0 ? 'Unlock' : 'Connect'}</span>
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
                className="flex items-center gap-2 px-2 py-1 lg:px-3 lg:py-2 rounded-xl bg-[var(--background-tertiary)] border border-[var(--border)] hover:border-[var(--border-hover)] transition-all"
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
                        <div className="p-3 flex items-center justify-between flex-shrink-0 bg-[var(--background-secondary)]/50">
                            <button
                                onClick={() => setShowWalletSwitcher(!showWalletSwitcher)}
                                className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-[var(--background-tertiary)] transition-colors -ml-1"
                            >
                                <div className="w-7 h-7 rounded-full bg-[var(--primary)] flex items-center justify-center shadow-sm">
                                    <Wallet className="w-3.5 h-3.5 text-black" />
                                </div>
                                <div className="text-left">
                                    <p className="text-xs font-bold leading-tight">{activeWallet.name}</p>
                                    <p className="text-[10px] text-[var(--foreground-muted)] font-mono opacity-80">
                                        {activeWallet.address.slice(0, 6)}...{activeWallet.address.slice(-4)}
                                    </p>
                                </div>
                                <ChevronDown className={clsx("w-3 h-3 text-[var(--foreground-muted)] transition-transform duration-200", showWalletSwitcher && "rotate-180")} />
                            </button>
                            <div className="flex items-center gap-1">
                                <button onClick={handleCopy} className="p-1.5 rounded-lg hover:bg-[var(--background-tertiary)] transition-colors text-[var(--foreground-muted)] hover:text-[var(--foreground)]">
                                    {copied ? <Check className="w-3.5 h-3.5 text-[var(--accent-green)]" /> : <Copy className="w-3.5 h-3.5" />}
                                </button>
                                <button onClick={() => setShowSettings(!showSettings)} className="p-1.5 rounded-lg hover:bg-[var(--background-tertiary)] transition-colors text-[var(--foreground-muted)] hover:text-[var(--foreground)]">
                                    <Settings className="w-3.5 h-3.5" />
                                </button>
                                <button onClick={() => { lock(); closeDropdown(); }} className="p-1.5 rounded-lg hover:bg-[var(--accent-red)]/5 text-[var(--foreground-muted)] hover:text-[var(--accent-red)] transition-colors">
                                    <Lock className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        </div>

                        {/* Wallet Switcher Dropdown */}
                        {showWalletSwitcher && wallets.length > 0 && (
                            <div className="absolute top-[60px] left-0 right-0 z-50 border-b border-[var(--border)] bg-[var(--background-secondary)] shadow-xl animate-in slide-in-from-top-2 duration-200">
                                <div className="p-2 pb-0">
                                    <p className="text-[9px] font-bold text-[var(--foreground-muted)] uppercase tracking-wider px-2 mb-1.5">Your Wallets</p>
                                    <div className="space-y-0.5 overflow-y-auto max-h-[90px]">
                                        {wallets.map((wallet) => (
                                            <button
                                                key={wallet.address}
                                                onClick={() => { setActiveWallet(wallet.address); setShowWalletSwitcher(false); }}
                                                className={clsx(
                                                    'w-full flex items-center gap-2.5 px-2 py-2 rounded-lg text-left text-xs transition-all',
                                                    wallet.address === activeWallet.address
                                                        ? 'bg-[var(--background-secondary)] shadow-sm border border-[var(--border)]'
                                                        : 'hover:bg-[var(--background-secondary)] hover:shadow-sm border border-transparent hover:border-[var(--border)]'
                                                )}
                                            >
                                                <div className={clsx(
                                                    "w-1.5 h-1.5 rounded-full flex-shrink-0",
                                                    wallet.address === activeWallet.address ? "bg-[var(--primary)]" : "bg-[var(--foreground-muted)]/30"
                                                )} />
                                                <span className={clsx(
                                                    "flex-1 truncate font-medium",
                                                    wallet.address === activeWallet.address ? "text-[var(--foreground)]" : "text-[var(--foreground-muted)]"
                                                )}>{wallet.name}</span>
                                                {wallet.address === activeWallet.address && <Check className="w-3 h-3 text-[var(--primary)]" />}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div className="p-2 pt-2">
                                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[var(--border)]/50">
                                        <button
                                            onClick={() => { openModal('create'); closeDropdown(); }}
                                            className="flex items-center justify-center gap-1.5 px-2 py-2 rounded-lg text-[11px] font-semibold text-[var(--primary)] bg-[var(--primary)]/10 hover:bg-[var(--primary)]/20 transition-colors"
                                        >
                                            <Plus className="w-3 h-3" />
                                            Create New
                                        </button>
                                        <button
                                            onClick={() => { openModal('import'); closeDropdown(); }}
                                            className="flex items-center justify-center gap-1.5 px-2 py-2 rounded-lg text-[11px] font-semibold text-[var(--accent-yellow)] bg-[var(--accent-yellow)]/10 hover:bg-[var(--accent-yellow)]/20 transition-colors"
                                        >
                                            <ArrowDownLeft className="w-3 h-3" />
                                            Import
                                        </button>
                                    </div>
                                </div>
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
                                    Create New Wallet
                                </button>
                                <button
                                    onClick={() => { openModal('import'); closeDropdown(); }}
                                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-[var(--background)] text-xs"
                                >
                                    <ArrowDownLeft className="w-3.5 h-3.5" />
                                    Import Wallet
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
                                <div className="p-3">
                                    {/* Balance - compact */}
                                    <div className="text-center mb-3">
                                        <p className="text-2xl font-bold mb-0.5">
                                            ${usdValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </p>
                                        <p className="text-[10px] text-[var(--foreground-muted)] flex items-center justify-center gap-1">
                                            <img src={chainConfig.logo} className="w-3 h-3 rounded-full" />
                                            {parseFloat(currentBalance).toFixed(4)} {chainConfig.symbol}
                                        </p>
                                    </div>

                                    {/* Quick Actions - compact */}
                                    <div className="flex justify-center gap-5 mb-3">
                                        <button onClick={() => setActiveTab('send')} className="flex flex-col items-center gap-1 group">
                                            <div className="w-10 h-10 rounded-full bg-[var(--background-tertiary)] flex items-center justify-center group-hover:bg-[var(--primary)]/20 transition-colors">
                                                <ArrowUpRight className="w-4 h-4 text-[var(--primary)]" />
                                            </div>
                                            <span className="text-[10px] font-medium">Send</span>
                                        </button>
                                        <button onClick={() => setActiveTab('receive')} className="flex flex-col items-center gap-1 group">
                                            <div className="w-10 h-10 rounded-full bg-[var(--background-tertiary)] flex items-center justify-center group-hover:bg-[var(--primary)]/20 transition-colors">
                                                <ArrowDownLeft className="w-4 h-4 text-[var(--primary)]" />
                                            </div>
                                            <span className="text-[10px] font-medium">Receive</span>
                                        </button>
                                        <button onClick={() => setActiveTab('swap')} className="flex flex-col items-center gap-1 group">
                                            <div className="w-10 h-10 rounded-full bg-[var(--background-tertiary)] flex items-center justify-center group-hover:bg-[var(--primary)]/20 transition-colors">
                                                <RefreshCw className="w-4 h-4 text-[var(--primary)]" />
                                            </div>
                                            <span className="text-[10px] font-medium">Swap</span>
                                        </button>
                                    </div>

                                    {/* Tokens / Activity Tab Selector */}
                                    <div className="-mx-4">
                                        <div className="flex border-b border-[var(--border)] relative">
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

                                            {/* Top Right Add Token Trigger */}
                                            {homeSubTab === 'tokens' && activeWallet.type !== 'solana' && (
                                                <div className="absolute right-2 top-1/2 -translate-y-1/2">
                                                    <button
                                                        onClick={() => setShowAddToken(!showAddToken)}
                                                        className="p-1 text-[var(--foreground-muted)] hover:text-[var(--primary)] transition-colors"
                                                    >
                                                        <Plus className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            )}
                                        </div>

                                        {/* Tab Content - full width separators */}
                                        <div>
                                            {homeSubTab === 'tokens' ? (
                                                <div className="divide-y divide-[var(--border)]">
                                                    {/* Add Token Input Form (Top of List) */}
                                                    {showAddToken && (
                                                        <div className="p-3 bg-[var(--background-tertiary)]/30">
                                                            <div className="bg-[var(--background-tertiary)] p-2 rounded-xl border border-[var(--border)]">
                                                                <p className="text-xs text-[var(--foreground-muted)] mb-1">Add Token Address</p>
                                                                <div className="flex gap-2">
                                                                    <input
                                                                        value={newTokenAddress}
                                                                        onChange={(e) => setNewTokenAddress(e.target.value)}
                                                                        placeholder="0x..."
                                                                        className="flex-1 bg-[var(--background)] border border-[var(--border)] rounded-lg px-2 py-1 text-xs min-w-0"
                                                                    />
                                                                    <button
                                                                        onClick={addCustomToken}
                                                                        disabled={addingToken || !newTokenAddress}
                                                                        className="bg-[var(--primary)] text-black rounded-lg px-2 py-1 text-xs font-bold disabled:opacity-50"
                                                                    >
                                                                        {addingToken ? '...' : 'Add'}
                                                                    </button>
                                                                    <button
                                                                        onClick={() => setShowAddToken(false)}
                                                                        className="p-1 hover:text-[var(--accent-red)] transition-colors"
                                                                    >
                                                                        <X className="w-4 h-4" />
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}

                                                    {tokens.map((token, index) => (
                                                        <div
                                                            key={token.symbol + index}
                                                            onClick={() => {
                                                                setSelectedToken(token);
                                                                setActiveTab('tokenDetail');
                                                            }}
                                                            className="flex items-center gap-3 px-4 py-3 hover:bg-[var(--background-tertiary)] cursor-pointer"
                                                        >
                                                            <img src={token.logo} className="w-9 h-9 rounded-full flex-shrink-0" />
                                                            <div className="flex-1 min-w-0">
                                                                <p className="text-sm font-medium truncate">{token.symbol}</p>
                                                                <p className="text-[10px] text-[var(--foreground-muted)] truncate">{token.name}</p>
                                                            </div>
                                                            <div className="text-right flex-shrink-0">
                                                                <p className="text-sm font-medium">{parseFloat(token.balance).toFixed(4)}</p>
                                                                <p className="text-[10px] text-[var(--foreground-muted)]">${token.usd.toFixed(2)}</p>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="flex flex-col items-center justify-center py-8 text-center px-4">
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
                                <div className="p-4 relative">
                                    <h3 className="font-bold text-base mb-4">Send</h3>

                                    {/* Token Selector Modal */}
                                    {showSendTokenSelector && (
                                        <div className="absolute inset-0 bg-[var(--background-secondary)] z-10 p-4 rounded-2xl">
                                            <div className="flex items-center justify-between mb-3">
                                                <h4 className="font-bold text-sm">Select Asset</h4>
                                                <button onClick={() => setShowSendTokenSelector(false)} className="p-1 rounded-lg hover:bg-[var(--background-tertiary)]">
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </div>
                                            <div className="space-y-1">
                                                {tokens.map((token) => (
                                                    <button
                                                        key={token.symbol}
                                                        onClick={() => {
                                                            setSelectedSendToken(token);
                                                            setShowSendTokenSelector(false);
                                                        }}
                                                        className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-[var(--background-tertiary)] transition-colors"
                                                    >
                                                        <img src={token.logo} className="w-8 h-8 rounded-full" />
                                                        <div className="flex-1 text-left">
                                                            <p className="text-sm font-medium">{token.symbol}</p>
                                                            <p className="text-[10px] text-[var(--foreground-muted)]">{token.name}</p>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="text-xs">{parseFloat(token.balance).toFixed(4)}</p>
                                                        </div>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    <div className="space-y-3">
                                        {/* Amount with inline token selector */}
                                        <div className="p-3 rounded-xl bg-[var(--background-tertiary)] border border-[var(--border)]">
                                            <div className="flex justify-between mb-1.5">
                                                <label className="text-[10px] text-[var(--foreground-muted)]">Amount</label>
                                                <span className="text-[10px] text-[var(--foreground-muted)]">
                                                    Balance: {parseFloat((selectedSendToken || tokens[0]).balance).toFixed(4)}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="number"
                                                    value={sendAmount}
                                                    onChange={(e) => setSendAmount(e.target.value)}
                                                    placeholder="0.00"
                                                    className="flex-1 min-w-0 bg-transparent text-2xl font-bold outline-none"
                                                />
                                                <button
                                                    onClick={() => setShowSendTokenSelector(true)}
                                                    className="flex items-center gap-1.5 px-2.5 py-2 rounded-lg bg-[var(--background)] border border-[var(--border)] hover:border-[var(--border-hover)] transition-all flex-shrink-0"
                                                >
                                                    <img src={(selectedSendToken || tokens[0]).logo} className="w-5 h-5 rounded-full" />
                                                    <span className="text-xs font-medium">{(selectedSendToken || tokens[0]).symbol}</span>
                                                    <ChevronDown className="w-3 h-3 text-[var(--foreground-muted)]" />
                                                </button>
                                            </div>
                                            <div className="flex gap-2 mt-2.5">
                                                {[25, 50, 75, 100].map((pct) => (
                                                    <button
                                                        key={pct}
                                                        onClick={() => setSendAmount((parseFloat((selectedSendToken || tokens[0]).balance) * pct / 100).toFixed(6))}
                                                        className="flex-1 py-1.5 text-[10px] rounded-lg bg-[var(--background)] hover:bg-[var(--background-tertiary)] hover:text-[var(--primary)] transition-colors"
                                                    >
                                                        {pct === 100 ? 'MAX' : `${pct}%`}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Recipient */}
                                        <div className="p-3 rounded-xl bg-[var(--background-tertiary)] border border-[var(--border)]">
                                            <label className="text-[10px] text-[var(--foreground-muted)] block mb-1.5">Recipient Address</label>
                                            <input
                                                type="text"
                                                value={sendRecipient}
                                                onChange={(e) => setSendRecipient(e.target.value)}
                                                placeholder="Enter address..."
                                                className="w-full bg-transparent text-sm font-mono outline-none truncate"
                                            />
                                        </div>

                                        <button
                                            disabled={!sendAmount || !sendRecipient}
                                            className="w-full py-3 rounded-xl bg-[var(--primary)] text-black font-bold text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Send {(selectedSendToken || tokens[0]).symbol}
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* RECEIVE TAB */}
                            {activeTab === 'receive' && (
                                <div className="p-3">
                                    <h3 className="font-bold text-base mb-2">Receive</h3>

                                    <div className="flex flex-col items-center">
                                        <div className="p-3 bg-white rounded-xl mb-2">
                                            <QRCodeSVG value={activeWallet.address} size={130} />
                                        </div>

                                        <p className="text-[10px] text-[var(--foreground-muted)] mb-2">Your {chainConfig.name} Address</p>

                                        <div className="w-full p-2.5 bg-[var(--background-tertiary)] rounded-xl border border-[var(--border)]">
                                            <p className="text-[10px] font-mono break-all text-center mb-2">{activeWallet.address}</p>
                                            <button
                                                onClick={handleCopy}
                                                className="w-full py-2 rounded-lg bg-[var(--primary)] text-black font-medium text-xs flex items-center justify-center gap-1.5"
                                            >
                                                {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                                                {copied ? 'Copied!' : 'Copy Address'}
                                            </button>
                                        </div>

                                        <p className="text-[9px] text-[var(--foreground-muted)] mt-2 text-center leading-tight">
                                            Only send <strong>{chainConfig.symbol}</strong> on <strong>{chainConfig.name}</strong> to this address.
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* SWAP TAB */}
                            {activeTab === 'swap' && (
                                <div className="p-4 relative">
                                    {/* Header with Slippage */}
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="font-bold text-lg">Swap</h3>
                                        <div className="flex items-center gap-1">
                                            <span className="text-[10px] text-[var(--foreground-muted)] mr-1">Slippage:</span>
                                            {[0.5, 1, 2].map((s) => (
                                                <button
                                                    key={s}
                                                    className="px-2 py-1 text-[10px] rounded-md bg-[var(--background-tertiary)] border border-[var(--border)] hover:border-[var(--primary)] hover:text-[var(--primary)] transition-colors"
                                                >
                                                    {s}%
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* From Token Selector Modal */}
                                    {showSwapFromSelector && (
                                        <div className="absolute inset-0 bg-[var(--background-secondary)] z-10 p-4 rounded-2xl">
                                            <div className="flex items-center justify-between mb-3">
                                                <h4 className="font-bold text-sm">Select Token</h4>
                                                <button onClick={() => setShowSwapFromSelector(false)} className="p-1 rounded-lg hover:bg-[var(--background-tertiary)]">
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </div>
                                            <div className="space-y-1">
                                                {tokens.map((token) => (
                                                    <button
                                                        key={token.symbol}
                                                        onClick={() => {
                                                            setSwapFromToken(token.symbol);
                                                            setShowSwapFromSelector(false);
                                                        }}
                                                        className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-[var(--background-tertiary)] transition-colors"
                                                    >
                                                        <img src={token.logo} className="w-8 h-8 rounded-full" />
                                                        <div className="flex-1 text-left">
                                                            <p className="text-sm font-medium">{token.symbol}</p>
                                                            <p className="text-[10px] text-[var(--foreground-muted)]">{token.name}</p>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="text-xs">{parseFloat(token.balance).toFixed(4)}</p>
                                                        </div>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* To Token Selector Modal */}
                                    {showSwapToSelector && (
                                        <div className="absolute inset-0 bg-[var(--background-secondary)] z-10 p-4 rounded-2xl">
                                            <div className="flex items-center justify-between mb-3">
                                                <h4 className="font-bold text-sm">Select Token</h4>
                                                <button onClick={() => setShowSwapToSelector(false)} className="p-1 rounded-lg hover:bg-[var(--background-tertiary)]">
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </div>
                                            <div className="space-y-1">
                                                {tokens.map((token) => (
                                                    <button
                                                        key={token.symbol}
                                                        onClick={() => {
                                                            setSwapToToken(token.symbol);
                                                            setShowSwapToSelector(false);
                                                        }}
                                                        className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-[var(--background-tertiary)] transition-colors"
                                                    >
                                                        <img src={token.logo} className="w-8 h-8 rounded-full" />
                                                        <div className="flex-1 text-left">
                                                            <p className="text-sm font-medium">{token.symbol}</p>
                                                            <p className="text-[10px] text-[var(--foreground-muted)]">{token.name}</p>
                                                        </div>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* You Pay Card */}
                                    <div className="p-3 rounded-xl bg-[var(--background-tertiary)] border border-[var(--border)]">
                                        <div className="flex justify-between items-center mb-2">
                                            <label className="text-xs text-[var(--foreground-muted)]">You Pay</label>
                                            <span className="text-xs text-[var(--foreground-muted)]">USD</span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <input
                                                type="number"
                                                value={swapAmount}
                                                onChange={(e) => setSwapAmount(e.target.value)}
                                                placeholder="0"
                                                className="flex-1 min-w-0 bg-transparent text-2xl font-bold outline-none placeholder:text-[var(--foreground-muted)]/40"
                                            />
                                            <button
                                                onClick={() => setShowSwapFromSelector(true)}
                                                className="flex items-center gap-1.5 px-2.5 py-1.5 bg-[var(--background)] rounded-full border border-[var(--border)] hover:border-[var(--primary)] transition-all"
                                            >
                                                <img src={tokens.find(t => t.symbol === (swapFromToken || chainConfig.symbol))?.logo || chainConfig.logo} className="w-5 h-5 rounded-full" />
                                                <span className="text-sm font-medium">{swapFromToken || chainConfig.symbol}</span>
                                                <ChevronDown className="w-3 h-3 text-[var(--foreground-muted)]" />
                                            </button>
                                        </div>
                                        {/* Quick Amount + Balance row */}
                                        <div className="flex items-center justify-between mt-3">
                                            <div className="flex gap-1.5">
                                                {[25, 50, 75, 100].map((pct) => (
                                                    <button
                                                        key={pct}
                                                        onClick={() => setSwapAmount((parseFloat(tokens.find(t => t.symbol === (swapFromToken || chainConfig.symbol))?.balance || '0') * pct / 100).toFixed(6))}
                                                        className="px-2.5 py-1 text-[10px] rounded-md bg-[var(--background-tertiary)] border border-[var(--border)] hover:border-[var(--primary)] hover:text-[var(--primary)] transition-colors"
                                                    >
                                                        {pct === 100 ? 'Max' : `${pct}%`}
                                                    </button>
                                                ))}
                                            </div>
                                            <span className="text-[10px] text-[var(--foreground-muted)]">
                                                Bal: {parseFloat(tokens.find(t => t.symbol === (swapFromToken || chainConfig.symbol))?.balance || '0').toFixed(4)} {swapFromToken || chainConfig.symbol}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Swap Direction Button - Between cards */}
                                    <div className="flex justify-center -my-2 relative z-10">
                                        <button
                                            onClick={() => {
                                                const temp = swapFromToken || chainConfig.symbol;
                                                setSwapFromToken(swapToToken);
                                                setSwapToToken(temp);
                                            }}
                                            className="w-8 h-8 rounded-full bg-[var(--background)] border border-[var(--border)] flex items-center justify-center text-[var(--primary)] hover:border-[var(--primary)] transition-colors"
                                        >
                                            <ArrowDownUp className="w-4 h-4" />
                                        </button>
                                    </div>

                                    {/* You Receive Card */}
                                    <div className="p-3 rounded-xl bg-[var(--background-tertiary)] border border-[var(--border)]">
                                        <label className="text-xs text-[var(--foreground-muted)] block mb-2">You Receive</label>
                                        <div className="flex items-center gap-3">
                                            <span className="flex-1 min-w-0 text-2xl font-bold text-[var(--foreground-muted)]">
                                                {swapAmount ? (parseFloat(swapAmount) * price).toFixed(2) : '0'}
                                            </span>
                                            <button
                                                onClick={() => setShowSwapToSelector(true)}
                                                className="flex items-center gap-1.5 px-2.5 py-1.5 bg-[var(--background)] rounded-full border border-[var(--border)] hover:border-[var(--primary)] transition-all"
                                            >
                                                <img src={tokens.find(t => t.symbol === swapToToken)?.logo || 'https://cryptologos.cc/logos/usd-coin-usdc-logo.png'} className="w-5 h-5 rounded-full" />
                                                <span className="text-sm font-medium">{swapToToken}</span>
                                                <ChevronDown className="w-3 h-3 text-[var(--foreground-muted)]" />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Action Button */}
                                    <button
                                        disabled={!swapAmount || parseFloat(swapAmount) <= 0}
                                        className="w-full py-3.5 rounded-xl bg-[var(--background-tertiary)] text-[var(--foreground-muted)] font-bold text-sm disabled:opacity-60 mt-4 hover:bg-[var(--primary)] hover:text-black disabled:hover:bg-[var(--background-tertiary)] disabled:hover:text-[var(--foreground-muted)] transition-colors"
                                    >
                                        {swapAmount && parseFloat(swapAmount) > 0 ? 'Swap' : 'Enter amount'}
                                    </button>
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
                                            className="w-full pl-10 pr-4 py-3 text-sm bg-[var(--background-tertiary)] border border-[var(--border)] rounded-xl outline-none focus:border-[var(--border-hover)]"
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

                            {/* TOKEN DETAIL TAB */}
                            {activeTab === 'tokenDetail' && selectedToken && (
                                <TokenDetailView
                                    token={selectedToken}
                                    onBack={() => {
                                        setActiveTab('home');
                                        setSelectedToken(null);
                                    }}
                                    onSend={() => setActiveTab('send')}
                                    onReceive={() => setActiveTab('receive')}
                                    onSwap={() => setActiveTab('swap')}
                                />
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
            )
            }
        </div >
    );
}
