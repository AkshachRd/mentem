'use client';

import type { ChatMessage } from './types';

import { useState, useCallback, useRef, useEffect } from 'react';

import { claudeStreamStart, claudeStreamCancel } from './claude-cli';

let messageCounter = 0;

function genId(): string {
    return `msg-${Date.now()}-${++messageCounter}`;
}

interface UseClaudeChatOptions {
    systemPrompt: string;
}

interface UseClaudeChatReturn {
    messages: ChatMessage[];
    sendMessage: (params: { text: string }) => void;
    isLoading: boolean;
    stop: () => void;
}

export function useClaudeChat({ systemPrompt }: UseClaudeChatOptions): UseClaudeChatReturn {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const sessionIdRef = useRef<string | null>(null);
    const unlistenRefs = useRef<Array<() => void>>([]);

    const cleanup = useCallback(async () => {
        for (const unlisten of unlistenRefs.current) {
            unlisten();
        }
        unlistenRefs.current = [];
    }, []);

    const stop = useCallback(async () => {
        if (sessionIdRef.current) {
            await claudeStreamCancel(sessionIdRef.current);
            sessionIdRef.current = null;
        }
        setIsLoading(false);
        await cleanup();
    }, [cleanup]);

    useEffect(() => {
        return () => {
            if (sessionIdRef.current) {
                claudeStreamCancel(sessionIdRef.current);
            }
            cleanup();
        };
    }, [cleanup]);

    const sendMessage = useCallback(
        async (params: { text: string }) => {
            const userMsg: ChatMessage = {
                id: genId(),
                role: 'user',
                parts: [{ type: 'text', text: params.text }],
            };

            const assistantMsg: ChatMessage = {
                id: genId(),
                role: 'assistant',
                parts: [{ type: 'text', text: '' }],
            };

            setMessages((prev) => [...prev, userMsg, assistantMsg]);
            setIsLoading(true);

            const sessionId = `session-${Date.now()}`;

            sessionIdRef.current = sessionId;

            // Build conversation context
            const history = messages
                .map((m) => {
                    const role = m.role === 'user' ? 'Human' : 'Assistant';
                    const text = m.parts
                        .filter((p) => p.type === 'text')
                        .map((p) => p.text)
                        .join('');

                    return `${role}: ${text}`;
                })
                .join('\n\n');

            const fullPrompt = history ? `${history}\n\nHuman: ${params.text}` : params.text;

            try {
                const { listen } = await import('@tauri-apps/api/event');

                const unlistenChunk = await listen<string>(
                    `ai:stream:${sessionId}:chunk`,
                    (event) => {
                        setMessages((prev) => {
                            const updated = [...prev];
                            const last = updated[updated.length - 1];

                            if (last && last.role === 'assistant') {
                                updated[updated.length - 1] = {
                                    ...last,
                                    parts: [
                                        { type: 'text', text: last.parts[0].text + event.payload },
                                    ],
                                };
                            }

                            return updated;
                        });
                    },
                );

                const unlistenDone = await listen<void>(`ai:stream:${sessionId}:done`, () => {
                    setIsLoading(false);
                    sessionIdRef.current = null;
                    cleanup();
                });

                const unlistenError = await listen<string>(
                    `ai:stream:${sessionId}:error`,
                    (event) => {
                        setMessages((prev) => {
                            const updated = [...prev];
                            const last = updated[updated.length - 1];

                            if (last && last.role === 'assistant') {
                                updated[updated.length - 1] = {
                                    ...last,
                                    parts: [{ type: 'text', text: `Error: ${event.payload}` }],
                                };
                            }

                            return updated;
                        });
                        setIsLoading(false);
                        sessionIdRef.current = null;
                        cleanup();
                    },
                );

                unlistenRefs.current = [unlistenChunk, unlistenDone, unlistenError];

                await claudeStreamStart(sessionId, systemPrompt, fullPrompt);
            } catch (err) {
                setMessages((prev) => {
                    const updated = [...prev];
                    const last = updated[updated.length - 1];

                    if (last && last.role === 'assistant') {
                        updated[updated.length - 1] = {
                            ...last,
                            parts: [
                                {
                                    type: 'text',
                                    text: `Error: ${err instanceof Error ? err.message : String(err)}`,
                                },
                            ],
                        };
                    }

                    return updated;
                });
                setIsLoading(false);
                sessionIdRef.current = null;
            }
        },
        [messages, systemPrompt, cleanup],
    );

    return { messages, sendMessage, isLoading, stop };
}
