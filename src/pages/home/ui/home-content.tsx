'use client';

import { useMemo } from 'react';

import { CardItem } from './card-item';

import { useCardStore, Card } from '@/entities/card';
import { useMemoriesStore, Memory } from '@/entities/memory';
import { NoteItem } from '@/entities/memory/ui/note-item';
import { NoteCreateItem } from '@/entities/memory/ui/note-create-item';
import { NoteMemory } from '@/entities/memory/model/types';
import { Masonry } from '@/shared/ui/masonry';

type HomeContentProps = {
    selectedTagIds: string[];
};

const COLUMN_WIDTH = 380;

type CreatePlaceholder = { id: '__create__'; kind: '__create__' };
type MasonryItem = Memory | Card | CreatePlaceholder;

function estimateNoteHeight(note: NoteMemory): number {
    const horizontalPadding = 32;
    const contentWidth = Math.max(200, COLUMN_WIDTH - horizontalPadding);
    const avgCharPx = 7.2;
    const charsPerLine = Math.max(20, Math.floor(contentWidth / avgCharPx));

    const titleHeight = 28;
    const tldrHeight = note.tldr ? 20 : 0;
    const headerGap = 16;
    const divider = 1;
    const verticalPadding = 32;
    const lineHeight = 24;

    const content = note.content ?? '';
    const lines = Math.max(2, Math.ceil(content.length / charsPerLine));
    const maxLines = Math.min(lines, 24);
    const contentHeight = maxLines * lineHeight;

    return titleHeight + tldrHeight + headerGap + divider + verticalPadding + contentHeight;
}

function getMaxContentLines(note: NoteMemory): number {
    return Math.max(2, Math.floor(estimateNoteHeight(note) / 24) - 4);
}

export const HomeContent = ({ selectedTagIds }: HomeContentProps) => {
    const { memories } = useMemoriesStore();
    const { cards } = useCardStore();

    const allItems = useMemo(() => {
        const combined: (Memory | Card)[] = [...memories, ...cards];
        return combined.sort((a, b) => b.updatedAt - a.updatedAt);
    }, [memories, cards]);

    const filteredItems = useMemo(() => {
        if (selectedTagIds.length === 0) return allItems;
        return allItems.filter((item) => item.tagIds.some((id) => selectedTagIds.includes(id)));
    }, [allItems, selectedTagIds]);

    const itemsWithCreate: MasonryItem[] = useMemo(
        () => [{ id: '__create__', kind: '__create__' } as CreatePlaceholder, ...filteredItems],
        [filteredItems],
    );

    return (
        <Masonry
            columnWidth={COLUMN_WIDTH}
            getItemKey={(item) => item.id}
            items={itemsWithCreate}
            renderItem={(item) => {
                if (item.kind === '__create__') {
                    return <NoteCreateItem />;
                }
                if (item.kind === 'card') {
                    return <CardItem card={item as Card} />;
                }
                if (item.kind === 'note') {
                    return (
                        <NoteItem
                            maxContentLines={getMaxContentLines(item as NoteMemory)}
                            memory={item as NoteMemory}
                        />
                    );
                }

                return null;
            }}
        />
    );
};
