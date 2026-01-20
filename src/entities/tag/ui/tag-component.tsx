'use client';

import { TagColor } from '../model/types';

import { Badge } from '@/shared/ui/badge';

type TagComponentProps = {
    color?: TagColor;
    children?: React.ReactNode;
    onClose?: () => void;
};

export const TagComponent = ({ children, onClose, color }: TagComponentProps) => {
    return (
        <Badge className="cursor-pointer" color={color} variant="outline" onClick={onClose}>
            {children}
        </Badge>
    );
};
