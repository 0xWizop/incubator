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
    ArrowLeft,
    Wallet,
    TrendingUp,
    ArrowRightLeft,
    Users,
    Settings,
    ExternalLink,
    Check,
    Info,
    AlertTriangle,
    Medal,
    Award,
    Gem,
    Crown,
} from 'lucide-react';
import { clsx } from 'clsx';

// ============================================
// DOCUMENTATION CONTENT STRUCTURE
// ============================================

interface DocSection {
    id: string;
    title: string;
    icon: any;
}

const docSections: DocSection[] = [
    { id: 'getting-started', title: 'Getting Started', icon: Zap },
    { id: 'wallet', title: 'Wallet', icon: Wallet },
    { id: 'trading', title: 'Trading', icon: Terminal },
    { id: 'screener', title: 'Token Screener', icon: TrendingUp },
    { id: 'explorer', title: 'Block Explorer', icon: Layers },
    { id: 'rewards', title: 'Rewards & Referrals', icon: Trophy },
    { id: 'chains', title: 'Supported Chains', icon: Globe },
    { id: 'security', title: 'Security', icon: Shield },
];

// ============================================
// CUSTOM DOCUMENTATION COMPONENTS
// ============================================

function SectionTitle({ children }: { children: React.ReactNode }) {
    return (
        <h1 className="text-2xl sm:text-3xl font-bold mb-6 pb-4 border-b border-[var(--border)]">
            {children}
        </h1>
    );
}

function SubSection({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div className="mb-8">
            <h2 className="text-lg font-semibold mb-4 text-[var(--foreground)] flex items-center gap-2">
                <div className="w-1.5 h-5 bg-[var(--primary)] rounded-full" />
                {title}
            </h2>
            <div className="text-[var(--foreground-muted)] leading-relaxed">
                {children}
            </div>
        </div>
    );
}

function Paragraph({ children }: { children: React.ReactNode }) {
    return <p className="mb-4 text-sm sm:text-base leading-relaxed">{children}</p>;
}

function FeatureList({ items }: { items: { title: string; description: string }[] }) {
    return (
        <div className="space-y-3 my-4">
            {items.map((item, i) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-[var(--background-tertiary)] border border-[var(--border)]">
                    <Check className="w-5 h-5 text-[var(--accent-green)] mt-0.5 shrink-0" />
                    <div>
                        <span className="font-medium text-[var(--foreground)]">{item.title}</span>
                        <span className="text-[var(--foreground-muted)]"> — {item.description}</span>
                    </div>
                </div>
            ))}
        </div>
    );
}

function StepList({ steps }: { steps: string[] }) {
    return (
        <div className="space-y-3 my-4">
            {steps.map((step, i) => (
                <div key={i} className="flex items-start gap-3">
                    <div className="w-7 h-7 rounded-full bg-[var(--primary)] flex items-center justify-center text-black text-sm font-bold shrink-0">
                        {i + 1}
                    </div>
                    <p className="pt-1 text-sm sm:text-base">{step}</p>
                </div>
            ))}
        </div>
    );
}

function InfoCard({ type, children }: { type: 'info' | 'warning'; children: React.ReactNode }) {
    const isWarning = type === 'warning';
    return (
        <div className={clsx(
            "flex items-start gap-3 p-4 rounded-xl border my-4",
            isWarning
                ? "bg-[var(--accent-yellow)]/10 border-[var(--accent-yellow)]/30"
                : "bg-[var(--primary)]/10 border-[var(--primary)]/30"
        )}>
            {isWarning
                ? <AlertTriangle className="w-5 h-5 text-[var(--accent-yellow)] shrink-0 mt-0.5" />
                : <Info className="w-5 h-5 text-[var(--primary)] shrink-0 mt-0.5" />
            }
            <div className="text-sm">{children}</div>
        </div>
    );
}

function ChainCard({ name, logo, type, speed }: { name: string; logo: string; type: string; speed: string }) {
    return (
        <div className="flex items-center gap-4 p-4 rounded-xl bg-[var(--background-tertiary)] border border-[var(--border)]">
            <img src={logo} alt={name} className="w-10 h-10 rounded-full" />
            <div className="flex-1">
                <p className="font-semibold">{name}</p>
                <p className="text-xs text-[var(--foreground-muted)]">{type}</p>
            </div>
            <div className="text-right">
                <p className="text-sm font-mono text-[var(--primary)]">{speed}</p>
                <p className="text-xs text-[var(--foreground-muted)]">block time</p>
            </div>
        </div>
    );
}

function TierCard({ name, Icon, minVolume, tradingRate, referralRate, color }: {
    name: string; Icon: any; minVolume: string; tradingRate: string; referralRate: string; color: string
}) {
    return (
        <div className="p-4 rounded-xl bg-[var(--background-tertiary)] border border-[var(--border)] text-center">
            <div className="w-10 h-10 mx-auto rounded-full flex items-center justify-center" style={{ backgroundColor: `${color}20` }}>
                <Icon className="w-5 h-5" style={{ color }} />
            </div>
            <p className="font-bold mt-2" style={{ color }}>{name}</p>
            <p className="text-xs text-[var(--foreground-muted)] mt-1">{minVolume}</p>
            <div className="mt-3 pt-3 border-t border-[var(--border)] grid grid-cols-2 gap-2 text-xs">
                <div>
                    <p className="text-[var(--foreground-muted)]">Trading</p>
                    <p className="font-bold text-[var(--primary)]">{tradingRate}%</p>
                </div>
                <div>
                    <p className="text-[var(--foreground-muted)]">Referral</p>
                    <p className="font-bold text-[var(--accent-purple)]">{referralRate}%</p>
                </div>
            </div>
        </div>
    );
}

// ============================================
// SECTION CONTENT RENDERERS
// ============================================

function GettingStartedContent() {
    return (
        <>
            <SectionTitle>Getting Started</SectionTitle>
            <Paragraph>
                Welcome to Incubator Protocol — your unified gateway for trading across multiple blockchains.
                Trade tokens on Solana, Ethereum, Base, and Arbitrum all from one interface.
            </Paragraph>

            <SubSection title="Quick Start">
                <StepList steps={[
                    "Click the wallet icon in the navigation to create or unlock your embedded wallet",
                    "Select your preferred chain from the sidebar (Solana, Ethereum, Base, or Arbitrum)",
                    "Use the Screener to discover trending tokens or paste a token address in the Trade page",
                    "Enter your swap amount, review the quote, and confirm your transaction"
                ]} />
            </SubSection>

            <SubSection title="Key Features">
                <FeatureList items={[
                    { title: "Multi-Chain Trading", description: "Swap tokens across 4 major networks from one dashboard" },
                    { title: "Embedded Wallet", description: "Built-in non-custodial wallet — no browser extension needed" },
                    { title: "Real-Time Data", description: "Live charts, prices, and on-chain data powered by DexScreener" },
                    { title: "Block Explorer", description: "Track transactions and blocks across all supported chains" },
                    { title: "Rewards Program", description: "Earn XP and unlock tiers based on your trading volume" }
                ]} />
            </SubSection>

            <SubSection title="Platform Fees">
                <Paragraph>
                    Incubator Protocol charges 0% platform fees on all trades. Standard DEX swap fees and network gas fees apply.
                    We route trades through aggregators like Jupiter (Solana) and 1inch (EVM) for optimal execution.
                </Paragraph>
            </SubSection>
        </>
    );
}

function WalletContent() {
    return (
        <>
            <SectionTitle>Wallet</SectionTitle>
            <Paragraph>
                Incubator Protocol includes a built-in embedded wallet that lets you trade without installing any browser extensions.
                Create separate wallets for EVM chains and Solana, all secured by a single password.
            </Paragraph>

            <SubSection title="Creating a Wallet">
                <StepList steps={[
                    "Click the wallet icon in the top navigation bar",
                    "Choose 'Create Wallet' and select the wallet type (EVM or Solana)",
                    "Set a secure password — this encrypts your private keys locally",
                    "Your wallet is now ready to use. Fund it by sending tokens to your address."
                ]} />
            </SubSection>

            <SubSection title="Wallet Features">
                <FeatureList items={[
                    { title: "Assets View", description: "See all your token holdings with USD values" },
                    { title: "Send & Receive", description: "Transfer tokens to any address on supported chains" },
                    { title: "Swap", description: "Quick access to swap tokens without leaving the wallet" },
                    { title: "Transaction History", description: "View all your past transactions" },
                    { title: "Multi-Wallet Support", description: "Create and switch between multiple wallets" }
                ]} />
            </SubSection>

            <InfoCard type="warning">
                Your private keys are encrypted and stored locally in your browser.
                Never share your password, and always back up your recovery phrase if prompted.
            </InfoCard>
        </>
    );
}

function TradingContent() {
    return (
        <>
            <SectionTitle>Trading Terminal</SectionTitle>
            <Paragraph>
                The trading terminal provides everything you need to analyze and execute token swaps
                across all supported chains.
            </Paragraph>

            <SubSection title="Chart & Analytics">
                <FeatureList items={[
                    { title: "TradingView Charts", description: "Professional candlestick charts with multiple timeframes" },
                    { title: "Token Info Panel", description: "Market cap, FDV, liquidity, 24h volume, and pair age" },
                    { title: "Price Tracking", description: "Real-time price updates with percentage changes" },
                    { title: "Recent Trades", description: "Live feed of recent swaps for the current pair" }
                ]} />
            </SubSection>

            <SectionTitle>Lightspeed Integration</SectionTitle>
            <Paragraph>
                Incubator Protocol exclusively uses <strong>Lightspeed</strong> for all token swaps.
                Lightspeed provides high-performance cross-chain capabilities, allowing you to swap assets seamlessly between networks.
            </Paragraph>

            <SubSection title="Why Lightspeed?">
                <FeatureList items={[
                    { title: "Cross-Chain Swaps", description: "Swap native tokens between Solana, Ethereum, Base, and Arbitrum" },
                    { title: "Best Rates", description: "Aggregates liquidity to ensure minimal slippage" },
                    { title: "Fast Execution", description: "Optimized routing for rapid transaction confirmation" },
                    { title: "Secure", description: "Non-custodial architecture keeps your assets safe" }
                ]} />
            </SubSection>

            <SubSection title="How it Works">
                <StepList steps={[
                    "We request a quote via the Lightspeed API for your desired swap",
                    "You approve the transaction in your wallet",
                    "Lightspeed executes the swap and delivers the tokens to your destination chart/wallet"
                ]} />
            </SubSection>

            <div className="mt-6">
                <a
                    href="https://lightspeed-9288f.web.app/docs"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--primary)] text-black font-bold hover:opacity-90 transition-opacity"
                >
                    View Official Lightspeed Docs
                    <ExternalLink className="w-4 h-4" />
                </a>
            </div>
        </>
    );
}

function ScreenerContent() {
    return (
        <>
            <SectionTitle>Token Screener</SectionTitle>
            <Paragraph>
                Discover trending tokens, track gainers, and find new trading opportunities
                across all supported chains with our real-time token screener.
            </Paragraph>

            <SubSection title="Screener Tabs">
                <FeatureList items={[
                    { title: "Trending", description: "Top tokens ranked by social momentum and trading volume" },
                    { title: "Top Pairs", description: "Highest volume trading pairs across all chains" },
                    { title: "Search", description: "Find any token by name, symbol, or contract address" }
                ]} />
            </SubSection>

            <SubSection title="Chain Filters">
                <Paragraph>
                    Filter tokens by chain to focus on specific networks. Click any chain button
                    (Solana, Ethereum, Base, Arbitrum) to show only tokens from that network,
                    or select "All Chains" to see everything.
                </Paragraph>
            </SubSection>

            <SubSection title="Token Data">
                <Paragraph>
                    Each token in the screener displays key metrics including price, 24h change,
                    market cap, liquidity depth, and trading volume. Click any row to open
                    the full trading terminal for that token.
                </Paragraph>
            </SubSection>

            <InfoCard type="info">
                Data is sourced in real-time from DexScreener API. The screener fetches approximately
                350 tokens across all chains, with customizable limits per chain.
            </InfoCard>
        </>
    );
}

function ExplorerContent() {
    return (
        <>
            <SectionTitle>Block Explorer</SectionTitle>
            <Paragraph>
                Track blocks, transactions, and on-chain activity across all supported networks
                with our unified multichain explorer.
            </Paragraph>

            <SubSection title="Explorer Features">
                <FeatureList items={[
                    { title: "Latest Blocks", description: "Real-time feed of newly produced blocks on each chain" },
                    { title: "Transaction Stream", description: "Live view of recent transactions with value and addresses" },
                    { title: "Universal Search", description: "Search by transaction hash, block number, or wallet address" },
                    { title: "Chain-Specific Pages", description: "Dedicated explorer pages for each network with pagination" }
                ]} />
            </SubSection>

            <SubSection title="Chain Overview Cards">
                <Paragraph>
                    The main explorer displays overview cards for each selected chain showing
                    the latest block number. Click any card to open the dedicated chain explorer
                    with full block history and transaction details.
                </Paragraph>
            </SubSection>
        </>
    );
}

function RewardsContent() {
    return (
        <>
            <SectionTitle>Rewards & Referrals</SectionTitle>
            <Paragraph>
                Earn rewards for your trading activity and referrals. Progress through tiers
                to unlock higher reward rates and build your XP.
            </Paragraph>

            <SubSection title="Tier System">
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 my-4">
                    <TierCard name="Bronze" Icon={Medal} minVolume="$0+" tradingRate="0.1" referralRate="0.5" color="#CD7F32" />
                    <TierCard name="Silver" Icon={Medal} minVolume="$10K+" tradingRate="0.15" referralRate="0.75" color="#C0C0C0" />
                    <TierCard name="Gold" Icon={Award} minVolume="$50K+" tradingRate="0.2" referralRate="1.0" color="#FFD700" />
                    <TierCard name="Platinum" Icon={Gem} minVolume="$250K+" tradingRate="0.25" referralRate="1.25" color="#E5E4E2" />
                    <TierCard name="Diamond" Icon={Crown} minVolume="$1M+" tradingRate="0.3" referralRate="1.5" color="#B9F2FF" />
                </div>
            </SubSection>

            <SubSection title="Referral Program">
                <Paragraph>
                    Create a unique referral code and share it with friends. When they trade,
                    you earn a percentage of their trading volume as rewards. Your earnings
                    accumulate in your claimable balance.
                </Paragraph>
                <StepList steps={[
                    "Go to the Rewards page and create your custom referral code",
                    "Share your link with friends",
                    "Earn up to 1.5% of your referrals' trading volume (based on your tier)",
                    "Claim your accumulated rewards anytime from the Rewards page"
                ]} />
            </SubSection>

            <SubSection title="XP System">
                <Paragraph>
                    Earn XP based on your trading volume and referral activity. XP is displayed
                    on the leaderboard and contributes to your overall ranking in the community.
                </Paragraph>
            </SubSection>
        </>
    );
}

function ChainsContent() {
    return (
        <>
            <SectionTitle>Supported Chains</SectionTitle>
            <Paragraph>
                Incubator Protocol supports trading on four major blockchain networks, each with
                unique characteristics optimized for different use cases.
            </Paragraph>

            <div className="space-y-3 my-6">
                <ChainCard
                    name="Solana"
                    logo="https://i.imgur.com/xp7PYKk.png"
                    type="Layer 1 — High Performance"
                    speed="~400ms"
                />
                <ChainCard
                    name="Ethereum"
                    logo="https://i.imgur.com/NKQlhQj.png"
                    type="Layer 1 — Most Liquidity"
                    speed="~12s"
                />
                <ChainCard
                    name="Base"
                    logo="https://i.imgur.com/zn5hpMs.png"
                    type="Layer 2 — Coinbase L2"
                    speed="~2s"
                />
                <ChainCard
                    name="Arbitrum"
                    logo="https://i.imgur.com/jmOXWlA.png"
                    type="Layer 2 — Optimistic Rollup"
                    speed="~250ms"
                />
            </div>

            <SubSection title="Switching Chains">
                <Paragraph>
                    Use the chain selector in the sidebar to switch between networks.
                    Your wallet balances and available tokens will update automatically
                    to reflect the selected chain.
                </Paragraph>
            </SubSection>
        </>
    );
}

function SecurityContent() {
    return (
        <>
            <SectionTitle>Security</SectionTitle>
            <Paragraph>
                Security is our top priority. Incubator Protocol is designed to be non-custodial,
                meaning you always retain full control of your assets.
            </Paragraph>

            <SubSection title="Security Features">
                <FeatureList items={[
                    { title: "Non-Custodial", description: "We never have access to your private keys or funds" },
                    { title: "Local Encryption", description: "Private keys are encrypted with your password and stored locally" },
                    { title: "Audited DEX Routes", description: "All swaps route through established, audited DEX contracts" },
                    { title: "Open Source", description: "Core components are open source and verifiable" }
                ]} />
            </SubSection>

            <SubSection title="Best Practices">
                <StepList steps={[
                    "Always verify you're on the official site before connecting your wallet",
                    "Double-check token contract addresses before trading",
                    "Never share your wallet password or private key with anyone",
                    "Start with small amounts when trading new or unfamiliar tokens",
                    "Be cautious of tokens with very low liquidity or suspicious contracts"
                ]} />
            </SubSection>

            <InfoCard type="warning">
                Incubator Protocol is a trading interface. Always do your own research (DYOR) before
                trading any token. We do not provide financial advice.
            </InfoCard>
        </>
    );
}

// ============================================
// MAIN DOCS PAGE COMPONENT
// ============================================

export default function DocsPage() {
    const [activeSection, setActiveSection] = useState('getting-started');
    const [searchQuery, setSearchQuery] = useState('');
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const filteredSections = docSections.filter(
        (section) => section.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const renderContent = () => {
        switch (activeSection) {
            case 'getting-started': return <GettingStartedContent />;
            case 'wallet': return <WalletContent />;
            case 'trading': return <TradingContent />;
            case 'screener': return <ScreenerContent />;
            case 'explorer': return <ExplorerContent />;
            case 'rewards': return <RewardsContent />;
            case 'chains': return <ChainsContent />;
            case 'security': return <SecurityContent />;
            default: return <GettingStartedContent />;
        }
    };

    return (
        <div className="flex min-h-screen bg-[var(--background)]">
            {/* Sidebar */}
            <aside className={clsx(
                "fixed lg:sticky top-0 left-0 h-screen w-72 bg-[var(--background-secondary)] border-r border-[var(--border)] flex flex-col z-50 transition-transform lg:translate-x-0",
                mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
            )}>
                {/* Sidebar Header */}
                <div className="p-6 border-b border-[var(--border)]">
                    <Link href="/" className="flex items-center gap-2 mb-4">
                        <img src="https://i.imgur.com/8UIQt03.png" alt="Incubator Protocol" className="w-8 h-8" />
                        <span className="font-bold text-lg">Documentation</span>
                    </Link>
                    <Link
                        href="/app/trade"
                        className="flex items-center gap-2 text-sm text-[var(--foreground-muted)] hover:text-[var(--primary)] transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to App
                    </Link>
                </div>

                {/* Search */}
                <div className="p-4 border-b border-[var(--border)]">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--foreground-muted)]" />
                        <input
                            type="text"
                            placeholder="Search docs..."
                            className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-[var(--background-tertiary)] border border-[var(--border)] text-sm focus:outline-none focus:border-[var(--primary)]"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 overflow-y-auto p-4">
                    <p className="text-xs font-semibold text-[var(--foreground-muted)] uppercase tracking-wider mb-3 px-3">
                        Documentation
                    </p>
                    <div className="space-y-1">
                        {filteredSections.map((section) => (
                            <button
                                key={section.id}
                                onClick={() => {
                                    setActiveSection(section.id);
                                    setMobileMenuOpen(false);
                                }}
                                className={clsx(
                                    'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left text-sm transition-all',
                                    activeSection === section.id
                                        ? 'bg-[var(--primary)]/10 text-[var(--primary)] font-medium'
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
                    </div>
                </nav>

                {/* Sidebar Footer */}
                <div className="p-4 border-t border-[var(--border)]">
                    <a
                        href="https://twitter.com/IncubatorProt"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors"
                    >
                        <ExternalLink className="w-4 h-4" />
                        Follow on X
                    </a>
                </div>
            </aside>

            {/* Mobile Menu Toggle */}
            <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-[var(--background-secondary)] border border-[var(--border)]"
            >
                <BookOpen className="w-5 h-5" />
            </button>

            {/* Mobile Overlay */}
            {mobileMenuOpen && (
                <div
                    className="lg:hidden fixed inset-0 bg-black/50 z-40"
                    onClick={() => setMobileMenuOpen(false)}
                />
            )}

            {/* Main Content */}
            <main className="flex-1 min-h-screen">
                <div className="max-w-4xl mx-auto px-6 py-12 lg:px-12">
                    {renderContent()}
                </div>
            </main>
        </div>
    );
}
