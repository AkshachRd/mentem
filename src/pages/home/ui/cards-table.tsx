import { Table, TableBody, TableCell, TableColumn, TableHeader, TableRow } from '@heroui/react';
import { useState } from 'react';

import { CardItemModal } from './card-item-modal';

import { Card, useCardStore } from '@/entities/card';
import { WidenIcon } from '@/shared/ui/icons';
import { Dialog, DialogContent } from '@/shared/ui/dialog';
import { Button } from '@/shared/ui/button';

export function CardsTable() {
    const { cards } = useCardStore();
    const [selectedCard, setSelectedCard] = useState<Card | null>(null);
    const [cardModalOpen, setCardModalOpen] = useState(false);

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
                                    className="size-8"
                                    variant="outline"
                                    onClick={() => {
                                        setSelectedCard(card);
                                        setCardModalOpen(true);
                                    }}
                                >
                                    <WidenIcon />
                                </Button>
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
            <Dialog open={cardModalOpen} onOpenChange={setCardModalOpen}>
                <DialogContent className="max-w-5xl lg:max-w-5xl" showCloseButton={false}>
                    {selectedCard && (
                        <CardItemModal
                            card={selectedCard}
                            onClose={() => setCardModalOpen(false)}
                        />
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
}
