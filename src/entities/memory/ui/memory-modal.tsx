'use client';

import { useState } from 'react';

import {
    Memory,
    NoteMemory,
    QuoteMemory,
    ImageMemory,
    ArticleMemory,
    ProductMemory,
    MemoryKind,
} from '../model/types';

import { NoteForm, QuoteForm, ImageForm, ArticleForm, ProductForm } from './forms';
import { KindSelector } from './kind-selector';
import { TagSidebar } from './tag-sidebar';
import { useTagSelection } from './use-tag-selection';

import { Separator } from '@/shared/ui/separator';

type MemoryModalProps = {
    memory?: Memory;
    onClose: () => void;
};

export function MemoryModal({ memory, onClose }: MemoryModalProps) {
    const [selectedKind, setSelectedKind] = useState<MemoryKind>(memory?.kind ?? 'note');
    const tagSelection = useTagSelection(memory?.tagIds ?? []);
    const isEditing = Boolean(memory);

    const formProps = {
        selectedTagIds: tagSelection.selectedTagIds,
        onClose,
    };

    const renderForm = () => {
        switch (selectedKind) {
            case 'note':
                return (
                    <NoteForm
                        memory={isEditing ? (memory as NoteMemory) : undefined}
                        {...formProps}
                    />
                );
            case 'quote':
                return (
                    <QuoteForm
                        memory={isEditing ? (memory as QuoteMemory) : undefined}
                        {...formProps}
                    />
                );
            case 'image':
                return (
                    <ImageForm
                        memory={isEditing ? (memory as ImageMemory) : undefined}
                        {...formProps}
                    />
                );
            case 'article':
                return (
                    <ArticleForm
                        memory={isEditing ? (memory as ArticleMemory) : undefined}
                        {...formProps}
                    />
                );
            case 'product':
                return (
                    <ProductForm
                        memory={isEditing ? (memory as ProductMemory) : undefined}
                        {...formProps}
                    />
                );
            default:
                return null;
        }
    };

    return (
        <div className="flex h-[600px] flex-col gap-3">
            {!isEditing && (
                <>
                    <KindSelector selected={selectedKind} onSelect={setSelectedKind} />
                    <Separator />
                </>
            )}
            <div className="flex min-h-0 flex-1">
                {renderForm()}
                <Separator orientation="vertical" />
                <TagSidebar {...tagSelection} />
            </div>
        </div>
    );
}
