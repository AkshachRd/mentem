'use client';

import { useState, useMemo } from 'react';
import { PanInfo } from 'framer-motion';
import { useKeyboard } from 'react-aria';
import { useSearchParams } from 'next/navigation';

import { CardStack } from './card-stack';
import { Side } from './side';
import { ShowAnswerButton } from './show-answer-button';

import { useMemoriesStore } from '@/entities/memory';

const swipeConfidenceThreshold = 200;

type LearnProps = {
    sessionCardIds?: string[];
};

export function Learn({ sessionCardIds }: LearnProps) {
    const searchParams = useSearchParams();
    const { cards: allCards } = useMemoriesStore();

    // Filter cards by session if provided
    const cards = useMemo(() => {
        const sessionParam = searchParams?.get('session');
        const idsToFilter = sessionCardIds ?? (sessionParam ? sessionParam.split(',') : null);

        if (!idsToFilter) return allCards;

        const idSet = new Set(idsToFilter);

        return allCards.filter((card) => idSet.has(card.id));
    }, [allCards, sessionCardIds, searchParams]);
    const [exitDirection, setExitDirection] = useState<number>(0);
    const [leftActive, setLeftActive] = useState(false);
    const [rightActive, setRightActive] = useState(false);
    const [revealBack, setRevealBack] = useState(false);

    const { keyboardProps } = useKeyboard({
        onKeyDown: (e) => {
            if (e.key === 'ArrowLeft') {
                setExitDirection(-1);
                handleRemove();
            } else if (e.key === 'ArrowRight') {
                setExitDirection(1);
                handleRemove();
            }
        },
    });

    const handleDrag = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
        setLeftActive(info.offset.x < -swipeConfidenceThreshold);
        setRightActive(info.offset.x > swipeConfidenceThreshold);
    };

    const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
        if (info.offset.x < -swipeConfidenceThreshold) {
            setExitDirection?.(-1);
            handleRemove();
        } else if (info.offset.x > swipeConfidenceThreshold) {
            setExitDirection?.(1);
            handleRemove();
        }

        setLeftActive(false);
        setRightActive(false);
    };

    const handleRemove = () => {
        // setCards((state) => state.slice(1));
        setRevealBack(false);
    };

    if (!cards) {
        return <div>No cards</div>;
    }

    return (
        <div className="flex h-full w-full items-center justify-center" {...keyboardProps}>
            <Side color="destructive" isActive={leftActive}>
                Bad
            </Side>
            <div className="flex h-full flex-col justify-evenly">
                <CardStack
                    cards={cards}
                    exitDirection={exitDirection}
                    revealBack={revealBack}
                    onDrag={handleDrag}
                    onDragEnd={handleDragEnd}
                />
                <ShowAnswerButton
                    disabled={revealBack}
                    onClick={() => {
                        setRevealBack(true);
                    }}
                    onCountDown={() => {
                        setRevealBack(false);
                    }}
                />
            </div>
            <Side color="success" isActive={rightActive}>
                Good
            </Side>
        </div>
    );
}
