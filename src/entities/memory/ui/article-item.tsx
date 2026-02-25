'use client';

import { useState } from 'react';
import { ExternalLink } from 'lucide-react';

import { ArticleMemory } from '../model/types';

import { MemoryKindBadge } from './memory-kind-badge';
import { MemoryModal } from './memory-modal';

import { Dialog, DialogContent } from '@/shared/ui/dialog';
import { Card, CardHeader, CardContent, CardFooter } from '@/shared/ui/card';
import { Separator } from '@/shared/ui/separator';
import { Badge } from '@/shared/ui/badge';

type ArticleItemProps = {
    memory: ArticleMemory;
};

export function ArticleItem({ memory }: ArticleItemProps) {
    const [dialogOpen, setDialogOpen] = useState(false);
    const title = memory.title ?? 'Untitled article';

    return (
        <>
            <Card className="relative w-[380px] cursor-pointer" onClick={() => setDialogOpen(true)}>
                <MemoryKindBadge className="absolute top-2 left-2" kind="article" />
                <CardHeader className="pt-4">
                    <h3 className="line-clamp-2 text-lg font-semibold">{title}</h3>
                    {memory.source && (
                        <Badge className="w-fit" variant="outline">
                            {memory.source}
                        </Badge>
                    )}
                </CardHeader>
                {memory.excerpt && (
                    <>
                        <Separator />
                        <CardContent>
                            <p
                                className="text-muted-foreground text-sm"
                                style={{
                                    display: '-webkit-box',
                                    WebkitLineClamp: 3,
                                    WebkitBoxOrient: 'vertical',
                                    overflow: 'hidden',
                                }}
                            >
                                {memory.excerpt}
                            </p>
                        </CardContent>
                    </>
                )}
                <CardFooter className="pt-4">
                    <a
                        className="text-primary hover:text-primary/80 flex items-center gap-1 text-sm"
                        href={memory.url}
                        rel="noopener noreferrer"
                        target="_blank"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <ExternalLink className="h-4 w-4" />
                        Read article
                    </a>
                </CardFooter>
            </Card>

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="max-w-2xl" showCloseButton={false}>
                    <MemoryModal memory={memory} onClose={() => setDialogOpen(false)} />
                </DialogContent>
            </Dialog>
        </>
    );
}
