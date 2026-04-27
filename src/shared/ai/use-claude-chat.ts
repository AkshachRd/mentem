'use client';

import type { ChatMessage } from './types';

import { useState, useCallback, useRef, useEffect } from 'react';

import { claudeStreamStart, claudeStreamCancel } from './claude-cli';

let messageCounter = 0;

function genId(): string {
    return `msg-${Date.now()}-${++messageCounter}`;
}

interface ChatStoreActions {
    getMessages: () => ChatMessage[];
    addMessage: (chatId: string, message: ChatMessage) => void;
    updateLastMessage: (chatId: string, text: string) => void;
    saveChat: (chatId: string) => void;
}

interface UseClaudeChatOptions {
    systemPrompt: string;
    chatId: string;
    messages: ChatMessage[];
    model?: string;
    store: ChatStoreActions;
}

interface UseClaudeChatReturn {
    messages: ChatMessage[];
    sendMessage: (params: { text: string; images?: Array<{ path: string; name: string }> }) => void;
    isLoading: boolean;
    stop: () => void;
}

export function useClaudeChat({
    systemPrompt,
    chatId,
    messages,
    model,
    store,
}: UseClaudeChatOptions): UseClaudeChatReturn {
    const [isLoading, setIsLoading] = useState(false);
    const sessionIdRef = useRef<string | null>(null);
    const unlistenRefs = useRef<Array<() => void>>([]);
    const chatIdRef = useRef(chatId);

    chatIdRef.current = chatId;

    const storeRef = useRef(store);

    storeRef.current = store;

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
        async (params: { text: string; images?: Array<{ path: string; name: string }> }) => {
            const currentChatId = chatIdRef.current;
            const s = storeRef.current;

            const imageParts = (params.images ?? []).map((img) => ({
                type: 'image' as const,
                path: img.path,
                name: img.name,
            }));

            const userMsg: ChatMessage = {
                id: genId(),
                role: 'user',
                parts: [...imageParts, { type: 'text', text: params.text }],
            };

            const assistantMsg: ChatMessage = {
                id: genId(),
                role: 'assistant',
                parts: [{ type: 'text', text: '' }],
            };

            s.addMessage(currentChatId, userMsg);
            s.addMessage(currentChatId, assistantMsg);
            setIsLoading(true);

            const sessionId = `session-${Date.now()}`;

            sessionIdRef.current = sessionId;

            // Build conversation context — read fresh messages from store
            const allMessages = s.getMessages();
            // Exclude the empty assistant message we just added
            const historyMessages = allMessages.slice(0, -1);

            const history = historyMessages
                .map((m) => {
                    const role = m.role === 'user' ? 'Human' : 'Assistant';
                    const text = m.parts
                        .filter((p): p is { type: 'text'; text: string } => p.type === 'text')
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
                        const currentMessages = storeRef.current.getMessages();
                        const lastMsg = currentMessages[currentMessages.length - 1];
                        const firstPart = lastMsg?.parts[0];
                        const currentText = firstPart?.type === 'text' ? firstPart.text : '';

                        storeRef.current.updateLastMessage(
                            currentChatId,
                            currentText + event.payload,
                        );
                    },
                );

                const unlistenDone = await listen<void>(`ai:stream:${sessionId}:done`, () => {
                    setIsLoading(false);
                    sessionIdRef.current = null;
                    storeRef.current.saveChat(currentChatId);
                    cleanup();
                });

                const unlistenError = await listen<string>(
                    `ai:stream:${sessionId}:error`,
                    (event) => {
                        storeRef.current.updateLastMessage(
                            currentChatId,
                            `Error: ${event.payload}`,
                        );
                        setIsLoading(false);
                        sessionIdRef.current = null;
                        storeRef.current.saveChat(currentChatId);
                        cleanup();
                    },
                );

                unlistenRefs.current = [unlistenChunk, unlistenDone, unlistenError];

                const imagePaths = params.images?.map((img) => img.path);

                await claudeStreamStart(sessionId, systemPrompt, fullPrompt, model, imagePaths);
            } catch (err) {
                storeRef.current.updateLastMessage(
                    currentChatId,
                    `Error: ${err instanceof Error ? err.message : String(err)}`,
                );
                setIsLoading(false);
                sessionIdRef.current = null;
            }
        },
        [systemPrompt, model, cleanup],
    );

    return { messages, sendMessage, isLoading, stop };
}
