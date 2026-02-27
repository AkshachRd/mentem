import type { NextStatesPreview, ScheduleResult, SrsData, SrsRating } from '../model/srs-types';

async function invokeCmd<T>(cmd: string, params?: Record<string, unknown>): Promise<T> {
    const { invoke } = await import('@tauri-apps/api/core');

    return await invoke<T>(cmd, params);
}

function today(): string {
    return new Date().toISOString().slice(0, 10);
}

function daysBetween(dateA: string, dateB: string): number {
    const a = new Date(dateA).getTime();
    const b = new Date(dateB).getTime();

    return Math.max(0, Math.round(Math.abs(a - b) / (1000 * 60 * 60 * 24)));
}

function addDays(date: string, days: number): string {
    const d = new Date(date);

    d.setDate(d.getDate() + days);

    return d.toISOString().slice(0, 10);
}

function srsToBackendData(srs?: SrsData) {
    if (!srs) {
        return { stability: null, difficulty: null, elapsedDays: 0 };
    }

    return {
        stability: srs.stability,
        difficulty: srs.difficulty,
        elapsedDays: daysBetween(srs.lastReview, today()),
    };
}

export async function getNextStates(
    srs?: SrsData,
    retention?: number,
    parameters?: number[] | null,
): Promise<NextStatesPreview> {
    return invokeCmd<NextStatesPreview>('srs_get_next_states', {
        cardSrsData: srsToBackendData(srs),
        desiredRetention: retention ?? null,
        parameters: parameters ?? null,
    });
}

function deriveState(rating: SrsRating, prevState?: string, interval?: number): SrsData['state'] {
    if (rating === 1) {
        return prevState === 'new' || !prevState ? 'learning' : 'relearning';
    }
    if (!interval || interval < 1) return 'learning';

    return 'review';
}

export async function scheduleReview(
    srs: SrsData | undefined,
    rating: SrsRating,
    retention?: number,
    parameters?: number[] | null,
): Promise<SrsData> {
    const result = await invokeCmd<ScheduleResult>('srs_schedule_review', {
        cardSrsData: srsToBackendData(srs),
        rating,
        desiredRetention: retention ?? null,
        parameters: parameters ?? null,
    });

    const now = today();
    const prevLapses = srs?.lapses ?? 0;
    const prevReps = srs?.reps ?? 0;

    return {
        stability: result.stability,
        difficulty: result.difficulty,
        due: addDays(now, Math.round(result.interval)),
        interval: Math.round(result.interval),
        lapses: rating === 1 ? prevLapses + 1 : prevLapses,
        reps: prevReps + 1,
        state: deriveState(rating, srs?.state, result.interval),
        lastReview: now,
    };
}

/** Run FSRS optimizer on review history. Returns optimized parameters. */
export async function optimizeParameters(reviewLogJsonl: string): Promise<number[]> {
    return invokeCmd<number[]>('srs_optimize', { reviewLogJsonl });
}
