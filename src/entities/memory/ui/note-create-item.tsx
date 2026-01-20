'use client';

import { Card, CardBody, useDisclosure } from '@heroui/react';
import { Plus } from 'lucide-react';

import { NoteMemoryModal } from './note-memory-modal';

import { Dialog, DialogContent } from '@/shared/ui/dialog';

export function NoteCreateItem() {
    const { isOpen, onOpen, onClose } = useDisclosure();

    return (
        <>
            <Card
                isPressable
                className="border-default-300 w-[380px] border-dashed"
                shadow="sm"
                onPress={onOpen}
            >
                <CardBody className="text-default-500 flex h-40 items-center justify-center gap-3">
                    <Plus size={18} />
                    <span>Create note</span>
                </CardBody>
            </Card>

            <Dialog open={isOpen} onOpenChange={onClose}>
                <DialogContent className="max-w-5xl lg:max-w-5xl" showCloseButton={false}>
                    <NoteMemoryModal onClose={onClose} />
                </DialogContent>
            </Dialog>
        </>
    );
}
