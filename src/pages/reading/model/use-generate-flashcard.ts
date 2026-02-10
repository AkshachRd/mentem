'use client';

import { experimental_useObject as useObject } from '@ai-sdk/react';
import { z } from 'zod';

export const flashcardSchema = z.object({
    frontSide: z.string().describe('Question or prompt for the flashcard front side'),
    backSide: z.string().describe('Answer or explanation for the flashcard back side'),
});

export type GeneratedFlashcard = z.infer<typeof flashcardSchema>;

interface UseGenerateFlashcardReturn {
    object: GeneratedFlashcard | undefined;
    isLoading: boolean;
    error: Error | undefined;
    generate: (text: string, context?: string) => void;
    stop: () => void;
}

export function useGenerateFlashcard(): UseGenerateFlashcardReturn {
    const { object, isLoading, error, submit, stop } = useObject({
        api: '/api/ai/flashcard',
        schema: flashcardSchema,
    });

    const generate = (text: string, context?: string) => {
        submit({ text, context });
    };

    return {
        object,
        isLoading,
        error,
        generate,
        stop,
    };
}
