'use client';

import { nanoid } from 'nanoid';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

import { useMemoriesStore } from '../model/store';
import { ImageMemory } from '../model/types';

import { useAutoGenerateTags } from '@/entities/ai';
import { TagComponent } from '@/entities/tag';
import { useTagsStore } from '@/entities/tag';
import { Button } from '@/shared/ui/button';
import { Separator } from '@/shared/ui/separator';
import { Input } from '@/shared/ui/input';
import { Field, FieldLabel } from '@/shared/ui/field';
import { Card, CardContent } from '@/shared/ui/card';

type ImageMemoryModalProps = {
    memory?: ImageMemory;
    onClose: () => void;
};

export function ImageMemoryModal({ memory, onClose }: ImageMemoryModalProps) {
    const isEditing = Boolean(memory);

    const { addMemory, updateMemory } = useMemoriesStore();
    const { tags, addTag } = useTagsStore();
    const { generate: generateTags } = useAutoGenerateTags();

    const [url, setUrl] = useState<string>(memory?.url ?? '');
    const [alt, setAlt] = useState<string>(memory?.alt ?? '');
    const [title, setTitle] = useState<string>(memory?.title ?? '');
    const [tagInput, setTagInput] = useState<string>('');
    const [selectedTagIds, setSelectedTagIds] = useState<Set<string>>(
        new Set(memory?.tagIds ?? []),
    );

    useEffect(() => {
        if (memory) {
            setUrl(memory.url);
            setAlt(memory.alt ?? '');
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
                url,
                alt: alt || undefined,
                title: title || undefined,
                tagIds,
                updatedAt: now,
            }));
            toast.success('Image saved');
        } else {
            const newMemory: ImageMemory = {
                id: nanoid(),
                kind: 'image',
                url,
                alt: alt || undefined,
                title: title || undefined,
                createdAt: now,
                updatedAt: now,
                tagIds,
            };

            addMemory(newMemory);
            toast.success('Image saved');

            if (tagIds.length === 0) {
                generateTags(newMemory.id, 'image', {
                    title: newMemory.title,
                    alt: newMemory.alt,
                });
            }
        }

        onClose();
    };

    const isSaveDisabled = url.trim().length === 0;

    return (
        <div className="flex h-[500px]">
            <div className="flex flex-1 flex-col gap-3 p-2">
                <Field>
                    <FieldLabel>Image URL</FieldLabel>
                    <Input
                        placeholder="https://..."
                        type="url"
                        value={url}
                        onInput={(e) => setUrl(e.currentTarget.value)}
                    />
                </Field>
                {url && (
                    <div className="flex justify-center overflow-hidden rounded-md border">
                        <img alt={alt || 'Preview'} className="max-h-48 object-contain" src={url} />
                    </div>
                )}
                <Field>
                    <FieldLabel>Title</FieldLabel>
                    <Input
                        placeholder="Give this image a title"
                        value={title}
                        onInput={(e) => setTitle(e.currentTarget.value)}
                    />
                </Field>
                <Field>
                    <FieldLabel>Alt text</FieldLabel>
                    <Input
                        placeholder="Describe the image"
                        value={alt}
                        onInput={(e) => setAlt(e.currentTarget.value)}
                    />
                </Field>
                <div className="flex gap-2">
                    <Button disabled={isSaveDisabled} onClick={handleSave}>
                        {isEditing ? 'Save changes' : 'Save image'}
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
