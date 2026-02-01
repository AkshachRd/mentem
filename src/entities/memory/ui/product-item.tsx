'use client';

import { useState } from 'react';
import { ExternalLink } from 'lucide-react';

import { ProductMemory } from '../model/types';

import { ProductMemoryModal } from './product-memory-modal';
import { MemoryKindBadge } from './memory-kind-badge';

import { Dialog, DialogContent } from '@/shared/ui/dialog';
import { Card, CardHeader, CardContent, CardFooter } from '@/shared/ui/card';
import { Separator } from '@/shared/ui/separator';

type ProductItemProps = {
    memory: ProductMemory;
};

export function ProductItem({ memory }: ProductItemProps) {
    const [dialogOpen, setDialogOpen] = useState(false);
    const title = memory.title ?? 'Untitled product';

    const formatPrice = () => {
        if (!memory.price) return null;
        const currency = memory.currency ?? '$';

        return `${currency}${memory.price}`;
    };

    const price = formatPrice();

    return (
        <>
            <Card className="relative w-[380px] cursor-pointer" onClick={() => setDialogOpen(true)}>
                <MemoryKindBadge className="absolute top-2 left-2" kind="product" />
                <CardHeader className="pt-10">
                    <h3 className="line-clamp-2 text-lg font-semibold">{title}</h3>
                </CardHeader>
                {price && (
                    <>
                        <Separator />
                        <CardContent>
                            <span className="text-primary text-2xl font-bold">{price}</span>
                        </CardContent>
                    </>
                )}
                {memory.url && (
                    <CardFooter className="pt-0">
                        <a
                            className="text-primary hover:text-primary/80 flex items-center gap-1 text-sm"
                            href={memory.url}
                            rel="noopener noreferrer"
                            target="_blank"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <ExternalLink className="h-4 w-4" />
                            View product
                        </a>
                    </CardFooter>
                )}
            </Card>

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="max-w-2xl" showCloseButton={false}>
                    <ProductMemoryModal memory={memory} onClose={() => setDialogOpen(false)} />
                </DialogContent>
            </Dialog>
        </>
    );
}
