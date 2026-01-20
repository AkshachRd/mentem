'use client';

import { Button, Divider } from '@heroui/react';

import { TagInput } from './tag-input';

import { Card, CardComponent } from '@/entities/card';
import { useTagsStore } from '@/entities/tag';

interface CardItemModalProps {
    card: Card;
    onClose: () => void;
}

export function CardItemModal({ card, onClose }: CardItemModalProps) {
    const { tags } = useTagsStore();
    const cardTags = tags.filter((tag) => card.tagIds.includes(tag.id));

    return (
        <div className="flex h-[600px]">
            <div className="flex flex-1 items-center justify-center">
                <CardComponent
                    footerContent={card.backSide}
                    headerContent={card.frontSide}
                    revealBack={true}
                />
            </div>
            <Divider orientation="vertical" />
            <div className="flex w-80 flex-col gap-4 p-4">
                <TagInput card={card} tags={cardTags} />
                <Button color="danger" variant="light" onPress={onClose}>
                    Close
                </Button>
            </div>
        </div>
    );
}
