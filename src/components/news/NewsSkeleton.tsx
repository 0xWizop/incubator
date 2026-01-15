export function NewsSkeleton() {
    return (
        <div className="p-3 border-b border-[var(--border)] animate-pulse flex items-start gap-3 pl-4 relative font-mono">
            <div className="w-2 h-2 mt-1 bg-[var(--primary)]/20 rounded-full shrink-0" />
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                    <div className="h-3 w-16 bg-[var(--primary)]/10 rounded" />
                    <div className="h-3 w-12 bg-[var(--foreground-muted)]/10 rounded" />
                </div>
                <div className="space-y-1.5">
                    <div className="h-4 bg-[var(--foreground-muted)]/20 rounded w-full" />
                    <div className="h-4 bg-[var(--foreground-muted)]/20 rounded w-3/4" />
                </div>
            </div>
        </div>
    );
}
