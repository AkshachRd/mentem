'use client';

import { nanoid } from 'nanoid';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

import { useMemoriesStore } from '../model/store';
import { ProductMemory } from '../model/types';

import { useAutoGenerateTags } from '@/entities/ai';
import { TagComponent } from '@/entities/tag';
import { useTagsStore } from '@/entities/tag';
import { Button } from '@/shared/ui/button';
import { Separator } from '@/shared/ui/separator';
import { Input } from '@/shared/ui/input';
import { Field, FieldLabel } from '@/shared/ui/field';
import { Card, CardContent } from '@/shared/ui/card';

type ProductMemoryModalProps = {
    memory?: ProductMemory;
    onClose: () => void;
};

export function ProductMemoryModal({ memory, onClose }: ProductMemoryModalProps) {
    const isEditing = Boolean(memory);

    const { addMemory, updateMemory } = useMemoriesStore();
    const { tags, addTag } = useTagsStore();
    const { generate: generateTags } = useAutoGenerateTags();

    const [url, setUrl] = useState<string>(memory?.url ?? '');
    const [title, setTitle] = useState<string>(memory?.title ?? '');
    const [price, setPrice] = useState<string>(memory?.price ?? '');
    const [currency, setCurrency] = useState<string>(memory?.currency ?? '$');
    const [tagInput, setTagInput] = useState<string>('');
    const [selectedTagIds, setSelectedTagIds] = useState<Set<string>>(
        new Set(memory?.tagIds ?? []),
    );

    useEffect(() => {
        if (memory) {
            setUrl(memory.url ?? '');
            setTitle(memory.title ?? '');
            setPrice(memory.price ?? '');
            setCurrency(memory.currency ?? '$');
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
                url: url || undefined,
                title: title || undefined,
                price: price || undefined,
                currency: currency || undefined,
                tagIds,
                updatedAt: now,
            }));
            toast.success('Product saved');
        } else {
            const newMemory: ProductMemory = {
                id: nanoid(),
                kind: 'product',
                url: url || undefined,
                title: title || undefined,
                price: price || undefined,
                currency: currency || undefined,
                createdAt: now,
                updatedAt: now,
                tagIds,
            };

            addMemory(newMemory);
            toast.success('Product saved');

            if (tagIds.length === 0) {
                generateTags(newMemory.id, 'product', {
                    title: newMemory.title,
                    price: newMemory.price,
                    currency: newMemory.currency,
                });
            }
        }

        onClose();
    };

    const isSaveDisabled = title.trim().length === 0;

    return (
        <div className="flex h-[400px]">
            <div className="flex flex-1 flex-col gap-3 p-2">
                <Field>
                    <FieldLabel>Product name</FieldLabel>
                    <Input
                        placeholder="Product name"
                        value={title}
                        onInput={(e) => setTitle(e.currentTarget.value)}
                    />
                </Field>
                <Field>
                    <FieldLabel>Product URL</FieldLabel>
                    <Input
                        placeholder="https://..."
                        type="url"
                        value={url}
                        onInput={(e) => setUrl(e.currentTarget.value)}
                    />
                </Field>
                <div className="flex gap-3">
                    <Field className="grow">
                        <FieldLabel>Price</FieldLabel>
                        <Input
                            placeholder="99.99"
                            value={price}
                            onInput={(e) => setPrice(e.currentTarget.value)}
                        />
                    </Field>
                    <Field className="w-24">
                        <FieldLabel>Currency</FieldLabel>
                        <Input
                            placeholder="$"
                            value={currency}
                            onInput={(e) => setCurrency(e.currentTarget.value)}
                        />
                    </Field>
                </div>
                <div className="flex gap-2">
                    <Button disabled={isSaveDisabled} onClick={handleSave}>
                        {isEditing ? 'Save changes' : 'Save product'}
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
