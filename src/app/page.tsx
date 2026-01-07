'use client';

import Link from 'next/link';
import { ArrowRight, Zap, Shield, Globe, BarChart3, Layers, Wallet, ExternalLink, Play, ChevronDown } from 'lucide-react';
import { useEffect, useState, useRef } from 'react';

// Animated counter hook
function useCountUp(end: number, duration: number = 2000) {
  const [count, setCount] = useState(0);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    if (!started) return;
    let startTime: number;
    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      setCount(Math.floor(progress * end));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [started, end, duration]);

  return { count, start: () => setStarted(true) };
}

export default function HomePage() {
  const [mounted, setMounted] = useState(false);
  const volumeStat = useCountUp(847, 2000);
  const usersStat = useCountUp(12400, 2000);
  const tradesStat = useCountUp(2100000, 2000);

  useEffect(() => {
    setMounted(true);
    const timer = setTimeout(() => {
      volumeStat.start();
      usersStat.start();
      tradesStat.start();
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  const chains = [
    { name: 'Solana', logo: 'https://i.imgur.com/xp7PYKk.png', color: '#9945FF' },
    { name: 'Ethereum', logo: 'https://i.imgur.com/NKQlhQj.png', color: '#627EEA' },
    { name: 'Base', logo: 'https://i.imgur.com/zn5hpMs.png', color: '#0052FF' },
    { name: 'Arbitrum', logo: 'https://i.imgur.com/jmOXWlA.png', color: '#28a0f0' },
  ];

  return (
    <div className="min-h-screen bg-black text-white relative overflow-x-hidden">
      {/* DRAMATIC ANIMATED BACKGROUND */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none max-w-full">
        {/* Massive central glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90vw] h-[90vw] max-w-[1200px] max-h-[1200px]">
          <div className="absolute inset-0 bg-gradient-radial from-[#F7931A]/30 via-[#F7931A]/5 to-transparent rounded-full animate-pulse" style={{ animationDuration: '4s' }} />
          <div className="absolute inset-[10%] bg-gradient-radial from-orange-500/20 via-transparent to-transparent rounded-full animate-pulse" style={{ animationDuration: '3s', animationDelay: '1s' }} />
        </div>

        {/* Animated gradient streaks */}
        <div className="absolute top-0 left-0 w-full h-full hidden md:block">
          <div className="absolute top-[20%] -left-[10%] w-[800px] h-[2px] bg-gradient-to-r from-transparent via-[#F7931A]/40 to-transparent rotate-[25deg] animate-pulse" style={{ animationDuration: '3s' }} />
          <div className="absolute top-[60%] -right-[10%] w-[600px] h-[2px] bg-gradient-to-r from-transparent via-[#F7931A]/30 to-transparent -rotate-[15deg] animate-pulse" style={{ animationDuration: '4s', animationDelay: '1.5s' }} />
          <div className="absolute bottom-[30%] left-[20%] w-[400px] h-[1px] bg-gradient-to-r from-transparent via-amber-500/20 to-transparent rotate-[45deg] animate-pulse" style={{ animationDuration: '5s', animationDelay: '0.5s' }} />
        </div>

        {/* Floating orbs */}
        <div className="absolute top-[10%] left-[15%] w-4 h-4 bg-[#F7931A] rounded-full blur-sm animate-float opacity-60" style={{ animationDuration: '6s' }} />
        <div className="absolute top-[30%] right-[20%] w-3 h-3 bg-amber-400 rounded-full blur-sm animate-float opacity-40" style={{ animationDuration: '8s', animationDelay: '2s' }} />
        <div className="absolute bottom-[25%] left-[25%] w-5 h-5 bg-orange-500 rounded-full blur-sm animate-float opacity-50" style={{ animationDuration: '7s', animationDelay: '1s' }} />
        <div className="absolute top-[60%] right-[10%] w-2 h-2 bg-[#F7931A] rounded-full blur-sm animate-float opacity-70" style={{ animationDuration: '5s', animationDelay: '3s' }} />

        {/* Grid pattern - more prominent on mobile */}
        <div className="absolute inset-0 opacity-[0.08] md:opacity-[0.05]" style={{
          backgroundImage: `linear-gradient(#F7931A 1px, transparent 1px), linear-gradient(90deg, #F7931A 1px, transparent 1px)`,
          backgroundSize: '60px 60px'
        }} />
      </div>

      {/* MINIMAL NAV */}
      <nav className={`fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 lg:px-12 py-5 transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}>
        <Link href="/" className="flex items-center gap-3 group">
          <div className="relative">
            <img src="https://i.imgur.com/8UIQt03.png" alt="Incubator" className="w-10 h-10 rounded-xl transition-transform group-hover:scale-110" />
            <div className="absolute inset-0 bg-[#F7931A] rounded-xl blur-xl opacity-0 group-hover:opacity-50 transition-opacity" />
          </div>
          <span className="hidden sm:block font-black text-xl tracking-wider text-white uppercase">INCUBATOR</span>
        </Link>

        <div className="flex items-center gap-4">
          <Link href="/docs" className="hidden md:block text-sm text-gray-400 hover:text-white transition-colors">Docs</Link>
          <Link href="/app" className="relative group px-6 py-2.5 rounded-full bg-[#F7931A] text-black font-bold text-sm overflow-hidden transition-all hover:scale-105">
            <span className="relative z-10 flex items-center gap-2">
              Launch App
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </span>
            <div className="absolute inset-0 bg-gradient-to-r from-amber-400 to-orange-500 opacity-0 group-hover:opacity-100 transition-opacity" />
          </Link>
        </div>
      </nav>

      {/* HERO - FULL SCREEN */}
      <section className="relative min-h-screen flex flex-col items-center justify-center px-6 pt-20">
        {/* Orbiting chains - behind content, synced with hero content */}
        <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[280px] h-[280px] sm:w-[400px] sm:h-[400px] md:w-[700px] md:h-[700px] transition-all duration-1000 ${mounted ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
          {chains.map((chain, i) => (
            <div
              key={chain.name}
              className="absolute top-1/2 left-1/2 w-8 h-8 sm:w-12 sm:h-12 md:w-16 md:h-16 -mt-4 -ml-4 sm:-mt-6 sm:-ml-6 md:-mt-8 md:-ml-8"
              style={{
                animation: `orbit 20s linear infinite`,
                animationDelay: `${i * -5}s`,
                transformOrigin: 'center',
              }}
            >
              <div className="relative group cursor-pointer">
                <img src={chain.logo} alt={chain.name} className="w-full h-full rounded-full transition-all group-hover:scale-125" />
                <div className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-60 blur-xl transition-opacity" style={{ background: chain.color }} />
              </div>
            </div>
          ))}
        </div>

        {/* Main hero content */}
        <div className="relative z-10 text-center max-w-5xl mx-auto">
          {/* Eyebrow */}
          <div className={`inline-flex items-center gap-3 px-5 py-2 rounded-full border border-white/10 bg-white/5 backdrop-blur-sm mb-8 transition-all duration-1000 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            <div className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-400"></span>
            </div>
            <span className="text-sm text-gray-300">Live on 4 Chains</span>
          </div>

          {/* HEADLINE */}
          <h1 className={`transition-all duration-1000 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <span className="block text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black leading-[0.95] tracking-tight">
              <span className="bg-gradient-to-r from-white via-gray-200 to-white bg-clip-text text-transparent">TRADE</span>
            </span>
            <span className="block text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black leading-[0.95] tracking-tight mt-1">
              <span className="bg-gradient-to-r from-[#F7931A] via-amber-400 to-[#F7931A] bg-clip-text text-transparent bg-[length:200%_auto] animate-gradient-shift">EVERYWHERE</span>
            </span>
          </h1>

          {/* Subheadline */}
          <p className={`mt-8 text-lg md:text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed transition-all duration-1000 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            The unified multichain terminal for serious traders. Charts, swaps, and analytics across Solana, Ethereum, Base & Arbitrum.
          </p>

          {/* CTA */}
          <div className={`mt-10 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 w-full px-4 transition-all duration-1000 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            <Link href="/app" className="group relative inline-flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-3.5 sm:px-8 sm:py-4 rounded-full bg-[#F7931A] text-black font-bold text-base sm:text-lg overflow-hidden transition-all hover:scale-105 hover:shadow-[0_0_60px_rgba(247,147,26,0.4)]">
              <Play className="w-4 h-4 sm:w-5 sm:h-5 fill-current" />
              Start Trading
              <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link href="/app/screener" className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-3.5 sm:px-8 sm:py-4 rounded-full border border-white/20 text-white font-medium text-base sm:text-lg hover:bg-white/5 hover:border-white/40 transition-all">
              Explore Tokens
            </Link>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className={`absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-gray-500 transition-all duration-1000 ${mounted ? 'opacity-100' : 'opacity-0'}`}>
          <span className="text-xs uppercase tracking-widest">Scroll</span>
          <ChevronDown className="w-5 h-5 animate-bounce" />
        </div>
      </section>

      {/* STATS SECTION */}
      <section className="relative z-10 py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8 md:gap-0 divide-y md:divide-y-0 md:divide-x divide-white/10">
            <div className="flex-1 text-center px-6">
              <p className="text-4xl md:text-5xl font-bold text-white bg-clip-text text-transparent">
                ${volumeStat.count}M+
              </p>
              <p className="mt-2 text-gray-500 uppercase tracking-widest text-xs font-semibold">Trading Volume</p>
            </div>
            <div className="flex-1 text-center px-6">
              <p className="text-4xl md:text-5xl font-bold text-white bg-clip-text text-transparent">
                {(usersStat.count / 1000).toFixed(1)}K+
              </p>
              <p className="mt-2 text-gray-500 uppercase tracking-widest text-xs font-semibold">Active Traders</p>
            </div>
            <div className="flex-1 text-center px-6">
              <p className="text-4xl md:text-5xl font-bold text-white bg-clip-text text-transparent">
                {(tradesStat.count / 1000000).toFixed(1)}M+
              </p>
              <p className="mt-2 text-gray-500 uppercase tracking-widest text-xs font-semibold">Total Trades</p>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES - BENTO GRID */}
      <section className="relative z-10 py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-2xl md:text-4xl font-bold tracking-tight mb-4">
              <span className="text-white">Built for </span>
              <span className="bg-gradient-to-r from-[#F7931A] to-amber-400 bg-clip-text text-transparent">Professionals</span>
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto text-base md:text-lg">
              Everything you need to trade efficiently across multiple chains in one unified interface.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: BarChart3, title: 'Advanced Charts', desc: 'TradingView-powered with real-time data', color: '#F7931A' },
              { icon: Zap, title: 'Instant Swaps', desc: 'Optimized DEX aggregation', color: '#F7931A' },
              { icon: Layers, title: 'Multi-Chain', desc: 'SOL, ETH, Base, Arbitrum', color: '#F7931A' },
              { icon: Globe, title: 'Token Screener', desc: 'Find trending tokens fast', color: '#F7931A' },
              { icon: Wallet, title: 'Any Wallet', desc: 'MetaMask, Phantom, WalletConnect', color: '#F7931A' },
              { icon: Shield, title: 'Earn Rewards', desc: 'Volume-based rewards system', color: '#F7931A' },
            ].map((feature, i) => (
              <div
                key={feature.title}
                className="group p-6 rounded-2xl bg-[#0A0A0A] border border-white/5 hover:border-[#F7931A] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_10px_40px_-10px_rgba(247,147,26,0.1)]"
              >
                <div className="w-12 h-12 rounded-xl bg-[#111111] border border-white/5 flex items-center justify-center mb-4 group-hover:scale-110 group-hover:border-[#F7931A]/30 transition-all duration-300 shadow-inner">
                  <feature.icon className="w-6 h-6 text-gray-400 group-hover:text-[#F7931A] transition-colors" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2 group-hover:text-[#F7931A] transition-colors">{feature.title}</h3>
                <p className="text-gray-500 leading-relaxed font-medium text-sm">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="relative z-10 py-20 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl md:text-4xl font-bold mb-4">
            <span className="text-white">Ready to </span>
            <span className="bg-gradient-to-r from-[#F7931A] to-amber-400 bg-clip-text text-transparent">Dominate</span>
            <span className="text-white">?</span>
          </h2>
          <p className="text-gray-400 text-base mb-8 max-w-lg mx-auto">
            Join thousands of traders already using the most powerful multichain terminal.
          </p>
          <Link href="/app" className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-3.5 sm:px-8 sm:py-4 rounded-full bg-[#F7931A] text-black font-bold text-base sm:text-lg hover:scale-105 hover:shadow-[0_0_60px_rgba(247,147,26,0.4)] transition-all">
            Launch App
            <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
          </Link>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="relative z-10 py-8 px-6 border-t border-white/10">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <img src="https://i.imgur.com/8UIQt03.png" alt="Incubator" className="w-8 h-8 rounded-lg" />
            <span className="font-black text-[#F7931A] uppercase">Incubator</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-gray-500">
            <Link href="/docs" className="hover:text-white transition-colors">Docs</Link>
            <Link href="/app/explorer" className="hover:text-white transition-colors">Explorer</Link>
            <a href="https://twitter.com" target="_blank" rel="noopener" className="hover:text-white transition-colors flex items-center gap-1">
              Twitter <ExternalLink className="w-3 h-3" />
            </a>
          </div>
          <p className="text-sm text-gray-600">© 2024 Incubator Protocol</p>
        </div>
      </footer>

      {/* CSS for orbit animation */}
      <style jsx>{`
        @keyframes orbit {
          from { transform: rotate(0deg) translateX(250px) rotate(0deg); }
          to { transform: rotate(360deg) translateX(250px) rotate(-360deg); }
        }
        @media (max-width: 768px) {
          @keyframes orbit {
            from { transform: rotate(0deg) translateX(140px) rotate(0deg); }
            to { transform: rotate(360deg) translateX(140px) rotate(-360deg); }
          }
        }
        @media (max-width: 640px) {
          @keyframes orbit {
            from { transform: rotate(0deg) translateX(100px) rotate(0deg); }
            to { transform: rotate(360deg) translateX(100px) rotate(-360deg); }
          }
        }
        @keyframes gradient-shift {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        .animate-gradient-shift {
          animation: gradient-shift 3s ease infinite;
        }
      `}</style>
    </div>
  );
}
