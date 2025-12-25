'use client';

import { Masonry } from '@/shared/ui/masonry';
import { useMemoriesStore } from '@/entities/memory';
import { NoteItem } from '@/entities/memory/ui/note-item';
import { NoteCreateItem } from '@/entities/memory/ui/note-create-item';
import { NoteMemory } from '@/entities/memory/model/types';

type MemoriesListProps = {
    selectedTagIds: string[];
};

const NOTE_COLUMN_WIDTH = 380;

function estimateNoteHeight(note: NoteMemory, columnWidth: number): number {
    const horizontalPadding = 32; // card paddings combined effect in width
    const contentWidth = Math.max(200, columnWidth - horizontalPadding);
    const avgCharPx = 7.2; // approximate average character width in px for base font
    const charsPerLine = Math.max(20, Math.floor(contentWidth / avgCharPx));

    const titleHeight = 28;
    const tldrHeight = note.tldr ? 20 : 0;
    const headerGap = 16;
    const divider = 1;
    const verticalPadding = 32; // top+bottom paddings in body/header
    const lineHeight = 24; // px

    const content = note.content ?? '';
    const lines = Math.max(2, Math.ceil(content.length / charsPerLine));
    const maxLines = Math.min(lines, 24); // clamp for very long notes
    const contentHeight = maxLines * lineHeight;

    return titleHeight + tldrHeight + headerGap + divider + verticalPadding + contentHeight;
}

export function MemoriesList({ selectedTagIds }: MemoriesListProps) {
    const { memories } = useMemoriesStore();
    const notes = memories.filter((m): m is NoteMemory => m.kind === 'note');

    const filteredNotes =
        selectedTagIds.length === 0
            ? notes
            : notes.filter((note) => note.tagIds.some((tagId) => selectedTagIds.includes(tagId)));

    const itemsWithCreate = [{ id: '__create__' } as unknown as NoteMemory, ...filteredNotes];

    return (
        <Masonry
            animateFrom="bottom"
            blurToFocus={true}
            columnWidth={NOTE_COLUMN_WIDTH}
            duration={0.6}
            ease="power3.out"
            getItemHeight={(note, colW) =>
                (note as NoteMemory).id === '__create__'
                    ? 160 /* matches h-40 */
                    : estimateNoteHeight(note as NoteMemory, colW)
            }
            getItemKey={(note) => (note as NoteMemory).id}
            hoverScale={0.98}
            items={itemsWithCreate}
            renderItem={(note) =>
                (note as NoteMemory).id === '__create__' ? (
                    <NoteCreateItem />
                ) : (
                    <NoteItem
                        maxContentLines={Math.max(
                            2,
                            Math.floor(
                                estimateNoteHeight(note as NoteMemory, NOTE_COLUMN_WIDTH) / 24,
                            ) - 4,
                        )}
                        memory={note as NoteMemory}
                    />
                )
            }
            scaleOnHover={true}
            stagger={0.05}
        />
    );
}
