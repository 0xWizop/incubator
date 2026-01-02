'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
    BookOpen,
    Search,
    ChevronRight,
    Shield,
    Zap,
    Globe,
    Layers,
    Terminal,
    Trophy,
    ArrowLeft
} from 'lucide-react';
import { clsx } from 'clsx';

const docSections = [
    {
        id: 'getting-started',
        title: 'Getting Started',
        icon: Zap,
        content: `
## Getting Started with CypherX

CypherX is your unified gateway for trading across **Solana, Ethereum, Base, and Arbitrum**.

### Connected Wallets
We support major wallets for all integrated chains:
- **EVM (ETH, Base, Arb):** MetaMask, Coinbase Wallet, Rainbow, WalletConnect
- **Solana:** Phantom, Solflare

### Your First Trade
1. **Connect Wallet:** Click the "Connect" button in the top right.
2. **Select Chain:** Choose your target network from the sidebar.
3. **Find Token:** Use the Screener or Paste an address in the Trade URL.
4. **Swap:** Enter amount, approve transaction, and confirm.

### Platform Fees
- **Trading:** 0% platform fee (standard DEX fees apply)
- **Aggregator:** We route through 1inch/Jupiter for best execution
        `,
    },
    {
        id: 'trading',
        title: 'Trading Terminal',
        icon: Terminal,
        content: `
## Trading Terminal

Our professional-grade terminal includes:

### Charts
Real-time TradingView charts with:
- Multiple timeframes (1M to 1D)
- Volume indicators
- Price change tracking

### Token Info
Instant view of vital metrics:
- Market Cap & FDV
- Liquidity depth
- 24h Volume
- Pair age & creation time

### Execution
- **Slippage:** Auto-adjusted or manual setting
- **Price Impact:** Warning for high impact trades
- **Route:** Visual display of token routing
        `,
    },
    {
        id: 'screener',
        title: 'Token Screener',
        icon: Globe,
        content: `
## Token Screener

Find the next 100x gem before anyone else.

- **Trending:** Top tokens by social & volume momentum
- **Gainers/Losers:** Top movers in last 24h
- **New Pairs:** Recently created pools
- **Filters:** Search by name, symbol, or address

Data is sourced real-time from **DexScreener** API.
        `,
    },
    {
        id: 'explorer',
        title: 'Multichain Explorer',
        icon: Layers,
        content: `
## Multichain Explorer

Track activity across 4 chains in one view.

- **Latest Blocks:** Live feed of produced blocks
- **Transactions:** Real-time stream of network activity
- **Search:** Universal search for tx hashes, blocks, or addresses

Supported Networks:
| Chain | Type | Speed |
|-------|------|-------|
| Solana | L1 | ~400ms |
| Ethereum | L1 | ~12s |
| Base | L2 | ~2s |
| Arbitrum | L2 | ~0.25s |
        `,
    },
    {
        id: 'rewards',
        title: 'Rewards & Referrals',
        icon: Trophy,
        content: `
## Rewards Program

Earn while you trade.

### Trading Rewards
Earn points for every dollar of volume.
- **Bronze:** $0 - $10k vol
- **Silver:** $10k - $100k vol
- **Gold:** $100k+ vol

### Referral System
Invite friends and earn **0.5%** of their platform usage value (if fees enabled). 
Currently, tracking volume for future airdrop points.
        `,
    },
    {
        id: 'security',
        title: 'Security',
        icon: Shield,
        content: `
## Security First

- **Non-Custodial:** We never touch your funds.
- **Audited Routers:** We define routing only to established contracts.
- **Open Source:** Core components are verifiable.

### Best Practices
- Verify URLs (cypherx.trade)
- Check token contract addresses
- Never share your private key
        `,
    },
];

export default function DocsPage() {
    const [activeSection, setActiveSection] = useState('getting-started');
    const [searchQuery, setSearchQuery] = useState('');

    const filteredSections = docSections.filter(
        (section) =>
            section.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            section.content.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const currentSection = docSections.find((s) => s.id === activeSection);

    return (
        <div className="flex h-full">
            {/* Left sidebar - Navigation */}
            <aside className="w-64 border-r border-[var(--border)] bg-[var(--background-secondary)] p-4 overflow-auto hidden lg:block">
                <div className="mb-6">
                    <Link href="/app/trade" className="flex items-center gap-2 text-sm text-[var(--foreground-muted)] hover:text-[var(--primary)] mb-4 transition-colors">
                        <ArrowLeft className="w-4 h-4" />
                        Back to App
                    </Link>
                    <h2 className="font-bold text-lg flex items-center gap-2">
                        <BookOpen className="w-5 h-5 text-[var(--primary)]" />
                        Documentation
                    </h2>
                </div>

                <div className="relative mb-4">
                    <input
                        type="text"
                        placeholder="Search docs..."
                        className="input input-no-icon text-sm"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                <nav className="space-y-1">
                    {filteredSections.map((section) => (
                        <button
                            key={section.id}
                            onClick={() => setActiveSection(section.id)}
                            className={clsx(
                                'w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left text-sm transition-all',
                                activeSection === section.id
                                    ? 'bg-[var(--primary)]/10 text-[var(--primary)] border border-[var(--primary)]/30'
                                    : 'text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:bg-[var(--background-tertiary)]'
                            )}
                        >
                            <section.icon className="w-4 h-4" />
                            {section.title}
                            {activeSection === section.id && (
                                <ChevronRight className="w-4 h-4 ml-auto" />
                            )}
                        </button>
                    ))}
                </nav>
            </aside>

            {/* Main content */}
            <main className="flex-1 overflow-auto p-6 lg:p-8">
                <div className="lg:hidden mb-6">
                    <select
                        value={activeSection}
                        onChange={(e) => setActiveSection(e.target.value)}
                        className="input"
                    >
                        {docSections.map((section) => (
                            <option key={section.id} value={section.id}>
                                {section.title}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="max-w-3xl">
                    {currentSection && (
                        <article className="prose prose-invert max-w-none">
                            <div
                                dangerouslySetInnerHTML={{ __html: formatMarkdown(currentSection.content) }}
                            />
                        </article>
                    )}
                </div>
            </main>
        </div>
    );
}

function formatMarkdown(content: string): string {
    return content
        .replace(/^### (.*$)/gim, '<h3 class="text-lg font-bold mt-6 mb-3 text-[var(--foreground)]">$1</h3>')
        .replace(/^## (.*$)/gim, '<h2 class="text-2xl font-bold mt-8 mb-4 text-[var(--foreground)] pb-2 border-b border-[var(--border)]">$1</h2>')
        .replace(/^\*\* (.*) \*\*/gim, '<strong>$1</strong>')
        .replace(/^\- (.*$)/gim, '<li class="ml-4 text-[var(--foreground-muted)] list-disc pl-2 mb-1">$1</li>')
        .replace(/^\d+\. (.*$)/gim, '<li class="ml-4 text-[var(--foreground-muted)] list-decimal pl-2 mb-1">$1</li>')
        .replace(/\n\n/g, '<p class="mb-4 text-[var(--foreground-muted)] leading-relaxed"></p>')
        .replace(/\|(.+)\|$/gim, (match) => {
            // Basic table parsing
            const cells = match.split('|').filter(Boolean).map(c => c.trim());
            if (cells.every(c => c.match(/^-+$/))) return '';
            const isHeader = !match.includes('---'); // Simplistic check, relying on previous line context usually or structure
            // Actually regex approach for table is flaky without full parser, better to keep simple.
            // Using simple replacement for now, assumes headers are first in block
            return `<div class="grid grid-cols-${cells.length} gap-4 py-2 border-b border-[var(--border)]">${cells.map(c => `<span>${c}</span>`).join('')}</div>`;
        });
}
