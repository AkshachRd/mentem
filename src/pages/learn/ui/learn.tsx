'use client';

import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { PanInfo } from 'framer-motion';
import { useSearchParams } from 'next/navigation';

import { CardStack } from './card-stack';
import { RatingButtons } from './rating-buttons';
import { QueueSummary } from './queue-summary';
import { SessionResults, SessionStats } from './session-results';
import { Side } from './side';
import { Statistics } from './statistics';

import {
    type NextStatesPreview,
    type SrsRating,
    type LearnStats,
    buildReviewQueue,
    getNextStates,
    scheduleReview,
    appendReviewLog,
    readReviewLog,
    readReviewLogRaw,
    computeStats,
    optimizeParameters,
} from '@/entities/card';
import { useMemoriesStore, type CardMemory } from '@/entities/memory';
import { useSettingsStore } from '@/entities/settings/model/store';

type LearnPhase = 'idle' | 'reviewing' | 'results';

const SWIPE_THRESHOLD = 200;

export function Learn() {
    const searchParams = useSearchParams();
    const memories = useMemoriesStore((s) => s.memories);
    const updateCard = useMemoriesStore((s) => s.updateCard);
    const { newCardsPerDay, desiredRetention, fsrsParameters } = useSettingsStore();

    const allCards = useMemo(
        () => memories.filter((m): m is CardMemory => m.kind === 'card'),
        [memories],
    );

    const today = new Date().toISOString().slice(0, 10);

    // Filter cards by session param if provided
    const sessionCards = useMemo(() => {
        const sessionParam = searchParams?.get('session');
        const ids = sessionParam ? sessionParam.split(',') : null;

        if (!ids) return allCards;
        const idSet = new Set(ids);

        return allCards.filter((card) => idSet.has(card.id));
    }, [allCards, searchParams]);

    // Build review queue
    const queue = useMemo(() => {
        return buildReviewQueue(sessionCards, newCardsPerDay, today);
    }, [sessionCards, newCardsPerDay, today]);

    const [phase, setPhase] = useState<LearnPhase>('idle');
    const [currentIndex, setCurrentIndex] = useState(0);
    const [revealBack, setRevealBack] = useState(false);
    const [preview, setPreview] = useState<NextStatesPreview | null>(null);
    const [exitDirection, setExitDirection] = useState(0);
    const [leftActive, setLeftActive] = useState(false);
    const [rightActive, setRightActive] = useState(false);

    // Session tracking
    const sessionStart = useRef(0);
    const [sessionStats, setSessionStats] = useState<SessionStats>({
        total: 0,
        again: 0,
        hard: 0,
        good: 0,
        easy: 0,
        durationMs: 0,
    });

    // Statistics
    const [stats, setStats] = useState<LearnStats | null>(null);

    useEffect(() => {
        readReviewLog()
            .then((log) => setStats(computeStats(allCards, log)))
            .catch(console.error);
    }, [allCards, phase]);

    // Auto-optimize FSRS parameters after session ends (max once per day, 50+ reviews)
    useEffect(() => {
        if (phase !== 'results') return;

        const MIN_REVIEWS = 50;
        const ONE_DAY_MS = 24 * 60 * 60 * 1000;
        const { lastOptimizedAt, setFsrsParameters, setLastOptimizedAt } =
            useSettingsStore.getState();

        if (lastOptimizedAt && Date.now() - lastOptimizedAt < ONE_DAY_MS) return;

        readReviewLogRaw()
            .then((jsonl) => {
                const lineCount = jsonl.split('\n').filter((l) => l.trim()).length;

                if (lineCount < MIN_REVIEWS) return;

                return optimizeParameters(jsonl).then((params) => {
                    setFsrsParameters(params);
                    setLastOptimizedAt(Date.now());
                });
            })
            .catch(console.error);
    }, [phase]);

    const currentCard = phase === 'reviewing' ? queue.queue[currentIndex] : null;

    // Load preview when card changes
    useEffect(() => {
        if (!currentCard) return;
        setPreview(null);
        getNextStates(currentCard.srs, desiredRetention, fsrsParameters)
            .then(setPreview)
            .catch(console.error);
    }, [currentCard?.id, desiredRetention, fsrsParameters]);

    const handleStart = useCallback(() => {
        setPhase('reviewing');
        setCurrentIndex(0);
        setRevealBack(false);
        sessionStart.current = Date.now();
        setSessionStats({ total: 0, again: 0, hard: 0, good: 0, easy: 0, durationMs: 0 });
    }, []);

    const handleRate = useCallback(
        async (rating: SrsRating) => {
            if (!currentCard) return;

            const newSrs = await scheduleReview(
                currentCard.srs,
                rating,
                desiredRetention,
                fsrsParameters,
            );

            updateCard(currentCard.id, (c) => ({ ...c, srs: newSrs }));

            appendReviewLog({
                cardId: currentCard.id,
                rating,
                date: today,
                elapsed: currentCard.srs
                    ? Math.round(
                          (Date.now() - new Date(currentCard.srs.lastReview).getTime()) /
                              (1000 * 60 * 60 * 24),
                      )
                    : 0,
                state: currentCard.srs?.state ?? 'new',
                timestamp: Date.now(),
            }).catch(console.error);

            const ratingKey = { 1: 'again', 2: 'hard', 3: 'good', 4: 'easy' }[rating] as
                | 'again'
                | 'hard'
                | 'good'
                | 'easy';

            setSessionStats((prev) => ({
                ...prev,
                total: prev.total + 1,
                [ratingKey]: prev[ratingKey] + 1,
            }));

            const nextIndex = currentIndex + 1;

            if (nextIndex >= queue.queue.length) {
                setSessionStats((prev) => ({
                    ...prev,
                    durationMs: Date.now() - sessionStart.current,
                }));
                setPhase('results');
            } else {
                setCurrentIndex(nextIndex);
                setRevealBack(false);
            }
        },
        [
            currentCard,
            currentIndex,
            queue.queue.length,
            desiredRetention,
            fsrsParameters,
            today,
            updateCard,
        ],
    );

    const handleDrag = useCallback(
        (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
            if (!revealBack) return;
            setLeftActive(info.offset.x < -SWIPE_THRESHOLD);
            setRightActive(info.offset.x > SWIPE_THRESHOLD);
        },
        [revealBack],
    );

    const handleDragEnd = useCallback(
        (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
            if (!revealBack) return;
            if (info.offset.x < -SWIPE_THRESHOLD) {
                setExitDirection(-1);
                handleRate(1); // Again
            } else if (info.offset.x > SWIPE_THRESHOLD) {
                setExitDirection(1);
                handleRate(3); // Good
            }
            setLeftActive(false);
            setRightActive(false);
        },
        [revealBack, handleRate],
    );

    if (phase === 'idle') {
        return (
            <div className="flex flex-col items-center gap-8">
                <QueueSummary queue={queue} onStart={handleStart} />
                {stats && <Statistics stats={stats} />}
            </div>
        );
    }

    if (phase === 'results') {
        return (
            <SessionResults
                stats={sessionStats}
                onDone={() => setPhase('idle')}
                onRestart={handleStart}
            />
        );
    }

    // Reviewing phase
    const remainingCards = queue.queue.slice(currentIndex);

    return (
        <div className="flex h-full w-full items-center justify-center">
            <Side color="destructive" isActive={leftActive}>
                Again
            </Side>
            <div className="flex h-full flex-col items-center justify-evenly">
                <CardStack
                    cards={remainingCards}
                    exitDirection={exitDirection}
                    revealBack={revealBack}
                    onDrag={handleDrag}
                    onDragEnd={handleDragEnd}
                />
                {!revealBack ? (
                    <button
                        className="text-muted-foreground hover:text-foreground border-border rounded border px-6 py-2 text-sm transition"
                        onClick={() => setRevealBack(true)}
                    >
                        Show answer
                    </button>
                ) : (
                    <RatingButtons preview={preview} onRate={handleRate} />
                )}
                <p className="text-muted-foreground text-xs">
                    {currentIndex + 1} / {queue.queue.length}
                </p>
            </div>
            <Side color="success" isActive={rightActive}>
                Good
            </Side>
        </div>
    );
}
