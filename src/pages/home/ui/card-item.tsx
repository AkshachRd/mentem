'use client';

import { useDisclosure } from '@heroui/react';

import { CardItemDropdown } from './card-item-dropdown';
import { CardItemModal } from './card-item-modal';

import { Card } from '@/entities/card';
import { Dialog, DialogContent } from '@/shared/ui/dialog';

interface CardItemProps {
    card: Card;
}

export function CardItem({ card }: CardItemProps) {
    const { isOpen: isModalOpen, onOpen: onModalOpen, onClose: onModalClose } = useDisclosure();

    return (
        <>
            <CardItemDropdown card={card} onModalOpen={onModalOpen} />

            <Dialog open={isModalOpen} onOpenChange={onModalClose}>
                <DialogContent className="max-w-5xl lg:max-w-5xl" showCloseButton={false}>
                    <CardItemModal card={card} onClose={onModalClose} />
                </DialogContent>
            </Dialog>
        </>
    );
}
