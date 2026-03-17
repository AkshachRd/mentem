'use client';

import { useState, useCallback } from 'react';

import { claudePrompt } from '@/shared/ai/claude-cli';

export type GeneratedFlashcard = {
    frontSide: string;
    backSide: string;
};

const SYSTEM_PROMPT = `You are an expert educator specialized in creating effective flashcards for learning.

Your task is to analyze the provided text and create a flashcard that helps memorize key information.

Guidelines:
1. Front side should contain a clear, specific question or prompt
2. Back side should contain a concise but complete answer
3. Focus on the most important concept, fact, or idea from the text
4. Questions should test understanding, not just recall
5. Keep answers concise but informative
6. Use the same language as the source text

Output ONLY a JSON object in this exact format: {"frontSide":"...","backSide":"..."}`;

interface UseGenerateFlashcardReturn {
    object: GeneratedFlashcard | undefined;
    isLoading: boolean;
    error: Error | undefined;
    generate: (text: string, context?: string) => void;
    stop: () => void;
}

export function useGenerateFlashcard(): UseGenerateFlashcardReturn {
    const [object, setObject] = useState<GeneratedFlashcard | undefined>();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<Error | undefined>();

    const generate = useCallback(async (text: string, context?: string) => {
        const prompt = context
            ? `Source: ${context}\n\nText to create flashcard from:\n"${text}"`
            : `Text to create flashcard from:\n"${text}"`;

        setIsLoading(true);
        setError(undefined);
        setObject(undefined);

        try {
            const result = await claudePrompt(SYSTEM_PROMPT, prompt);

            // Extract JSON from the response
            const jsonMatch = result.match(/\{[\s\S]*"frontSide"[\s\S]*"backSide"[\s\S]*\}/);
            if (jsonMatch) {
                const parsed = JSON.parse(jsonMatch[0]);
                setObject({ frontSide: parsed.frontSide, backSide: parsed.backSide });
            } else {
                throw new Error('Failed to parse flashcard from AI response');
            }
        } catch (err) {
            setError(err instanceof Error ? err : new Error(String(err)));
        } finally {
            setIsLoading(false);
        }
    }, []);

    const stop = () => {
        // No-op: non-streaming prompt completes atomically
    };

    return { object, isLoading, error, generate, stop };
}
