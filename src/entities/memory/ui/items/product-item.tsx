'use client';

import { useState } from 'react';

import { ProductMemory } from '../../model/types';
import { MemoryKindBadge } from '../memory-kind-badge';
import { MemoryModal } from '../memory-modal';

import { Card, CardHeader, CardContent, CardFooter } from '@/shared/ui/card';
import { Dialog, DialogContent } from '@/shared/ui/dialog';
import { ExternalLink } from '@/shared/ui/external-link';
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
                        <ExternalLink className="text-primary hover:text-primary/80 text-sm" href={memory.url}>
                            View product
                        </ExternalLink>
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
