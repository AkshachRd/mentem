import clsx from 'clsx';
import { FC } from 'react';
import { Spoiler } from 'spoiled';

import { IBMPlexSerif } from '@/shared/config';
import { MemoryKindBadge } from '@/entities/memory/ui/memory-kind-badge';
import { Separator } from '@/shared/ui/separator';
import { Card, CardHeader, CardFooter } from '@/shared/ui/card';

interface CardComponentProps {
    headerContent?: string;
    footerContent?: string;
    revealBack?: boolean;
    className?: string;
    showKindBadge?: boolean;
}

function getTextSizeClass(text?: string): string {
    const len = text?.length ?? 0;

    if (len <= 30) return 'text-xl';
    if (len <= 60) return 'text-lg';
    if (len <= 100) return 'text-base';
    if (len <= 150) return 'text-sm';

    return 'text-xs';
}

export const CardComponent: FC<CardComponentProps> = ({
    headerContent,
    footerContent,
    revealBack = false,
    className,
    showKindBadge = false,
}) => {
    const headerSizeClass = getTextSizeClass(headerContent);
    const footerSizeClass = getTextSizeClass(footerContent);

    return (
        <Card className={clsx('relative w-[380px] font-serif', IBMPlexSerif.variable, className)}>
            {showKindBadge && <MemoryKindBadge className="absolute top-2 left-2" kind="card" />}
            <CardHeader
                className={clsx(
                    'flex h-28 items-center justify-center overflow-hidden p-4 text-center',
                    headerSizeClass,
                )}
            >
                {headerContent}
            </CardHeader>
            <Separator />
            <CardFooter
                className={clsx(
                    'flex h-28 items-center justify-center overflow-hidden p-4 text-center',
                    footerSizeClass,
                )}
            >
                <Spoiler fps={16} hidden={!revealBack}>
                    {footerContent}
                </Spoiler>
            </CardFooter>
        </Card>
    );
};
