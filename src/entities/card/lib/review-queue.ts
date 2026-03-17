import type { CardMemory } from '@/entities/memory';

export type ReviewQueue = {
    dueCards: CardMemory[];
    newCards: CardMemory[];
    queue: CardMemory[];
    totalReviewable: number;
};

export function buildReviewQueue(
    cards: CardMemory[],
    newCardLimit: number,
    today: string,
): ReviewQueue {
    const dueCards: CardMemory[] = [];
    const newCards: CardMemory[] = [];

    for (const card of cards) {
        if (!card.srs) {
            newCards.push(card);
        } else if (card.srs.due <= today) {
            dueCards.push(card);
        }
    }

    // Sort due cards: most overdue first
    dueCards.sort((a, b) => {
        const aDue = a.srs!.due;
        const bDue = b.srs!.due;

        return aDue < bDue ? -1 : aDue > bDue ? 1 : 0;
    });

    const limitedNew = newCards.slice(0, newCardLimit);
    const queue = [...dueCards, ...limitedNew];

    return {
        dueCards,
        newCards: limitedNew,
        queue,
        totalReviewable: queue.length,
    };
}
