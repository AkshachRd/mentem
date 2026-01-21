'use client';

import React, { useState } from 'react';
import { useForm } from '@tanstack/react-form';

import { useTaskStore } from '../model/store';

import { useDeepResearch } from './use-deep-research';
import { AIAnimationWrapper } from './ai-animation-wrapper';

import { Button } from '@/shared/ui/button';
import { Textarea } from '@/shared/ui/textarea';
import { Field, FieldLabel, FieldError } from '@/shared/ui/field';

export function Topic() {
    const { askQuestions } = useDeepResearch();
    const [isThinking, setIsThinking] = useState(false);
    const { setQuestion, questions } = useTaskStore.getState();

    const form = useForm({
        defaultValues: {
            topic: '',
        },
        onSubmit: async ({ value }) => {
            try {
                setIsThinking(true);
                setQuestion(value.topic);
                await askQuestions();
            } finally {
                setIsThinking(false);
            }
        },
    });

    return (
        <AIAnimationWrapper className="flex w-full flex-col" isLoading={isThinking}>
            <section className="bg-background z-10 flex w-full flex-col rounded-lg p-4">
                <h2 className="text-lg">1. Research topics</h2>
                <form
                    className="flex w-full flex-col gap-4"
                    onSubmit={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        form.handleSubmit();
                    }}
                >
                    <form.Field
                        name="topic"
                        validators={{
                            onChange: ({ value }) => (!value ? 'Please enter a topic' : undefined),
                        }}
                    >
                        {(field) => (
                            <Field>
                                <FieldLabel>Research Topics</FieldLabel>
                                <Textarea
                                    aria-invalid={field.state.meta.errors.length > 0}
                                    placeholder="Any topic you want to research"
                                    rows={3}
                                    value={field.state.value}
                                    onBlur={field.handleBlur}
                                    onChange={(e) => field.handleChange(e.target.value)}
                                />
                                <FieldError>{field.state.meta.errors.join(', ')}</FieldError>
                            </Field>
                        )}
                    </form.Field>
                    <Button className="w-full" type="submit">
                        Start thinking
                    </Button>
                    {questions && (
                        <div className="text-muted-foreground text-sm">
                            You submitted: <code>{questions}</code>
                        </div>
                    )}
                </form>
            </section>
        </AIAnimationWrapper>
    );
}
