'use client';

import { memoryKindIcons, memoryKindLabels } from '../lib/icons';
import { MemoryKind } from '../model/types';

import { cn } from '@/shared/lib/utils';

const SELECTABLE_KINDS: Exclude<MemoryKind, 'card'>[] = [
    'note',
    'quote',
    'image',
    'article',
    'product',
];

type KindSelectorProps = {
    selected: MemoryKind;
    onSelect: (kind: MemoryKind) => void;
};

export function KindSelector({ selected, onSelect }: KindSelectorProps) {
    return (
        <div className="grid grid-cols-5 gap-2 px-2">
            {SELECTABLE_KINDS.map((kind) => {
                const Icon = memoryKindIcons[kind];
                const label = memoryKindLabels[kind];
                const isActive = selected === kind;

                return (
                    <button
                        key={kind}
                        className={cn(
                            'flex flex-col items-center gap-1.5 rounded-lg border p-3 transition-colors',
                            isActive
                                ? 'border-primary bg-primary/10 text-primary'
                                : 'border-muted hover:border-primary/50 text-muted-foreground hover:text-foreground',
                        )}
                        type="button"
                        onClick={() => onSelect(kind)}
                    >
                        <Icon size={20} />
                        <span className="text-xs capitalize">{label}</span>
                    </button>
                );
            })}
        </div>
    );
}
