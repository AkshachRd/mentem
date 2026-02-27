'use client';

import type { ReviewQueue } from '@/entities/card';

import { FC } from 'react';

import { Button } from '@/shared/ui/button';

interface QueueSummaryProps {
    queue: ReviewQueue;
    onStart: () => void;
}

export const QueueSummary: FC<QueueSummaryProps> = ({ queue, onStart }) => {
    if (queue.totalReviewable === 0) {
        return (
            <div className="flex flex-col items-center gap-4 py-12">
                <p className="text-muted-foreground text-lg">No cards to review</p>
                <p className="text-muted-foreground text-sm">
                    Create cards first or come back when reviews are due.
                </p>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center gap-6 py-12">
            <div className="flex gap-8 text-center">
                <div>
                    <p className="text-2xl font-bold text-blue-500">{queue.dueCards.length}</p>
                    <p className="text-muted-foreground text-xs">Due</p>
                </div>
                <div>
                    <p className="text-2xl font-bold text-green-500">{queue.newCards.length}</p>
                    <p className="text-muted-foreground text-xs">New</p>
                </div>
            </div>
            <Button size="lg" onClick={onStart}>
                Start review ({queue.totalReviewable})
            </Button>
        </div>
    );
};
