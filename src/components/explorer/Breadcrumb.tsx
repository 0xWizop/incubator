'use client';

import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';

interface BreadcrumbItem {
    label: string;
    href?: string;
}

interface BreadcrumbProps {
    items: BreadcrumbItem[];
}

export function Breadcrumb({ items }: BreadcrumbProps) {
    return (
        <nav className="flex items-center gap-1.5 text-sm mb-4 overflow-x-auto">
            <Link
                href="/app/explorer"
                className="flex items-center gap-1 text-[var(--foreground-muted)] hover:text-[var(--primary)] transition-colors whitespace-nowrap"
            >
                <span>Explorer</span>
            </Link>

            {items.map((item, index) => (
                <div key={index} className="flex items-center gap-1.5">
                    <ChevronRight className="w-4 h-4 text-[var(--border)]" />
                    {item.href ? (
                        <Link
                            href={item.href}
                            className="text-[var(--foreground-muted)] hover:text-[var(--primary)] transition-colors whitespace-nowrap"
                        >
                            {item.label}
                        </Link>
                    ) : (
                        <span className="text-[var(--foreground)] font-medium whitespace-nowrap">
                            {item.label}
                        </span>
                    )}
                </div>
            ))}
        </nav>
    );
}
