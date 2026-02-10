import { TagColor, tagColors } from '../model/types';

export const getRandomTagColor = (): TagColor => {
    return tagColors[Math.floor(Math.random() * tagColors.length)];
};
