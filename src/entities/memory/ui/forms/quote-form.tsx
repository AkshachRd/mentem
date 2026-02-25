'use client';

import { nanoid } from 'nanoid';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { useMemoriesStore } from '../../model/store';
import { QuoteMemory } from '../../model/types';

import { useAutoGenerateTags } from '@/entities/ai';
import { Button } from '@/shared/ui/button';
import { Field, FieldLabel } from '@/shared/ui/field';
import { Input } from '@/shared/ui/input';
import { Textarea } from '@/shared/ui/textarea';

type QuoteFormProps = {
    memory?: QuoteMemory;
    selectedTagIds: Set<string>;
    onClose: () => void;
};

export function QuoteForm({ memory, selectedTagIds, onClose }: QuoteFormProps) {
    const isEditing = Boolean(memory);
    const { addMemory, updateMemory } = useMemoriesStore();
    const { generate: generateTags } = useAutoGenerateTags();

    const [title, setTitle] = useState(memory?.title ?? '');
    const [text, setText] = useState(memory?.text ?? '');
    const [author, setAuthor] = useState(memory?.author ?? '');
    const [sourceUrl, setSourceUrl] = useState(memory?.sourceUrl ?? '');

    useEffect(() => {
        if (memory) {
            setTitle(memory.title ?? '');
            setText(memory.text);
            setAuthor(memory.author ?? '');
            setSourceUrl(memory.sourceUrl ?? '');
        }
    }, [memory]);

    const handleSave = () => {
        const now = Date.now();
        const tagIds = Array.from(selectedTagIds);

        if (isEditing && memory) {
            updateMemory(memory.id, (current) => ({
                ...current,
                text,
                author: author || undefined,
                sourceUrl: sourceUrl || undefined,
                title: title || undefined,
                tagIds,
                updatedAt: now,
            }));
            toast.success('Quote saved');
        } else {
            const newMemory: QuoteMemory = {
                id: nanoid(),
                kind: 'quote',
                text,
                author: author || undefined,
                sourceUrl: sourceUrl || undefined,
                title: title || undefined,
                createdAt: now,
                updatedAt: now,
                tagIds,
            };

            addMemory(newMemory);
            toast.success('Quote saved');

            if (tagIds.length === 0) {
                generateTags(newMemory.id, 'quote', {
                    text: newMemory.text,
                    author: newMemory.author,
                });
            }
        }

        onClose();
    };

    const isSaveDisabled = text.trim().length === 0;

    return (
        <div className="flex flex-1 flex-col gap-3 p-2">
            <Field>
                <FieldLabel>Title (optional)</FieldLabel>
                <Input
                    placeholder="Optional title for the quote"
                    value={title}
                    onInput={(e) => setTitle(e.currentTarget.value)}
                />
            </Field>
            <Field className="min-h-0 grow">
                <FieldLabel>Quote text</FieldLabel>
                <Textarea
                    className="h-full resize-none"
                    placeholder="Enter the quote..."
                    rows={6}
                    value={text}
                    onInput={(e) => setText(e.currentTarget.value)}
                />
            </Field>
            <Field>
                <FieldLabel>Author</FieldLabel>
                <Input
                    placeholder="Who said this?"
                    value={author}
                    onInput={(e) => setAuthor(e.currentTarget.value)}
                />
            </Field>
            <Field>
                <FieldLabel>Source URL</FieldLabel>
                <Input
                    placeholder="https://..."
                    type="url"
                    value={sourceUrl}
                    onInput={(e) => setSourceUrl(e.currentTarget.value)}
                />
            </Field>
            <div className="flex gap-2">
                <Button disabled={isSaveDisabled} onClick={handleSave}>
                    {isEditing ? 'Save changes' : 'Create quote'}
                </Button>
                <Button variant="destructive" onClick={onClose}>
                    Cancel
                </Button>
            </div>
        </div>
    );
}
