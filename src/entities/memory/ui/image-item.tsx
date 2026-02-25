'use client';

import { useState } from 'react';

import { ImageMemory } from '../model/types';

import { MemoryKindBadge } from './memory-kind-badge';
import { MemoryModal } from './memory-modal';

import { Dialog, DialogContent } from '@/shared/ui/dialog';
import { Card } from '@/shared/ui/card';

type ImageItemProps = {
    memory: ImageMemory;
};

export function ImageItem({ memory }: ImageItemProps) {
    const [dialogOpen, setDialogOpen] = useState(false);
    const title = memory.title ?? memory.alt ?? 'Untitled image';

    return (
        <>
            <Card
                className="relative w-[380px] cursor-pointer overflow-hidden"
                onClick={() => setDialogOpen(true)}
            >
                <MemoryKindBadge className="absolute top-2 left-2 z-10" kind="image" />
                <div className="relative aspect-video w-full overflow-hidden">
                    <img
                        alt={memory.alt ?? title}
                        className="h-full w-full object-cover transition-transform hover:scale-105"
                        src={memory.url}
                    />
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-4">
                        <h3 className="line-clamp-2 text-sm font-medium text-white">{title}</h3>
                    </div>
                </div>
            </Card>

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="max-w-3xl" showCloseButton={false}>
                    <MemoryModal memory={memory} onClose={() => setDialogOpen(false)} />
                </DialogContent>
            </Dialog>
        </>
    );
}
