'use client';

import { Plus } from 'lucide-react';
import { useState } from 'react';

import { MemoryModal } from './memory-modal';

import { Dialog, DialogContent } from '@/shared/ui/dialog';
import { Card, CardContent } from '@/shared/ui/card';

export function MemoryCreateItem() {
    const [open, setOpen] = useState(false);

    return (
        <>
            <Card
                className="w-[380px] cursor-pointer border-2 border-dashed"
                onClick={() => setOpen(true)}
            >
                <CardContent className="text-muted-foreground flex h-40 items-center justify-center gap-3">
                    <Plus size={18} />
                    <span>Create memory</span>
                </CardContent>
            </Card>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="max-w-5xl lg:max-w-5xl" showCloseButton={false}>
                    <MemoryModal onClose={() => setOpen(false)} />
                </DialogContent>
            </Dialog>
        </>
    );
}
