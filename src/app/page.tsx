'use client';

import Link from 'next/link';
import { ArrowRight, Zap, Shield, Globe, BarChart3, Layers, Wallet, ExternalLink, Play, ChevronDown, Eye, Newspaper, Sparkles, TrendingUp, Star } from 'lucide-react';
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
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [billingInterval, setBillingInterval] = useState<'monthly' | 'yearly'>('monthly');
  const [showCryptoModal, setShowCryptoModal] = useState(false);
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

  // Handle Stripe checkout
  const handleCheckout = async (interval: 'monthly' | 'yearly' = 'monthly') => {
    setCheckoutLoading(true);
    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: 'guest_' + Date.now(), // Guest checkout - will be linked later
          plan: 'pro',
          interval,
        }),
      });
      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error || 'Error starting checkout. Please try again.');
      }
    } catch (error) {
      console.error('Checkout error:', error);
      alert('Error starting checkout. Please try again.');
    }
    setCheckoutLoading(false);
  };

  // Copy address to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Address copied to clipboard!');
  };

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
            The ultimate multichain terminal. Trade, track, and analyze across Solana, Ethereum, Base & Arbitrum in one unified interface.
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

      {/* PRO FEATURES SHOWCASE */}
      <section className="relative z-10 py-24 px-6 overflow-hidden">
        <div className="max-w-6xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#F7931A]/30 bg-[#F7931A]/10 backdrop-blur-sm mb-6">
              <Sparkles className="w-4 h-4 text-[#F7931A]" />
              <span className="text-sm text-[#F7931A] font-medium">Pro Features</span>
            </div>
            <h2 className="text-2xl md:text-4xl font-bold tracking-tight mb-4">
              <span className="text-white">Professional Tools for </span>
              <span className="bg-gradient-to-r from-[#F7931A] to-amber-400 bg-clip-text text-transparent">Serious Traders</span>
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto text-base md:text-lg">
              Unlock advanced analytics, real-time tracking, and institutional-grade market data.
            </p>
          </div>

          {/* Feature Cards - Consistent Orange Theme */}
          <div className="grid lg:grid-cols-2 gap-6">
            {/* News Terminal */}
            <div className="group relative p-6 rounded-2xl bg-[#0A0A0A] border border-white/5 hover:border-[#F7931A]/40 transition-all duration-300">
              <div className="absolute top-4 right-4 px-2 py-0.5 rounded-full bg-[#F7931A]/10 border border-[#F7931A]/20">
                <span className="text-[10px] font-bold text-[#F7931A] uppercase">Pro</span>
              </div>
              <div className="w-12 h-12 rounded-xl bg-[#111111] border border-white/5 flex items-center justify-center mb-4 group-hover:border-[#F7931A]/30 transition-colors">
                <Newspaper className="w-6 h-6 text-gray-400 group-hover:text-[#F7931A] transition-colors" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2 group-hover:text-[#F7931A] transition-colors">News Terminal</h3>
              <p className="text-gray-500 text-sm leading-relaxed mb-4">
                Bloomberg-style crypto news aggregator with real-time feeds from 50+ sources and push notifications.
              </p>
              <ul className="space-y-1.5 text-sm text-gray-400">
                <li className="flex items-center gap-2">
                  <span className="w-1 h-1 rounded-full bg-[#F7931A]"></span>
                  Real-time news from 50+ sources
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1 h-1 rounded-full bg-[#F7931A]"></span>
                  Push notifications for breaking news
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1 h-1 rounded-full bg-[#F7931A]"></span>
                  Filter by chain, token, or sentiment
                </li>
              </ul>
            </div>

            {/* Wallet Tracker */}
            <div className="group relative p-6 rounded-2xl bg-[#0A0A0A] border border-white/5 hover:border-[#F7931A]/40 transition-all duration-300">
              <div className="absolute top-4 right-4 px-2 py-0.5 rounded-full bg-[#F7931A]/10 border border-[#F7931A]/20">
                <span className="text-[10px] font-bold text-[#F7931A] uppercase">Pro</span>
              </div>
              <div className="w-12 h-12 rounded-xl bg-[#111111] border border-white/5 flex items-center justify-center mb-4 group-hover:border-[#F7931A]/30 transition-colors">
                <Eye className="w-6 h-6 text-gray-400 group-hover:text-[#F7931A] transition-colors" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2 group-hover:text-[#F7931A] transition-colors">Wallet Tracker</h3>
              <p className="text-gray-500 text-sm leading-relaxed mb-4">
                Monitor any wallet in real-time. Track whale movements and get instant notifications on activity.
              </p>
              <ul className="space-y-1.5 text-sm text-gray-400">
                <li className="flex items-center gap-2">
                  <span className="w-1 h-1 rounded-full bg-[#F7931A]"></span>
                  Unlimited tracked wallets
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1 h-1 rounded-full bg-[#F7931A]"></span>
                  Real-time trade notifications
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1 h-1 rounded-full bg-[#F7931A]"></span>
                  Cross-chain activity monitoring
                </li>
              </ul>
            </div>

            {/* Market Heatmap */}
            <div className="group relative p-6 rounded-2xl bg-[#0A0A0A] border border-white/5 hover:border-[#F7931A]/40 transition-all duration-300">
              <div className="absolute top-4 right-4 px-2 py-0.5 rounded-full bg-[#F7931A]/10 border border-[#F7931A]/20">
                <span className="text-[10px] font-bold text-[#F7931A] uppercase">Pro</span>
              </div>
              <div className="w-12 h-12 rounded-xl bg-[#111111] border border-white/5 flex items-center justify-center mb-4 group-hover:border-[#F7931A]/30 transition-colors">
                <TrendingUp className="w-6 h-6 text-gray-400 group-hover:text-[#F7931A] transition-colors" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2 group-hover:text-[#F7931A] transition-colors">Market Heatmap</h3>
              <p className="text-gray-500 text-sm leading-relaxed mb-4">
                Visualize the entire crypto market at a glance. Identify hot sectors and trending tokens instantly.
              </p>
              <ul className="space-y-1.5 text-sm text-gray-400">
                <li className="flex items-center gap-2">
                  <span className="w-1 h-1 rounded-full bg-[#F7931A]"></span>
                  Real-time market visualization
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1 h-1 rounded-full bg-[#F7931A]"></span>
                  Sector performance tracking
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1 h-1 rounded-full bg-[#F7931A]"></span>
                  Multi-timeframe analysis
                </li>
              </ul>
            </div>

            {/* Priority Execution */}
            <div className="group relative p-6 rounded-2xl bg-[#0A0A0A] border border-white/5 hover:border-[#F7931A]/40 transition-all duration-300">
              <div className="absolute top-4 right-4 px-2 py-0.5 rounded-full bg-[#F7931A]/10 border border-[#F7931A]/20">
                <span className="text-[10px] font-bold text-[#F7931A] uppercase">Pro</span>
              </div>
              <div className="w-12 h-12 rounded-xl bg-[#111111] border border-white/5 flex items-center justify-center mb-4 group-hover:border-[#F7931A]/30 transition-colors">
                <Zap className="w-6 h-6 text-gray-400 group-hover:text-[#F7931A] transition-colors" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2 group-hover:text-[#F7931A] transition-colors">Priority Execution</h3>
              <p className="text-gray-500 text-sm leading-relaxed mb-4">
                Get your trades executed faster with priority routing, lower latency, and MEV protection.
              </p>
              <ul className="space-y-1.5 text-sm text-gray-400">
                <li className="flex items-center gap-2">
                  <span className="w-1 h-1 rounded-full bg-[#F7931A]"></span>
                  Faster trade execution
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1 h-1 rounded-full bg-[#F7931A]"></span>
                  MEV protection enabled
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1 h-1 rounded-full bg-[#F7931A]"></span>
                  Optimized routing algorithms
                </li>
              </ul>
            </div>
          </div>

          {/* CTA */}
          <div className="text-center mt-12">
            <Link
              href="#pricing"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-[#F7931A] text-black font-bold hover:scale-105 hover:shadow-[0_0_40px_rgba(247,147,26,0.3)] transition-all"
            >
              <Sparkles className="w-5 h-5" />
              Upgrade to Pro — $9.99/mo
            </Link>
          </div>
        </div>
      </section>
      {/* PRICING SECTION */}
      <section id="pricing" className="relative z-10 py-24 px-6">
        <div className="max-w-6xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/10 bg-white/5 backdrop-blur-sm mb-6">
              <span className="text-sm text-gray-300">Simple Pricing</span>
            </div>
            <h2 className="text-2xl md:text-4xl font-bold tracking-tight mb-4">
              <span className="text-white">Choose Your </span>
              <span className="bg-gradient-to-r from-[#F7931A] to-amber-400 bg-clip-text text-transparent">Trading Tier</span>
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto text-base md:text-lg">
              Start free and upgrade when you need more power. Beta testers get lifetime access.
            </p>
          </div>

          {/* Pricing Cards */}
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {/* Free Tier */}
            <div className="relative p-6 rounded-2xl bg-[#0A0A0A]/80 border border-white/10 backdrop-blur-sm">
              <div className="mb-6">
                <h3 className="text-xl font-bold text-white mb-2">Free</h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold text-white">$0</span>
                  <span className="text-gray-500">/forever</span>
                </div>
              </div>
              <ul className="space-y-3 mb-8">
                {[
                  'Multi-chain trading',
                  'Basic charts & token info',
                  '2 tracked wallets',
                  '5 news articles/day',
                  'Standard swap execution',
                ].map((feature) => (
                  <li key={feature} className="flex items-center gap-3 text-sm text-gray-300">
                    <div className="w-5 h-5 rounded-full bg-green-500/10 flex items-center justify-center">
                      <svg className="w-3 h-3 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    {feature}
                  </li>
                ))}
              </ul>
              <Link
                href="/app"
                className="block w-full py-3 px-6 rounded-full border border-white/20 text-center text-white font-medium hover:bg-white/5 transition-colors"
              >
                Get Started
              </Link>
            </div>

            {/* Pro Tier - Featured */}
            <div className="relative p-6 rounded-2xl bg-gradient-to-b from-[#F7931A]/10 to-[#0A0A0A]/80 border border-[#F7931A]/30 backdrop-blur-sm shadow-[0_0_60px_rgba(247,147,26,0.15)]">
              {/* Popular Badge */}
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-[#F7931A] text-black text-xs font-bold uppercase tracking-wider">
                Most Popular
              </div>
              <div className="mb-6 mt-2">
                <h3 className="text-xl font-bold text-white mb-2">Pro</h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold text-[#F7931A]">$9.99</span>
                  <span className="text-gray-500">/month</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">or $79.99/year (save 2 months)</p>
              </div>
              <ul className="space-y-3 mb-8">
                {[
                  'Everything in Free, plus:',
                  'Unlimited wallet tracking',
                  'Full news terminal access',
                  'Market heatmap',
                  'dApp analytics (coming soon)',
                  'Priority swap execution',
                ].map((feature, i) => (
                  <li key={feature} className={`flex items-center gap-3 text-sm ${i === 0 ? 'text-[#F7931A] font-medium' : 'text-gray-300'}`}>
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center ${i === 0 ? 'bg-[#F7931A]/20' : 'bg-[#F7931A]/10'}`}>
                      <svg className="w-3 h-3 text-[#F7931A]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    {feature}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => handleCheckout('monthly')}
                disabled={checkoutLoading}
                className="block w-full py-3 px-6 rounded-full bg-[#F7931A] text-black text-center font-bold hover:scale-105 hover:shadow-[0_0_40px_rgba(247,147,26,0.3)] transition-all disabled:opacity-50 disabled:cursor-wait"
              >
                {checkoutLoading ? 'Loading...' : 'Upgrade to Pro'}
              </button>
              <button
                onClick={() => handleCheckout('yearly')}
                disabled={checkoutLoading}
                className="block w-full mt-2 py-2 px-6 rounded-full border border-[#F7931A]/30 text-center text-[#F7931A] text-sm font-medium hover:bg-[#F7931A]/10 transition-all disabled:opacity-50"
              >
                Or pay $79.99/year (save 2 months)
              </button>

              {/* Crypto Payment Option */}
              <div className="relative mt-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/10"></div>
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-[#0A0A0A] px-2 text-gray-500">or</span>
                </div>
              </div>
              <button
                onClick={() => setShowCryptoModal(true)}
                className="flex flex-col items-center gap-2 w-full mt-4 py-3 px-6 rounded-xl border border-white/10 text-center hover:bg-white/5 transition-all"
              >
                <div className="flex items-center gap-2">
                  <img src="https://i.imgur.com/NKQlhQj.png" alt="ETH" className="w-4 h-4 rounded-full" />
                  <img src="https://i.imgur.com/xp7PYKk.png" alt="SOL" className="w-4 h-4 rounded-full" />
                  <img src="https://cryptologos.cc/logos/usd-coin-usdc-logo.png?v=040" alt="USDC" className="w-4 h-4 rounded-full" />
                </div>
                <span className="text-gray-400 text-xs font-medium hover:text-white">
                  Pay with Crypto (ETH, SOL, USDC)
                </span>
              </button>
            </div>

            {/* Lifetime / Beta Tier */}
            <div className="relative p-6 rounded-2xl bg-gradient-to-b from-[#B9F2FF]/5 to-[#0A0A0A]/80 border border-[#B9F2FF]/20 backdrop-blur-sm">
              <div className="mb-6">
                <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                  Lifetime
                  <span className="text-xs px-2 py-0.5 rounded-full bg-[#B9F2FF]/20 text-[#B9F2FF] font-medium">Beta Only</span>
                </h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold text-[#B9F2FF]">FREE</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">For beta testers only</p>
              </div>
              <ul className="space-y-3 mb-8">
                {[
                  'All Pro features forever',
                  'Lifetime Diamond tier',
                  'Lowest trading fees',
                  'Priority support',
                  'Early access to features',
                  '$INC Season 1 rewards',
                ].map((feature) => (
                  <li key={feature} className="flex items-center gap-3 text-sm text-gray-300">
                    <div className="w-5 h-5 rounded-full bg-[#B9F2FF]/10 flex items-center justify-center">
                      <svg className="w-3 h-3 text-[#B9F2FF]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    {feature}
                  </li>
                ))}
              </ul>
              <a
                href="https://discord.gg/366nqwwz"
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full py-3 px-6 rounded-full border border-[#B9F2FF]/30 text-center text-[#B9F2FF] font-medium hover:bg-[#B9F2FF]/5 transition-colors"
              >
                Join Beta (Jan 26)
              </a>
            </div>
          </div>

          {/* Bottom Note */}
          <p className="text-center text-gray-500 text-sm mt-8">
            Beta testing starts January 26th. All beta participants receive lifetime rewards.
          </p>
        </div>
      </section>
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
          <p className="text-sm text-gray-600">© 2026 Incubator Protocol</p>
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

      {/* Crypto Payment Modal */}
      {showCryptoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={() => setShowCryptoModal(false)}>
          <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="p-6 border-b border-white/10 text-center">
              <h3 className="text-xl font-bold text-white mb-2">Pay with Crypto</h3>
              <p className="text-sm text-gray-400">Send payment to one of the addresses below</p>
            </div>

            {/* Payment Options */}
            <div className="p-6 space-y-4">
              {/* ETH / Base / USDC */}
              <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex -space-x-2">
                    <img src="https://i.imgur.com/NKQlhQj.png" alt="ETH" className="w-6 h-6 rounded-full border-2 border-[#0a0a0a]" />
                    <img src="https://i.imgur.com/zn5hpMs.png" alt="Base" className="w-6 h-6 rounded-full border-2 border-[#0a0a0a]" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">ETH / USDC (Base or Ethereum)</p>
                    <p className="text-xs text-gray-500">$10 monthly or $80 yearly</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <code className="flex-1 px-3 py-2 bg-black rounded-lg text-xs text-gray-300 font-mono truncate">
                    0x05267817d402D34Fe6C0f79DF0eAB774dEd8e4E3
                  </code>
                  <button
                    onClick={() => copyToClipboard('0x05267817d402D34Fe6C0f79DF0eAB774dEd8e4E3')}
                    className="px-3 py-2 bg-[#F7931A] text-black rounded-lg text-xs font-bold hover:opacity-90"
                  >
                    Copy
                  </button>
                </div>
              </div>

              {/* Solana */}
              <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                <div className="flex items-center gap-3 mb-3">
                  <img src="https://i.imgur.com/xp7PYKk.png" alt="SOL" className="w-6 h-6 rounded-full" />
                  <div>
                    <p className="text-sm font-bold text-white">SOL / USDC (Solana)</p>
                    <p className="text-xs text-gray-500">$10 monthly or $80 yearly</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <code className="flex-1 px-3 py-2 bg-black rounded-lg text-xs text-gray-300 font-mono truncate">
                    Coming soon - contact us on Discord
                  </code>
                </div>
              </div>

              {/* Instructions */}
              <div className="p-4 rounded-xl bg-[#F7931A]/10 border border-[#F7931A]/20">
                <p className="text-xs text-[#F7931A] leading-relaxed">
                  <strong>After sending:</strong> Join our Discord and open a ticket with your wallet address and transaction hash. We'll activate Pro within 24 hours.
                </p>
              </div>

              <a
                href="https://discord.gg/incubatorxyz"
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full py-3 bg-[#5865F2] text-white text-center text-sm font-bold rounded-xl hover:opacity-90 transition-opacity"
              >
                Join Discord to Confirm Payment
              </a>
            </div>

            {/* Close */}
            <button
              onClick={() => setShowCryptoModal(false)}
              className="absolute top-4 right-4 p-2 text-gray-500 hover:text-white transition-colors"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
