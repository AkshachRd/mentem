'use client';

import { Card, CardBody, CardHeader, Divider, useDisclosure } from '@heroui/react';

import { NoteMemory } from '../model/types';

import { NoteMemoryModal } from './note-memory-modal';

import { Dialog, DialogContent } from '@/shared/ui/dialog';

type NoteItemProps = {
    memory: NoteMemory;
    maxContentLines: number;
};

export function NoteItem({ memory, maxContentLines }: NoteItemProps) {
    const { isOpen, onOpen, onClose } = useDisclosure();
    const title = memory.title ?? 'Untitled note';
    const tldr = memory.tldr;

    return (
        <>
            <Card isPressable className="w-[380px]" shadow="lg" onPress={onOpen}>
                <CardHeader className="flex flex-col items-start gap-1">
                    {tldr && <div className="text-tiny text-default-500">{tldr}</div>}
                    <div className="text-large font-semibold">{title}</div>
                </CardHeader>
                <Divider />
                <CardBody>
                    <div
                        className="text-base leading-6 whitespace-pre-wrap"
                        style={{
                            display: '-webkit-box',
                            WebkitLineClamp: maxContentLines,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                        }}
                    >
                        {memory.content}
                    </div>
                </CardBody>
            </Card>

            <Dialog open={isOpen} onOpenChange={onClose}>
                <DialogContent className="max-w-5xl lg:max-w-5xl" showCloseButton={false}>
                    <NoteMemoryModal memory={memory} onClose={onClose} />
                </DialogContent>
            </Dialog>
        </>
    );
}
