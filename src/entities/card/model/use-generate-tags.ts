import { useState, useCallback } from 'react';

import { generatePrompt, getSystemPrompt } from '../lib/prompts';

import { useTagsStore } from '@/entities/tag';
import { Card } from '@/entities/card';
import { claudePrompt } from '@/shared/ai/claude-cli';

export const parseAIGeneratedTags = (tags: string): string[] => {
    if (!tags) return [];

    return tags.split(',').map((tag) => tag.trim());
};

interface UseGenerateTagsReturn {
    completion: string;
    input: string;
    setInput: (input: string) => void;
    generateTags: (card: Card) => void;
    isLoading: boolean;
    stopGeneration: () => void;
    generatedTagNames: string[];
    clearCompletion: () => void;
    showSaveAndCancelButton: boolean;
    setShowSaveAndCancelButton: (show: boolean) => void;
}

export const useGenerateTags = (): UseGenerateTagsReturn => {
    const [showSaveAndCancelButton, setShowSaveAndCancelButton] = useState(false);
    const [completion, setCompletion] = useState('');
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const generateTags = useCallback(async (card: Card) => {
        const { tags } = useTagsStore.getState();

        const currentTags = tags.filter((tag) => card.tagIds.includes(tag.id));

        const prompt = generatePrompt(
            card.frontSide,
            card.backSide,
            currentTags.map((tag) => tag.name).join(', '),
            tags.map((tag) => tag.name).join(','),
        );

        setIsLoading(true);
        try {
            const result = await claudePrompt(getSystemPrompt(), prompt);

            setCompletion(result);
            setShowSaveAndCancelButton(true);
        } catch (err) {
            console.error('[use-generate-tags] failed', err);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const stopGeneration = () => {
        // No-op: non-streaming prompt completes atomically
    };

    const clearCompletion = () => {
        setCompletion('');
    };

    const generatedTagNames = parseAIGeneratedTags(completion);

    return {
        completion,
        input,
        setInput,
        generateTags,
        isLoading,
        stopGeneration,
        generatedTagNames,
        clearCompletion,
        showSaveAndCancelButton,
        setShowSaveAndCancelButton,
    };
};
