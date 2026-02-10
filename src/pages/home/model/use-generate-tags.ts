import { useCompletion } from '@ai-sdk/react';
import { useState } from 'react';

import { generatePrompt } from '../lib/prompts';

import { useTagsStore } from '@/entities/tag';
import { Card } from '@/entities/card';

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

    const { completion, input, setInput, complete, isLoading, stop, setCompletion } = useCompletion(
        {
            api: '/api/ai/tags',
            onFinish: () => {
                setShowSaveAndCancelButton(true);
            },
        },
    );

    const generateTags = (card: Card) => {
        const { tags } = useTagsStore.getState();

        const currentTags = tags.filter((tag) => card.tagIds.includes(tag.id));

        complete(
            generatePrompt(
                card.frontSide,
                card.backSide,
                currentTags.map((tag) => tag.name).join(', '),
                tags.map((tag) => tag.name).join(','),
            ),
        );
    };

    const stopGeneration = () => {
        stop();
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
