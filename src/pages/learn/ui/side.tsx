'use client';

import clsx from 'clsx';
import { FC, ReactNode } from 'react';

import { Button } from '@/shared/ui/button';

interface SideProps {
    children?: ReactNode;
    color: 'danger' | 'success';
    className?: string;
    isActive?: boolean;
}

export const Side: FC<SideProps> = ({
    color,
    className,
    isActive = false,
    children,
}: SideProps) => {
    return (
        <div
            className={clsx(className, 'relative m-6 inline-block h-full flex-auto', {
                'animate-pulse': isActive,
            })}
        >
            <div
                className={clsx(
                    'absolute inset-0 top-0 right-0 left-0 h-full w-full scale-120 bg-size-[200%_200%] blur-lg',
                    isActive && `bg-${color}`,
                )}
            />
            <Button
                className={`bg-background h-full w-full data-[hover=true]:bg-${color}/20`}
                variant="default"
            >
                {children}
            </Button>
        </div>
    );
};
