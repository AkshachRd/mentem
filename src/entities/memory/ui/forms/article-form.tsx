'use client';

import { nanoid } from 'nanoid';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { useMemoriesStore } from '../../model/store';
import { ArticleMemory } from '../../model/types';

import { useAutoGenerateTags } from '@/entities/ai';
import { Button } from '@/shared/ui/button';
import { Field, FieldLabel } from '@/shared/ui/field';
import { Input } from '@/shared/ui/input';
import { Textarea } from '@/shared/ui/textarea';

type ArticleFormProps = {
    memory?: ArticleMemory;
    selectedTagIds: Set<string>;
    onClose: () => void;
};

export function ArticleForm({ memory, selectedTagIds, onClose }: ArticleFormProps) {
    const isEditing = Boolean(memory);
    const { addMemory, updateMemory } = useMemoriesStore();
    const { generate: generateTags } = useAutoGenerateTags();

    const [url, setUrl] = useState(memory?.url ?? '');
    const [title, setTitle] = useState(memory?.title ?? '');
    const [source, setSource] = useState(memory?.source ?? '');
    const [excerpt, setExcerpt] = useState(memory?.excerpt ?? '');

    useEffect(() => {
        if (memory) {
            setUrl(memory.url);
            setTitle(memory.title ?? '');
            setSource(memory.source ?? '');
            setExcerpt(memory.excerpt ?? '');
        }
    }, [memory]);

    const handleSave = () => {
        const now = Date.now();
        const tagIds = Array.from(selectedTagIds);

        if (isEditing && memory) {
            updateMemory(memory.id, (current) => ({
                ...current,
                url,
                title: title || undefined,
                excerpt: excerpt || undefined,
                source: source || undefined,
                tagIds,
                updatedAt: now,
            }));
            toast.success('Article saved');
        } else {
            const newMemory: ArticleMemory = {
                id: nanoid(),
                kind: 'article',
                url,
                title: title || undefined,
                excerpt: excerpt || undefined,
                source: source || undefined,
                createdAt: now,
                updatedAt: now,
                tagIds,
            };

            addMemory(newMemory);
            toast.success('Article saved');

            if (tagIds.length === 0) {
                generateTags(newMemory.id, 'article', {
                    title: newMemory.title,
                    excerpt: newMemory.excerpt,
                    source: newMemory.source,
                });
            }
        }

        onClose();
    };

    const isSaveDisabled = url.trim().length === 0;

    return (
        <div className="flex flex-1 flex-col gap-3 p-2">
            <Field>
                <FieldLabel>Article URL</FieldLabel>
                <Input
                    placeholder="https://..."
                    type="url"
                    value={url}
                    onInput={(e) => setUrl(e.currentTarget.value)}
                />
            </Field>
            <Field>
                <FieldLabel>Title</FieldLabel>
                <Input
                    placeholder="Article title"
                    value={title}
                    onInput={(e) => setTitle(e.currentTarget.value)}
                />
            </Field>
            <Field>
                <FieldLabel>Source</FieldLabel>
                <Input
                    placeholder="e.g., Medium, NY Times, Blog Name"
                    value={source}
                    onInput={(e) => setSource(e.currentTarget.value)}
                />
            </Field>
            <Field className="min-h-0 grow">
                <FieldLabel>Excerpt / Summary</FieldLabel>
                <Textarea
                    className="h-full resize-none"
                    placeholder="Key points or summary of the article..."
                    rows={4}
                    value={excerpt}
                    onInput={(e) => setExcerpt(e.currentTarget.value)}
                />
            </Field>
            <div className="flex gap-2">
                <Button disabled={isSaveDisabled} onClick={handleSave}>
                    {isEditing ? 'Save changes' : 'Save article'}
                </Button>
                <Button variant="destructive" onClick={onClose}>
                    Cancel
                </Button>
            </div>
        </div>
    );
}
