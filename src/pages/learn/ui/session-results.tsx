'use client';

import { FC } from 'react';

import { Button } from '@/shared/ui/button';

export type SessionStats = {
    total: number;
    again: number;
    hard: number;
    good: number;
    easy: number;
    durationMs: number;
};

interface SessionResultsProps {
    stats: SessionStats;
    onRestart: () => void;
    onDone: () => void;
}

function formatDuration(ms: number): string {
    const seconds = Math.round(ms / 1000);

    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;

    return `${minutes}m ${remainingSeconds}s`;
}

type BarConfig = { label: string; count: number; color: string };

export const SessionResults: FC<SessionResultsProps> = ({ stats, onRestart, onDone }) => {
    const bars: BarConfig[] = [
        { label: 'Again', count: stats.again, color: 'bg-red-500' },
        { label: 'Hard', count: stats.hard, color: 'bg-orange-500' },
        { label: 'Good', count: stats.good, color: 'bg-green-500' },
        { label: 'Easy', count: stats.easy, color: 'bg-blue-500' },
    ];

    return (
        <div className="flex flex-col items-center gap-6 py-12">
            <p className="text-lg font-medium">Session complete!</p>
            <p className="text-muted-foreground text-sm">
                {stats.total} cards in {formatDuration(stats.durationMs)}
            </p>

            <div className="flex w-64 flex-col gap-2">
                {bars.map(({ label, count, color }) => (
                    <div key={label} className="flex items-center gap-2">
                        <span className="text-muted-foreground w-12 text-right text-xs">
                            {label}
                        </span>
                        <div className="bg-muted h-4 flex-1 overflow-hidden rounded-sm">
                            {stats.total > 0 && (
                                <div
                                    className={`h-full ${color}`}
                                    style={{ width: `${(count / stats.total) * 100}%` }}
                                />
                            )}
                        </div>
                        <span className="text-muted-foreground w-6 text-xs">{count}</span>
                    </div>
                ))}
            </div>

            <div className="flex gap-3">
                <Button variant="outline" onClick={onRestart}>
                    Review more
                </Button>
                <Button onClick={onDone}>Done</Button>
            </div>
        </div>
    );
};
