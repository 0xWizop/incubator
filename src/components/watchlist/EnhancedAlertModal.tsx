'use client';

import React, { useState, useEffect, useRef } from 'react';
import { X, Bell, TrendingUp, TrendingDown, Percent, AlertCircle, BarChart3, Droplets, Clock } from 'lucide-react';
import { clsx } from 'clsx';
import { useWatchlistStore } from '@/store';
import { useAuth } from '@/context/AuthContext';
import { ChainId, AlertConditionType, AlertTimeframe } from '@/types';
import { createEnhancedAlert } from '@/lib/firebase/collections-extended';

interface EnhancedAlertModalProps {
    isOpen: boolean;
    onClose: () => void;
    tokenData: {
        address: string;
        pairAddress: string;
        chainId: ChainId;
        symbol: string;
        name: string;
        logo?: string;
        currentPrice: number;
        volume24h?: number;
        liquidity?: number;
    };
}

interface AlertOption {
    type: AlertConditionType;
    label: string;
    icon: React.ElementType;
    description: string;
    category: 'price' | 'volume' | 'liquidity';
}

export function EnhancedAlertModal({ isOpen, onClose, tokenData }: EnhancedAlertModalProps) {
    const modalRef = useRef<HTMLDivElement>(null);
    const { firebaseUser } = useAuth();
    const { addAlert } = useWatchlistStore();

    const [alertType, setAlertType] = useState<AlertConditionType>('price_above');
    const [targetValue, setTargetValue] = useState('');
    const [timeframe, setTimeframe] = useState<AlertTimeframe>('24h');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [activeCategory, setActiveCategory] = useState<'price' | 'volume' | 'liquidity'>('price');

    // Reset form when modal opens
    useEffect(() => {
        if (isOpen) {
            setAlertType('price_above');
            setTargetValue('');
            setTimeframe('24h');
            setError('');
            setActiveCategory('price');
        }
    }, [isOpen]);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
                onClose();
            }
        };
        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen, onClose]);

    // Close on escape
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [onClose]);

    if (!isOpen) return null;

    const alertOptions: AlertOption[] = [
        // Price alerts
        { type: 'price_above', label: 'Price Above', icon: TrendingUp, description: 'Alert when price rises above target', category: 'price' },
        { type: 'price_below', label: 'Price Below', icon: TrendingDown, description: 'Alert when price drops below target', category: 'price' },
        { type: 'percent_change', label: '% Change', icon: Percent, description: 'Alert on percentage price change', category: 'price' },
        // Volume alerts
        { type: 'volume_above', label: 'Volume Above', icon: BarChart3, description: 'Alert when 24h volume exceeds target', category: 'volume' },
        { type: 'volume_below', label: 'Volume Below', icon: BarChart3, description: 'Alert when 24h volume drops below target', category: 'volume' },
        // Liquidity alerts
        { type: 'liquidity_change', label: 'Liquidity Change', icon: Droplets, description: 'Alert on liquidity pool changes', category: 'liquidity' },
    ];

    const filteredOptions = alertOptions.filter(o => o.category === activeCategory);

    const handleSubmit = async () => {
        if (!firebaseUser?.uid) return;

        const value = parseFloat(targetValue);
        if (isNaN(value) || value <= 0) {
            setError('Please enter a valid number');
            return;
        }

        // Validate based on alert type
        if (alertType === 'percent_change' && value > 1000) {
            setError('Percentage must be under 1000%');
            return;
        }

        setIsSubmitting(true);
        setError('');

        try {
            // Get current value based on alert type
            let currentValue = tokenData.currentPrice;
            if (alertType === 'volume_above' || alertType === 'volume_below') {
                currentValue = tokenData.volume24h || 0;
            } else if (alertType === 'liquidity_change') {
                currentValue = tokenData.liquidity || 0;
            }

            await createEnhancedAlert(firebaseUser.uid, {
                tokenAddress: tokenData.address,
                pairAddress: tokenData.pairAddress,
                chainId: tokenData.chainId,
                symbol: tokenData.symbol,
                name: tokenData.name,
                logo: tokenData.logo,
                conditionType: alertType,
                targetValue: value,
                currentValue,
                timeframe: alertType === 'percent_change' ? timeframe : undefined,
            });

            onClose();
        } catch (err) {
            setError('Failed to create alert');
        } finally {
            setIsSubmitting(false);
        }
    };

    const getPlaceholder = () => {
        switch (alertType) {
            case 'percent_change':
                return 'e.g. 10';
            case 'volume_above':
            case 'volume_below':
                return 'e.g. 1000000';
            case 'liquidity_change':
                return 'e.g. 500000';
            default:
                return `e.g. ${tokenData.currentPrice.toFixed(tokenData.currentPrice < 0.01 ? 6 : 4)}`;
        }
    };

    const getInputLabel = () => {
        switch (alertType) {
            case 'percent_change':
                return 'Percentage (%)';
            case 'volume_above':
            case 'volume_below':
                return 'Volume (USD)';
            case 'liquidity_change':
                return 'Liquidity Change (%)';
            default:
                return 'Target Price (USD)';
        }
    };

    const getCurrentValue = () => {
        switch (alertType) {
            case 'volume_above':
            case 'volume_below':
                return tokenData.volume24h ? `$${(tokenData.volume24h / 1000000).toFixed(2)}M` : 'N/A';
            case 'liquidity_change':
                return tokenData.liquidity ? `$${(tokenData.liquidity / 1000000).toFixed(2)}M` : 'N/A';
            default:
                return `$${tokenData.currentPrice.toFixed(tokenData.currentPrice < 0.01 ? 6 : 4)}`;
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div
                ref={modalRef}
                className="w-full max-w-lg bg-[var(--background-secondary)] border border-[var(--border)] rounded-2xl shadow-2xl overflow-hidden"
            >
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)]">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-[var(--primary)] rounded-lg">
                            <Bell className="w-5 h-5 text-black" />
                        </div>
                        <div>
                            <h3 className="font-semibold">Create Alert</h3>
                            <p className="text-xs text-[var(--foreground-muted)]">
                                {tokenData.symbol} • Current: {getCurrentValue()}
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-[var(--background-tertiary)] rounded-lg transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-5 space-y-5">
                    {/* Category Tabs */}
                    <div className="flex gap-2">
                        {(['price', 'volume', 'liquidity'] as const).map((cat) => (
                            <button
                                key={cat}
                                onClick={() => {
                                    setActiveCategory(cat);
                                    const firstOption = alertOptions.find(o => o.category === cat);
                                    if (firstOption) setAlertType(firstOption.type);
                                }}
                                className={clsx(
                                    'flex-1 px-3 py-2 rounded-lg text-sm font-medium capitalize transition-colors',
                                    activeCategory === cat
                                        ? 'bg-[var(--primary)] text-black'
                                        : 'bg-[var(--background-tertiary)] hover:bg-[var(--background-tertiary)]/80'
                                )}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>

                    {/* Alert Type Selection */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-[var(--foreground-muted)]">Alert Type</label>
                        <div className="grid grid-cols-2 gap-2">
                            {filteredOptions.map((option) => (
                                <button
                                    key={option.type}
                                    onClick={() => setAlertType(option.type)}
                                    className={clsx(
                                        'flex items-center gap-2 px-3 py-3 rounded-lg border transition-all text-left',
                                        alertType === option.type
                                            ? 'bg-[var(--primary)] text-black border-[var(--primary)]'
                                            : 'bg-[var(--background-tertiary)] border-[var(--border)] hover:border-[var(--border-hover)]/50'
                                    )}
                                >
                                    <option.icon className="w-4 h-4" />
                                    <span className="text-sm font-medium">{option.label}</span>
                                </button>
                            ))}
                        </div>
                        <p className="text-xs text-[var(--foreground-muted)]">
                            {alertOptions.find(o => o.type === alertType)?.description}
                        </p>
                    </div>

                    {/* Timeframe Selector (for percent change) */}
                    {alertType === 'percent_change' && (
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-[var(--foreground-muted)] flex items-center gap-2">
                                <Clock className="w-4 h-4" />
                                Timeframe
                            </label>
                            <div className="flex gap-2">
                                {(['1h', '24h', '7d'] as AlertTimeframe[]).map((tf) => (
                                    <button
                                        key={tf}
                                        onClick={() => setTimeframe(tf)}
                                        className={clsx(
                                            'flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                                            timeframe === tf
                                                ? 'bg-[var(--primary)] text-black'
                                                : 'bg-[var(--background-tertiary)] hover:bg-[var(--background-tertiary)]/80'
                                        )}
                                    >
                                        {tf}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Target Value Input */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-[var(--foreground-muted)]">{getInputLabel()}</label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--foreground-muted)]">
                                {alertType === 'percent_change' || alertType === 'liquidity_change' ? '%' : '$'}
                            </span>
                            <input
                                type="number"
                                value={targetValue}
                                onChange={(e) => setTargetValue(e.target.value)}
                                placeholder={getPlaceholder()}
                                className="w-full pl-8 pr-4 py-3 bg-[var(--background-tertiary)] border border-[var(--border)] rounded-lg text-lg font-mono focus:border-[var(--border-hover)] focus:outline-none transition-colors"
                                step="any"
                            />
                        </div>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="flex items-center gap-2 p-3 bg-[var(--accent-red)]/10 border border-[var(--accent-red)]/30 rounded-lg text-[var(--accent-red)]">
                            <AlertCircle className="w-4 h-4" />
                            <span className="text-sm">{error}</span>
                        </div>
                    )}

                    {/* Submit Button */}
                    <button
                        onClick={handleSubmit}
                        disabled={!targetValue || isSubmitting || !firebaseUser}
                        className="w-full py-3 bg-[var(--primary)] text-black font-semibold rounded-lg hover:shadow-[0_0_15px_var(--primary-glow)] disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                    >
                        {isSubmitting ? (
                            <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                        ) : (
                            <>
                                <Bell className="w-4 h-4" />
                                Create Alert
                            </>
                        )}
                    </button>

                    {!firebaseUser && (
                        <p className="text-center text-xs text-[var(--foreground-muted)]">
                            Sign in to create alerts
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}

export default EnhancedAlertModal;
