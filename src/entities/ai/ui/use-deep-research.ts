'use client';

import { useState } from 'react';
import { toast } from 'sonner';

import { useTaskStore } from '../model/store';

import { parseError } from '@/shared/ai';

function removeJsonMarkdown(text: string) {
    text = text.trim();
    if (text.startsWith('```json')) {
        text = text.slice(7);
    } else if (text.startsWith('json')) {
        text = text.slice(4);
    } else if (text.startsWith('```')) {
        text = text.slice(3);
    }
    if (text.endsWith('```')) {
        text = text.slice(0, -3);
    }

    return text.trim();
}

export function handleError(error: unknown) {
    const errorMessage = parseError(error);

    toast.error(errorMessage, {
        description: 'Something went wrong while generating questions.',
    });
}

export function useDeepResearch() {
    const taskStore = useTaskStore();
    const [status, setStatus] = useState<string>('');

    async function askQuestions() {
        const { question } = useTaskStore.getState();

        setStatus('Thinking...');

        taskStore.setQuestion(question);

        try {
            type GenerateQuestionsFn = (
                q: string,
                lang: string,
                onError: (error: unknown) => void,
            ) => Promise<{ output: unknown }>;

            const mod = (await import('../lib/generate-questions').catch(
                async () => await import('../lib/generate-questions.stub'),
            )) as unknown as { generateQuestions: GenerateQuestionsFn };

            await mod.generateQuestions(question, 'english', handleError);
        } catch {
            // Server actions not available in static export
            taskStore.updateQuestions('Research is unavailable in this build.');
            setStatus('');

            return;
        }
    }

    return {
        status,
        askQuestions,
    };
}
