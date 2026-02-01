'use client';

import React, { useRef, useCallback, useEffect, KeyboardEvent, ClipboardEvent } from 'react';
import { X } from 'lucide-react';

import { cn } from '@/shared/lib/utils';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/shared/ui/tooltip';

export interface QuoteBadgeData {
    id: string;
    text: string;
    fullText: string;
    source: string;
}

interface ChatInputEditorProps {
    value: string;
    quotes: QuoteBadgeData[];
    placeholder?: string;
    className?: string;
    onChange: (value: string) => void;
    onQuoteRemove: (quoteId: string) => void;
    onQuoteClick?: (quoteId: string) => void;
    onSubmit: () => void;
}

/**
 * Chat input editor with support for inline quote badges
 * Uses contenteditable for rich content while maintaining controlled behavior
 */
export function ChatInputEditor({
    value,
    quotes,
    placeholder = 'Type a message...',
    className,
    onChange,
    onQuoteRemove,
    onQuoteClick,
    onSubmit,
}: ChatInputEditorProps) {
    const editorRef = useRef<HTMLDivElement>(null);
    const isComposingRef = useRef(false);

    // Sync contenteditable with value prop (for clearing)
    useEffect(() => {
        if (editorRef.current && !value && editorRef.current.textContent) {
            editorRef.current.textContent = '';
        }
    }, [value]);

    // Handle input changes
    const handleInput = useCallback(() => {
        if (!editorRef.current || isComposingRef.current) return;

        const text = editorRef.current.textContent || '';

        onChange(text);
    }, [onChange]);

    // Handle key down events
    const handleKeyDown = useCallback(
        (e: KeyboardEvent<HTMLDivElement>) => {
            // Submit on Enter (without Shift)
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                onSubmit();
            }
        },
        [onSubmit],
    );

    // Prevent pasting rich content
    const handlePaste = useCallback((e: ClipboardEvent<HTMLDivElement>) => {
        e.preventDefault();
        const text = e.clipboardData.getData('text/plain');

        document.execCommand('insertText', false, text);
    }, []);

    // Handle composition events (for IME input)
    const handleCompositionStart = useCallback(() => {
        isComposingRef.current = true;
    }, []);

    const handleCompositionEnd = useCallback(() => {
        isComposingRef.current = false;
        handleInput();
    }, [handleInput]);

    // Focus the editor
    const focusEditor = useCallback(() => {
        if (editorRef.current) {
            editorRef.current.focus();
            // Move cursor to end
            const range = document.createRange();
            const sel = window.getSelection();

            range.selectNodeContents(editorRef.current);
            range.collapse(false);
            sel?.removeAllRanges();
            sel?.addRange(range);
        }
    }, []);

    return (
        <div
            className={cn(
                'bg-background border-input focus-within:ring-ring relative flex min-h-[44px] w-full flex-col gap-2 rounded-md border px-3 py-2 text-sm transition-shadow focus-within:ring-1',
                className,
            )}
            onClick={focusEditor}
        >
            {/* Quote badges */}
            {quotes.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                    {quotes.map((quote) => (
                        <Tooltip key={quote.id} delay={300}>
                            <TooltipTrigger
                                className={cn(
                                    'bg-primary/10 text-primary group inline-flex items-center gap-1.5 rounded-md border border-current/20 px-2 py-1 text-xs',
                                    onQuoteClick &&
                                        'hover:bg-primary/20 cursor-pointer transition-colors',
                                )}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onQuoteClick?.(quote.id);
                                }}
                            >
                                <span className="line-clamp-1 max-w-[200px]">{quote.text}</span>
                                <span className="text-muted-foreground text-[10px]">
                                    {quote.source}
                                </span>
                                <button
                                    className="text-muted-foreground hover:text-foreground hover:bg-destructive/10 -mr-1 rounded p-0.5 transition-colors"
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onQuoteRemove(quote.id);
                                    }}
                                >
                                    <X className="h-3 w-3" />
                                </button>
                            </TooltipTrigger>
                            <TooltipContent className="max-w-xs" side="top">
                                <p className="text-sm leading-relaxed">{quote.fullText}</p>
                                <p className="text-muted-foreground mt-1 text-[10px]">
                                    {quote.source}
                                </p>
                            </TooltipContent>
                        </Tooltip>
                    ))}
                </div>
            )}

            {/* Contenteditable input */}
            <div
                ref={editorRef}
                contentEditable
                suppressContentEditableWarning
                aria-multiline="true"
                className={cn(
                    'text-foreground max-h-32 min-h-[20px] w-full overflow-y-auto break-words whitespace-pre-wrap outline-none',
                    !value &&
                        'empty:before:text-muted-foreground empty:before:content-[attr(data-placeholder)]',
                )}
                data-placeholder={placeholder}
                role="textbox"
                onCompositionEnd={handleCompositionEnd}
                onCompositionStart={handleCompositionStart}
                onInput={handleInput}
                onKeyDown={handleKeyDown}
                onPaste={handlePaste}
            />
        </div>
    );
}
