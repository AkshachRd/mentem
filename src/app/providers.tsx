'use client';

import type { ThemeProviderProps } from 'next-themes';
import type { Memory } from '@/entities/memory/model/types';
import type { Tag } from '@/entities/tag/model/types';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { ThemeProvider as NextThemesProvider } from 'next-themes';
import { onOpenUrl } from '@tauri-apps/plugin-deep-link';
import { nanoid } from 'nanoid';
import { listen } from '@tauri-apps/api/event';

import { useMemoriesStore } from '@/entities/memory/model/store';
import { useTagsStore } from '@/entities/tag/model/store';
import { getMemoriesDir, listFiles, readMarkdownFile } from '@/shared/lib/fs';
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

    React.useEffect(() => {
        // On startup, hydrate/migrate
        (async () => {
            try {
                // Hydrate memories from disk
                const memoriesDir = await getMemoriesDir();
                const files = await listFiles(memoriesDir);
                const mdFiles = files.filter((f) => f.name?.endsWith('.md'));

                for (const entry of mdFiles) {
                    const content = await readMarkdownFile(memoriesDir, entry.name!);
                    const memory = parseMemoryMarkdown(content);

                    if (memory) addMemory(memory);
                }

                // Migrate from old zustand localStorage if present (one-time)
                if (typeof window !== 'undefined' && !localStorage.getItem('mdMigrationV1')) {
                    try {
                        type PersistEnvelope<S> = { state?: S } | S | null;
                        const readPersist = <S,>(key: string): S | null => {
                            const raw = localStorage.getItem(key);

                            if (!raw) return null;
                            try {
                                const obj = JSON.parse(raw) as PersistEnvelope<S>;

                                if (
                                    obj &&
                                    typeof obj === 'object' &&
                                    obj !== null &&
                                    'state' in obj
                                ) {
                                    return (obj as { state?: S }).state ?? null;
                                }

                                return obj as S;
                            } catch {
                                return null;
                            }
                        };

                        const memState = readPersist<{ memories?: Memory[] }>('memories');
                        const cardState = readPersist<{ cards?: Memory[] }>('cards');
                        const tagState = readPersist<{ tags?: Tag[] }>('tags');

                        if (memState?.memories) {
                            for (const m of memState.memories) addMemory(m);
                        }

                        if (cardState?.cards) {
                            for (const c of cardState.cards) addMemory(c);
                        }

                        if (tagState?.tags) {
                            for (const t of tagState.tags) addTag(t.name, t.color);
                        }

                        localStorage.setItem('mdMigrationV1', 'done');
                    } catch {
                        /* ignore */
                    }
                }
            } catch {
                /* ignore: web dev */
            }
        })();

        let unlistenDeepLink: (() => void) | undefined;
        let unlistenSingle: (() => void) | undefined;

        (async () => {
            try {
                unlistenDeepLink = await onOpenUrl((urls: string[]) => {
                    for (const href of urls) {
                        try {
                            const url = new URL(href);

                            if (url.protocol !== 'mentem:') continue;

                            if (url.hostname === 'clip' && url.pathname === '/article') {
                                const excerpt = url.searchParams.get('content') ?? undefined;
                                const title = url.searchParams.get('title') ?? undefined;
                                const articleUrl = url.searchParams.get('url') ?? '';

                                const now = Date.now();

                                addMemory({
                                    id: nanoid(),
                                    kind: 'article',
                                    url: articleUrl,
                                    title,
                                    excerpt: excerpt || undefined,
                                    createdAt: now,
                                    updatedAt: now,
                                    tagIds: [],
                                });
                            }
                        } catch {
                            /* ignore malformed deep link */
                        }
                    }
                });

                // Also handle deep links forwarded from a second instance
                unlistenSingle = await listen<string[]>('single-instance-deep-link', (event) => {
                    const urls = event.payload ?? [];

                    for (const href of urls) {
                        try {
                            const url = new URL(href);

                            if (url.protocol !== 'mentem:') continue;
                            if (url.hostname === 'clip' && url.pathname === '/article') {
                                const excerpt = url.searchParams.get('content') ?? undefined;
                                const title = url.searchParams.get('title') ?? undefined;
                                const articleUrl = url.searchParams.get('url') ?? '';

                                const now = Date.now();

                                addMemory({
                                    id: nanoid(),
                                    kind: 'article',
                                    url: articleUrl,
                                    title,
                                    excerpt: excerpt || undefined,
                                    createdAt: now,
                                    updatedAt: now,
                                    tagIds: [],
                                });
                            }
                        } catch {
                            /* ignore */
                        }
                    }
                });
            } catch {
                /* plugin not available (e.g. web dev) */
            }
        })();

        return () => {
            try {
                unlistenDeepLink?.();
                unlistenSingle?.();
            } catch {
                /* ignore */
            }
        };
    }, [addMemory, addTag]);

    return <NextThemesProvider {...themeProps}>{children}</NextThemesProvider>;
}
