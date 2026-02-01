'use client';

import { Layers, X, Play } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { useSessionCards } from '../model/use-session-cards';

import { Button } from '@/shared/ui/button';

export function SessionCardsPanel() {
    const router = useRouter();
    const { cards, count, clearSession } = useSessionCards();

    if (count === 0) return null;

    const handleReviewNow = () => {
        // Navigate to learn page with session filter
        const cardIds = cards.map((c) => c.id).join(',');

        router.push(`/learn?session=${cardIds}`);
    };

    return (
        <div className="bg-card fixed right-4 bottom-4 z-50 flex items-center gap-3 rounded-lg border p-3 shadow-lg">
            <div className="flex items-center gap-2">
                <div className="bg-primary/10 text-primary rounded-full p-2">
                    <Layers className="h-4 w-4" />
                </div>
                <span className="text-sm font-medium">
                    {count} {count === 1 ? 'card' : 'cards'} created
                </span>
            </div>
            <div className="flex items-center gap-2">
                <Button size="sm" onClick={handleReviewNow}>
                    <Play className="mr-1 h-3 w-3" />
                    Review now
                </Button>
                <Button size="icon" variant="ghost" onClick={clearSession}>
                    <X className="h-4 w-4" />
                </Button>
            </div>
        </div>
    );
}
