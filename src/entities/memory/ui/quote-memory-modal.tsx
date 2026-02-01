'use client';

import { nanoid } from 'nanoid';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

import { useMemoriesStore } from '../model/store';
import { QuoteMemory } from '../model/types';

import { useAutoGenerateTags } from '@/entities/ai';
import { TagComponent } from '@/entities/tag';
import { useTagsStore } from '@/entities/tag';
import { Button } from '@/shared/ui/button';
import { Separator } from '@/shared/ui/separator';
import { Input } from '@/shared/ui/input';
import { Textarea } from '@/shared/ui/textarea';
import { Field, FieldLabel } from '@/shared/ui/field';
import { Card, CardContent } from '@/shared/ui/card';

type QuoteMemoryModalProps = {
    memory?: QuoteMemory;
    onClose: () => void;
};

export function QuoteMemoryModal({ memory, onClose }: QuoteMemoryModalProps) {
    const isEditing = Boolean(memory);

    const { addMemory, updateMemory } = useMemoriesStore();
    const { tags, addTag } = useTagsStore();
    const { generate: generateTags } = useAutoGenerateTags();

    const [text, setText] = useState<string>(memory?.text ?? '');
    const [author, setAuthor] = useState<string>(memory?.author ?? '');
    const [sourceUrl, setSourceUrl] = useState<string>(memory?.sourceUrl ?? '');
    const [title, setTitle] = useState<string>(memory?.title ?? '');
    const [tagInput, setTagInput] = useState<string>('');
    const [selectedTagIds, setSelectedTagIds] = useState<Set<string>>(
        new Set(memory?.tagIds ?? []),
    );

    useEffect(() => {
        if (memory) {
            setText(memory.text);
            setAuthor(memory.author ?? '');
            setSourceUrl(memory.sourceUrl ?? '');
            setTitle(memory.title ?? '');
            setSelectedTagIds(new Set(memory.tagIds));
        }
    }, [memory]);

    const selectedTags = useMemo(
        () => tags.filter((t) => selectedTagIds.has(t.id)),
        [tags, selectedTagIds],
    );

    const handleAddTagByName = () => {
        const trimmed = tagInput.trim();

        if (trimmed.length === 0) return;

        const existing = tags.find((t) => t.name.toLowerCase() === trimmed.toLowerCase());
        const tag = existing ?? addTag(trimmed);

        setSelectedTagIds((prev) => new Set(prev).add(tag.id));
        setTagInput('');
    };

    const handleRemoveSelectedTag = (tagId: string) => {
        setSelectedTagIds((prev) => {
            const next = new Set(prev);

            next.delete(tagId);

            return next;
        });
    };

    const handleSave = async () => {
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
        <div className="flex h-[500px]">
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
            <Separator orientation="vertical" />
            <div className="flex w-64 flex-col gap-4 p-4">
                <Card className="w-full">
                    <CardContent className="flex flex-row flex-wrap items-center gap-2">
                        {selectedTags.map((tag) => (
                            <TagComponent
                                key={tag.id}
                                color={tag.color}
                                onClose={() => handleRemoveSelectedTag(tag.id)}
                            >
                                {tag.name}
                            </TagComponent>
                        ))}
                        <div className="flex grow flex-row gap-2">
                            <Input
                                className="grow"
                                placeholder="Add tag"
                                value={tagInput}
                                onInput={(e) => setTagInput(e.currentTarget.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && tagInput.trim().length > 0) {
                                        handleAddTagByName();
                                    }
                                }}
                            />
                            <Button
                                disabled={tagInput.trim().length === 0}
                                size="sm"
                                onClick={handleAddTagByName}
                            >
                                Add
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
