'use client';

import { CardsList } from './cards-list';
import { ContentTable } from './content-table';
import { MemoriesList } from './memories-list';

import { TagComponent } from '@/entities/tag';
import { useTagsStore } from '@/entities/tag';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/shared/ui/tabs';

type HomeContentProps = {
    selectedTagIds: string[];
};

export const HomeContent = ({ selectedTagIds }: HomeContentProps) => {
    const { tags } = useTagsStore();

    return (
        <Tabs className="w-full" defaultValue="cards">
            <TabsList variant="line">
                <TabsTrigger value="cards">cards</TabsTrigger>
                <TabsTrigger value="notes">notes</TabsTrigger>
                <TabsTrigger value="tags">tags</TabsTrigger>
                <TabsTrigger value="table">table</TabsTrigger>
            </TabsList>
            <TabsContent value="cards">
                <CardsList selectedTagIds={selectedTagIds} />
            </TabsContent>
            <TabsContent value="notes">
                <MemoriesList selectedTagIds={selectedTagIds} />
            </TabsContent>
            <TabsContent value="tags">
                <div className="flex flex-wrap justify-center gap-2">
                    {tags.map((tag) => (
                        <TagComponent key={tag.id} color={tag.color}>
                            {tag.name}
                        </TagComponent>
                    ))}
                </div>
            </TabsContent>
            <TabsContent className="w-full" value="table">
                <ContentTable />
            </TabsContent>
        </Tabs>
    );
};
