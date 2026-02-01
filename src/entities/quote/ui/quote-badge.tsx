'use client';

import type { Quote } from '../model/types';

import { X, FileText } from 'lucide-react';

import { cn } from '@/shared/lib/utils';

interface QuoteBadgeProps {
    quote: Quote;
    onRemove?: (quoteId: string) => void;
    className?: string;
}

export function QuoteBadge({ quote, onRemove, className }: QuoteBadgeProps) {
    // Truncate text for badge display
    const displayText = quote.text.length > 80 ? quote.text.slice(0, 80) + '...' : quote.text;

    return (
        <div
            className={cn(
                'bg-muted/80 border-border group relative flex items-start gap-2 rounded-lg border p-2',
                className,
            )}
        >
            <FileText className="text-muted-foreground mt-0.5 h-4 w-4 shrink-0" />
            <div className="min-w-0 flex-1">
                <p className="line-clamp-2 text-xs leading-relaxed">{displayText}</p>
                <p className="text-muted-foreground mt-1 text-[10px]">
                    {quote.source.fileName} — стр. {quote.source.position.pageNumber}
                </p>
            </div>
            {onRemove && (
                <button
                    className="text-muted-foreground hover:text-foreground hover:bg-muted -mt-1 -mr-1 rounded p-0.5 transition-colors"
                    type="button"
                    onClick={() => onRemove(quote.id)}
                >
                    <X className="h-3.5 w-3.5" />
                </button>
            )}
        </div>
    );
}
