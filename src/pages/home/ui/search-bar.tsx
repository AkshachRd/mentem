'use client';

import { SearchInput } from './search-input';

import { TagComponent, useTagsStore } from '@/entities/tag';

type SearchBarProps = {
    selectedTagIds: string[];
    setSelectedTagIds: (tagIds: string[] | ((prev: string[]) => string[])) => void;
};

export const SearchBar = ({ selectedTagIds, setSelectedTagIds }: SearchBarProps) => {
    const { tags } = useTagsStore();
    const selectedTags = tags.filter((tag) => selectedTagIds.includes(tag.id));

    return (
        <div className="border-large bg-background flex w-full items-center justify-center gap-2 rounded-full p-4 px-20">
            {selectedTags.map((tag, index) => (
                <TagComponent
                    key={index}
                    color={tag.color}
                    onClose={() => setSelectedTagIds((prev) => prev.filter((id) => id !== tag.id))}
                >
                    {tag.name}
                </TagComponent>
            ))}
            <SearchInput selectedTagIds={selectedTagIds} setSelectedTagIds={setSelectedTagIds} />
        </div>
    );
};
