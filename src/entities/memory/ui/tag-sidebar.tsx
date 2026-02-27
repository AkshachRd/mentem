'use client';

import { useTagSelection } from './use-tag-selection';

import { AIAnimationWrapper } from '@/entities/ai';
import { TagComponent } from '@/entities/tag';
import { Button } from '@/shared/ui/button';
import { Card, CardContent } from '@/shared/ui/card';
import { Input } from '@/shared/ui/input';

type TagSidebarProps = ReturnType<typeof useTagSelection>;

export function TagSidebar({
    tagInput,
    setTagInput,
    selectedTags,
    handleAddTagByName,
    handleRemoveSelectedTag,
    canGenerateTags,
    isGenerating,
    handleGenerateTags,
}: TagSidebarProps) {
    const showGenButton = canGenerateTags && selectedTags.length === 0 && !isGenerating;

    return (
        <div className="flex w-64 flex-col gap-4 p-4">
            <AIAnimationWrapper isLoading={isGenerating}>
                <Card className="w-full">
                    <CardContent className="flex flex-row flex-wrap items-center gap-2">
                        {selectedTags.map((tag) => (
                            <TagComponent
                                key={tag.id}
                                color={tag.color}
                                onClose={() => handleRemoveSelectedTag(tag.id)}
                            >
                                {tag.name}
                            </TagComponent>
                        ))}
                        {showGenButton && (
                            <Button size="sm" type="button" onClick={handleGenerateTags}>
                                Gen tags
                            </Button>
                        )}
                        {isGenerating && (
                            <span className="text-muted-foreground text-sm">Generating...</span>
                        )}
                        <div className="flex grow flex-row gap-2">
                            <Input
                                className="grow"
                                placeholder="Add tag"
                                value={tagInput}
                                onInput={(e) => setTagInput(e.currentTarget.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && tagInput.trim().length > 0) {
                                        handleAddTagByName();
                                    }
                                }}
                            />
                            <Button
                                disabled={tagInput.trim().length === 0}
                                size="sm"
                                onClick={handleAddTagByName}
                            >
                                Add
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </AIAnimationWrapper>
        </div>
    );
}
