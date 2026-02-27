import type { CardMemory } from '@/entities/memory';
import type { ReviewLogEntry } from './review-log';

export type CardCounts = {
    new: number;
    learning: number;
    review: number;
    relearning: number;
};

export type LearnStats = {
    cardCounts: CardCounts;
    heatmap: Record<string, number>;
    todayReviews: number;
    streak: number;
};

export function computeStats(cards: CardMemory[], reviewLog: ReviewLogEntry[]): LearnStats {
    const cardCounts: CardCounts = { new: 0, learning: 0, review: 0, relearning: 0 };

    for (const card of cards) {
        if (!card.srs) {
            cardCounts.new++;
        } else {
            const state = card.srs.state;

            if (state in cardCounts) {
                cardCounts[state as keyof CardCounts]++;
            }
        }
    }

    // Build heatmap: date -> review count
    const heatmap: Record<string, number> = {};

    for (const entry of reviewLog) {
        heatmap[entry.date] = (heatmap[entry.date] ?? 0) + 1;
    }

    // Today's reviews
    const today = new Date().toISOString().slice(0, 10);
    const todayReviews = heatmap[today] ?? 0;

    // Calculate streak
    const streak = computeStreak(heatmap, today);

    return { cardCounts, heatmap, todayReviews, streak };
}

function computeStreak(heatmap: Record<string, number>, today: string): number {
    let streak = 0;
    const date = new Date(today);

    // Check if today has reviews; if not, start from yesterday
    if (!heatmap[today]) {
        date.setDate(date.getDate() - 1);
    }

    while (true) {
        const dateStr = date.toISOString().slice(0, 10);

        if (heatmap[dateStr]) {
            streak++;
            date.setDate(date.getDate() - 1);
        } else {
            break;
        }
    }

    return streak;
}
