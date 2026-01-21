'use client';

import { Card, CardBody } from '@heroui/react';
import { nanoid } from 'nanoid';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

import { useMemoriesStore } from '../model/store';
import { NoteMemory } from '../model/types';

import { TagComponent } from '@/entities/tag';
import { useTagsStore } from '@/entities/tag';
import { Button } from '@/shared/ui/button';
import { Separator } from '@/shared/ui/separator';
import { Input } from '@/shared/ui/input';
import { Textarea } from '@/shared/ui/textarea';
import { Field, FieldLabel } from '@/shared/ui/field';

type NoteMemoryModalProps = {
    memory?: NoteMemory;
    onClose: () => void;
};

export function NoteMemoryModal({ memory, onClose }: NoteMemoryModalProps) {
    const isEditing = Boolean(memory);

    const { addMemory, updateMemory } = useMemoriesStore();
    const { tags, addTag } = useTagsStore();

    const [title, setTitle] = useState<string>(memory?.title ?? '');
    const [tldr, setTldr] = useState<string>(memory?.tldr ?? '');
    const [content, setContent] = useState<string>(memory?.content ?? '');
    const [tagInput, setTagInput] = useState<string>('');
    const [selectedTagIds, setSelectedTagIds] = useState<Set<string>>(
        new Set(memory?.tagIds ?? []),
    );

    useEffect(() => {
        if (memory) {
            setTitle(memory.title ?? '');
            setTldr(memory.tldr ?? '');
            setContent(memory.content);
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

    const handleSave = async (onClose: () => void) => {
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
        }

        onClose();
    };

    const isSaveDisabled = content.trim().length === 0;

    return (
        <div className="flex h-[600px]">
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
                    <Button disabled={isSaveDisabled} onClick={() => handleSave(onClose)}>
                        {isEditing ? 'Save changes' : 'Create note'}
                    </Button>
                    <Button variant="destructive" onClick={onClose}>
                        Cancel
                    </Button>
                </div>
            </div>
            <Separator orientation="vertical" />
            <div className="flex w-80 flex-col gap-4 p-4">
                <Card className="w-full">
                    <CardBody className="flex-row flex-wrap items-center gap-2">
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
                                placeholder="Add tag by name"
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
                                onClick={handleAddTagByName}
                            >
                                Add
                            </Button>
                        </div>
                    </CardBody>
                </Card>
            </div>
        </div>
    );
}
