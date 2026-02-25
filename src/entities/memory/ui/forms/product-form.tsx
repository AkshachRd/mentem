'use client';

import { nanoid } from 'nanoid';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { useMemoriesStore } from '../../model/store';
import { ProductMemory } from '../../model/types';

import { useAutoGenerateTags } from '@/entities/ai';
import { Button } from '@/shared/ui/button';
import { Field, FieldLabel } from '@/shared/ui/field';
import { Input } from '@/shared/ui/input';

type ProductFormProps = {
    memory?: ProductMemory;
    selectedTagIds: Set<string>;
    onClose: () => void;
};

export function ProductForm({ memory, selectedTagIds, onClose }: ProductFormProps) {
    const isEditing = Boolean(memory);
    const { addMemory, updateMemory } = useMemoriesStore();
    const { generate: generateTags } = useAutoGenerateTags();

    const [title, setTitle] = useState(memory?.title ?? '');
    const [url, setUrl] = useState(memory?.url ?? '');
    const [price, setPrice] = useState(memory?.price ?? '');
    const [currency, setCurrency] = useState(memory?.currency ?? '$');

    useEffect(() => {
        if (memory) {
            setTitle(memory.title ?? '');
            setUrl(memory.url ?? '');
            setPrice(memory.price ?? '');
            setCurrency(memory.currency ?? '$');
        }
    }, [memory]);

    const handleSave = () => {
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
    );
}
