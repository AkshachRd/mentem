'use client';

import clsx from 'clsx';
import { FC, ReactNode } from 'react';

import { Button } from '@/shared/ui/button';

interface SideProps {
    children?: ReactNode;
    color: 'destructive' | 'success';
    className?: string;
    isActive?: boolean;
}

const glowClasses = {
    destructive: 'bg-destructive',
    success: 'bg-success',
} as const;

export const Side: FC<SideProps> = ({
    color,
    className,
    isActive = false,
    children,
}: SideProps) => {
    return (
        <div className={clsx(className, 'relative m-6 inline-block h-full flex-auto')}>
            <div
                className={clsx(
                    'absolute -inset-4 blur-xl transition-opacity duration-300',
                    glowClasses[color],
                    isActive ? 'animate-pulse opacity-100' : 'opacity-0',
                )}
            />
            <Button className="bg-card relative z-10 h-full w-full border-0" variant="outline">
                {children}
            </Button>
        </div>
    );
};
