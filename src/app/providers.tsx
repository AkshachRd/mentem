'use client';

import type { ThemeProviderProps } from 'next-themes';
import type { Memory } from '@/entities/memory/model/types';
import type { Card } from '@/entities/card/model/types';
import type { Tag } from '@/entities/tag/model/types';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { ThemeProvider as NextThemesProvider } from 'next-themes';
import { onOpenUrl } from '@tauri-apps/plugin-deep-link';
import { nanoid } from 'nanoid';
import { listen } from '@tauri-apps/api/event';

import { useMemoriesStore } from '@/entities/memory/model/store';
import { useCardStore } from '@/entities/card/model/store';
import { useTagsStore } from '@/entities/tag/model/store';
import { getCollectionDir, listFiles, readMarkdownFile } from '@/shared/lib/fs';
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
    const addCard = useCardStore((s) => s.addCard);
    const addTag = useTagsStore((s) => s.addTag);
    // hydration hooks can be added later for parsing disk files

    React.useEffect(() => {
        // On startup, hydrate/migrate
        (async () => {
            try {
                const memoriesDir = await getCollectionDir('memories');
                const cardsDir = await getCollectionDir('cards');
                const tagsDir = await getCollectionDir('tags');

                const [memFiles] = await Promise.all([
                    listFiles(memoriesDir),
                    listFiles(cardsDir),
                    listFiles(tagsDir),
                ]);

                // Hydrate memories from disk
                try {
                    const memoryEntries = memFiles.filter((f) => f.name?.endsWith('.md'));

                    for (const entry of memoryEntries) {
                        const content = await readMarkdownFile(memoriesDir, entry.name!);
                        const memory = parseMemoryMarkdown(content);

                        if (memory) addMemory(memory);
                    }
                } catch {
                    /* ignore */
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
                        const cardState = readPersist<{ cards?: Card[] }>('cards');
                        const tagState = readPersist<{ tags?: Tag[] }>('tags');

                        if (memState?.memories) {
                            for (const m of memState.memories) addMemory(m);
                        }

                        if (cardState?.cards) {
                            for (const c of cardState.cards) addCard(c);
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

                            if (url.hostname === 'clip' && url.pathname === '/note') {
                                const content = url.searchParams.get('content') ?? '';
                                const title = url.searchParams.get('title') ?? undefined;
                                const sourceUrl = url.searchParams.get('url') ?? undefined;

                                const now = Date.now();
                                const lines = [content, sourceUrl ? `\n\nSource: ${sourceUrl}` : '']
                                    .filter(Boolean)
                                    .join('');

                                addMemory({
                                    id: nanoid(),
                                    kind: 'note',
                                    title,
                                    content: lines,
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
                            if (url.hostname === 'clip' && url.pathname === '/note') {
                                const content = url.searchParams.get('content') ?? '';
                                const title = url.searchParams.get('title') ?? undefined;
                                const sourceUrl = url.searchParams.get('url') ?? undefined;

                                const now = Date.now();
                                const lines = [content, sourceUrl ? `\n\nSource: ${sourceUrl}` : '']
                                    .filter(Boolean)
                                    .join('');

                                addMemory({
                                    id: nanoid(),
                                    kind: 'note',
                                    title,
                                    content: lines,
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
    }, [addMemory, addCard, addTag]);

    return <NextThemesProvider {...themeProps}>{children}</NextThemesProvider>;
}
