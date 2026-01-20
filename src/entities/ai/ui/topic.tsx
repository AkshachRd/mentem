'use client';

import { Form, Textarea } from '@heroui/react';
import React, { FormEvent, useState } from 'react';

import { useTaskStore } from '../model/store';

import { useDeepResearch } from './use-deep-research';
import { AIAnimationWrapper } from './ai-animation-wrapper';

import { Button } from '@/shared/ui/button';

export function Topic() {
    const { askQuestions } = useDeepResearch();
    const [isThinking, setIsThinking] = useState(false);
    const { setQuestion, questions } = useTaskStore.getState();

    const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        const data = Object.fromEntries(new FormData(e.currentTarget));

        try {
            setIsThinking(true);
            setQuestion(data.topic as string);
            await askQuestions();
        } finally {
            setIsThinking(false);
        }
    };

    return (
        <AIAnimationWrapper className="flex w-full flex-col" isLoading={isThinking}>
            <section className="bg-background z-10 flex w-full flex-col rounded-lg p-4">
                <h2 className="text-lg">1. Research topics</h2>
                <Form className="w-full items-center" onSubmit={onSubmit}>
                    <Textarea
                        errorMessage="Please enter a topic"
                        label="Research Topics"
                        labelPlacement="outside"
                        name="topic"
                        placeholder="Any topic you want to research"
                        rows={3}
                    />
                    <Button className="w-full" type="submit">
                        Start thinking
                    </Button>
                    {questions && (
                        <div className="text-small text-default-500">
                            You submitted: <code>{questions}</code>
                        </div>
                    )}
                </Form>
            </section>
        </AIAnimationWrapper>
    );
}
