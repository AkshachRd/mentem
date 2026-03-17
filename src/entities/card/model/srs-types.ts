export type CardState = 'new' | 'learning' | 'review' | 'relearning';
export type SrsRating = 1 | 2 | 3 | 4; // Again, Hard, Good, Easy

export type SrsData = {
    stability: number;
    difficulty: number;
    due: string; // "2026-03-01" ISO date
    interval: number; // days
    lapses: number;
    reps: number;
    state: CardState;
    lastReview: string; // "2026-02-26" ISO date
};

export type ScheduleResult = {
    stability: number;
    difficulty: number;
    interval: number;
};

export type NextStatesPreview = {
    again: ScheduleResult;
    hard: ScheduleResult;
    good: ScheduleResult;
    easy: ScheduleResult;
};
