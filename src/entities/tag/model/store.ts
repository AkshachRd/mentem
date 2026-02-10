import { create } from 'zustand';
import { nanoid } from 'nanoid';

import { getRandomTagColor } from '../lib/getRandomTagColor';
import { tagToMarkdown } from '../lib/serialize';

import { Tag, TagColor } from './types';

import { getFileSystemClient } from '@/shared/lib/fs';

export type TagsState = {
    tags: Tag[];
    addTag: (name: string, color?: TagColor) => Tag;
    removeTag: (tagId: string) => void;
    clearTags: () => void;
    hydrate: (tags: Tag[]) => void;
};

export const useTagsStore = create<TagsState>()((set) => {
    const fs = getFileSystemClient();

    return {
        tags: [],
        addTag: (name, color) => {
            const tag = { id: nanoid(), name, color: color ?? getRandomTagColor() };

            void (async () => {
                try {
                    const dir = await fs.getCollectionDir('tags');
                    const fileName = `${tag.id}.md`;

                    await fs.writeMarkdownFile(dir, fileName, tagToMarkdown(tag));
                } catch (error) {
                    console.error('Failed to write tag file', error);
                }
            })();

            set((state) => ({ tags: [...state.tags, tag] }));

            return tag;
        },
        removeTag: (tagId) =>
            set((state) => ({
                tags: state.tags.filter((t) => t.id !== tagId),
            })),
        clearTags: () => set(() => ({ tags: [] })),
        hydrate: (tags) => set(() => ({ tags })),
    };
});
