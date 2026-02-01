'use client';

import { useCallback, useState } from 'react';
import { toast } from 'sonner';

import { generateTagsForMemory } from './generate-tags';

import { MemoryKind } from '@/entities/memory/model/types';
import { useTagsStore } from '@/entities/tag';
import { useMemoriesStore } from '@/entities/memory';
import { useSettingsStore } from '@/entities/settings';

export function useAutoGenerateTags() {
    const autoGenerateTags = useSettingsStore((s) => s.autoGenerateTags);
    const { tags, addTag } = useTagsStore();
    const addTagsToMemory = useMemoriesStore((s) => s.addTagsToMemory);
    const [isLoading, setIsLoading] = useState(false);

    const generate = useCallback(
        async (memoryId: string, kind: MemoryKind, data: Record<string, unknown>) => {
            if (!autoGenerateTags) return;

            setIsLoading(true);
            try {
                const generatedTags = await generateTagsForMemory(kind, data);

                if (generatedTags.length === 0) return;

                // Create or find existing tags
                const tagIds: string[] = [];

                for (const tagName of generatedTags) {
                    const existing = tags.find(
                        (t) => t.name.toLowerCase() === tagName.toLowerCase(),
                    );
                    const tag = existing ?? addTag(tagName);

                    tagIds.push(tag.id);
                }

                // Update memory with new tags
                if (tagIds.length > 0) {
                    addTagsToMemory(memoryId, tagIds);
                    toast.success(`Added ${tagIds.length} tags`);
                }
            } catch (err) {
                console.error('[auto-tags] generation failed', err);
                toast.error('Failed to generate tags');
            } finally {
                setIsLoading(false);
            }
        },
        [autoGenerateTags, tags, addTag, addTagsToMemory],
    );

    return {
        generate,
        isLoading,
    };
}
