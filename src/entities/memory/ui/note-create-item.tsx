'use client';

import { Card, CardBody, Modal, useDisclosure } from '@heroui/react';
import { Plus } from 'lucide-react';

import { NoteMemoryModal } from './note-memory-modal';

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

            <Modal isOpen={isOpen} size="5xl" onClose={onClose}>
                <NoteMemoryModal />
            </Modal>
        </>
    );
}
