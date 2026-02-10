export const tagColors = [
    'default',
    'primary',
    'secondary',
    'success',
    'warning',
    'danger',
] as const;

export type TagColor = (typeof tagColors)[number];

export type Tag = {
    id: string;
    name: string;
    color: TagColor;
};
