export function NewsSkeleton() {
    return (
        <div className="p-3 border-b border-[var(--border)] animate-pulse">
            <div className="flex gap-2.5">
                {/* Image skeleton */}
                <div className="w-16 h-16 rounded-lg bg-[var(--background-tertiary)] flex-shrink-0" />

                {/* Content skeleton */}
                <div className="flex-1 space-y-2">
                    <div className="h-4 bg-[var(--background-tertiary)] rounded w-full" />
                    <div className="h-4 bg-[var(--background-tertiary)] rounded w-3/4" />
                    <div className="h-3 bg-[var(--background-tertiary)] rounded w-1/2" />
                </div>
            </div>
        </div>
    );
}
