'use client';

import { useState, useEffect } from 'react';

export function TimeAgo({ timestamp }: { timestamp: number }) {
    const [timeAgo, setTimeAgo] = useState<string>('Just now');

    useEffect(() => {
        const updateTime = () => {
            const now = Math.floor(Date.now() / 1000);
            const diff = now - timestamp;

            if (diff < 10) {
                setTimeAgo('Just now');
            } else if (diff < 60) {
                setTimeAgo(`${diff} secs ago`);
            } else if (diff < 3600) {
                setTimeAgo(`${Math.floor(diff / 60)}m ${diff % 60}s ago`);
            } else {
                const hours = Math.floor(diff / 3600);
                const minutes = Math.floor((diff % 3600) / 60);
                setTimeAgo(`${hours}h ${minutes}m ago`);
            }
        };

        updateTime();
        const interval = setInterval(updateTime, 1000);
        return () => clearInterval(interval);
    }, [timestamp]);

    return <span className="font-mono tabular-nums">{timeAgo}</span>;
}
