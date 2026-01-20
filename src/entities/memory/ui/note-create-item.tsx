'use client';

import { Card, CardBody } from '@heroui/react';
import { useState } from 'react';
import { Plus } from 'lucide-react';

import { NoteMemoryModal } from './note-memory-modal';

import { Dialog, DialogContent } from '@/shared/ui/dialog';

export function NoteCreateItem() {
    const [noteCreateModalOpen, setNoteCreateModalOpen] = useState(false);

    return (
        <>
            <Card
                isPressable
                className="border-default-300 w-[380px] border-dashed"
                shadow="sm"
                onPress={() => setNoteCreateModalOpen(true)}
            >
                <CardBody className="text-default-500 flex h-40 items-center justify-center gap-3">
                    <Plus size={18} />
                    <span>Create note</span>
                </CardBody>
            </Card>

            <Dialog open={noteCreateModalOpen} onOpenChange={setNoteCreateModalOpen}>
                <DialogContent className="max-w-5xl lg:max-w-5xl" showCloseButton={false}>
                    <NoteMemoryModal onClose={() => setNoteCreateModalOpen(false)} />
                </DialogContent>
            </Dialog>
        </>
    );
}
