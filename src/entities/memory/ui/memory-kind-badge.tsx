'use client';

import { MemoryKind } from '../model/types';
import { memoryKindIcons, memoryKindLabels } from '../lib/icons';

import { Badge } from '@/shared/ui/badge';

type MemoryKindBadgeProps = {
    kind: MemoryKind;
    className?: string;
};

export function MemoryKindBadge({ kind, className }: MemoryKindBadgeProps) {
    const Icon = memoryKindIcons[kind];
    const label = memoryKindLabels[kind];

    return (
        <Badge className={className} variant="secondary">
            <Icon className="mr-1 h-3 w-3" />
            {label}
        </Badge>
    );
}
