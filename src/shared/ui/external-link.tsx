'use client';

import { ExternalLink as ExternalLinkIcon } from 'lucide-react';

import { openExternalUrl } from '@/shared/lib/open-url';
import { cn } from '@/shared/lib/utils';

type ExternalLinkProps = {
    href: string;
    children: React.ReactNode;
    className?: string;
    iconSize?: number;
};

export function ExternalLink({ href, children, className, iconSize = 16 }: ExternalLinkProps) {
    return (
        <button
            className={cn('flex cursor-pointer items-center gap-1', className)}
            type="button"
            onClick={(e) => {
                e.stopPropagation();
                openExternalUrl(href);
            }}
        >
            <ExternalLinkIcon size={iconSize} />
            {children}
        </button>
    );
}
