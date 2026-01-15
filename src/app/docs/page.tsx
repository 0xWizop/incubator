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
    Eye,
    Newspaper,
    Server,
    Download,
    Key,
    Calendar,
    Target,
    Rocket,
    MessageCircle
} from 'lucide-react';
import { clsx } from 'clsx';
import { StepCard, WalletBackupDiagram, BackupUI, TrackerNotificationUI, WalletMockup } from './DocVisuals';

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
    { id: 'beta', title: 'Beta Testing', icon: Rocket },
    { id: 'roadmap', title: 'Roadmap', icon: Target },
    { id: 'wallet', title: 'Wallet', icon: Wallet },
    { id: 'tracker', title: 'Wallet Tracker', icon: Eye },
    { id: 'trading', title: 'Trading', icon: Terminal },
    { id: 'explorer', title: 'Block Explorer', icon: Layers },
    { id: 'rewards', title: 'Rewards & Referrals', icon: Trophy },
    { id: 'chains', title: 'Supported Chains', icon: Globe },
    { id: 'providers', title: 'Data Providers', icon: Server },
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
        <div className="mb-10">
            <h2 className="text-lg font-semibold mb-6 text-[var(--foreground)] flex items-center gap-2">
                <div className="w-1.5 h-6 bg-[var(--primary)] rounded-full" />
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
        <div className="grid sm:grid-cols-2 gap-4 my-6">
            {items.map((item, i) => (
                <div key={i} className="flex flex-col gap-2 p-4 rounded-xl bg-[var(--background-tertiary)] border border-[var(--border)] hover:border-[var(--primary)]/50 transition-colors">
                    <div className="flex items-center gap-2 font-bold text-[var(--foreground)]">
                        <div className="p-1 rounded bg-[var(--accent-green)]/10">
                            <Check className="w-3.5 h-3.5 text-[var(--accent-green)]" />
                        </div>
                        {item.title}
                    </div>
                    <p className="text-sm text-[var(--foreground-muted)] leading-relaxed">{item.description}</p>
                </div>
            ))}
        </div>
    );
}

function StepList({ steps }: { steps: string[] }) {
    return (
        <div className="space-y-4 my-6">
            {steps.map((step, i) => (
                <div key={i} className="flex items-start gap-4 p-3 rounded-lg hover:bg-[var(--background-secondary)] transition-colors">
                    <div className="w-8 h-8 rounded-full bg-[var(--primary)]/10 border border-[var(--primary)]/20 flex items-center justify-center text-[var(--primary)] text-sm font-bold shrink-0 shadow-[0_0_10px_rgba(var(--primary-rgb),0.1)]">
                        {i + 1}
                    </div>
                    <p className="pt-1 text-sm sm:text-base leading-relaxed">{step}</p>
                </div>
            ))}
        </div>
    );
}

function InfoCard({ type, children }: { type: 'info' | 'warning'; children: React.ReactNode }) {
    const isWarning = type === 'warning';
    return (
        <div className={clsx(
            "flex items-start gap-4 p-5 rounded-xl border my-6 bg-gradient-to-r",
            isWarning
                ? "from-[var(--accent-yellow)]/5 to-transparent border-[var(--accent-yellow)]/20"
                : "from-[var(--primary)]/5 to-transparent border-[var(--primary)]/20"
        )}>
            {isWarning
                ? <AlertTriangle className="w-6 h-6 text-[var(--accent-yellow)] shrink-0 mt-0.5" />
                : <Info className="w-6 h-6 text-[var(--primary)] shrink-0 mt-0.5" />
            }
            <div className="text-sm leading-relaxed">{children}</div>
        </div>
    );
}

function ChainCard({ name, logo, type, speed }: { name: string; logo: string; type: string; speed: string }) {
    return (
        <div className="flex items-center gap-4 p-5 rounded-2xl bg-[var(--background-tertiary)] border border-[var(--border)] hover:border-[var(--primary)] transition-all hover:scale-[1.01]">
            <img src={logo} alt={name} className="w-12 h-12 rounded-full shadow-lg" />
            <div className="flex-1">
                <p className="font-bold text-lg">{name}</p>
                <p className="text-xs font-medium text-[var(--foreground-muted)] uppercase tracking-wide">{type}</p>
            </div>
            <div className="text-right">
                <p className="text-lg font-mono text-[var(--primary)] font-bold">{speed}</p>
                <p className="text-[10px] text-[var(--foreground-muted)] uppercase tracking-wider">block time</p>
            </div>
        </div>
    );
}

function TierCard({ name, Icon, minVolume, tradingRate, referralRate, color }: {
    name: string; Icon: any; minVolume: string; tradingRate: string; referralRate: string; color: string
}) {
    return (
        <div className="p-4 rounded-xl bg-[var(--background-tertiary)] border border-[var(--border)] text-center relative overflow-hidden group hover:-translate-y-1 transition-transform">
            <div className="absolute top-0 left-0 w-full h-1" style={{ backgroundColor: color }} />
            <div className="w-12 h-12 mx-auto rounded-xl flex items-center justify-center mb-3 transition-transform group-hover:scale-110" style={{ backgroundColor: `${color}15` }}>
                <Icon className="w-6 h-6" style={{ color }} />
            </div>
            <p className="font-bold text-lg" style={{ color }}>{name}</p>
            <p className="text-xs font-mono bg-[var(--background)] py-1 px-2 rounded-md inline-block mt-2 border border-[var(--border)] opacity-80">{minVolume}</p>

            <div className="mt-4 pt-4 border-t border-[var(--border)] grid grid-cols-2 gap-2 text-xs">
                <div>
                    <p className="text-[var(--foreground-muted)] mb-1">Trading</p>
                    <p className="font-bold text-base text-[var(--primary)]">{tradingRate}%</p>
                </div>
                <div>
                    <p className="text-[var(--foreground-muted)] mb-1">Referral</p>
                    <p className="font-bold text-base text-[var(--accent-purple)]">{referralRate}%</p>
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
                Trade tokens on Solana, Ethereum, Base, and Arbitrum all from one professional interface.
            </Paragraph>

            <SubSection title="Quick Start Guide">
                <StepList steps={[
                    "Connect your wallet using the button in the top right",
                    "Select a network (Solana, Ethereum, Base, or Arbitrum)",
                    "Find a token using the search bar or trending list",
                    "Enter an amount to swap and confirm the transaction"
                ]} />
            </SubSection>

            <SubSection title="Key Features">
                <FeatureList items={[
                    { title: "Multi-Chain Trading", description: "Swap tokens across 4 major networks from one dashboard" },
                    { title: "Wallet Tracker", description: "Monitor activity for any wallet address in real-time" },
                    { title: "Embedded Wallet", description: "Built-in non-custodial wallet — no browser extension needed" },
                    { title: "Real-Time Data", description: "Live charts, prices, and on-chain data powered by DexScreener" },
                    { title: "Rewards Program", description: "Earn XP and unlock tiers based on your trading volume" }
                ]} />
            </SubSection>
        </>
    );
}

function WalletTrackerContent() {
    return (
        <>
            <SectionTitle>Wallet Tracker</SectionTitle>
            <div className="flex flex-col-reverse lg:flex-row gap-8 items-center mb-8">
                <div className="flex-1">
                    <Paragraph>
                        The Wallet Tracker allows you to monitor any wallet address on Ethereum, Solana, Base, or Arbitrum.
                        Get notified instantly when monitored wallets perform trades.
                    </Paragraph>
                </div>
                {/* Visual Preview */}
                <div className="w-full max-w-sm">
                    <div className="text-center mb-2 text-xs font-semibold text-[var(--foreground-muted)] tracking-wider uppercase">Preview Notification</div>
                    <TrackerNotificationUI />
                </div>
            </div>

            <SubSection title="How to Track a Wallet">
                <StepList steps={[
                    "Click the Eye icon (👁️) in the header or sidebar to open the tracker",
                    "Click 'Add Wallet' button",
                    "Paste any EVM (0x...) or Solana (Base58) address",
                    "Give it a nickname to easily identify who it belongs to",
                    "Toggle notifications on to receive desktop alerts"
                ]} />
            </SubSection>

            <SubSection title="Smart Features">
                <FeatureList items={[
                    { title: "Auto-Chain Detection", description: "Our system automatically detects if an address is EVM or Solana based on format" },
                    { title: "Smart Filtering", description: "Browser notifications only trigger on major activity (Swaps/Trades), ignoring spam" },
                    { title: "Unified Feed", description: "View recent activity for all your tracked wallets in one scrolling timeline" },
                    { title: "Local Privacy", description: "Your tracked wallets are stored locally on your device and are never shared" }
                ]} />
            </SubSection>
        </>
    );
}

function ProvidersContent() {
    return (
        <>
            <SectionTitle>Data Providers</SectionTitle>
            <Paragraph>
                Incubator Protocol aggregates data from industry-leading providers to ensure accuracy, speed, and reliability.
            </Paragraph>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-6">
                <div className="p-6 border border-[var(--border)] rounded-2xl bg-[var(--background-tertiary)] hover:border-[var(--primary)] transition-colors">
                    <h3 className="font-bold flex items-center gap-2 mb-2 text-lg">
                        DexScreener
                    </h3>
                    <p className="text-sm text-[var(--foreground-muted)] leading-relaxed">
                        Primary source for real-time token prices, charts, and market data across all chains.
                    </p>
                </div>
                <div className="p-6 border border-[var(--border)] rounded-2xl bg-[var(--background-tertiary)] hover:border-[var(--primary)] transition-colors">
                    <h3 className="font-bold flex items-center gap-2 mb-2 text-lg">
                        CoinGecko
                    </h3>
                    <p className="text-sm text-[var(--foreground-muted)] leading-relaxed">
                        Trusted source for global cryptocurrency market data, metadata, and token info.
                    </p>
                </div>
                <div className="p-6 border border-[var(--border)] rounded-2xl bg-[var(--background-tertiary)] hover:border-[var(--primary)] transition-colors">
                    <h3 className="font-bold flex items-center gap-2 mb-2 text-lg">
                        0x Protocol
                    </h3>
                    <p className="text-sm text-[var(--foreground-muted)] leading-relaxed">
                        Industry standard aggregation API for the best prices on Ethereum, Base, and Arbitrum.
                    </p>
                </div>
                <div className="p-6 border border-[var(--border)] rounded-2xl bg-[var(--background-tertiary)] hover:border-[var(--primary)] transition-colors">
                    <h3 className="font-bold flex items-center gap-2 mb-2 text-lg">
                        Jupiter
                    </h3>
                    <p className="text-sm text-[var(--foreground-muted)] leading-relaxed">
                        The #1 liquidity aggregator for Solana, ensuring the best swap rates across the ecosystem.
                    </p>
                </div>
            </div>
        </>
    );
}

function WalletContent() {
    return (
        <>
            <SectionTitle>Embedded Wallet</SectionTitle>
            <Paragraph>
                Incubator Protocol features a state-of-the-art embedded wallet. It allows you to trade on any chain without installing browser extensions like Metamask or Phantom.
            </Paragraph>

            <WalletMockup />

            <div className="mt-12"></div>

            <SubSection title="Security & Architecture">
                <Paragraph>
                    Your wallet is <strong>non-custodial</strong>. This means your private keys are generated on your device and encrypted with your password.
                    We do not store your password or private keys on our servers. You are the only person who can access your funds.
                </Paragraph>

                <WalletBackupDiagram />
            </SubSection>

            <div className="grid lg:grid-cols-2 gap-8 my-8">
                <div>
                    <SubSection title="How to Back Up">
                        <Paragraph>
                            Since we cannot recover your password, it is critical that you back up your wallet immediately after creation.
                        </Paragraph>
                        <StepList steps={[
                            "Open the wallet menu (top right)",
                            "Navigate to Settings > Security",
                            "Click 'Reveal Private Key' or 'Export Wallet'",
                            "Enter your password to decrypt",
                            "Save the private key or JSON file safely"
                        ]} />
                    </SubSection>
                </div>
                <div className="flex flex-col justify-center">
                    <BackupUI />
                </div>
            </div>

            <InfoCard type="warning">
                <strong>Important:</strong> If you clear your browser cache or switch devices, you will need your Private Key or Recovery Phrase to restore your wallet. Always keep a backup.
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

            <SectionTitle>Routing Engine</SectionTitle>
            <Paragraph>
                We utilize the most powerful aggregators in the industry to ensure you get the absolute best price for every trade, regardless of the chain.
            </Paragraph>

            <SubSection title="Our Providers">
                <div className="grid gap-4 sm:grid-cols-2 my-4">
                    <div className="p-5 rounded-xl bg-[var(--background-tertiary)] border border-[var(--border)]">
                        <h4 className="font-bold text-lg mb-1 flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-blue-500" />
                            EVM Swaps
                        </h4>
                        <p className="text-sm text-[var(--foreground-muted)] mb-3">Powered by <strong>0x API</strong></p>
                        <p className="text-xs text-[var(--foreground-muted)] leading-relaxed">
                            Aggregates liquidity from Uniswap, Sushiswap, Curve, and 100+ other DEXs on Ethereum, Base, and Arbitrum.
                        </p>
                    </div>
                    <div className="p-5 rounded-xl bg-[var(--background-tertiary)] border border-[var(--border)]">
                        <h4 className="font-bold text-lg mb-1 flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-green-500" />
                            Solana Swaps
                        </h4>
                        <p className="text-sm text-[var(--foreground-muted)] mb-3">Powered by <strong>Jupiter</strong></p>
                        <p className="text-xs text-[var(--foreground-muted)] leading-relaxed">
                            The gold standard for Solana routing. Splits trades across Raydium, Orca, Meteora, and more for minimal price impact.
                        </p>
                    </div>
                </div>
            </SubSection>

            <SubSection title="How Execution Works">
                <div className="grid gap-4 sm:grid-cols-3">
                    <StepCard number={1} title="Quote" description="We query 0x or Jupiter for the best route." />
                    <StepCard number={2} title="Approve" description="You confirm the transaction in your embedded wallet." />
                    <StepCard number={3} title="Swap" description="The transaction is submitted directly to the blockchain." />
                </div>
            </SubSection>
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
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 my-6">
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
                <div className="grid gap-4 sm:grid-cols-2 my-6">
                    <div className="p-6 rounded-xl bg-[var(--background-tertiary)] border border-[var(--border)]">
                        <Users className="w-8 h-8 text-[var(--accent-purple)] mb-4" />
                        <h3 className="font-bold text-lg mb-2">Invite Friends</h3>
                        <p className="text-sm text-[var(--foreground-muted)]">Share your unique link. You earn reliable commissions on every swap they make.</p>
                    </div>
                    <div className="p-6 rounded-xl bg-[var(--background-tertiary)] border border-[var(--border)]">
                        <Trophy className="w-8 h-8 text-[var(--accent-yellow)] mb-4" />
                        <h3 className="font-bold text-lg mb-2">Earn Together</h3>
                        <p className="text-sm text-[var(--foreground-muted)]">Users who sign up with your code get a 5% discount on fees permanently.</p>
                    </div>
                </div>
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

            <div className="space-y-4 my-8">
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

            <div className="mt-8 flex justify-center">
                <Shield className="w-24 h-24 text-[var(--accent-green)] opacity-20" />
            </div>

            <InfoCard type="warning">
                Incubator Protocol is a trading interface. Always do your own research (DYOR) before
                trading any token. We do not provide financial advice.
            </InfoCard>
        </>
    );
}

function BetaTestingContent() {
    return (
        <>
            <SectionTitle>Beta Testing</SectionTitle>
            <Paragraph>
                Incubator Protocol Beta launches <strong>January 26th, 2026</strong>. This three-week phase
                is the final step before our public release. We're opening the doors to a select group of
                traders to stress-test the infrastructure and refine the user experience.
            </Paragraph>

            <InfoCard type="warning">
                <strong>Important:</strong> This is a beta. While our wallet infrastructure has been heavily
                tested internally, do not deposit life-changing sums. Use amounts you are comfortable testing with.
            </InfoCard>

            <SubSection title="How to Participate">
                <StepList steps={[
                    "Join our Discord server at discord.gg/366nqwwz",
                    "Wait for the beta access link on January 26th",
                    "Connect your wallet and start trading",
                    "Report bugs and feedback in #beta-testing channel"
                ]} />
            </SubSection>

            <SubSection title="Beta Rewards">
                <Paragraph>
                    Active beta participants will secure permanent, lifetime benefits:
                </Paragraph>
                <FeatureList items={[
                    { title: "Lifetime Diamond Tier", description: "Permanently whitelisted for the lowest trading fee tier. This status stays with your wallet forever." },
                    { title: "Unlocked Analytics Suite", description: "Post-beta, advanced tools like Market Heatmap, Wallet Tracking, News Terminal, and dApp Analytics move behind a paywall. Beta users retain lifetime free access." },
                    { title: "Season 1 Rewards", description: "Early access to the $INC points system and enhanced airdrop multipliers." },
                    { title: "Priority Support", description: "Direct line to the development team for any issues or feature requests." }
                ]} />
            </SubSection>

            <SubSection title="Submitting Feedback">
                <Paragraph>
                    Please use the following format when reporting issues in Discord:
                </Paragraph>
                <div className="p-4 rounded-xl bg-[var(--background-tertiary)] border border-[var(--border)] font-mono text-sm my-4">
                    <p className="text-[var(--foreground-muted)]"><strong>Type:</strong> Bug / Feedback / Request</p>
                    <p className="text-[var(--foreground-muted)]"><strong>Description:</strong> Brief explanation of the issue</p>
                    <p className="text-[var(--foreground-muted)]"><strong>Device:</strong> Desktop / Mobile (iOS/Android)</p>
                    <p className="text-[var(--foreground-muted)]"><strong>Screenshot:</strong> (Optional but helpful)</p>
                </div>
            </SubSection>

            <SubSection title="Bug Bounty">
                <Paragraph>
                    We are confident in our security. If you can break our wallet or extract funds from
                    the protocol during this beta, we will pay a bounty. Report any security vulnerabilities
                    directly via Discord DM to the founder.
                </Paragraph>
            </SubSection>
        </>
    );
}

function RoadmapContent() {
    const phases = [
        {
            title: "Phase 1: Beta Testing",
            date: "Jan 26 - Feb 16, 2026",
            status: "upcoming",
            items: [
                "Infrastructure hardening on Solana, Ethereum, Base, Arbitrum",
                "Bug bounty program active",
                "Direct feedback loop with engineering",
                "Beta participants earn lifetime rewards"
            ]
        },
        {
            title: "Phase 2: Strategic Funding",
            date: "Feb 17 - Feb 28, 2026",
            status: "planned",
            items: [
                "Fundraising for marketing and liquidity",
                "Security audit finalization",
                "Partnership closures with market makers",
                "Final preparations for TGE"
            ]
        },
        {
            title: "Phase 3: Token Generation Event",
            date: "Early March 2026",
            status: "planned",
            items: [
                "$INC token goes live on major DEXs",
                "Initial liquidity injection",
                "$INC single-sided staking opens",
                "Revenue share participation begins"
            ]
        },
        {
            title: "Phase 4: Season 1",
            date: "March - June 2026",
            status: "planned",
            items: [
                "Incubator Points System launches",
                "Trading volume rewards",
                "Referral system with tiered commissions",
                "Daily streaks and whale bonuses"
            ]
        },
        {
            title: "Phase 5: Season 2 & Expansion",
            date: "June 2026+",
            status: "planned",
            items: [
                "Copy trading marketplace",
                "Expansion to Tron / BNB Chain",
                "New scoring mechanisms",
                "Advanced trading features"
            ]
        }
    ];

    return (
        <>
            <SectionTitle>Roadmap</SectionTitle>
            <Paragraph>
                We are building an on-chain everything app. Here's what's ahead for Incubator Protocol.
            </Paragraph>

            <div className="space-y-6 my-8">
                {phases.map((phase, i) => (
                    <div key={phase.title} className="relative pl-8 border-l-2 border-[var(--border)]">
                        <div className={`absolute left-0 top-0 w-4 h-4 -translate-x-[9px] rounded-full border-2 ${phase.status === 'upcoming'
                            ? 'bg-[var(--primary)] border-[var(--primary)]'
                            : 'bg-[var(--background)] border-[var(--border)]'
                            }`} />
                        <div className="mb-2">
                            <h3 className="text-lg font-bold text-white">{phase.title}</h3>
                            <p className="text-sm text-[var(--foreground-muted)]">{phase.date}</p>
                        </div>
                        <ul className="space-y-2">
                            {phase.items.map((item, j) => (
                                <li key={j} className="flex items-start gap-2 text-sm text-[var(--foreground-muted)]">
                                    <Check className="w-4 h-4 text-[var(--accent-green)] shrink-0 mt-0.5" />
                                    {item}
                                </li>
                            ))}
                        </ul>
                    </div>
                ))}
            </div>

            <SubSection title="$INC Tokenomics">
                <FeatureList items={[
                    { title: "Real Yield", description: "Protocol uses fees to buy back $INC and pay stakers" },
                    { title: "Deflation", description: "Unstaking penalties and listing fees are permanently burned" },
                    { title: "Governance", description: "Stakers vote on Season 2 reward allocations" }
                ]} />
            </SubSection>

            <SubSection title="Season 1 Points System">
                <Paragraph>
                    All users earn points which convert to $INC airdrops at the end of Season 1.
                </Paragraph>
                <div className="grid gap-4 sm:grid-cols-2 my-4">
                    <div className="p-4 rounded-xl bg-[var(--background-tertiary)] border border-[var(--border)]">
                        <h4 className="font-bold mb-2 flex items-center gap-2">
                            <TrendingUp className="w-4 h-4 text-[var(--primary)]" />
                            Trading Volume
                        </h4>
                        <ul className="text-sm text-[var(--foreground-muted)] space-y-1">
                            <li>• Earn points for every $1000 traded</li>
                            <li>• Multi-chain bonus (trade on 3+ chains)</li>
                            <li>• Whale bonus for trades over $1k</li>
                        </ul>
                    </div>
                    <div className="p-4 rounded-xl bg-[var(--background-tertiary)] border border-[var(--border)]">
                        <h4 className="font-bold mb-2 flex items-center gap-2">
                            <Users className="w-4 h-4 text-[var(--accent-purple)]" />
                            Referrals
                        </h4>
                        <ul className="text-sm text-[var(--foreground-muted)] space-y-1">
                            <li>• 10% of direct referral points</li>
                            <li>• 5% of secondary tier points</li>
                            <li>• Unlock higher tiers with more referrals</li>
                        </ul>
                    </div>
                </div>
            </SubSection>
        </>
    );
}

export default function DocsPage() {
    const [activeSection, setActiveSection] = useState('getting-started');
    const [searchQuery, setSearchQuery] = useState('');
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const filteredSections = docSections.filter(
        (section) => section.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const activeSectionTitle = docSections.find(s => s.id === activeSection)?.title || 'Documentation';

    const renderContent = () => {
        switch (activeSection) {
            case 'getting-started': return <GettingStartedContent />;
            case 'beta': return <BetaTestingContent />;
            case 'roadmap': return <RoadmapContent />;
            case 'wallet': return <WalletContent />;
            case 'tracker': return <WalletTrackerContent />;
            case 'providers': return <ProvidersContent />;
            case 'trading': return <TradingContent />;
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
                <div className="px-6 py-3 border-b border-[var(--border)]">
                    <Link href="/" className="flex items-center gap-2">
                        <img src="https://i.imgur.com/8UIQt03.png" alt="Incubator Protocol" className="w-8 h-8" />
                        <span className="font-bold text-lg">Documentation</span>
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
                <div className="p-4 border-t border-[var(--border)] space-y-3">
                    <Link
                        href="/app/dashboard"
                        className="flex items-center gap-2 p-2 rounded-lg bg-[var(--primary)]/10 text-[var(--primary)] text-sm font-medium hover:bg-[var(--primary)]/20 transition-colors w-full justify-center"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to App
                    </Link>
                    <a
                        href="https://twitter.com/IncubatorProt"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-3 text-sm text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors justify-center"
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
                <div className="max-w-7xl mx-auto px-6 py-8 lg:px-12 flex items-start gap-12">

                    {/* Center Column */}
                    <div className="flex-1 min-w-0">
                        {/* Breadcrumbs */}
                        <div className="flex items-center gap-2 text-sm text-[var(--foreground-muted)] mb-8">
                            <Link href="/app/dashboard" className="hover:text-[var(--foreground)] transition-colors">App</Link>
                            <ChevronRight className="w-3 h-3" />
                            <span>Documentation</span>
                            <ChevronRight className="w-3 h-3" />
                            <span className="text-[var(--primary)] font-medium">{activeSectionTitle}</span>
                        </div>

                        {renderContent()}
                    </div>

                    {/* Right Sidebar (Table of Contents / Links) */}
                    <div className="hidden xl:block w-64 sticky top-8 space-y-8">
                        <div>
                            <p className="text-xs font-bold text-[var(--foreground-muted)] uppercase tracking-wider mb-4">
                                On This Page
                            </p>
                            <ul className="space-y-3 border-l border-[var(--border)] pl-4">
                                <li>
                                    <a href="#" className="text-sm font-medium text-[var(--primary)] border-l-2 border-[var(--primary)] -ml-[17px] pl-3 block">
                                        {activeSectionTitle}
                                    </a>
                                </li>
                                {/* In a real app we'd map subsections here */}
                            </ul>
                        </div>

                        <div>
                            <p className="text-xs font-bold text-[var(--foreground-muted)] uppercase tracking-wider mb-4">
                                Community
                            </p>
                            <div className="space-y-3">
                                <a href="mailto:incubatorprotocol@gmail.com" className="flex items-center gap-2 text-sm text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors">
                                    <Info className="w-4 h-4" />
                                    Contact Support
                                </a>
                                <a href="mailto:incubatorprotocol@gmail.com" className="flex items-center gap-2 text-sm text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors">
                                    <AlertTriangle className="w-4 h-4" />
                                    Report a Bug
                                </a>
                                <a href="https://discord.gg/366nqwwz" className="flex items-center gap-2 text-sm text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors">
                                    <ExternalLink className="w-4 h-4" />
                                    Discord Community
                                </a>
                            </div>
                        </div>
                    </div>

                </div>
            </main>
        </div>
    );
}
