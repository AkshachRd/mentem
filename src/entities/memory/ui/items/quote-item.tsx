'use client';

import { useState } from 'react';

import { QuoteMemory } from '../../model/types';
import { MemoryKindBadge } from '../memory-kind-badge';
import { MemoryModal } from '../memory-modal';

import { Card, CardContent, CardFooter } from '@/shared/ui/card';
import { Dialog, DialogContent } from '@/shared/ui/dialog';
import { ExternalLink } from '@/shared/ui/external-link';

type QuoteItemProps = {
    memory: QuoteMemory;
};

export function QuoteItem({ memory }: QuoteItemProps) {
    const [dialogOpen, setDialogOpen] = useState(false);

    return (
        <>
            <Card className="relative w-[380px] cursor-pointer" onClick={() => setDialogOpen(true)}>
                <MemoryKindBadge className="absolute top-2 left-2" kind="quote" />
                <CardContent className="pt-4">
                    <blockquote className="border-primary/30 border-l-4 pl-4">
                        <p
                            className="text-base leading-relaxed italic"
                            style={{
                                display: '-webkit-box',
                                WebkitLineClamp: 6,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden',
                            }}
                        >
                            &laquo;{memory.text}&raquo;
                        </p>
                    </blockquote>
                </CardContent>
                {(memory.author || memory.sourceUrl) && (
                    <CardFooter className="flex items-center justify-between pt-0">
                        {memory.author && (
                            <span className="text-muted-foreground text-sm">— {memory.author}</span>
                        )}
                        {memory.sourceUrl && (
                            <ExternalLink
                                className="text-muted-foreground hover:text-primary text-xs"
                                href={memory.sourceUrl}
                                iconSize={12}
                            >
                                source
                            </ExternalLink>
                        )}
                    </CardFooter>
                )}
            </Card>

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="max-w-5xl lg:max-w-5xl" showCloseButton={false}>
                    <MemoryModal memory={memory} onClose={() => setDialogOpen(false)} />
                </DialogContent>
            </Dialog>
        </>
    );
}
