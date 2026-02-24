'use client';

import type { PdfTextSelectionData } from '@/shared/lib/hooks';
import type { QuoteMemory } from '@/entities/memory';
import type { Quote } from '@/entities/quote';

import { useState, useCallback } from 'react';
import { toast } from 'sonner';

import { useTextSelection } from '@/shared/lib/hooks';
import { useMemoriesStore } from '@/entities/memory';
import { useAutoGenerateTags } from '@/entities/ai';
import { useQuoteStore } from '@/entities/quote';

export function usePdfContextActions(filePath: string | null, pageNumber: number) {
    const [flashcardDialogOpen, setFlashcardDialogOpen] = useState(false);
    const [flashcardText, setFlashcardText] = useState('');

    const { clearSelection } = useTextSelection();
    const addMemory = useMemoriesStore((state) => state.addMemory);
    const { generate: generateTags } = useAutoGenerateTags();
    const addPendingQuote = useQuoteStore((state) => state.addPendingQuote);

    const handleCopy = useCallback(
        async (text: string) => {
            if (!text) return;

            try {
                await navigator.clipboard.writeText(text);
            } catch {
                const textArea = document.createElement('textarea');

                textArea.value = text;
                document.body.appendChild(textArea);
                textArea.select();
                document.execCommand('copy');
                document.body.removeChild(textArea);
            }
            clearSelection();
        },
        [clearSelection],
    );

    const handleAddNote = useCallback(
        (text: string) => {
            if (!text) return;

            const fileName = filePath ? filePath.split(/[\\/]/).pop() || 'PDF' : 'PDF';

            const newMemory = {
                id: crypto.randomUUID(),
                kind: 'note' as const,
                content: text,
                title: `From ${fileName} (Page ${pageNumber})`,
                createdAt: Date.now(),
                updatedAt: Date.now(),
                tagIds: [],
            };

            addMemory(newMemory);
            toast.success('Note created', {
                description: `From ${fileName} (Page ${pageNumber})`,
            });
            clearSelection();
        },
        [filePath, pageNumber, clearSelection, addMemory],
    );

    const handleHighlight = useCallback(
        (text: string, color: string) => {
            // eslint-disable-next-line no-console
            console.log('Highlight:', text, 'with color:', color);
            clearSelection();
        },
        [clearSelection],
    );

    const handleSearch = useCallback(
        (text: string) => {
            // eslint-disable-next-line no-console
            console.log('Search for:', text);
            clearSelection();
        },
        [clearSelection],
    );

    const handleSendToChat = useCallback(
        (data: PdfTextSelectionData) => {
            if (!data.text || !filePath) return;

            const fileName = filePath.split(/[\\/]/).pop() || 'PDF';

            const quote: Quote = {
                id: crypto.randomUUID(),
                text: data.text,
                source: {
                    filePath,
                    fileName,
                    position: {
                        pageNumber: data.pageNumber,
                        startOffset: data.startOffset,
                        endOffset: data.endOffset,
                        rect: data.rect,
                    },
                },
                createdAt: Date.now(),
            };

            addPendingQuote(quote);

            toast.success('Цитата добавлена в чат', {
                description: `${fileName}, стр. ${data.pageNumber}`,
            });

            clearSelection();
        },
        [filePath, addPendingQuote, clearSelection],
    );

    const handleCreateFlashcard = useCallback(
        (text: string) => {
            if (!text) return;

            setFlashcardText(text);
            setFlashcardDialogOpen(true);
            clearSelection();
        },
        [clearSelection],
    );

    const handleSaveAsQuote = useCallback(
        (text: string) => {
            if (!text) return;

            const fileName = filePath ? filePath.split(/[\\/]/).pop() || 'PDF' : 'PDF';

            const newQuote: QuoteMemory = {
                id: crypto.randomUUID(),
                kind: 'quote',
                text,
                sourceUrl: filePath ?? undefined,
                title: `From ${fileName} (Page ${pageNumber})`,
                createdAt: Date.now(),
                updatedAt: Date.now(),
                tagIds: [],
            };

            addMemory(newQuote);
            toast.success('Quote saved', {
                description: `From ${fileName} (Page ${pageNumber})`,
            });

            generateTags(newQuote.id, 'quote', {
                text: newQuote.text,
            });

            clearSelection();
        },
        [filePath, pageNumber, addMemory, generateTags, clearSelection],
    );

    return {
        flashcardDialogOpen,
        flashcardText,
        setFlashcardDialogOpen,
        handlers: {
            onCopy: handleCopy,
            onAddNote: handleAddNote,
            onHighlight: handleHighlight,
            onSearch: handleSearch,
            onSendToChat: handleSendToChat,
            onCreateFlashcard: handleCreateFlashcard,
            onSaveAsQuote: handleSaveAsQuote,
        },
    };
}
