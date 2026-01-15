import React from 'react';
import { Shield, Key, Lock, CheckCircle2, ArrowRight, Download, Eye, Bell, Wallet, ChevronDown, Copy, Settings, ArrowDown, Home, ArrowUpRight, ArrowDownLeft, RefreshCw, Search } from 'lucide-react';

import { clsx } from 'clsx';

// ============================================
// COMPONENT: VISUAL STEP CARD
// ============================================
export function StepCard({ number, title, description, icon: Icon }: {
    number: number;
    title: string;
    description: string;
    icon?: any;
}) {
    return (
        <div className="relative p-6 rounded-xl bg-[var(--background-secondary)] border border-[var(--border)] group hover:border-[var(--primary)] transition-all overflow-hidden">
            {/* Number Watermark */}
            <div className="absolute -right-4 -bottom-6 text-9xl font-bold text-[var(--background-tertiary)] opacity-50 select-none pointer-events-none group-hover:text-[var(--primary)] group-hover:opacity-5 transition-colors">
                {number}
            </div>

            <div className="flex gap-4 relative z-10">
                <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-[var(--background-tertiary)] flex items-center justify-center border border-[var(--border)] group-hover:bg-[var(--primary)]/10 group-hover:border-[var(--primary)]/30 transition-colors">
                    {Icon ? (
                        <Icon className="w-6 h-6 text-[var(--primary)]" />
                    ) : (
                        <span className="text-xl font-bold text-[var(--primary)]">{number}</span>
                    )}
                </div>
                <div>
                    <h3 className="font-bold text-lg mb-2">{title}</h3>
                    <p className="text-[var(--foreground-muted)] text-sm leading-relaxed">{description}</p>
                </div>
            </div>
        </div>
    );
}

// ============================================
// COMPONENT: WALLET MOCKUP (High Fidelity)
// ============================================
export function WalletMockup() {
    return (
        <div className="mx-auto max-w-[360px] bg-[#050505] rounded-[30px] border border-[#222] overflow-hidden font-sans text-white shadow-2xl relative">
            {/* Status Bar Shim */}
            <div className="h-3 w-full bg-[#050505]"></div>

            {/* Header */}
            <div className="px-5 py-2 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#FF9F1C] flex items-center justify-center">
                        <Wallet className="w-5 h-5 text-black" />
                    </div>
                    <div>
                        <div className="flex items-center gap-1">
                            <span className="font-bold text-sm">Wallet 1</span>
                            <ChevronDown className="w-3 h-3 text-gray-500" />
                        </div>
                        <p className="text-[10px] text-gray-500 font-mono">0xD82A...2522</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <Copy className="w-4 h-4 text-gray-500" />
                    <Settings className="w-4 h-4 text-gray-500" />
                    <Lock className="w-4 h-4 text-red-500" />
                </div>
            </div>

            {/* Content Body */}
            <div className="p-5 pb-20">
                {/* Swap Header */}
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-2xl font-bold">Swap</h2>
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500">Slippage:</span>
                        <div className="flex bg-[#222] rounded-lg p-0.5">
                            <div className="px-2 py-1 rounded-md bg-[#555] text-[10px] font-bold text-white">0.5%</div>
                            <div className="px-2 py-1 rounded-md text-[10px] text-gray-400 hover:text-gray-200">1%</div>
                            <div className="px-2 py-1 rounded-md text-[10px] text-gray-400 hover:text-gray-200">2%</div>
                        </div>
                    </div>
                </div>

                {/* Pay Input */}
                <div className="bg-[#111] rounded-2xl p-4 mb-2">
                    <div className="flex justify-between mb-2">
                        <span className="text-xs text-gray-500 font-medium">You Pay</span>
                        <span className="text-xs text-gray-500">USD</span>
                    </div>
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-4xl font-medium text-gray-600">0</span>
                        <div className="flex items-center gap-2 bg-[#000] border border-[#333] rounded-full pl-2 pr-3 py-1.5">
                            <img src="https://i.imgur.com/NKQlhQj.png" className="w-5 h-5 rounded-full" alt="ETH" />
                            <span className="font-bold text-sm">ETH</span>
                            <ChevronDown className="w-3 h-3 text-gray-500" />
                        </div>
                    </div>
                    <div className="flex items-center justify-between gap-2 overflow-hidden">
                        <div className="flex gap-1.5 flex-1 min-w-0">
                            {['25%', '50%', '75%', 'Max'].map(p => (
                                <button key={p} className="px-2 py-1 rounded-lg bg-[#444] border border-[#555] text-[10px] font-bold text-gray-200 hover:bg-[#555] hover:text-white whitespace-nowrap transition-colors">
                                    {p}
                                </button>
                            ))}
                        </div>
                        <div className="text-[10px] text-gray-500 whitespace-nowrap bg-[#111] pl-2">
                            Bal: 0.0000 ETH
                        </div>
                    </div>
                </div>

                {/* Swap Icon Divider */}
                <div className="flex justify-center -my-3 relative z-10">
                    <div className="w-8 h-8 rounded-full bg-[#111] border-2 border-[#000] flex items-center justify-center">
                        <ArrowDown className="w-4 h-4 text-[#FF9F1C]" />
                    </div>
                </div>

                {/* Receive Input */}
                <div className="bg-[#111] rounded-2xl p-4 mt-1 mb-4">
                    <div className="flex justify-between mb-3">
                        <span className="text-xs text-gray-500 font-medium">You Receive</span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-4xl font-medium text-gray-600">0</span>
                        <div className="flex items-center gap-2 bg-[#000] border border-[#333] rounded-full pl-2 pr-3 py-1.5">
                            <div className="w-5 h-5 rounded-full bg-[#2775CA] flex items-center justify-center text-[8px] font-bold text-white">$</div>
                            <span className="font-bold text-sm">USDC</span>
                            <ChevronDown className="w-3 h-3 text-gray-500" />
                        </div>
                    </div>
                </div>

                {/* Main Action Button */}
                <div className="w-full py-4 rounded-xl bg-[#222] text-[#555] font-bold text-center text-sm mb-4">
                    Enter amount
                </div>
            </div>

            {/* Bottom Nav */}
            <div className="absolute bottom-0 left-0 right-0 bg-[#000] border-t border-[#222] px-6 py-4 flex justify-between items-end">
                <div className="flex flex-col items-center gap-1 opacity-50">
                    <Home className="w-5 h-5" />
                    <span className="text-[10px]">Home</span>
                </div>
                <div className="flex flex-col items-center gap-1 opacity-50">
                    <ArrowUpRight className="w-5 h-5" />
                    <span className="text-[10px]">Send</span>
                </div>
                <div className="flex flex-col items-center gap-1 opacity-50">
                    <ArrowDownLeft className="w-5 h-5" />
                    <span className="text-[10px]">Receive</span>
                </div>
                <div className="flex flex-col items-center gap-1 text-[#FF9F1C]">
                    <RefreshCw className="w-5 h-5" />
                    <span className="text-[10px]">Swap</span>
                </div>
                <div className="flex flex-col items-center gap-1 opacity-50">
                    <Search className="w-5 h-5" />
                    <span className="text-[10px]">Search</span>
                </div>
            </div>
        </div>
    );
}

// ============================================
// COMPONENT: WALLET BACKUP DIAGRAM (Compact)
// ============================================
export function WalletBackupDiagram() {
    return (
        <div className="my-6 p-4 rounded-xl bg-[var(--background-secondary)] border border-[var(--border)]">
            <h3 className="text-xs font-bold text-[var(--foreground-muted)] uppercase tracking-wider mb-4 text-center">
                Non-Custodial Security Model
            </h3>

            <div className="flex items-center justify-between max-w-lg mx-auto gap-2">
                {/* Node 1 */}
                <div className="flex-1 flex flex-col items-center text-center gap-2">
                    <div className="w-10 h-10 rounded-lg bg-[var(--primary)]/10 flex items-center justify-center border border-[var(--primary)]/20">
                        <Key className="w-5 h-5 text-[var(--primary)]" />
                    </div>
                    <span className="text-[10px] font-bold leading-tight">Private<br />Key</span>
                </div>

                {/* Arrow */}
                <div className="h-[1px] flex-1 bg-[var(--border)] relative">
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 -translate-x-1/2">
                        <ArrowRight className="w-3 h-3 text-[var(--foreground-muted)]" />
                    </div>
                </div>

                {/* Node 2 */}
                <div className="flex-1 flex flex-col items-center text-center gap-2">
                    <div className="w-10 h-10 rounded-lg bg-[var(--background-tertiary)] flex items-center justify-center border border-[var(--border)]">
                        <Lock className="w-5 h-5 text-[var(--foreground)]" />
                    </div>
                    <span className="text-[10px] font-bold leading-tight">Your<br />Password</span>
                </div>

                {/* Arrow */}
                <div className="h-[1px] flex-1 bg-[var(--border)] relative">
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 -translate-x-1/2">
                        <ArrowRight className="w-3 h-3 text-[var(--foreground-muted)]" />
                    </div>
                </div>

                {/* Node 3 */}
                <div className="flex-1 flex flex-col items-center text-center gap-2">
                    <div className="w-10 h-10 rounded-lg bg-[var(--accent-green)]/10 flex items-center justify-center border border-[var(--accent-green)]/20 shadow-[0_0_10px_rgba(0,255,100,0.1)]">
                        <Shield className="w-5 h-5 text-[var(--accent-green)]" />
                    </div>
                    <span className="text-[10px] font-bold leading-tight">Encrypted<br />Storage</span>
                </div>
            </div>
        </div>
    );
}

// ============================================
// COMPONENT: DOWNLOAD BACKUP UI
// ============================================
export function BackupUI() {
    return (
        <div className="my-6 max-w-md mx-auto rounded-xl border border-[var(--border)] bg-[#1A1D24] overflow-hidden shadow-2xl">
            <div className="bg-[#2B303B] px-4 py-3 flex items-center justify-between border-b border-[var(--border)]">
                <span className="text-xs font-mono text-[var(--foreground-muted)]">Backup Wallet</span>
                <div className="flex gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-red-500/50" />
                    <div className="w-2 h-2 rounded-full bg-yellow-500/50" />
                    <div className="w-2 h-2 rounded-full bg-green-500/50" />
                </div>
            </div>

            <div className="p-6 flex flex-col items-center text-center">
                <div className="mb-4 p-4 rounded-full bg-[var(--primary)]/10">
                    <Download className="w-8 h-8 text-[var(--primary)]" />
                </div>
                <h4 className="font-bold text-white mb-1">Download Recovery Key</h4>
                <p className="text-xs text-[var(--foreground-muted)] mb-6 max-w-[200px]">
                    Save this file in a secure location. It contains your encrypted private key.
                </p>

                <button className="w-full py-2 bg-[var(--primary)] text-black text-sm font-bold rounded-lg hover:opacity-90 transition-opacity mb-3">
                    Download .JSON File
                </button>
                <button className="text-xs text-[var(--foreground-muted)] hover:text-white transition-colors">
                    Copy Private Key
                </button>
            </div>
        </div>
    );
}

// ============================================
// COMPONENT: TRACKER NOTIFICATION UI
// ============================================
export function TrackerNotificationUI() {
    return (
        <div className="my-6 max-w-sm mx-auto">
            <div className="bg-[#202020] rounded-lg shadow-lg border border-[var(--border)] p-4 flex gap-3 animate-in fade-in slide-in-from-bottom-2 duration-500">
                <div className="w-10 h-10 rounded-full bg-[var(--primary)]/20 flex items-center justify-center shrink-0">
                    <Bell className="w-5 h-5 text-[var(--primary)]" />
                </div>
                <div>
                    <h4 className="font-bold text-sm">Whale Alert 🐋</h4>
                    <p className="text-xs text-[var(--foreground-muted)] mt-0.5">
                        <span className="text-[var(--primary)]">Vitalik.eth</span> swapped <span className="text-white">500 ETH</span> for <span className="text-white">USDC</span>
                    </p>
                    <p className="text-[10px] text-[var(--foreground-muted)] mt-1.5">Just now • Incubator Tracker</p>
                </div>
            </div>
        </div>
    );
}
