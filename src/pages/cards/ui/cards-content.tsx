'use client';

import { useMemo } from 'react';

import { Card, CardItem } from '@/entities/card';
import { useMemoriesStore, Memory } from '@/entities/memory';
import { Masonry } from '@/shared/ui/masonry';

type CardsContentProps = {
    selectedTagIds: string[];
};

const COLUMN_WIDTH = 380;

export const CardsContent = ({ selectedTagIds }: CardsContentProps) => {
    const { memories } = useMemoriesStore();

    const cards = useMemo(() => {
        return [...memories]
            .filter((item): item is Memory & { kind: 'card' } => item.kind === 'card')
            .sort((a, b) => b.updatedAt - a.updatedAt);
    }, [memories]);

    const filteredCards = useMemo(() => {
        if (selectedTagIds.length === 0) return cards;

        return cards.filter((item) => item.tagIds.some((id) => selectedTagIds.includes(id)));
    }, [cards, selectedTagIds]);

    return (
        <Masonry
            columnWidth={COLUMN_WIDTH}
            getItemKey={(item) => item.id}
            items={filteredCards}
            renderItem={(item) => <CardItem card={item as Card} />}
        />
    );
};
