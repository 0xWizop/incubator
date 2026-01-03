'use client';

import { useState } from 'react';
import { Copy, Check, Share2, AlertTriangle, Download } from 'lucide-react';
import { clsx } from 'clsx';
import { useWalletStore } from '@/store/walletStore';
import { CHAINS, ChainType } from '@/lib/wallet';
import { QRCodeSVG } from 'qrcode.react';

export function ReceiveTab() {
    const { activeWallet, activeChain, setActiveChain } = useWalletStore();
    const [copied, setCopied] = useState(false);

    const chainConfig = activeWallet?.type === 'solana' ? CHAINS.solana : CHAINS[activeChain];

    const handleCopy = () => {
        if (activeWallet) {
            navigator.clipboard.writeText(activeWallet.address);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const handleShare = async () => {
        if (activeWallet && navigator.share) {
            try {
                await navigator.share({
                    title: 'My Wallet Address',
                    text: `Send ${chainConfig.symbol} to: ${activeWallet.address}`,
                });
            } catch (err) {
                // User cancelled or share failed
            }
        }
    };

    const handleDownloadQR = () => {
        const svg = document.getElementById('wallet-qr-code');
        if (!svg) return;

        const svgData = new XMLSerializer().serializeToString(svg);
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();

        img.onload = () => {
            canvas.width = img.width;
            canvas.height = img.height;
            ctx?.drawImage(img, 0, 0);
            const pngFile = canvas.toDataURL('image/png');

            const downloadLink = document.createElement('a');
            downloadLink.download = `${chainConfig.symbol}-wallet-qr.png`;
            downloadLink.href = pngFile;
            downloadLink.click();
        };

        img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
    };

    const evmChains: ChainType[] = ['ethereum', 'base', 'arbitrum'];

    return (
        <div className="space-y-6">
            {/* Network Selector (EVM only) */}
            {activeWallet?.type !== 'solana' && (
                <div>
                    <p className="text-xs text-[var(--foreground-muted)] mb-2">Select Network</p>
                    <div className="flex gap-2">
                        {evmChains.map((chain) => (
                            <button
                                key={chain}
                                onClick={() => setActiveChain(chain)}
                                className={clsx(
                                    'flex items-center gap-2 px-3 py-2 rounded-xl transition-all flex-1',
                                    activeChain === chain
                                        ? 'bg-[var(--primary)]/10 border-2 border-[var(--primary)]'
                                        : 'bg-[var(--background-tertiary)] border border-[var(--border)] hover:border-[var(--primary)]/50'
                                )}
                            >
                                <img src={CHAINS[chain].logo} alt={chain} className="w-5 h-5 rounded-full" />
                                <span className="text-xs font-medium capitalize">{chain}</span>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* QR Code */}
            <div className="flex flex-col items-center p-6 rounded-2xl bg-white">
                <div className="mb-4">
                    {activeWallet && (
                        <QRCodeSVG
                            id="wallet-qr-code"
                            value={activeWallet.address}
                            size={180}
                            level="H"
                            includeMargin={true}
                            bgColor="#ffffff"
                            fgColor="#000000"
                        />
                    )}
                </div>
                <p className="text-xs text-gray-500">Scan to receive {chainConfig.symbol}</p>
            </div>

            {/* Address Display */}
            <div className="p-4 rounded-2xl bg-[var(--background-tertiary)] border border-[var(--border)]">
                <p className="text-xs text-[var(--foreground-muted)] mb-2">Your {chainConfig.name} Address</p>
                <div className="flex items-center gap-2">
                    <p className="flex-1 font-mono text-sm break-all">
                        {activeWallet?.address}
                    </p>
                    <button
                        onClick={handleCopy}
                        className="p-2 rounded-lg bg-[var(--background)] hover:bg-[var(--primary)]/10 transition-colors"
                    >
                        {copied ? (
                            <Check className="w-4 h-4 text-[var(--accent-green)]" />
                        ) : (
                            <Copy className="w-4 h-4 text-[var(--foreground-muted)]" />
                        )}
                    </button>
                </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
                <button
                    onClick={handleCopy}
                    className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-[var(--primary)] text-black font-medium hover:opacity-90 transition-all"
                >
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    {copied ? 'Copied!' : 'Copy Address'}
                </button>
                <button
                    onClick={handleDownloadQR}
                    className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-[var(--background-tertiary)] border border-[var(--border)] font-medium hover:border-[var(--primary)] transition-all"
                >
                    <Download className="w-4 h-4" />
                </button>
                <button
                    onClick={handleShare}
                    className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-[var(--background-tertiary)] border border-[var(--border)] font-medium hover:border-[var(--primary)] transition-all"
                >
                    <Share2 className="w-4 h-4" />
                </button>
            </div>

            {/* Warning */}
            <div className="flex gap-3 p-3 rounded-xl bg-[var(--accent-yellow)]/10 border border-[var(--accent-yellow)]/20">
                <AlertTriangle className="w-5 h-5 text-[var(--accent-yellow)] flex-shrink-0" />
                <div className="text-xs text-[var(--foreground-muted)]">
                    <p className="font-medium text-[var(--accent-yellow)] mb-1">Important</p>
                    <p>Only send <strong>{chainConfig.symbol}</strong> and tokens on <strong>{chainConfig.name}</strong> to this address. Sending other assets may result in permanent loss.</p>
                </div>
            </div>
        </div>
    );
}
