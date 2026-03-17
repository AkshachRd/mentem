'use client';

import type { NextStatesPreview, SrsRating } from '@/entities/card';

import { FC } from 'react';

import { Button } from '@/shared/ui/button';

function formatInterval(days: number): string {
    if (days < 1) return '<1d';
    if (days === 1) return '1d';
    if (days < 30) return `${Math.round(days)}d`;
    if (days < 365) return `${Math.round(days / 30)}mo`;

    return `${(days / 365).toFixed(1)}y`;
}

type RatingConfig = {
    rating: SrsRating;
    label: string;
    key: keyof NextStatesPreview;
    className: string;
};

const RATINGS: RatingConfig[] = [
    { rating: 1, label: 'Again', key: 'again', className: 'text-red-500 hover:bg-red-500/10' },
    {
        rating: 2,
        label: 'Hard',
        key: 'hard',
        className: 'text-orange-500 hover:bg-orange-500/10',
    },
    { rating: 3, label: 'Good', key: 'good', className: 'text-green-500 hover:bg-green-500/10' },
    { rating: 4, label: 'Easy', key: 'easy', className: 'text-blue-500 hover:bg-blue-500/10' },
];

interface RatingButtonsProps {
    preview: NextStatesPreview | null;
    onRate: (rating: SrsRating) => void;
}

export const RatingButtons: FC<RatingButtonsProps> = ({ preview, onRate }) => {
    return (
        <div className="flex gap-2">
            {RATINGS.map(({ rating, label, key, className }) => (
                <Button
                    key={rating}
                    className={className}
                    size="lg"
                    variant="outline"
                    onClick={() => onRate(rating)}
                >
                    <span className="flex flex-col items-center gap-0.5">
                        <span>{label}</span>
                        {preview && (
                            <span className="text-muted-foreground text-[10px]">
                                {formatInterval(preview[key].interval)}
                            </span>
                        )}
                    </span>
                </Button>
            ))}
        </div>
    );
};
