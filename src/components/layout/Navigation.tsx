'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import ReactDOM from 'react-dom';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { clsx } from 'clsx';
import {
    LayoutDashboard,
    LineChart,
    Search,
    Compass,
    Gift,
    BookOpen,
    X,
    ChevronDown,
    ExternalLink,
    Boxes,
    User,
    LogOut,
    Settings,
    Mail,
    Star,
    Newspaper,
    Eye,
} from 'lucide-react';
import { useAppStore, useWatchlistStore } from '@/store';
import { WalletButton } from '@/components/wallet';
import { useAuth } from '@/context/AuthContext';
import { AuthModal } from '@/components/auth';
import { WatchlistPanel } from '@/components/watchlist';
import { NewsFeed } from '@/components/news';
import { TrackerPanel } from '@/components/tracker';

const navigation = [
    { name: 'Trade', href: '/app/trade/', icon: LineChart },
    { name: 'Screener', href: '/app/screener/', icon: Search },
    { name: 'Explorer', href: '/app/explorer/', icon: Compass },
    { name: 'News', href: '/app/news/', icon: Newspaper },
    { name: 'Wallet Tracker', href: '/app/tracker/', icon: Eye },
    { name: 'Dashboard', href: '/app/dashboard/', icon: LayoutDashboard },
    { name: 'Rewards', href: '/app/rewards/', icon: Gift },
    { name: 'dApps', href: 'https://dappincubator.xyz', icon: Boxes, external: true, desktopOnly: true },
    { name: 'Docs', href: '/docs/', icon: BookOpen },
];

export function Sidebar() {
    const pathname = usePathname();
    const { sidebarOpen, toggleSidebar, selectedChains, toggleChain } = useAppStore();

    const chainColors: Record<string, string> = {
        solana: '#9945ff',
        ethereum: '#627eea',
        base: '#0052ff',
        arbitrum: '#2D374B',
    };

    return (
        <>
            {/* Mobile overlay - Only show on desktop if somehow triggered, or remove entirely for mobile */}
            <div
                className={clsx(
                    "fixed inset-0 bg-black/60 z-40 backdrop-blur-sm transition-opacity",
                    sidebarOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none",
                    "lg:hidden" // Ensure hidden on desktop default, but we want to HIDE this on mobile now too if we are disabling sidebar
                )}
                onClick={toggleSidebar}
                style={{ display: 'none' }} // Force hidden on mobile as requested
            />

            {/* Sidebar - Hidden on mobile, visible on desktop */}
            <aside
                className={clsx(
                    'hidden lg:flex flex-col fixed left-0 top-0 h-full z-50',
                    'w-64 bg-[var(--background-secondary)] border-r border-[var(--border)]',
                )}
            >
                {/* Logo */}
                <div className="h-14 flex items-center justify-between px-4 border-b border-[var(--border)]">
                    <Link href="/" className="flex items-center gap-2.5">
                        <img
                            src="https://i.imgur.com/8UIQt03.png"
                            alt="Incubator Protocol"
                            className="w-8 h-8 rounded-lg"
                        />
                        <span className="text-sm font-black tracking-wide text-[var(--primary)] uppercase">
                            INCUBATOR PROTOCOL
                        </span>
                    </Link>
                    <button
                        onClick={toggleSidebar}
                        className="lg:hidden p-2 hover:bg-[var(--background-tertiary)] rounded-lg"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Navigation */}
                <nav className="p-3 space-y-0.5">
                    {navigation.map((item) => {
                        const isExternal = (item as any).external;
                        const isActive = !isExternal && (pathname === item.href ||
                            (item.href !== '/app' && pathname.startsWith(item.href)));

                        if (isExternal) {
                            return (
                                <a
                                    key={item.name}
                                    href={item.href}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2.5 px-3 py-3 rounded-lg text-[13px] transition-all duration-200 min-h-[44px] text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:bg-[var(--background-tertiary)]"
                                >
                                    <item.icon className="w-5 h-5" />
                                    <span>{item.name}</span>
                                    <ExternalLink className="w-3 h-3 ml-auto opacity-50" />
                                </a>
                            );
                        }

                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                className={clsx(
                                    'flex items-center gap-2.5 px-3 py-3 rounded-lg text-[13px] transition-all duration-200 min-h-[44px]',
                                    isActive
                                        ? 'bg-[var(--primary)]/10 text-[var(--primary)]'
                                        : 'text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:bg-[var(--background-tertiary)]'
                                )}
                            >
                                <item.icon className="w-5 h-5" />
                                <span>{item.name}</span>
                            </Link>
                        );
                    })}
                </nav>

                {/* Bottom Section: Socials + Networks */}
                <div className="mt-auto">
                    {/* Socials */}
                    <div className="px-4 pb-4 flex items-center justify-start gap-4">
                        <a
                            href="https://x.com/theincubatorxyz"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors hover:scale-110 transform duration-200"
                        >
                            {/* X (Twitter) Logo */}
                            <svg viewBox="0 0 24 24" aria-hidden="true" className="w-4 h-4 fill-current">
                                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                            </svg>
                        </a>
                        <a
                            href="https://discord.gg/366nqwwz"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[var(--foreground-muted)] hover:text-[#5865F2] transition-colors hover:scale-110 transform duration-200"
                        >
                            {/* Discord Logo */}
                            <svg viewBox="0 0 127.14 96.36" aria-hidden="true" className="w-4 h-4 fill-current">
                                <path d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.11,77.11,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a68.68,68.68,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1A105.25,105.25,0,0,0,126.6,80.22c.12-9.23-1.69-19-4.35-27.66C119.95,41.66,115.36,23.33,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53s5-12.74,11.43-12.74S54,46,53.89,53,48.84,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.25,60,73.25,53s5.06-12.74,11.37-12.74S96.15,46,96.06,53,91,65.69,84.69,65.69Z" />
                            </svg>
                        </a>
                        <a
                            href="mailto:incubatorprotocol@gmail.com"
                            className="text-[var(--foreground-muted)] hover:text-[var(--primary)] transition-colors hover:scale-110 transform duration-200"
                        >
                            <Mail className="w-4 h-4" />
                        </a>
                    </div>

                    {/* Chain filter section */}
                    <div className="p-3 border-t border-[var(--border)]">
                        <p className="text-[10px] text-[var(--foreground-muted)] mb-2 uppercase tracking-widest">
                            Networks
                        </p>
                        <div className="grid grid-cols-2 gap-2">
                            {(['solana', 'ethereum', 'base', 'arbitrum'] as const).map((chainId) => {
                                const isActive = selectedChains.includes(chainId);
                                const logos: Record<string, string> = {
                                    solana: 'https://i.imgur.com/xp7PYKk.png',
                                    ethereum: 'https://i.imgur.com/NKQlhQj.png',
                                    base: 'https://i.imgur.com/zn5hpMs.png',
                                    arbitrum: 'https://i.imgur.com/jmOXWlA.png',
                                };

                                return (
                                    <button
                                        key={chainId}
                                        onClick={() => toggleChain(chainId)}
                                        className={clsx(
                                            'flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[11px] transition-all group',
                                            isActive
                                                ? 'opacity-100 bg-[var(--background-tertiary)] border border-[var(--border)]'
                                                : 'opacity-40 hover:opacity-100 hover:bg-[var(--background-tertiary)]/50'
                                        )}
                                    >
                                        <div className="relative w-4 h-4 rounded-full overflow-hidden flex-shrink-0">
                                            <img
                                                src={logos[chainId]}
                                                alt={chainId}
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                        <span className="capitalize text-[var(--foreground-muted)]">{chainId}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </aside >
        </>
    );
}

export function Header() {
    const { toggleSidebar, searchQuery, setSearchQuery } = useAppStore();
    const { firebaseUser, loading: authLoading, signOut } = useAuth();
    const { watchlists, isPanelOpen, openPanel, closePanel, initialize, isInitialized } = useWatchlistStore();

    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);
    const [showAuthModal, setShowAuthModal] = useState(false);
    const [showUserMenu, setShowUserMenu] = useState(false);
    const [showMobileSearch, setShowMobileSearch] = useState(false);
    const [showNewsPanel, setShowNewsPanel] = useState(false);
    const [showTrackerPanel, setShowTrackerPanel] = useState(false);
    const searchRef = useRef<HTMLDivElement>(null);
    const userMenuRef = useRef<HTMLDivElement>(null);
    const watchlistRef = useRef<HTMLDivElement>(null);
    const debounceRef = useRef<NodeJS.Timeout | null>(null);

    // Initialize watchlist store when user is authenticated
    // Initialize watchlist store
    useEffect(() => {
        if (!authLoading && !isInitialized) {
            initialize(firebaseUser?.uid);
        }
    }, [authLoading, firebaseUser?.uid, isInitialized, initialize]);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
                setShowDropdown(false);
            }
            if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
                setShowUserMenu(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Debounced search
    const handleSearch = useCallback(async (query: string) => {
        setSearchQuery(query);

        if (query.length < 2) {
            setSearchResults([]);
            setShowDropdown(false);
            return;
        }

        // Debounce
        if (debounceRef.current) clearTimeout(debounceRef.current);

        debounceRef.current = setTimeout(async () => {
            setIsSearching(true);
            try {
                const { searchPairs } = await import('@/lib/services/dexscreener');
                const results = await searchPairs(query);
                setSearchResults(results.slice(0, 8)); // Limit to 8 results
                setShowDropdown(true);
            } catch (error) {
                console.error('Search error:', error);
            } finally {
                setIsSearching(false);
            }
        }, 300);
    }, [setSearchQuery]);

    const handleResultClick = (pair: any) => {
        setShowDropdown(false);
        setSearchQuery('');
        // Navigate to trade page with chain and pair address
        window.location.href = `/app/trade?chain=${pair.chainId}&pair=${pair.pairAddress}`;
    };

    const handleSignOut = async () => {
        await signOut();
        setShowUserMenu(false);
    };

    const chainLogos: Record<string, string> = {
        solana: 'https://i.imgur.com/xp7PYKk.png',
        ethereum: 'https://i.imgur.com/NKQlhQj.png',
        base: 'https://i.imgur.com/zn5hpMs.png',
        arbitrum: 'https://i.imgur.com/jmOXWlA.png',
    };

    return (
        <>
            <header className="h-12 lg:h-14 bg-[var(--background-secondary)] border-b border-[var(--border)] flex items-center justify-between px-3 lg:px-6">
                {/* Left side */}
                <div className="flex items-center gap-4">
                    {/* Mobile search icon */}
                    <button
                        onClick={() => setShowMobileSearch(true)}
                        className="md:hidden p-2 rounded-lg hover:bg-[var(--background-tertiary)] transition-colors"
                        aria-label="Search"
                    >
                        <Search className="w-5 h-5 text-[var(--foreground-muted)]" />
                    </button>

                    {/* Search bar with dropdown */}
                    <div className="hidden md:flex items-center flex-1 max-w-2xl" ref={searchRef}>
                        <div className="relative w-full">
                            <input
                                type="text"
                                placeholder="Search any token by name, symbol, or address..."
                                className="input input-no-icon w-full bg-[var(--background-tertiary)] text-sm focus:!outline-none focus:!border-transparent focus:!ring-0 focus:!shadow-none placeholder:text-[var(--foreground-muted)]"
                                value={searchQuery}
                                onChange={(e) => handleSearch(e.target.value)}
                                onFocus={() => searchResults.length > 0 && setShowDropdown(true)}
                            />
                            {isSearching && (
                                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                    <div className="w-4 h-4 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin" />
                                </div>
                            )}

                            {/* Search Results Dropdown */}
                            {showDropdown && searchResults.length > 0 && (
                                <div className="absolute top-full left-0 right-0 mt-2 bg-[var(--background-secondary)] border border-[var(--border)] rounded-lg shadow-xl z-50 max-h-96 overflow-y-auto">
                                    {searchResults.map((pair, i) => (
                                        <button
                                            key={`${pair.chainId}-${pair.pairAddress}-${i}`}
                                            onClick={() => handleResultClick(pair)}
                                            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[var(--background-tertiary)] transition-colors text-left border-b border-[var(--border)] last:border-b-0"
                                        >
                                            {/* Token Logo */}
                                            <div className="w-8 h-8 rounded-full bg-[var(--background-tertiary)] flex items-center justify-center overflow-hidden flex-shrink-0">
                                                {pair.baseToken?.logo || pair.logo ? (
                                                    <img src={pair.baseToken?.logo || pair.logo} alt="" className="w-full h-full object-cover" />
                                                ) : (
                                                    <span className="text-xs font-bold">{pair.baseToken?.symbol?.slice(0, 2)}</span>
                                                )}
                                            </div>

                                            {/* Token Info */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-medium text-sm">{pair.baseToken?.symbol}</span>
                                                    <span className="text-xs text-[var(--foreground-muted)] truncate">{pair.baseToken?.name}</span>
                                                </div>
                                                <div className="flex items-center gap-2 text-xs text-[var(--foreground-muted)]">
                                                    <span className="font-mono">${pair.priceUsd?.toFixed(6)}</span>
                                                    <span className={pair.priceChange?.h24 >= 0 ? 'text-[var(--accent-green)]' : 'text-[var(--accent-red)]'}>
                                                        {pair.priceChange?.h24 >= 0 ? '+' : ''}{pair.priceChange?.h24?.toFixed(2)}%
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Chain Logo */}
                                            <div className="w-5 h-5 rounded-full overflow-hidden flex-shrink-0">
                                                <img src={chainLogos[pair.chainId] || chainLogos.ethereum} alt={pair.chainId} className="w-full h-full object-cover" />
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right side */}
                <div className="flex items-center gap-3">
                    {/* News button */}
                    <button
                        onClick={() => setShowNewsPanel(!showNewsPanel)}
                        className={clsx(
                            'p-2 rounded-lg transition-all',
                            showNewsPanel
                                ? 'bg-[var(--primary)]/20 text-[var(--primary)] shadow-[0_0_15px_var(--primary-glow)]'
                                : 'text-[var(--foreground-muted)] hover:bg-[var(--background-tertiary)] hover:text-[var(--foreground)]'
                        )}
                        title="News Feed"
                    >
                        <Newspaper className="w-5 h-5" />
                    </button>

                    {/* Tracker button */}
                    <button
                        onClick={() => setShowTrackerPanel(!showTrackerPanel)}
                        className={clsx(
                            'p-2 rounded-lg transition-all',
                            showTrackerPanel
                                ? 'bg-[var(--primary)]/20 text-[var(--primary)] shadow-[0_0_15px_var(--primary-glow)]'
                                : 'text-[var(--foreground-muted)] hover:bg-[var(--background-tertiary)] hover:text-[var(--foreground)]'
                        )}
                        title="Wallet Tracker"
                    >
                        <Eye className="w-5 h-5" />
                    </button>

                    {/* Watchlist star button */}
                    <div className="relative" ref={watchlistRef}>
                        <button
                            onClick={() => isPanelOpen ? closePanel() : openPanel()}
                            className={clsx(
                                'p-2 rounded-lg transition-all text-[var(--primary)]',
                                isPanelOpen
                                    ? 'bg-[var(--primary)]/20 shadow-[0_0_15px_var(--primary-glow)]'
                                    : 'hover:bg-[var(--background-tertiary)]'
                            )}
                            title="Watchlist"
                        >
                            <Star className="w-5 h-5" fill={isPanelOpen ? 'currentColor' : 'none'} />
                            {watchlists.find(w => w.id === 'favorites')?.tokens.length ? (
                                <span className="absolute -top-1 -right-1 w-4 h-4 bg-[var(--primary)] text-black text-[10px] font-bold rounded-full flex items-center justify-center">
                                    {watchlists.find(w => w.id === 'favorites')?.tokens.length}
                                </span>
                            ) : null}
                        </button>
                        <WatchlistPanel isOpen={isPanelOpen} onClose={closePanel} />
                    </div>

                    {/* Wallet button */}
                    <WalletButton />

                    {/* Auth button / User menu */}
                    {authLoading ? (
                        <div className="w-8 h-8 rounded-full bg-[var(--background-tertiary)] animate-pulse" />
                    ) : firebaseUser ? (
                        <div className="relative" ref={userMenuRef}>
                            <button
                                onClick={() => setShowUserMenu(!showUserMenu)}
                                className="flex items-center gap-2 px-2 py-1 lg:px-3 lg:py-1.5 rounded-lg bg-[var(--background-tertiary)] hover:bg-[var(--background)] border border-[var(--border)] transition-colors"
                            >
                                {firebaseUser.photoURL ? (
                                    <img src={firebaseUser.photoURL} alt="" className="w-6 h-6 rounded-full" />
                                ) : (
                                    <div className="w-6 h-6 rounded-full bg-[var(--primary)]/20 flex items-center justify-center">
                                        <User className="w-3.5 h-3.5 text-[var(--primary)]" />
                                    </div>
                                )}
                                <span className="text-sm font-medium hidden sm:block max-w-[100px] truncate">
                                    {firebaseUser.displayName || firebaseUser.email?.split('@')[0]}
                                </span>
                                <ChevronDown className="w-4 h-4 text-[var(--foreground-muted)]" />
                            </button>

                            {/* User dropdown menu */}
                            {showUserMenu && (
                                <div className="absolute right-0 top-full mt-2 w-48 bg-[var(--background-secondary)] border border-[var(--border)] rounded-lg shadow-xl z-50 overflow-hidden">
                                    <div className="p-3 border-b border-[var(--border)]">
                                        <p className="text-sm font-medium truncate">{firebaseUser.displayName || 'User'}</p>
                                        <p className="text-xs text-[var(--foreground-muted)] truncate">{firebaseUser.email}</p>
                                    </div>
                                    <div className="p-1">
                                        <Link
                                            href="/app/settings/"
                                            onClick={() => setShowUserMenu(false)}
                                            className="flex items-center gap-2 px-3 py-2 rounded-md text-sm hover:bg-[var(--background-tertiary)] transition-colors"
                                        >
                                            <Settings className="w-4 h-4" />
                                            Settings
                                        </Link>
                                        <button
                                            onClick={handleSignOut}
                                            className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm text-[var(--accent-red)] hover:bg-[var(--accent-red)]/10 transition-colors"
                                        >
                                            <LogOut className="w-4 h-4" />
                                            Sign Out
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <button
                            onClick={() => setShowAuthModal(true)}
                            className="flex items-center gap-2 px-3 py-1.5 lg:px-4 lg:py-2 rounded-xl bg-[var(--primary)] text-black font-medium text-xs lg:text-sm hover:opacity-90 transition-all shadow-[0_0_15px_var(--primary-glow)]"
                        >
                            <User className="w-4 h-4" />
                            <span className="hidden sm:block">Sign In</span>
                        </button>
                    )}
                </div>
            </header>

            {/* Auth Modal */}
            <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />

            {/* News Sidebar Panel */}
            {showNewsPanel && (
                <>
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 bg-black/60 z-40 backdrop-blur-sm"
                        onClick={() => setShowNewsPanel(false)}
                    />

                    {/* Sidebar */}
                    <div className="fixed right-0 top-0 h-full w-full sm:w-96 bg-[var(--background-secondary)] border-l border-[var(--border)] z-50 shadow-2xl">
                        <div className="flex items-center justify-between p-3 border-b border-[var(--border)]">
                            <h2 className="font-bold text-sm flex items-center gap-2">
                                <Newspaper className="w-4 h-4 text-[var(--primary)]" />
                                Crypto News
                            </h2>
                            <button
                                onClick={() => setShowNewsPanel(false)}
                                className="p-1.5 rounded-lg hover:bg-[var(--background-tertiary)] transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                        <div className="h-[calc(100%-3.5rem)]">
                            <NewsFeed />
                        </div>
                    </div>
                </>
            )}

            {/* Tracker Sidebar Panel */}
            {showTrackerPanel && (
                <>
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 bg-black/60 z-40 backdrop-blur-sm"
                        onClick={() => setShowTrackerPanel(false)}
                    />

                    {/* Sidebar */}
                    <div className="fixed right-0 top-0 h-full w-full sm:w-96 bg-[var(--background-secondary)] border-l border-[var(--border)] z-50 shadow-2xl">
                        <div className="flex items-center justify-between p-3 border-b border-[var(--border)]">
                            <h2 className="font-bold text-sm flex items-center gap-2">
                                <Eye className="w-4 h-4 text-[var(--primary)]" />
                                Wallet Tracker
                            </h2>
                            <button
                                onClick={() => setShowTrackerPanel(false)}
                                className="p-1.5 rounded-lg hover:bg-[var(--background-tertiary)] transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                        <div className="h-[calc(100%-3.5rem)]">
                            <TrackerPanel />
                        </div>
                    </div>
                </>
            )}

            {/* Mobile Full-Page Search Overlay */}
            {showMobileSearch && (
                <div className="fixed inset-0 z-[100] bg-[var(--background)] flex flex-col md:hidden">
                    {/* Header with search input and close button */}
                    <div className="flex items-center gap-3 p-3 border-b border-[var(--border)]">
                        <button
                            onClick={() => {
                                setShowMobileSearch(false);
                                setSearchQuery('');
                                setSearchResults([]);
                            }}
                            className="p-2 rounded-lg hover:bg-[var(--background-tertiary)] transition-colors"
                            aria-label="Close search"
                        >
                            <X className="w-5 h-5" />
                        </button>
                        <div className="flex-1 relative">
                            <input
                                type="text"
                                placeholder="Search tokens..."
                                className="w-full px-4 py-3 bg-[var(--background-tertiary)] border border-[var(--border)] rounded-lg text-base focus:outline-none focus:border-[var(--border-hover)]"
                                value={searchQuery}
                                onChange={(e) => handleSearch(e.target.value)}
                                autoFocus
                            />
                            {isSearching && (
                                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                    <div className="w-4 h-4 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin" />
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Search results */}
                    <div className="flex-1 overflow-y-auto overscroll-contain" style={{ WebkitOverflowScrolling: 'touch' }}>
                        {searchResults.length > 0 ? (
                            <div className="divide-y divide-[var(--border)]">
                                {searchResults.map((pair, i) => (
                                    <button
                                        key={`mobile-${pair.chainId}-${pair.pairAddress}-${i}`}
                                        onClick={() => {
                                            setShowMobileSearch(false);
                                            setSearchQuery('');
                                            setSearchResults([]);
                                            window.location.href = `/app/trade?chain=${pair.chainId}&pair=${pair.pairAddress}`;
                                        }}
                                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[var(--background-tertiary)] transition-colors text-left"
                                    >
                                        {/* Token Logo */}
                                        <div className="w-10 h-10 rounded-full bg-[var(--background-tertiary)] flex items-center justify-center overflow-hidden flex-shrink-0">
                                            {pair.baseToken?.logo || pair.logo ? (
                                                <img src={pair.baseToken?.logo || pair.logo} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                <span className="text-sm font-bold">{pair.baseToken?.symbol?.slice(0, 2)}</span>
                                            )}
                                        </div>

                                        {/* Token Info */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <span className="font-medium">{pair.baseToken?.symbol}</span>
                                                <span className="text-sm text-[var(--foreground-muted)] truncate">{pair.baseToken?.name}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-sm text-[var(--foreground-muted)]">
                                                <span className="font-mono">${pair.priceUsd?.toFixed(6)}</span>
                                                <span className={pair.priceChange?.h24 >= 0 ? 'text-[var(--accent-green)]' : 'text-[var(--accent-red)]'}>
                                                    {pair.priceChange?.h24 >= 0 ? '+' : ''}{pair.priceChange?.h24?.toFixed(2)}%
                                                </span>
                                            </div>
                                        </div>

                                        {/* Chain Logo */}
                                        <div className="w-6 h-6 rounded-full overflow-hidden flex-shrink-0">
                                            <img src={chainLogos[pair.chainId] || chainLogos.ethereum} alt={pair.chainId} className="w-full h-full object-cover" />
                                        </div>
                                    </button>
                                ))}
                            </div>
                        ) : searchQuery.length >= 2 && !isSearching ? (
                            <div className="flex flex-col items-center justify-center p-8 text-[var(--foreground-muted)]">
                                <Search className="w-12 h-12 mb-3 opacity-30" />
                                <p>No results found</p>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center p-8 text-[var(--foreground-muted)]">
                                <Search className="w-12 h-12 mb-3 opacity-30" />
                                <p>Search by token name, symbol, or address</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </>
    );
}

export function BottomTabNav() {
    const pathname = usePathname();
    const router = useRouter();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Only show main navigation items in bottom nav (not Docs, not external, not desktopOnly)
    const mobileNavItems = navigation.filter(item =>
        item.href !== '/docs' &&
        !item.external &&
        !item.desktopOnly
    ).slice(0, 5);

    const navContent = (
        <nav
            className="fixed bottom-0 left-0 right-0 z-[9999] lg:hidden bg-[var(--background-secondary)] border-t border-[var(--border)]"
            style={{
                paddingBottom: 'env(safe-area-inset-bottom, 0px)',
                touchAction: 'manipulation',
                isolation: 'isolate'
            }}
        >
            <div className="flex items-stretch justify-around h-16">
                {mobileNavItems.map((item) => {
                    const isActive = pathname === item.href ||
                        (item.href !== '/app' && pathname.startsWith(item.href));

                    return (
                        <button
                            key={item.name}
                            type="button"
                            onClick={() => router.push(item.href)}
                            className={clsx(
                                'flex flex-col items-center justify-center flex-1 min-w-[64px] py-2 transition-colors active:opacity-70 cursor-pointer',
                                isActive
                                    ? 'text-[var(--primary)]'
                                    : 'text-[var(--foreground-muted)]'
                            )}
                            style={{ touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}
                        >
                            <item.icon className={clsx(
                                'w-5 h-5 mb-1 pointer-events-none',
                                isActive && 'scale-110'
                            )} />
                            <span className="text-[10px] font-medium pointer-events-none">{item.name}</span>
                        </button>
                    );
                })}
            </div>
        </nav>
    );

    // Use portal to render outside parent stacking contexts
    if (!mounted || typeof document === 'undefined') {
        return null;
    }

    return ReactDOM.createPortal(navContent, document.body);
}
