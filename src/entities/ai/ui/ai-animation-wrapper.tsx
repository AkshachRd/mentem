'use client';

import clsx from 'clsx';
import { FC } from 'react';

interface AIAnimationWrapperProps {
    className?: string;
    isLoading?: boolean;
    children: React.ReactNode;
}

export const AIAnimationWrapper: FC<AIAnimationWrapperProps> = ({
    className,
    isLoading,
    children,
}) => {
    return (
        <div className={clsx(className, 'relative inline-block')}>
            <div
                className={`bg-glow-gradient pointer-events-none absolute inset-0 top-2 right-0 left-0 h-full w-full bg-size-[200%_200%] blur-lg transition-opacity duration-300 ease-in-out ${isLoading ? 'animate-glow opacity-100' : 'opacity-0'}`}
            />
            {children}
        </div>
    );
};
