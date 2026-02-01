'use client';

import * as React from 'react';
import { Tooltip as TooltipPrimitive } from '@base-ui/react/tooltip';

import { cn } from '@/shared/lib/utils';

function Tooltip({ ...props }: TooltipPrimitive.Root.Props) {
    return <TooltipPrimitive.Root data-slot="tooltip" {...props} />;
}

function TooltipTrigger({ ...props }: TooltipPrimitive.Trigger.Props) {
    return <TooltipPrimitive.Trigger data-slot="tooltip-trigger" {...props} />;
}

function TooltipPortal({ ...props }: TooltipPrimitive.Portal.Props) {
    return <TooltipPrimitive.Portal data-slot="tooltip-portal" {...props} />;
}

function TooltipContent({
    className,
    sideOffset = 4,
    side = 'top',
    align = 'center',
    ...props
}: TooltipPrimitive.Popup.Props &
    Pick<TooltipPrimitive.Positioner.Props, 'sideOffset' | 'side' | 'align'>) {
    return (
        <TooltipPrimitive.Portal>
            <TooltipPrimitive.Positioner
                align={align}
                className="z-50"
                side={side}
                sideOffset={sideOffset}
            >
                <TooltipPrimitive.Popup
                    className={cn(
                        'bg-popover text-popover-foreground animate-in fade-in-0 zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50 origin-(--transform-origin) rounded-md border px-3 py-1.5 text-xs shadow-md',
                        className,
                    )}
                    data-slot="tooltip-content"
                    {...props}
                />
            </TooltipPrimitive.Positioner>
        </TooltipPrimitive.Portal>
    );
}

function TooltipArrow({ className, ...props }: TooltipPrimitive.Arrow.Props) {
    return (
        <TooltipPrimitive.Arrow
            className={cn(
                'fill-popover z-50 size-2.5 translate-y-[calc(-50%_-_2px)] rotate-45 rounded-sm border',
                className,
            )}
            data-slot="tooltip-arrow"
            {...props}
        />
    );
}

export { Tooltip, TooltipTrigger, TooltipContent, TooltipPortal, TooltipArrow };
