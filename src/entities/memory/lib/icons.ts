import { StickyNote, Layers, Image, Quote, FileText, ShoppingCart, LucideIcon } from 'lucide-react';

import { MemoryKind } from '../model/types';

export const memoryKindIcons: Record<MemoryKind, LucideIcon> = {
    note: StickyNote,
    card: Layers,
    image: Image,
    quote: Quote,
    article: FileText,
    product: ShoppingCart,
};

export const memoryKindLabels: Record<MemoryKind, string> = {
    note: 'note',
    card: 'card',
    image: 'image',
    quote: 'quote',
    article: 'article',
    product: 'product',
};
