'use client';

import { useState } from 'react';

import { SearchBar } from './search-bar';
import { CardsContent } from './cards-content';

export function CardsPage() {
    const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);

    return (
        <section className="flex flex-col justify-center gap-4 py-8 md:py-10">
            <div className="self-center">
                <SearchBar selectedTagIds={selectedTagIds} setSelectedTagIds={setSelectedTagIds} />
            </div>
            <CardsContent selectedTagIds={selectedTagIds} />
        </section>
    );
}
