import { create } from 'zustand';
import { nanoid } from 'nanoid';

import { memoryToMarkdown } from '../lib';

import { CardInput, CardMemory, Memory } from './types';
import { getFileSystemClient } from '@/shared/lib/fs';

export type MemoriesState = {
    memories: Memory[];
    addMemory: (memory: Memory) => void;
    updateMemory: (id: string, updater: (current: Memory) => Memory) => void;
    removeMemory: (id: string) => void;
    addTagsToMemory: (memoryId: string, tagIds: string[]) => void;
    removeTagsFromMemory: (memoryId: string, tagIds: string[]) => void;
    clearMemories: () => void;
    hydrate: (memories: Memory[]) => void;
    cards: CardMemory[];
    addCard: (input: CardInput) => CardMemory;
    updateCard: (id: string, updater: (current: CardMemory) => CardMemory) => void;
    removeCard: (id: string) => void;
    addTagsToCard: (cardId: string, tagIds: string[]) => void;
    removeTagsFromCard: (cardId: string, tagIds: string[]) => void;
};

export const useMemoriesStore = create<MemoriesState>()((set, get) => {
    const fs = getFileSystemClient()!;

    return {
        memories: [],
        addMemory: (memory) => {
            void (async () => {
                try {
                    const dir = await fs.getMemoriesDir();
                    const fileName = `${memory.id}.md`;

                    await fs.writeMarkdownFile(dir, fileName, memoryToMarkdown(memory));
                } catch (error) {
                    console.error('[mem] add -> write fail', error);
                }
            })();
            set((state) => ({ memories: [...state.memories, memory] }));
        },
        updateMemory: (id, updater) => {
            set((state) => ({
                memories: state.memories.map((m) => (m.id === id ? updater(m) : m)),
            }));
            void (async () => {
                try {
                    const current = get().memories.find((m) => m.id === id);

                    if (current) {
                        const dir = await fs.getMemoriesDir();

                        await fs.writeMarkdownFile(dir, `${id}.md`, memoryToMarkdown(current));
                    }
                } catch (error) {
                    console.error('[mem] update -> write fail', error);
                }
            })();
        },
        removeMemory: (id) => {
            const memory = get().memories.find((m) => m.id === id);

            set((state) => ({
                memories: state.memories.filter((m) => m.id !== id),
            }));
            void (async () => {
                try {
                    if (memory) {
                        const dir = await fs.getMemoriesDir();

                        if (await fs.fileExists(dir, `${id}.md`)) {
                            await fs.deleteFile(dir, `${id}.md`);
                        }
                    }
                } catch (error) {
                    console.error('[mem] delete -> fail', error);
                }
            })();
        },
        addTagsToMemory: (memoryId, tagIds) => {
            set((state) => ({
                memories: state.memories.map((m) =>
                    m.id === memoryId ? { ...m, tagIds: [...m.tagIds, ...tagIds] } : m,
                ),
            }));
            void (async () => {
                try {
                    const current = get().memories.find((m) => m.id === memoryId);

                    if (current) {
                        const dir = await fs.getMemoriesDir();

                        await fs.writeMarkdownFile(
                            dir,
                            `${memoryId}.md`,
                            memoryToMarkdown(current),
                        );
                    }
                } catch (error) {
                    console.error('[mem] addTags -> write fail', error);
                }
            })();
        },
        removeTagsFromMemory: (memoryId, tagIds) => {
            set((state) => ({
                memories: state.memories.map((m) =>
                    m.id === memoryId
                        ? {
                              ...m,
                              tagIds: m.tagIds.filter((id) => !tagIds.includes(id)),
                          }
                        : m,
                ),
            }));
            void (async () => {
                try {
                    const current = get().memories.find((m) => m.id === memoryId);

                    if (current) {
                        const dir = await fs.getMemoriesDir();

                        await fs.writeMarkdownFile(
                            dir,
                            `${memoryId}.md`,
                            memoryToMarkdown(current),
                        );
                    }
                } catch (error) {
                    console.error('[mem] removeTags -> write fail', error);
                }
            })();
        },
        clearMemories: () => set(() => ({ memories: [] })),
        hydrate: (memories) => set(() => ({ memories })),

        get cards() {
            return get().memories.filter((m): m is CardMemory => m.kind === 'card');
        },
        addCard: (input) => {
            const now = Date.now();
            const card: CardMemory = {
                id: input.id ?? nanoid(),
                kind: 'card',
                frontSide: input.frontSide,
                backSide: input.backSide,
                tagIds: input.tagIds ?? [],
                createdAt: input.createdAt ?? now,
                updatedAt: input.updatedAt ?? now,
                title: input.title,
                tldr: input.tldr,
            };

            get().addMemory(card);

            return card;
        },
        updateCard: (id, updater) => {
            const now = Date.now();

            get().updateMemory(id, (m) => {
                if (m.kind !== 'card') return m;

                return { ...updater(m as CardMemory), updatedAt: now };
            });
        },
        removeCard: (id) => {
            get().removeMemory(id);
        },
        addTagsToCard: (cardId, tagIds) => {
            const now = Date.now();

            set((state) => ({
                memories: state.memories.map((m) =>
                    m.id === cardId && m.kind === 'card'
                        ? { ...m, tagIds: [...m.tagIds, ...tagIds], updatedAt: now }
                        : m,
                ),
            }));
            void (async () => {
                try {
                    const current = get().memories.find((m) => m.id === cardId);

                    if (current) {
                        const dir = await fs.getMemoriesDir();

                        await fs.writeMarkdownFile(dir, `${cardId}.md`, memoryToMarkdown(current));
                    }
                } catch (error) {
                    console.error('[card] addTags -> write fail', error);
                }
            })();
        },
        removeTagsFromCard: (cardId, tagIds) => {
            const now = Date.now();

            set((state) => ({
                memories: state.memories.map((m) =>
                    m.id === cardId && m.kind === 'card'
                        ? {
                              ...m,
                              tagIds: m.tagIds.filter((id) => !tagIds.includes(id)),
                              updatedAt: now,
                          }
                        : m,
                ),
            }));
            void (async () => {
                try {
                    const current = get().memories.find((m) => m.id === cardId);

                    if (current) {
                        const dir = await fs.getMemoriesDir();

                        await fs.writeMarkdownFile(dir, `${cardId}.md`, memoryToMarkdown(current));
                    }
                } catch (error) {
                    console.error('[card] removeTags -> write fail', error);
                }
            })();
        },
    };
});

export { useMemoriesStore as useCardStore };
