'use client';

import { useState } from 'react';

import { NoteMemory } from '../../model/types';
import { MemoryKindBadge } from '../memory-kind-badge';
import { MemoryModal } from '../memory-modal';

import { Dialog, DialogContent } from '@/shared/ui/dialog';
import { Separator } from '@/shared/ui/separator';
import { Card, CardHeader, CardContent } from '@/shared/ui/card';

type NoteItemProps = {
    memory: NoteMemory;
    maxContentLines: number;
};

export function NoteItem({ memory, maxContentLines }: NoteItemProps) {
    const [dialogOpen, setDialogOpen] = useState(false);
    const title = memory.title ?? 'Untitled note';
    const tldr = memory.tldr;

    return (
        <>
            <Card className="relative w-[380px] cursor-pointer" onClick={() => setDialogOpen(true)}>
                <MemoryKindBadge className="absolute top-2 left-2" kind="note" />
                <CardHeader className="flex flex-col items-start gap-1 pt-4">
                    {tldr && <div className="text-muted-foreground text-xs">{tldr}</div>}
                    <div className="text-lg font-semibold">{title}</div>
                </CardHeader>
                <Separator />
                <CardContent>
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
                </CardContent>
            </Card>

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="max-w-5xl lg:max-w-5xl" showCloseButton={false}>
                    <MemoryModal memory={memory} onClose={() => setDialogOpen(false)} />
                </DialogContent>
            </Dialog>
        </>
    );
}
