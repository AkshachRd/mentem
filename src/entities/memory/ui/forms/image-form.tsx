'use client';

import { nanoid } from 'nanoid';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { useMemoriesStore } from '../../model/store';
import { ImageMemory } from '../../model/types';

import { useAutoGenerateTags } from '@/entities/ai';
import { Button } from '@/shared/ui/button';
import { Field, FieldLabel } from '@/shared/ui/field';
import { Input } from '@/shared/ui/input';

type ImageFormProps = {
    memory?: ImageMemory;
    selectedTagIds: Set<string>;
    onClose: () => void;
};

export function ImageForm({ memory, selectedTagIds, onClose }: ImageFormProps) {
    const isEditing = Boolean(memory);
    const { addMemory, updateMemory } = useMemoriesStore();
    const { generate: generateTags } = useAutoGenerateTags();

    const [url, setUrl] = useState(memory?.url ?? '');
    const [title, setTitle] = useState(memory?.title ?? '');
    const [alt, setAlt] = useState(memory?.alt ?? '');

    useEffect(() => {
        if (memory) {
            setUrl(memory.url);
            setTitle(memory.title ?? '');
            setAlt(memory.alt ?? '');
        }
    }, [memory]);

    const handleSave = () => {
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
    );
}
