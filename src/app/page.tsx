import Link from 'next/link';
import { ArrowRight, Zap, Shield, Globe, BarChart3, Layers, Wallet, ChevronRight, ExternalLink } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[var(--background)] relative overflow-hidden">
      {/* Background effects */}
      <div className="fixed inset-0 pointer-events-none">
        {/* Gradient orbs */}
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-[var(--primary)] opacity-[0.08] blur-[150px] rounded-full" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-[var(--accent-yellow)] opacity-[0.06] blur-[150px] rounded-full" />
        <div className="absolute top-1/2 right-0 w-[400px] h-[400px] bg-[var(--primary)] opacity-[0.05] blur-[150px] rounded-full" />
        {/* Grid overlay */}
        <div className="absolute inset-0 grid-bg" />
      </div>

      {/* Navigation */}
      <nav className="relative z-10 flex items-center justify-between px-6 lg:px-12 py-4">
        <div className="flex items-center gap-2">
          <img src="https://i.imgur.com/OWwI16j.png" alt="Incubator Protocol" className="w-10 h-10 rounded-xl" />
          <span className="hidden md:inline font-black text-2xl tracking-wide text-[var(--primary)] uppercase">THE INCUBATOR</span>
        </div>

        <div className="hidden md:flex items-center gap-8">
          <a href="#features" className="text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors">Features</a>
          <a href="#chains" className="text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors">Chains</a>
          <a href="#about" className="text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors">About</a>
          <Link href="/docs" className="text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors">Docs</Link>
        </div>

        <Link href="/app" className="btn btn-primary text-xs px-3 py-1.5 md:text-sm md:px-4 md:py-2">
          Launch App
          <ArrowRight className="w-3 h-3 md:w-4 md:h-4" />
        </Link>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 px-6 lg:px-12 pt-20 pb-32">
        <div className="max-w-5xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--background-secondary)] border border-[var(--border)] mb-8">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--accent-green)] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--accent-green)]"></span>
            </span>
            <span className="text-sm text-[var(--foreground-muted)]">
              Beta • Early Access
            </span>
          </div>

          {/* Main heading */}
          <h1 className="text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-bold leading-tight mb-4 md:mb-6">
            <span className="gradient-text">Trade Across</span>
            <br />
            <span className="text-[var(--foreground)]">Every Chain</span>
          </h1>

          <p className="text-lg md:text-xl text-[var(--foreground-muted)] max-w-2xl mx-auto mb-10">
            The unified trading terminal for serious DeFi traders. Real-time charts,
            cross-chain analytics, and seamless swaps — all in one powerful interface.
          </p>

          {/* CTA buttons */}
          <div className="flex flex-wrap items-center justify-center gap-4 mb-16">
            <Link href="/app" className="btn btn-primary text-base px-8 py-3.5">
              Start Trading
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link href="/app/screener" className="btn btn-secondary text-base px-8 py-3.5">
              Explore Tokens
            </Link>
          </div>

          {/* Chain logos - Desktop: static, Mobile: scrolling banner */}
          {/* Desktop view */}
          <div className="hidden md:flex items-center justify-center gap-6">
            {[
              { name: 'Solana', logo: 'https://i.imgur.com/xp7PYKk.png' },
              { name: 'Ethereum', logo: 'https://i.imgur.com/NKQlhQj.png' },
              { name: 'Base', logo: 'https://i.imgur.com/zn5hpMs.png' },
              { name: 'Arbitrum', logo: 'https://i.imgur.com/jmOXWlA.png' },
            ].map((chain) => (
              <div
                key={chain.name}
                className="flex items-center justify-center w-12 h-12 rounded-xl bg-[var(--background-secondary)] border border-[var(--border)] hover:border-[var(--border-hover)] transition-colors"
                title={chain.name}
              >
                <img src={chain.logo} alt={chain.name} className="w-7 h-7 rounded-full" />
              </div>
            ))}
          </div>

          {/* Mobile scrolling banner */}
          <div className="md:hidden w-full overflow-hidden">
            <div className="flex animate-scroll-x gap-6" style={{ width: 'max-content' }}>
              {/* Duplicate chains for seamless loop */}
              {[...Array(3)].map((_, setIndex) => (
                <div key={setIndex} className="flex items-center gap-6">
                  {[
                    { name: 'Solana', logo: 'https://i.imgur.com/xp7PYKk.png' },
                    { name: 'Ethereum', logo: 'https://i.imgur.com/NKQlhQj.png' },
                    { name: 'Base', logo: 'https://i.imgur.com/zn5hpMs.png' },
                    { name: 'Arbitrum', logo: 'https://i.imgur.com/jmOXWlA.png' },
                  ].map((chain) => (
                    <div
                      key={`${setIndex}-${chain.name}`}
                      className="flex items-center justify-center w-12 h-12 rounded-xl bg-[var(--background-secondary)] border border-[var(--border)] flex-shrink-0"
                      title={chain.name}
                    >
                      <img src={chain.logo} alt={chain.name} className="w-7 h-7 rounded-full" />
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="relative z-10 px-6 lg:px-12 py-24 border-t border-[var(--border)]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Everything You Need to <span className="gradient-text">Dominate DeFi</span>
            </h2>
            <p className="text-[var(--foreground-muted)] max-w-xl mx-auto">
              Professional-grade tools designed for traders who demand the best.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <FeatureCard
              icon={BarChart3}
              title="Advanced Charts"
              description="TradingView-powered charts with multiple timeframes, indicators, and real-time data from DexScreener."
            />
            <FeatureCard
              icon={Layers}
              title="Multi-Chain Explorer"
              description="Explore blocks, transactions, and addresses across Solana, Ethereum, Base, and Arbitrum."
            />
            <FeatureCard
              icon={Zap}
              title="Instant Swaps"
              description="Execute trades in seconds with optimized routing through top DEX aggregators."
            />
            <FeatureCard
              icon={Globe}
              title="Token Screener"
              description="Discover trending tokens, new pairs, and track gainers/losers across all chains."
            />
            <FeatureCard
              icon={Wallet}
              title="Multi-Wallet Support"
              description="Connect MetaMask, Phantom, WalletConnect, and more. One interface, all your wallets."
            />
            <FeatureCard
              icon={Shield}
              title="Referral Rewards"
              description="Earn rewards for your trading volume and when you refer friends to the platform."
            />
          </div>
        </div>
      </section>

      {/* How it works - Horizontal cards */}
      <section id="about" className="relative z-10 px-6 lg:px-12 py-16">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-xl font-semibold text-center mb-10">
            Get Started in <span className="text-[var(--primary)]">3 Steps</span>
          </h2>

          <div className="grid md:grid-cols-3 gap-4">
            <div className="p-6 rounded-xl bg-[var(--background-secondary)] border border-[var(--border)] hover:border-[var(--primary)]/30 transition-colors">
              <div className="text-3xl font-bold text-[var(--primary)]/30 mb-3">01</div>
              <h3 className="font-semibold mb-2">Connect</h3>
              <p className="text-sm text-[var(--foreground-muted)]">Link MetaMask, Phantom, or WalletConnect in seconds.</p>
            </div>
            <div className="p-6 rounded-xl bg-[var(--background-secondary)] border border-[var(--border)] hover:border-[var(--primary)]/30 transition-colors">
              <div className="text-3xl font-bold text-[var(--primary)]/30 mb-3">02</div>
              <h3 className="font-semibold mb-2">Discover</h3>
              <p className="text-sm text-[var(--foreground-muted)]">Browse screener, charts, and explore across all chains.</p>
            </div>
            <div className="p-6 rounded-xl bg-[var(--background-secondary)] border border-[var(--border)] hover:border-[var(--primary)]/30 transition-colors">
              <div className="text-3xl font-bold text-[var(--primary)]/30 mb-3">03</div>
              <h3 className="font-semibold mb-2">Trade & Earn</h3>
              <p className="text-sm text-[var(--foreground-muted)]">Execute swaps and earn volume-based rewards.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section - Compact */}
      <section className="relative z-10 px-6 lg:px-12 py-16 border-t border-[var(--border)]">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl font-semibold mb-3">
            Ready to <span className="gradient-text">Trade Smarter</span>?
          </h2>
          <p className="text-sm text-[var(--foreground-muted)] mb-6">
            Join traders using Incubator Protocol across the multichain ecosystem.
          </p>
          <Link href="/app" className="btn btn-primary px-8 py-3">
            Launch App
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 px-6 lg:px-12 py-8 border-t border-[var(--border)]">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <img src="https://i.imgur.com/OWwI16j.png" alt="Incubator Protocol" className="w-8 h-8 rounded-lg" />
            <span className="font-black tracking-wide text-[var(--primary)] uppercase">THE INCUBATOR</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-[var(--foreground-muted)]">
            <Link href="/docs" className="hover:text-[var(--foreground)] transition-colors">Docs</Link>
            <Link href="/app/explorer" className="hover:text-[var(--foreground)] transition-colors">Explorer</Link>
            <a href="https://twitter.com" target="_blank" rel="noopener" className="hover:text-[var(--foreground)] transition-colors flex items-center gap-1">
              Twitter <ExternalLink className="w-3 h-3" />
            </a>
          </div>
          <p className="text-sm text-[var(--foreground-muted)]">
            © 2024 Incubator Protocol. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
}) {
  return (
    <div className="card card-glow group">
      <div className="w-12 h-12 rounded-xl bg-[var(--primary)]/10 flex items-center justify-center mb-4 group-hover:bg-[var(--primary)]/20 transition-colors">
        <Icon className="w-6 h-6 text-[var(--primary)]" />
      </div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-sm text-[var(--foreground-muted)] leading-relaxed">{description}</p>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-center">
      <p className="text-4xl md:text-5xl font-bold gradient-text mb-2">{value}</p>
      <p className="text-sm text-[var(--foreground-muted)]">{label}</p>
    </div>
  );
}

function Step({ number, title, description }: { number: string; title: string; description: string }) {
  return (
    <div className="flex gap-6 items-start">
      <div className="flex-shrink-0 w-14 h-14 rounded-xl gradient-bg flex items-center justify-center font-bold text-white">
        {number}
      </div>
      <div>
        <h3 className="text-xl font-semibold mb-1">{title}</h3>
        <p className="text-[var(--foreground-muted)]">{description}</p>
      </div>
    </div>
  );
}
