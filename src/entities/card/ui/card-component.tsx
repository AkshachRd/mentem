import { Card, CardFooter, CardHeader } from '@heroui/react';
import clsx from 'clsx';
import { FC } from 'react';
import { Spoiler } from 'spoiled';

import { fontSerif } from '@/shared/config';
import { Separator } from '@/shared/ui/separator';

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
        <Card className={clsx('w-[380px] font-serif', fontSerif.variable, className)} shadow="lg">
            <CardHeader className="h-28 justify-center text-xl">{headerContent}</CardHeader>
            <Separator />
            <CardFooter className="h-28 justify-center text-xl">
                <Spoiler fps={16} hidden={!revealBack}>
                    {footerContent}
                </Spoiler>
            </CardFooter>
        </Card>
    );
};
