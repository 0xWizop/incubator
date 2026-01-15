'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { SnapshotViewer } from '@/components/portfolio';
import { ArrowLeft, Info } from 'lucide-react';

import { LoadingSpinner } from '@/components/ui/Loading';

export default function PortfolioHistoryPage() {
    const { firebaseUser } = useAuth();
    const router = useRouter();
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
    }, []);

    if (!isClient) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-[var(--background)]">
                <LoadingSpinner size="lg" text="Loading history..." />
            </div>
        );
    }

    if (!firebaseUser) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-[var(--background)] p-6">
                <div className="max-w-md text-center">
                    <Info className="w-12 h-12 text-[var(--primary)] mx-auto mb-4" />
                    <h1 className="text-2xl font-bold mb-2">Sign In Required</h1>
                    <p className="text-[var(--foreground-muted)] mb-6">
                        Please sign in to view your portfolio history.
                    </p>
                    <button
                        onClick={() => router.push('/app')}
                        className="px-6 py-3 bg-[var(--primary)] text-black font-semibold rounded-lg hover:shadow-[0_0_20px_var(--primary-glow)] transition-all"
                    >
                        Go to App
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[var(--background)] text-white">
            {/* Top Navigation */}
            <div className="border-b border-[var(--border)] bg-[var(--background-secondary)]">
                <div className="max-w-7xl mx-auto px-6 py-4">
                    <button
                        onClick={() => router.back()}
                        className="flex items-center gap-2 text-[var(--foreground-muted)] hover:text-white transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        <span className="font-medium">Back</span>
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto p-6">
                <div className="bg-[var(--background-secondary)] border border-[var(--border)] rounded-2xl overflow-hidden shadow-xl">
                    <SnapshotViewer userId={firebaseUser.uid} />
                </div>

                {/* Info Card */}
                <div className="mt-6 p-4 bg-[var(--background-secondary)]/50 border border-[var(--border)] rounded-xl">
                    <div className="flex items-start gap-3">
                        <Info className="w-5 h-5 text-[var(--primary)] mt-0.5 flex-shrink-0" />
                        <div className="text-sm text-[var(--foreground-muted)]">
                            <p className="font-medium text-white mb-1">About Portfolio Snapshots</p>
                            <p>
                                Portfolio snapshots are captured automatically every 24 hours. They provide
                                a historical record of your holdings and their values over time. Use the date
                                selector above to view your portfolio at any point in the past.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
