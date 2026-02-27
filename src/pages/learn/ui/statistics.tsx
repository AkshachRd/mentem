'use client';

import type { LearnStats } from '@/entities/card/lib/statistics';

import { FC, useMemo } from 'react';

function generateHeatmapDays(heatmap: Record<string, number>): { date: string; count: number }[] {
    const days: { date: string; count: number }[] = [];
    const end = new Date();
    const start = new Date();

    start.setDate(end.getDate() - 90); // Last 90 days

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const dateStr = d.toISOString().slice(0, 10);

        days.push({ date: dateStr, count: heatmap[dateStr] ?? 0 });
    }

    return days;
}

function heatColor(count: number, max: number): string {
    if (count === 0) return 'bg-muted';
    const ratio = count / Math.max(max, 1);

    if (ratio < 0.25) return 'bg-green-900/40';
    if (ratio < 0.5) return 'bg-green-700/60';
    if (ratio < 0.75) return 'bg-green-500/80';

    return 'bg-green-400';
}

interface StatisticsProps {
    stats: LearnStats;
}

export const Statistics: FC<StatisticsProps> = ({ stats }) => {
    const heatmapDays = useMemo(() => generateHeatmapDays(stats.heatmap), [stats.heatmap]);
    const maxCount = useMemo(() => Math.max(...heatmapDays.map((d) => d.count), 1), [heatmapDays]);

    return (
        <div className="flex flex-col gap-4">
            {/* Card state counters */}
            <div className="flex gap-6 text-center">
                <CounterBadge color="text-blue-500" count={stats.cardCounts.new} label="New" />
                <CounterBadge
                    color="text-orange-500"
                    count={stats.cardCounts.learning + stats.cardCounts.relearning}
                    label="Learning"
                />
                <CounterBadge
                    color="text-green-500"
                    count={stats.cardCounts.review}
                    label="Review"
                />
            </div>

            {/* Streak & today */}
            <div className="text-muted-foreground flex gap-4 text-xs">
                <span>Today: {stats.todayReviews} reviews</span>
                <span>Streak: {stats.streak} days</span>
            </div>

            {/* Heatmap */}
            <div className="flex flex-wrap gap-[2px]">
                {heatmapDays.map(({ date, count }) => (
                    <div
                        key={date}
                        className={`h-2.5 w-2.5 rounded-[1px] ${heatColor(count, maxCount)}`}
                        title={`${date}: ${count} reviews`}
                    />
                ))}
            </div>
        </div>
    );
};

function CounterBadge({ count, label, color }: { count: number; label: string; color: string }) {
    return (
        <div>
            <p className={`text-lg font-bold ${color}`}>{count}</p>
            <p className="text-muted-foreground text-xs">{label}</p>
        </div>
    );
}
