'use client';

import { useState } from 'react';

import { CardItemDropdown } from './card-item-dropdown';
import { CardItemModal } from './card-item-modal';

import { Card } from '@/entities/card';
import { Dialog, DialogContent } from '@/shared/ui/dialog';

interface CardItemProps {
    card: Card;
}

export function CardItem({ card }: CardItemProps) {
    const [cardModalOpen, setCardModalOpen] = useState(false);

    return (
        <>
            <CardItemDropdown card={card} onModalOpen={() => setCardModalOpen(true)} />

            <Dialog open={cardModalOpen} onOpenChange={setCardModalOpen}>
                <DialogContent className="max-w-5xl lg:max-w-5xl" showCloseButton={false}>
                    <CardItemModal card={card} onClose={() => setCardModalOpen(false)} />
                </DialogContent>
            </Dialog>
        </>
    );
}
