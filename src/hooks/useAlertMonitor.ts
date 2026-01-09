'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useWatchlistStore } from '@/store';
import { useAuth } from '@/context/AuthContext';
import { markAlertTriggered } from '@/lib/firebase/collections';
import { PriceAlert } from '@/types';

const POLL_INTERVAL = 30000; // Check every 30 seconds

// Request notification permission
async function requestNotificationPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
        console.log('Browser does not support notifications');
        return false;
    }

    if (Notification.permission === 'granted') {
        return true;
    }

    if (Notification.permission !== 'denied') {
        const permission = await Notification.requestPermission();
        return permission === 'granted';
    }

    return false;
}

// Show browser notification
function showNotification(alert: PriceAlert, currentPrice: number) {
    if (Notification.permission !== 'granted') return;

    const direction = alert.condition === 'above' ? '📈 Above' : '📉 Below';
    const notification = new Notification(`Price Alert: ${alert.symbol}`, {
        body: `${alert.symbol} is now ${direction} $${alert.targetPrice.toFixed(6)}\nCurrent: $${currentPrice.toFixed(6)}`,
        icon: alert.logo || '/icon.png',
        tag: alert.id, // Prevent duplicate notifications
        requireInteraction: true,
    });

    notification.onclick = () => {
        window.focus();
        notification.close();
    };
}

// Fetch current price for a token
async function fetchTokenPrice(chainId: string, pairAddress: string): Promise<number | null> {
    try {
        const response = await fetch(
            `https://api.dexscreener.com/latest/dex/pairs/${chainId}/${pairAddress}`
        );
        const data = await response.json();
        return data.pair?.priceUsd ? parseFloat(data.pair.priceUsd) : null;
    } catch (error) {
        console.error('Error fetching price for alert:', error);
        return null;
    }
}

export function useAlertMonitor() {
    const { firebaseUser } = useAuth();
    const { alerts, initialize, isInitialized } = useWatchlistStore();
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    const checkAlerts = useCallback(async () => {
        const activeAlerts = alerts.filter(a => !a.triggered);

        if (activeAlerts.length === 0) return;

        // Check each active alert
        for (const alert of activeAlerts) {
            const currentPrice = await fetchTokenPrice(alert.chainId, alert.pairAddress);

            if (currentPrice === null) continue;

            let triggered = false;

            if (alert.condition === 'above' && currentPrice >= alert.targetPrice) {
                triggered = true;
            } else if (alert.condition === 'below' && currentPrice <= alert.targetPrice) {
                triggered = true;
            }

            if (triggered) {
                console.log(`🔔 Alert triggered: ${alert.symbol} at $${currentPrice}`);

                // Mark as triggered in Firestore
                await markAlertTriggered(alert.id);

                // Update local state
                useWatchlistStore.setState(state => ({
                    alerts: state.alerts.map(a =>
                        a.id === alert.id ? { ...a, triggered: true } : a
                    )
                }));

                // Show browser notification
                showNotification(alert, currentPrice);
            }
        }
    }, [alerts]);

    useEffect(() => {
        // Request notification permission on mount
        requestNotificationPermission();
    }, []);

    useEffect(() => {
        // Initialize watchlist store if needed
        if (!isInitialized && firebaseUser?.uid) {
            initialize(firebaseUser.uid);
        }
    }, [firebaseUser?.uid, isInitialized, initialize]);

    useEffect(() => {
        // Start polling when there are active alerts
        const activeAlerts = alerts.filter(a => !a.triggered);

        if (activeAlerts.length > 0) {
            // Check immediately
            checkAlerts();

            // Then poll every 30 seconds
            intervalRef.current = setInterval(checkAlerts, POLL_INTERVAL);

            console.log(`📊 Monitoring ${activeAlerts.length} price alerts`);
        }

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
        };
    }, [alerts, checkAlerts]);

    return {
        activeAlerts: alerts.filter(a => !a.triggered).length,
        triggeredAlerts: alerts.filter(a => a.triggered).length,
    };
}
