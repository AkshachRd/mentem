'use client';

import { useState } from 'react';

import { SearchBar } from './search-bar';
import { HomeContent } from './home-content';
import { ReadingCard } from './reading-card';
import { StudyCard } from './study-card';

export function HomePage() {
    const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);

    return (
        <section className="flex flex-col justify-center gap-4 py-8 md:py-10">
            <div className="flex w-full flex-row justify-center gap-4">
                <ReadingCard />
                <StudyCard />
            </div>
            <div className="self-center">
                <SearchBar selectedTagIds={selectedTagIds} setSelectedTagIds={setSelectedTagIds} />
            </div>
            <HomeContent selectedTagIds={selectedTagIds} />
        </section>
    );
}
