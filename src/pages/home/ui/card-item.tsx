'use client';

import { useDisclosure, Modal } from '@heroui/react';

import { CardItemDropdown } from './card-item-dropdown';
import { CardItemModal } from './card-item-modal';

import { Card } from '@/entities/card';

interface CardItemProps {
    card: Card;
}

export function CardItem({ card }: CardItemProps) {
    const { isOpen: isModalOpen, onOpen: onModalOpen, onClose: onModalClose } = useDisclosure();

    return (
        <>
            <CardItemDropdown card={card} onModalOpen={onModalOpen} />

            <Modal isOpen={isModalOpen} size="5xl" onClose={onModalClose}>
                <CardItemModal card={card} onClose={onModalClose} />
            </Modal>
        </>
    );
}
