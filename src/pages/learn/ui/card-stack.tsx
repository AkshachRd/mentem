'use client';

import { FC } from 'react';
import { AnimatePresence, PanInfo } from 'framer-motion';
import clsx from 'clsx';

import { AnimatedCard } from './animated-card';

import { Card } from '@/entities/card';

export interface CardStackProps {
    className?: string;
    cards: Card[];
    onDrag?: (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => void;
    onDragEnd?: (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => void;
    revealBack?: boolean;
    exitDirection: number;
}

export const CardStack: FC<CardStackProps> = ({
    onDrag,
    className,
    cards,
    onDragEnd,
    revealBack,
    exitDirection,
}) => {
    return (
        <div className={clsx('relative h-[193px] w-[400px]', className)}>
            {cards.length > 2 && (
                <AnimatedCard
                    key={cards[2].id}
                    className="absolute top-10"
                    delay={0.4}
                    scale={0.9}
                />
            )}
            {cards.length > 1 && (
                <AnimatedCard
                    key={cards[1].id}
                    className="absolute top-5"
                    delay={0.2}
                    footerContent={cards[1].backSide}
                    headerContent={cards[1].frontSide}
                    scale={0.95}
                />
            )}
            <AnimatePresence custom={{ exitDirection }} initial={false}>
                {cards.length > 0 && (
                    <AnimatedCard
                        key={cards[0].id}
                        className="absolute top-0 z-10"
                        delay={0}
                        footerContent={cards[0].backSide}
                        headerContent={cards[0].frontSide}
                        isDraggable={true}
                        revealBack={revealBack}
                        scale={1}
                        onDrag={onDrag}
                        onDragEnd={onDragEnd}
                    />
                )}
            </AnimatePresence>
        </div>
    );
};
