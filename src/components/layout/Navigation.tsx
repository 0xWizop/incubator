'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
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
    Menu,
    X,
    ChevronDown,
    ExternalLink,
    Boxes,
} from 'lucide-react';
import { useAppStore } from '@/store';
import { WalletButton } from '@/components/wallet';

const navigation = [
    { name: 'Trade', href: '/app/trade/', icon: LineChart },
    { name: 'Screener', href: '/app/screener/', icon: Search },
    { name: 'Explorer', href: '/app/explorer/', icon: Compass },
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
                            src="https://i.imgur.com/OWwI16j.png"
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

                {/* Chain filter section */}
                <div className="absolute bottom-0 left-0 right-0 p-3 border-t border-[var(--border)]">
                    <p className="text-[10px] text-[var(--foreground-muted)] mb-2 uppercase tracking-widest">
                        Networks
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                        {(['solana', 'ethereum', 'base', 'arbitrum'] as const).map((chainId) => {
                            const isActive = selectedChains.includes(chainId);
                            // Lazy import or assume it's available. 
                            // Better: we should import CHAINS at top.
                            // Since this is a replacement block, we can't easily add import at top if we only replace this block.
                            // I will use `CHAINS` global if possible but I need to ensure it's imported.
                            // Wait, I should add the import first or do a multi replacement.
                            // For now, hardcode the logos here or assume CHAINS is available.
                            // Actually, I'll update the component to accept CHAINS or import it in a separate step if needed.
                            // Let's assume I can't add import in this block.

                            // Let's verify imports in Navigation.tsx first. It does NOT import CHAINS.
                            // I will use a separate step to add the import.
                            // Here I will modify the logic to use the logos.

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
            </aside >
        </>
    );
}

export function Header() {
    const { toggleSidebar, searchQuery, setSearchQuery } = useAppStore();

    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);
    const searchRef = useRef<HTMLDivElement>(null);
    const debounceRef = useRef<NodeJS.Timeout | null>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
                setShowDropdown(false);
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

    const chainLogos: Record<string, string> = {
        solana: 'https://i.imgur.com/xp7PYKk.png',
        ethereum: 'https://i.imgur.com/NKQlhQj.png',
        base: 'https://i.imgur.com/zn5hpMs.png',
        arbitrum: 'https://i.imgur.com/jmOXWlA.png',
    };

    return (
        <header className="h-14 bg-[var(--background-secondary)] border-b border-[var(--border)] flex items-center justify-between px-4 lg:px-6">
            {/* Left side */}
            <div className="flex items-center gap-4">
                <button
                    onClick={toggleSidebar}
                    className="lg:hidden p-2 hover:bg-[var(--background-tertiary)] rounded-lg"
                >
                    <Menu className="w-5 h-5" />
                </button>

                {/* Search bar with dropdown */}
                <div className="hidden md:flex items-center flex-1 max-w-2xl" ref={searchRef}>
                    <div className="relative w-full">
                        <input
                            type="text"
                            placeholder="Search any token by name, symbol, or address..."
                            className="input input-no-icon w-full bg-[var(--background-tertiary)] text-sm"
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
                {/* Wallet button */}
                <WalletButton />
            </div>
        </header>
    );
}

export function BottomTabNav() {
    const pathname = usePathname();

    // Only show main navigation items in bottom nav (not Docs, not external, not desktopOnly)
    const mobileNavItems = navigation.filter(item =>
        item.href !== '/docs' &&
        !item.external &&
        !item.desktopOnly
    ).slice(0, 5);

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-[60] lg:hidden bg-[var(--background-secondary)] border-t border-[var(--border)] safe-area-bottom">
            <div className="flex items-stretch justify-around h-16">
                {mobileNavItems.map((item) => {
                    const isActive = pathname === item.href ||
                        (item.href !== '/app' && pathname.startsWith(item.href));

                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            prefetch={true}
                            className={clsx(
                                'flex flex-col items-center justify-center flex-1 min-w-[64px] py-2 transition-colors',
                                isActive
                                    ? 'text-[var(--primary)]'
                                    : 'text-[var(--foreground-muted)]'
                            )}
                        >
                            <item.icon className={clsx(
                                'w-5 h-5 mb-1',
                                isActive && 'scale-110'
                            )} />
                            <span className="text-[10px] font-medium">{item.name}</span>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
