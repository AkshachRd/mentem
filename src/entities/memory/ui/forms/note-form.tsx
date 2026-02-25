'use client';

import { nanoid } from 'nanoid';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { useMemoriesStore } from '../../model/store';
import { NoteMemory } from '../../model/types';

import { useAutoGenerateTags } from '@/entities/ai';
import { Button } from '@/shared/ui/button';
import { Field, FieldLabel } from '@/shared/ui/field';
import { Input } from '@/shared/ui/input';
import { Textarea } from '@/shared/ui/textarea';

type NoteFormProps = {
    memory?: NoteMemory;
    selectedTagIds: Set<string>;
    onClose: () => void;
};

export function NoteForm({ memory, selectedTagIds, onClose }: NoteFormProps) {
    const isEditing = Boolean(memory);
    const { addMemory, updateMemory } = useMemoriesStore();
    const { generate: generateTags } = useAutoGenerateTags();

    const [title, setTitle] = useState(memory?.title ?? '');
    const [tldr, setTldr] = useState(memory?.tldr ?? '');
    const [content, setContent] = useState(memory?.content ?? '');

    useEffect(() => {
        if (memory) {
            setTitle(memory.title ?? '');
            setTldr(memory.tldr ?? '');
            setContent(memory.content);
        }
    }, [memory]);

    const handleSave = () => {
        const now = Date.now();
        const tagIds = Array.from(selectedTagIds);

        if (isEditing && memory) {
            updateMemory(memory.id, (current) => ({
                ...current,
                title: title || undefined,
                tldr: tldr || undefined,
                content,
                tagIds,
                updatedAt: now,
            }));
            toast.success('Note saved');
        } else {
            const newMemory: NoteMemory = {
                id: nanoid(),
                kind: 'note',
                title: title || undefined,
                tldr: tldr || undefined,
                content,
                createdAt: now,
                updatedAt: now,
                tagIds,
            };

            addMemory(newMemory);
            toast.success('Note saved');

            if (tagIds.length === 0) {
                generateTags(newMemory.id, 'note', {
                    title: newMemory.title,
                    tldr: newMemory.tldr,
                    content: newMemory.content,
                });
            }
        }

        onClose();
    };

    const isSaveDisabled = content.trim().length === 0;

    return (
        <div className="flex flex-1 flex-col gap-3 p-2">
            <Field>
                <FieldLabel>Title</FieldLabel>
                <Input
                    placeholder="Optional title"
                    value={title}
                    onInput={(e) => setTitle(e.currentTarget.value)}
                />
            </Field>
            <Field>
                <FieldLabel>TL;DR</FieldLabel>
                <Textarea
                    placeholder="Optional short summary"
                    rows={2}
                    value={tldr}
                    onInput={(e) => setTldr(e.currentTarget.value)}
                />
            </Field>
            <Field className="min-h-0 grow">
                <FieldLabel>Content</FieldLabel>
                <Textarea
                    className="h-full resize-none"
                    placeholder="Write your note..."
                    rows={10}
                    value={content}
                    onInput={(e) => setContent(e.currentTarget.value)}
                />
            </Field>
            <div className="flex gap-2">
                <Button disabled={isSaveDisabled} onClick={handleSave}>
                    {isEditing ? 'Save changes' : 'Create note'}
                </Button>
                <Button variant="destructive" onClick={onClose}>
                    Cancel
                </Button>
            </div>
        </div>
    );
}
