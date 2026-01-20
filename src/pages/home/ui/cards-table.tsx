import { useState } from 'react';

import { CardItemModal } from './card-item-modal';

import { Card, useCardStore } from '@/entities/card';
import { WidenIcon } from '@/shared/ui/icons';
import { Dialog, DialogContent } from '@/shared/ui/dialog';
import { Button } from '@/shared/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/table';

export function CardsTable() {
    const { cards } = useCardStore();
    const [selectedCard, setSelectedCard] = useState<Card | null>(null);
    const [cardModalOpen, setCardModalOpen] = useState(false);

    return (
        <>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>FRONT</TableHead>
                        <TableHead>BACK</TableHead>
                        <TableHead>WIDEN</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {cards.map((card) => (
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
                    ))}
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
