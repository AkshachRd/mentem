'use client';

import { useState } from 'react';
import { ExternalLink } from 'lucide-react';

import { QuoteMemory } from '../model/types';

import { QuoteMemoryModal } from './quote-memory-modal';
import { MemoryKindBadge } from './memory-kind-badge';

import { Dialog, DialogContent } from '@/shared/ui/dialog';
import { Card, CardContent, CardFooter } from '@/shared/ui/card';

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
                            <a
                                className="text-muted-foreground hover:text-primary flex items-center gap-1 text-xs"
                                href={memory.sourceUrl}
                                rel="noopener noreferrer"
                                target="_blank"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <ExternalLink className="h-3 w-3" />
                                source
                            </a>
                        )}
                    </CardFooter>
                )}
            </Card>

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="max-w-2xl" showCloseButton={false}>
                    <QuoteMemoryModal memory={memory} onClose={() => setDialogOpen(false)} />
                </DialogContent>
            </Dialog>
        </>
    );
}
