'use client';

import { useMemo } from 'react';

import { CardItem } from './card-item';

import { Card } from '@/entities/card';
import {
    useMemoriesStore,
    Memory,
    NoteItem,
    QuoteItem,
    ImageItem,
    ArticleItem,
    ProductItem,
} from '@/entities/memory';
import { NoteCreateItem } from '@/entities/memory/ui/note-create-item';
import {
    NoteMemory,
    QuoteMemory,
    ImageMemory,
    ArticleMemory,
    ProductMemory,
} from '@/entities/memory/model/types';
import { TagComponent, useTagsStore } from '@/entities/tag';
import { Masonry } from '@/shared/ui/masonry';

type HomeContentProps = {
    selectedTagIds: string[];
    onTagClick: (tagId: string) => void;
};

const COLUMN_WIDTH = 380;

type CreatePlaceholder = { id: '__create__'; kind: '__create__' };
type MasonryItem = Memory | CreatePlaceholder;

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

export const HomeContent = ({ selectedTagIds, onTagClick }: HomeContentProps) => {
    const { memories } = useMemoriesStore();
    const { tags } = useTagsStore();

    const allItems = useMemo(() => {
        return [...memories].sort((a, b) => b.updatedAt - a.updatedAt);
    }, [memories]);

    const filteredItems = useMemo(() => {
        if (selectedTagIds.length === 0) return allItems;

        return allItems.filter((item) => item.tagIds.some((id) => selectedTagIds.includes(id)));
    }, [allItems, selectedTagIds]);

    const itemsWithCreate: MasonryItem[] = useMemo(
        () => [{ id: '__create__', kind: '__create__' } as CreatePlaceholder, ...filteredItems],
        [filteredItems],
    );

    const renderMemoryTags = (memory: Memory) => {
        const memoryTags = tags.filter((tag) => memory.tagIds.includes(tag.id));

        if (memoryTags.length === 0) return null;

        return (
            <div className="flex flex-wrap gap-1 px-2 pt-1 pb-1">
                {memoryTags.map((tag) => (
                    <TagComponent key={tag.id} color={tag.color} onClose={() => onTagClick(tag.id)}>
                        {tag.name}
                    </TagComponent>
                ))}
            </div>
        );
    };

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
                    return (
                        <>
                            <CardItem card={item as Card} />
                            {renderMemoryTags(item as Card)}
                        </>
                    );
                }
                if (item.kind === 'note') {
                    return (
                        <>
                            <NoteItem
                                maxContentLines={getMaxContentLines(item as NoteMemory)}
                                memory={item as NoteMemory}
                            />
                            {renderMemoryTags(item as NoteMemory)}
                        </>
                    );
                }
                if (item.kind === 'quote') {
                    return (
                        <>
                            <QuoteItem memory={item as QuoteMemory} />
                            {renderMemoryTags(item as QuoteMemory)}
                        </>
                    );
                }
                if (item.kind === 'image') {
                    return (
                        <>
                            <ImageItem memory={item as ImageMemory} />
                            {renderMemoryTags(item as ImageMemory)}
                        </>
                    );
                }
                if (item.kind === 'article') {
                    return (
                        <>
                            <ArticleItem memory={item as ArticleMemory} />
                            {renderMemoryTags(item as ArticleMemory)}
                        </>
                    );
                }
                if (item.kind === 'product') {
                    return (
                        <>
                            <ProductItem memory={item as ProductMemory} />
                            {renderMemoryTags(item as ProductMemory)}
                        </>
                    );
                }

                return null;
            }}
        />
    );
};
