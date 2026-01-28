import { create } from 'zustand';
import { nanoid } from 'nanoid';

import { cardToMarkdown } from '../lib/serialize';

import { Card, CardInput } from './types';

import { deleteFile, fileExists, getCollectionDir, writeMarkdownFile } from '@/shared/lib/fs';

export type CardsState = {
    cards: Card[];
    addCard: (input: CardInput) => Card;
    updateCard: (id: string, updater: (current: Card) => Card) => void;
    removeCard: (id: string) => void;
    addTagsToCard: (cardId: string, tagIds: string[]) => void;
    removeTagsFromCard: (cardId: string, tagIds: string[]) => void;
    hydrate: (cards: Card[]) => void;
};

export const useCardStore = create<CardsState>()((set, get) => ({
    cards: [],
    addCard: (input) => {
        const now = Date.now();
        const card: Card = {
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

        void (async () => {
            try {
                const dir = await getCollectionDir('cards');

                await writeMarkdownFile(dir, `${card.id}.md`, cardToMarkdown(card));
            } catch (error) {
                console.error('Failed to write card file', error);
            }
        })();
        set((state) => ({ cards: [...state.cards, card] }));

        return card;
    },
    updateCard: (id, updater) => {
        const now = Date.now();

        set((state) => ({
            cards: state.cards.map((c) => (c.id === id ? { ...updater(c), updatedAt: now } : c)),
        }));
        void (async () => {
            try {
                const dir = await getCollectionDir('cards');
                const current = get().cards.find((c) => c.id === id);

                if (current) {
                    await writeMarkdownFile(dir, `${id}.md`, cardToMarkdown(current));
                }
            } catch (error) {
                console.error('[card] update -> write fail', error);
            }
        })();
    },
    removeCard: (id) => {
        set((state) => ({
            cards: state.cards.filter((c) => c.id !== id),
        }));
        void (async () => {
            try {
                const dir = await getCollectionDir('cards');

                if (await fileExists(dir, `${id}.md`)) {
                    await deleteFile(dir, `${id}.md`);
                }
            } catch (error) {
                console.error('[card] delete -> fail', error);
            }
        })();
    },
    addTagsToCard: (cardId: string, tagIds: string[]) => {
        const now = Date.now();

        set((state) => ({
            cards: state.cards.map((card) =>
                card.id === cardId
                    ? { ...card, tagIds: [...card.tagIds, ...tagIds], updatedAt: now }
                    : card,
            ),
        }));
        void (async () => {
            try {
                const current = get().cards.find((c) => c.id === cardId);

                if (!current) return;
                const dir = await getCollectionDir('cards');

                await writeMarkdownFile(dir, `${cardId}.md`, cardToMarkdown(current));
            } catch (error) {
                console.error('Failed to update card file (add tags)', error);
            }
        })();
    },
    removeTagsFromCard: (cardId: string, tagIds: string[]) => {
        const now = Date.now();

        set((state) => ({
            cards: state.cards.map((card) =>
                card.id === cardId
                    ? {
                          ...card,
                          tagIds: card.tagIds.filter((id) => !tagIds.includes(id)),
                          updatedAt: now,
                      }
                    : card,
            ),
        }));
        void (async () => {
            try {
                const current = get().cards.find((c) => c.id === cardId);

                if (!current) return;
                const dir = await getCollectionDir('cards');

                await writeMarkdownFile(dir, `${cardId}.md`, cardToMarkdown(current));
            } catch (error) {
                console.error('Failed to update card file (remove tags)', error);
            }
        })();
    },
    hydrate: (cards) => set(() => ({ cards })),
}));
