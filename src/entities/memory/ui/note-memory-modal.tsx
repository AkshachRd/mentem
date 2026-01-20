'use client';

import { Divider, Button, Input, Textarea, Card, CardBody, addToast } from '@heroui/react';
import { nanoid } from 'nanoid';
import { useEffect, useMemo, useState } from 'react';

import { useMemoriesStore } from '../model/store';
import { NoteMemory } from '../model/types';

import { TagComponent } from '@/entities/tag';
import { useTagsStore } from '@/entities/tag';

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
            addToast({ title: 'Note saved', color: 'success' });
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
            addToast({ title: 'Note saved', color: 'success' });
        }

        onClose();
    };

    const isSaveDisabled = content.trim().length === 0;

    return (
        <div className="flex h-[600px]">
            <div className="flex flex-1 flex-col gap-3 p-2">
                <Input
                    label={'Title'}
                    placeholder="Optional title"
                    value={title}
                    onInput={(e) => setTitle(e.currentTarget.value)}
                />
                <Textarea
                    label={'TL;DR'}
                    minRows={2}
                    placeholder="Optional short summary"
                    value={tldr}
                    onInput={(e) => setTldr(e.currentTarget.value)}
                />
                <div className="min-h-0 grow">
                    <Textarea
                        className="h-full"
                        label={'Content'}
                        minRows={10}
                        placeholder="Write your note..."
                        value={content}
                        onInput={(e) => setContent(e.currentTarget.value)}
                    />
                </div>
                <div className="flex gap-2">
                    <Button
                        color="primary"
                        isDisabled={isSaveDisabled}
                        onPress={() => handleSave(onClose)}
                    >
                        {isEditing ? 'Save changes' : 'Create note'}
                    </Button>
                    <Button color="danger" variant="light" onPress={onClose}>
                        Cancel
                    </Button>
                </div>
            </div>
            <Divider orientation="vertical" />
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
                                fullWidth={false}
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
                                isDisabled={tagInput.trim().length === 0}
                                type="button"
                                onPress={handleAddTagByName}
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
