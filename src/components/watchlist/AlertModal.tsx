'use client';

import React, { useState, useEffect, useRef } from 'react';
import { X, Bell, TrendingUp, TrendingDown, Percent, AlertCircle } from 'lucide-react';
import { clsx } from 'clsx';
import { useWatchlistStore } from '@/store';
import { useAuth } from '@/context/AuthContext';
import { ChainId } from '@/types';

interface AlertModalProps {
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
    };
}

type AlertType = 'price_above' | 'price_below' | 'percent_up' | 'percent_down';

export function AlertModal({ isOpen, onClose, tokenData }: AlertModalProps) {
    const modalRef = useRef<HTMLDivElement>(null);
    const { firebaseUser } = useAuth();
    const { addAlert } = useWatchlistStore();

    const [alertType, setAlertType] = useState<AlertType>('price_above');
    const [targetValue, setTargetValue] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    // Reset form when modal opens
    useEffect(() => {
        if (isOpen) {
            setAlertType('price_above');
            setTargetValue('');
            setError('');
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

    const alertOptions: { type: AlertType; label: string; icon: React.ElementType; description: string }[] = [
        { type: 'price_above', label: 'Price Above', icon: TrendingUp, description: 'Alert when price goes above target' },
        { type: 'price_below', label: 'Price Below', icon: TrendingDown, description: 'Alert when price drops below target' },
        { type: 'percent_up', label: '% Increase (1h)', icon: Percent, description: 'Alert on percentage gain in 1 hour' },
        { type: 'percent_down', label: '% Decrease (1h)', icon: Percent, description: 'Alert on percentage drop in 1 hour' },
    ];

    const handleSubmit = async () => {
        if (!firebaseUser?.uid) return;

        const value = parseFloat(targetValue);
        if (isNaN(value) || value <= 0) {
            setError('Please enter a valid number');
            return;
        }

        // For percent alerts, validate reasonable percentage
        if ((alertType === 'percent_up' || alertType === 'percent_down') && value > 1000) {
            setError('Percentage must be under 1000%');
            return;
        }

        setIsSubmitting(true);
        setError('');

        try {
            // Calculate target price for percent-based alerts
            let condition: 'above' | 'below' = alertType.includes('above') || alertType.includes('up') ? 'above' : 'below';
            let targetPrice = value;

            if (alertType === 'percent_up') {
                targetPrice = tokenData.currentPrice * (1 + value / 100);
            } else if (alertType === 'percent_down') {
                targetPrice = tokenData.currentPrice * (1 - value / 100);
            }

            await addAlert(firebaseUser.uid, {
                tokenAddress: tokenData.address,
                pairAddress: tokenData.pairAddress,
                chainId: tokenData.chainId,
                symbol: tokenData.symbol,
                name: tokenData.name,
                logo: tokenData.logo,
                condition,
                targetPrice,
                priceAtCreation: tokenData.currentPrice,
            });

            onClose();
        } catch (err) {
            setError('Failed to create alert');
        } finally {
            setIsSubmitting(false);
        }
    };

    const getPlaceholder = () => {
        if (alertType === 'percent_up' || alertType === 'percent_down') {
            return 'e.g. 10';
        }
        return `e.g. ${tokenData.currentPrice.toFixed(tokenData.currentPrice < 0.01 ? 6 : 4)}`;
    };

    const getInputLabel = () => {
        if (alertType === 'percent_up' || alertType === 'percent_down') {
            return 'Percentage (%)';
        }
        return 'Target Price (USD)';
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div
                ref={modalRef}
                className="w-full max-w-md bg-[var(--background-secondary)] border border-[var(--border)] rounded-2xl shadow-2xl overflow-hidden"
            >
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)]">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-[var(--primary)] rounded-lg">
                            <Bell className="w-5 h-5 text-black" />
                        </div>
                        <div>
                            <h3 className="font-semibold">Set Price Alert</h3>
                            <p className="text-xs text-[var(--foreground-muted)]">{tokenData.symbol} • ${tokenData.currentPrice.toFixed(tokenData.currentPrice < 0.01 ? 6 : 4)}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-[var(--background-tertiary)] rounded-lg transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-5 space-y-5">
                    {/* Alert Type Selection */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-[var(--foreground-muted)]">Alert Type</label>
                        <div className="grid grid-cols-2 gap-2">
                            {alertOptions.map((option) => (
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

                    {/* Target Value Input */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-[var(--foreground-muted)]">{getInputLabel()}</label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--foreground-muted)]">
                                {alertType.includes('percent') ? '%' : '$'}
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
                        {alertType.includes('percent') && targetValue && (
                            <p className="text-xs text-[var(--foreground-muted)]">
                                Target price: ${(tokenData.currentPrice * (1 + (alertType === 'percent_up' ? 1 : -1) * parseFloat(targetValue || '0') / 100)).toFixed(6)}
                            </p>
                        )}
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
                            Sign in to create price alerts
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}

export default AlertModal;
