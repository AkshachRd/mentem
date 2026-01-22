'use client';

import type { Quote } from '../model/types';

import { useCallback } from 'react';
import { FileText } from 'lucide-react';

import { useQuoteStore } from '../model/store';

import { cn } from '@/shared/lib/utils';

interface QuoteBlockProps {
    quote: Quote;
    className?: string;
}

export function QuoteBlock({ quote, className }: QuoteBlockProps) {
    const navigateToQuote = useQuoteStore((s) => s.navigateToQuote);
    const activeQuoteId = useQuoteStore((s) => s.activeQuoteId);

    const handleClick = useCallback(() => {
        navigateToQuote(quote.id);
    }, [quote.id, navigateToQuote]);

    const isActive = activeQuoteId === quote.id;

    // Truncate long quotes for display
    const displayText = quote.text.length > 200 ? quote.text.slice(0, 200) + '...' : quote.text;

    return (
        <button
            className={cn(
                'w-full rounded-lg border p-3 text-left transition-all duration-200',
                'hover:bg-accent/50 cursor-pointer',
                'focus:ring-primary/50 focus:ring-2 focus:outline-none',
                isActive && 'ring-primary bg-primary/5 ring-2',
                className,
            )}
            type="button"
            onClick={handleClick}
        >
            <blockquote className="border-primary/50 border-l-2 pl-3 text-sm italic">
                {displayText}
            </blockquote>
            <div className="text-muted-foreground mt-2 flex items-center gap-1.5 text-xs">
                <FileText className="h-3 w-3" />
                <span>
                    {quote.source.fileName} — стр. {quote.source.position.pageNumber}
                </span>
            </div>
        </button>
    );
}
