'use client';

import { Suspense } from 'react';
import { SectorHeatmap } from '@/components/screener/SectorHeatmap';
import { LoadingSpinner } from '@/components/ui/Loading';
import { PaywallOverlay } from '@/components/ui/PaywallOverlay';

export default function HeatmapPage() {
    return (
        <div className="h-full w-full overflow-hidden flex flex-col">
            <div className="flex-1 min-h-0">
                <PaywallOverlay featureName="Market Heatmap" showPreview={false}>
                    <Suspense fallback={<LoadingSpinner text="Loading heatmap..." />}>
                        <SectorHeatmap />
                    </Suspense>
                </PaywallOverlay>
            </div>
        </div>
    );
}

