'use client';

import React, { useRef, useCallback, useEffect, KeyboardEvent, ClipboardEvent } from 'react';
import { X } from 'lucide-react';

import { cn } from '@/shared/lib/utils';

export interface QuoteBadgeData {
    id: string;
    text: string;
    source: string;
}

interface ChatInputEditorProps {
    value: string;
    quotes: QuoteBadgeData[];
    placeholder?: string;
    className?: string;
    onChange: (value: string) => void;
    onQuoteRemove: (quoteId: string) => void;
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
                        <div
                            key={quote.id}
                            className="bg-primary/10 text-primary group inline-flex items-center gap-1.5 rounded-md border border-current/20 px-2 py-1 text-xs"
                        >
                            <span className="line-clamp-1 max-w-[200px]">{quote.text}</span>
                            <span className="text-muted-foreground text-[10px]">{quote.source}</span>
                            <button
                                className="text-muted-foreground hover:text-foreground -mr-1 rounded p-0.5 transition-colors"
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onQuoteRemove(quote.id);
                                }}
                            >
                                <X className="h-3 w-3" />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* Contenteditable input */}
            <div
                ref={editorRef}
                className={cn(
                    'text-foreground min-h-[20px] max-h-32 w-full overflow-y-auto whitespace-pre-wrap break-words outline-none',
                    !value && 'empty:before:text-muted-foreground empty:before:content-[attr(data-placeholder)]',
                )}
                contentEditable
                data-placeholder={placeholder}
                role="textbox"
                aria-multiline="true"
                suppressContentEditableWarning
                onInput={handleInput}
                onKeyDown={handleKeyDown}
                onPaste={handlePaste}
                onCompositionStart={handleCompositionStart}
                onCompositionEnd={handleCompositionEnd}
            />
        </div>
    );
}
