import { useCallback, useState, useMemo } from 'react';
import { useFilter } from 'react-aria';

import { useTagsStore } from '@/entities/tag';

export type Item = {
    key: string;
    type: string;
    label: string;
};

type FieldState = {
    selectedKey: string | number | null;
    inputValue: string;
};

const createItem: Item = {
    type: 'create',
    label: 'Create card',
    key: 'create',
};

export const useSearch = (selectedTagIds: string[]) => {
    const { tags } = useTagsStore();
    const { startsWith } = useFilter({ sensitivity: 'base' });
    const [fieldState, setFieldState] = useState<FieldState>({
        selectedKey: '',
        inputValue: '',
    });

    const availableItems = useMemo(() => {
        return tags
            .filter((tag) => !selectedTagIds.includes(tag.id))
            .map<Item>((tag) => ({
                key: tag.id,
                type: 'tag',
                label: tag.name,
            }));
    }, [tags, selectedTagIds]);

    const filter = useCallback(
        (items: Item[], selectedLabel: string) => {
            return items.filter((item) => startsWith(item.label, selectedLabel));
        },
        [startsWith],
    );

    const onInputChange = useCallback(
        (value: string) => {
            const filteredItems = filter(availableItems, value);
            const newItems = filteredItems.length > 0 ? filteredItems : [createItem];

            setFieldState((prevState) => ({
                inputValue: value,
                selectedKey: value === '' ? null : prevState.selectedKey,
            }));

            return newItems;
        },
        [filter, availableItems],
    );

    const onSelectionChange = useCallback(
        (key: string | number | null) => {
            if (key === null) return { shouldCreate: false, items: availableItems };

            if (key === 'create') {
                setFieldState((prevState) => ({
                    inputValue: prevState.inputValue,
                    selectedKey: key,
                }));

                return { shouldCreate: true, items: [] };
            }

            const selectedItem = availableItems.find((option) => option.key === key);

            if (!selectedItem) return { shouldCreate: false, items: availableItems };

            const filteredItems = filter(availableItems, selectedItem.label);
            const newItems = filteredItems.length > 0 ? filteredItems : [createItem];

            setFieldState({
                inputValue: '',
                selectedKey: key,
            });

            return { shouldCreate: false, items: newItems };
        },
        [filter, availableItems],
    );

    return {
        fieldState,
        availableItems,
        onInputChange,
        onSelectionChange,
    };
};
