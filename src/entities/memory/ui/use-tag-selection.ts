'use client';

import { useMemo, useState } from 'react';

import { useTagsStore } from '@/entities/tag';

export function useTagSelection(initialTagIds: string[]) {
    const { tags, addTag } = useTagsStore();

    const [tagInput, setTagInput] = useState('');
    const [selectedTagIds, setSelectedTagIds] = useState<Set<string>>(new Set(initialTagIds));

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

    const resetTagIds = (tagIds: string[]) => {
        setSelectedTagIds(new Set(tagIds));
    };

    return {
        tagInput,
        setTagInput,
        selectedTagIds,
        selectedTags,
        handleAddTagByName,
        handleRemoveSelectedTag,
        resetTagIds,
    };
}
