import clsx from 'clsx';
import { FC } from 'react';
import { Spoiler } from 'spoiled';

import { IBMPlexSerif } from '@/shared/config';
import { Separator } from '@/shared/ui/separator';
import { Card, CardHeader, CardFooter } from '@/shared/ui/card';

interface CardComponentProps {
    headerContent?: string;
    footerContent?: string;
    revealBack?: boolean;
    className?: string;
}

export const CardComponent: FC<CardComponentProps> = ({
    headerContent,
    footerContent,
    revealBack = false,
    className,
}) => {
    return (
        <Card className={clsx('w-[380px] font-serif', IBMPlexSerif.variable, className)}>
            <CardHeader className="flex h-28 items-center justify-center text-xl">
                {headerContent}
            </CardHeader>
            <Separator />
            <CardFooter className="flex h-28 items-center justify-center text-xl">
                <Spoiler fps={16} hidden={!revealBack}>
                    {footerContent}
                </Spoiler>
            </CardFooter>
        </Card>
    );
};
