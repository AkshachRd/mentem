import {
    Button,
    Table,
    TableBody,
    TableCell,
    TableColumn,
    TableHeader,
    TableRow,
    useDisclosure,
} from '@heroui/react';
import { useState } from 'react';

import { CardItemModal } from './card-item-modal';

import { Card, useCardStore } from '@/entities/card';
import { WidenIcon } from '@/shared/ui/icons';
import { Dialog, DialogContent } from '@/shared/ui/dialog';

export function CardsTable() {
    const { cards } = useCardStore();
    const [selectedCard, setSelectedCard] = useState<Card | null>(null);
    const { isOpen: isModalOpen, onOpen: onModalOpen, onClose: onModalClose } = useDisclosure();

    return (
        <>
            <Table aria-label="List of cards" selectionMode="multiple">
                <TableHeader>
                    <TableColumn>FRONT</TableColumn>
                    <TableColumn>BACK</TableColumn>
                    <TableColumn width="1fr">WIDEN</TableColumn>
                </TableHeader>
                <TableBody items={cards}>
                    {(card) => (
                        <TableRow key={card.id}>
                            <TableCell>{card.frontSide}</TableCell>
                            <TableCell>{card.backSide}</TableCell>
                            <TableCell>
                                <Button
                                    isIconOnly
                                    radius="full"
                                    size="md"
                                    onPress={() => {
                                        setSelectedCard(card);
                                        onModalOpen();
                                    }}
                                >
                                    <WidenIcon />
                                </Button>
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
            <Dialog open={isModalOpen} onOpenChange={onModalClose}>
                <DialogContent className="max-w-5xl lg:max-w-5xl" showCloseButton={false}>
                    {selectedCard && <CardItemModal card={selectedCard} onClose={onModalClose} />}
                </DialogContent>
            </Dialog>
        </>
    );
}
