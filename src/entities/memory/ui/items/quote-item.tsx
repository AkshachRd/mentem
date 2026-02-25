'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { FileText } from 'lucide-react';

import { QuoteMemory } from '../../model/types';
import { MemoryKindBadge } from '../memory-kind-badge';
import { MemoryModal } from '../memory-modal';

import { Card, CardContent, CardFooter } from '@/shared/ui/card';
import { Dialog, DialogContent } from '@/shared/ui/dialog';
import { ExternalLink } from '@/shared/ui/external-link';
import { useSettingsStore } from '@/entities/settings';
import { useQuoteStore } from '@/entities/quote';

type QuoteItemProps = {
    memory: QuoteMemory;
};

function isHttpUrl(url: string): boolean {
    return url.startsWith('http://') || url.startsWith('https://');
}

export function QuoteItem({ memory }: QuoteItemProps) {
    const [dialogOpen, setDialogOpen] = useState(false);
    const router = useRouter();
    const setSelectedPdfPath = useSettingsStore((s) => s.setSelectedPdfPath);
    const addPdfPaths = useSettingsStore((s) => s.addPdfPaths);
    const setNavigationTarget = useQuoteStore((s) => s.setNavigationTarget);

    const handleNavigateToSource = useCallback(() => {
        if (!memory.sourceUrl || !memory.sourcePosition) return;

        addPdfPaths([memory.sourceUrl]);
        setSelectedPdfPath(memory.sourceUrl);
        setNavigationTarget({
            filePath: memory.sourceUrl,
            position: memory.sourcePosition,
        });
        router.push('/reading');
    }, [
        memory.sourceUrl,
        memory.sourcePosition,
        addPdfPaths,
        setSelectedPdfPath,
        setNavigationTarget,
        router,
    ]);

    const hasLocalSource =
        memory.sourceUrl && !isHttpUrl(memory.sourceUrl) && memory.sourcePosition;
    const hasHttpSource = memory.sourceUrl && isHttpUrl(memory.sourceUrl);

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
                {(memory.author || hasLocalSource || hasHttpSource) && (
                    <CardFooter className="flex items-center justify-between pt-4">
                        {memory.author && (
                            <span className="text-muted-foreground text-sm">— {memory.author}</span>
                        )}
                        {hasLocalSource && (
                            <button
                                className="text-muted-foreground hover:text-primary flex items-center gap-1 text-xs"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleNavigateToSource();
                                }}
                            >
                                <FileText className="h-3 w-3" />
                                source
                            </button>
                        )}
                        {hasHttpSource && (
                            <ExternalLink
                                className="text-muted-foreground hover:text-primary text-xs"
                                href={memory.sourceUrl!}
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
