'use client';

import { useAuth } from '@/context/AuthContext';
import { useLatestNews } from '@/hooks/useNews';

export function NewsMonitor() {
    const { user } = useAuth();

    // Only enable if user exists and has newsAlerts enabled
    // Defaults to false if user preferences aren't loaded yet
    const enableNotifications = user?.preferences?.notifications?.newsAlerts ?? false;

    // We use the hook with notifications enabled based on user preference
    // The hook itself handles logic to duplicate-check and only notify on new items
    useLatestNews(20, enableNotifications);

    return null; // Render nothing, just a logic component
}
