'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';

import { NoteMemoryModal } from './note-memory-modal';

import { Dialog, DialogContent } from '@/shared/ui/dialog';
import { Card, CardContent } from '@/shared/ui/card';

export function NoteCreateItem() {
    const [noteCreateModalOpen, setNoteCreateModalOpen] = useState(false);

    return (
        <>
            <Card
                className="w-[380px] cursor-pointer border-2 border-dashed"
                onClick={() => setNoteCreateModalOpen(true)}
            >
                <CardContent className="text-muted-foreground flex h-40 items-center justify-center gap-3">
                    <Plus size={18} />
                    <span>Create note</span>
                </CardContent>
            </Card>

            <Dialog open={noteCreateModalOpen} onOpenChange={setNoteCreateModalOpen}>
                <DialogContent className="max-w-5xl lg:max-w-5xl" showCloseButton={false}>
                    <NoteMemoryModal onClose={() => setNoteCreateModalOpen(false)} />
                </DialogContent>
            </Dialog>
        </>
    );
}
