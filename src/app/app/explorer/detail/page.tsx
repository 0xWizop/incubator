import { Suspense } from 'react';
import { ExplorerDetailClient } from '@/components/explorer/ExplorerDetailClient';

export default function ExplorerDetailPage() {
    return (
        <Suspense fallback={<div className="p-6 text-center">Loading...</div>}>
            <ExplorerDetailClient />
        </Suspense>
    );
}
