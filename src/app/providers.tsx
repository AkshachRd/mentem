'use client';

import type { ThemeProviderProps } from 'next-themes';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { ThemeProvider as NextThemesProvider } from 'next-themes';
import { nanoid } from 'nanoid';

import { useMemoriesStore } from '@/entities/memory/model/store';
import { useTagsStore } from '@/entities/tag/model/store';
import { getFileSystemClient } from '@/shared/lib/fs';
import { parseMemoryMarkdown } from '@/entities/memory/lib/parse';

export interface ProvidersProps {
    children: React.ReactNode;
    themeProps?: ThemeProviderProps;
}

declare module '@react-types/shared' {
    interface RouterConfig {
        routerOptions: NonNullable<Parameters<ReturnType<typeof useRouter>['push']>[1]>;
    }
}

export function Providers({ children, themeProps }: ProvidersProps) {
    const addMemory = useMemoriesStore((s) => s.addMemory);
    const addTag = useTagsStore((s) => s.addTag);
    const router = useRouter();

    React.useEffect(() => {
        const initApp = async () => {
            try {
                const fs = getFileSystemClient();

                const memoriesDir = await fs.getMemoriesDir();
                const files = await fs.listFiles(memoriesDir);
                const mdFiles = files.filter((f) => f.name?.endsWith('.md'));

                for (const entry of mdFiles) {
                    const content = await fs.readMarkdownFile(memoriesDir, entry.name!);
                    const memory = parseMemoryMarkdown(content);

                    if (memory) addMemory(memory);
                }

                handleDeepLinks();
            } catch (error) {
                console.error('Failed to initialize file system:', error);
            }
        };

        initApp();

        return () => {
            // Cleanup if needed
        };
    }, [addMemory, addTag]);

    const handleDeepLinks = () => {
        try {
            const url = new URL(window.location.href);
            const params = new URLSearchParams(url.search);

            const content = params.get('content') ?? '';
            const title = params.get('title') ?? undefined;
            const sourceUrl = params.get('url') ?? undefined;

            if (content) {
                const now = Date.now();
                const lines = [content, sourceUrl ? `\n\nSource: ${sourceUrl}` : '']
                    .filter(Boolean)
                    .join('');

                addMemory({
                    id: nanoid(),
                    kind: 'note',
                    title: title || 'From URL',
                    content: lines,
                    createdAt: now,
                    updatedAt: now,
                    tagIds: [],
                });
            }
        } catch (error) {
            console.error('Failed to handle deep links:', error);
        }
    };

    return <NextThemesProvider {...themeProps}>{children}</NextThemesProvider>;
}
