'use client';

import { useMemo, useState } from 'react';

import { Memory } from '../model/types';

import { generateTagsForMemory } from '@/entities/ai';
import { useTagsStore } from '@/entities/tag';

export function useTagSelection(initialTagIds: string[], memory?: Memory) {
    const { tags, addTag } = useTagsStore();

    const [tagInput, setTagInput] = useState('');
    const [selectedTagIds, setSelectedTagIds] = useState<Set<string>>(new Set(initialTagIds));
    const [isGenerating, setIsGenerating] = useState(false);

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

    const handleGenerateTags = async () => {
        if (!memory || isGenerating) return;

        setIsGenerating(true);

        try {
            const generatedNames = await generateTagsForMemory(
                memory.kind,
                memory as unknown as Record<string, unknown>,
            );

            for (const name of generatedNames) {
                const existing = tags.find((t) => t.name.toLowerCase() === name.toLowerCase());
                const tag = existing ?? addTag(name);

                setSelectedTagIds((prev) => new Set(prev).add(tag.id));
            }
        } finally {
            setIsGenerating(false);
        }
    };

    return {
        tagInput,
        setTagInput,
        selectedTagIds,
        selectedTags,
        handleAddTagByName,
        handleRemoveSelectedTag,
        resetTagIds,
        canGenerateTags: Boolean(memory),
        isGenerating,
        handleGenerateTags,
    };
}
