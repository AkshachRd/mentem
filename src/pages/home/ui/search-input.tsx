'use client';

import type { Item } from '../model/use-search';

import { AnimatePresence } from 'framer-motion';
import { useCallback, useState } from 'react';
import { nanoid } from 'nanoid';

import { useSearch } from '../model/use-search';

import { CardCreationForm } from './card-creation-form';

import { useCardStore } from '@/entities/card';
import {
    Combobox,
    ComboboxInput,
    ComboboxContent,
    ComboboxList,
    ComboboxItem,
    ComboboxEmpty,
} from '@/shared/ui/combobox';

type SearchInputProps = {
    selectedTagIds: string[];
    setSelectedTagIds: (tagIds: string[] | ((prev: string[]) => string[])) => void;
};

export const SearchInput = ({ selectedTagIds, setSelectedTagIds }: SearchInputProps) => {
    const { addCard } = useCardStore();
    const [isCreating, setIsCreating] = useState(false);
    const [items, setItems] = useState<Item[]>([]);

    const { fieldState, availableItems, onInputChange, onSelectionChange } =
        useSearch(selectedTagIds);

    const handleTagSelection = useCallback(
        (tagId: string) => {
            if (selectedTagIds.includes(tagId)) {
                setSelectedTagIds((prev) => prev.filter((id) => id !== tagId));
            } else {
                setSelectedTagIds((prev) => [...prev, tagId]);
            }
        },
        [selectedTagIds, setSelectedTagIds],
    );

    const handleSelectionChange = useCallback(
        (key: string | number | null) => {
            const { shouldCreate, items: newItems } = onSelectionChange(key);

            setItems(newItems);

            if (shouldCreate) {
                setIsCreating(true);
            } else if (key !== null) {
                const selectedItem = availableItems.find((option) => option.key === key);

                if (selectedItem?.type === 'tag') {
                    handleTagSelection(selectedItem.key);
                }
            }
        },
        [availableItems, onSelectionChange, setSelectedTagIds],
    );

    const handleInputChange = useCallback(
        (value: string) => {
            const newItems = onInputChange(value);

            setItems(newItems);
        },
        [onInputChange],
    );

    const handleCreateCard = useCallback(
        (backSide: string) => {
            addCard({
                id: nanoid(),
                frontSide: fieldState.inputValue,
                backSide,
                tagIds: [],
            });
        },
        [fieldState.inputValue, addCard],
    );

    return (
        <div className="flex w-96 flex-col">
            <div className="relative">
                <Combobox
                    value={fieldState.selectedKey?.toString() ?? ''}
                    onValueChange={(value) => {
                        handleSelectionChange(value || null);
                    }}
                >
                    <ComboboxInput
                        className="bg-background z-10 w-full rounded-full border-b"
                        placeholder={isCreating ? 'Front side' : 'Search, create, tag...'}
                        showClear={false}
                        showTrigger={false}
                        value={fieldState.inputValue}
                        onChange={(e) => handleInputChange(e.target.value)}
                    />
                    <ComboboxContent>
                        <ComboboxList>
                            {items.map((item) => {
                                if (item.type === 'tag') {
                                    return (
                                        <ComboboxItem key={item.key} value={item.key}>
                                            {item.label}
                                        </ComboboxItem>
                                    );
                                } else if (item.type === 'create') {
                                    return (
                                        <ComboboxItem key={item.type} value={item.type}>
                                            Create
                                        </ComboboxItem>
                                    );
                                } else {
                                    return (
                                        <ComboboxItem key={item.type} value={item.type}>
                                            Can&apos;t find
                                        </ComboboxItem>
                                    );
                                }
                            })}
                        </ComboboxList>
                        <ComboboxEmpty>No results found</ComboboxEmpty>
                    </ComboboxContent>
                </Combobox>
            </div>
            <AnimatePresence>
                {isCreating && (
                    <CardCreationForm
                        frontSide={fieldState.inputValue}
                        onCancel={() => setIsCreating(false)}
                        onCreate={handleCreateCard}
                    />
                )}
            </AnimatePresence>
        </div>
    );
};
