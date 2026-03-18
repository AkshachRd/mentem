import type { Chat, ChatMessage } from '@/shared/ai/types';

import { create } from 'zustand';
import { nanoid } from 'nanoid';

import { chatToMarkdown, parseChat } from '../lib/serialize';

import {
    getCollectionDir,
    writeMarkdownFile,
    listFiles,
    readMarkdownFile,
    deleteFile,
} from '@/shared/lib/fs';

interface ChatState {
    chats: Chat[];
    activeChatId: string | null;
    loaded: boolean;

    loadChats: () => Promise<void>;
    createChat: () => string;
    deleteChat: (id: string) => void;
    setActiveChat: (id: string | null) => void;
    addMessage: (chatId: string, message: ChatMessage) => void;
    updateLastMessage: (chatId: string, text: string) => void;
    saveChat: (chatId: string) => void;
}

async function getChatsDir() {
    return getCollectionDir('chats');
}

export const useChatStore = create<ChatState>()((set, get) => ({
    chats: [],
    activeChatId: null,
    loaded: false,

    loadChats: async () => {
        if (get().loaded) return;

        try {
            const dir = await getChatsDir();
            const files = await listFiles(dir);
            const mdFiles = files.filter((f) => f.name.endsWith('.md'));
            const chats: Chat[] = [];

            for (const file of mdFiles) {
                try {
                    const content = await readMarkdownFile(dir, file.name);

                    chats.push(parseChat(content));
                } catch (err) {
                    console.error(`[chat] parse fail: ${file.name}`, err);
                }
            }

            chats.sort((a, b) => b.updatedAt - a.updatedAt);
            set({ chats, loaded: true });
        } catch {
            // Directory might not exist yet — that's fine
            set({ loaded: true });
        }
    },

    createChat: () => {
        const id = nanoid();
        const now = Date.now();
        const chat: Chat = {
            id,
            title: 'Новый чат',
            createdAt: now,
            updatedAt: now,
            messages: [],
        };

        set((state) => ({ chats: [chat, ...state.chats], activeChatId: id }));

        return id;
    },

    deleteChat: (id) => {
        set((state) => ({
            chats: state.chats.filter((c) => c.id !== id),
            activeChatId: state.activeChatId === id ? null : state.activeChatId,
        }));
        void (async () => {
            try {
                const dir = await getChatsDir();

                await deleteFile(dir, `${id}.md`);
            } catch (err) {
                console.error('[chat] delete fail', err);
            }
        })();
    },

    setActiveChat: (id) => {
        set({ activeChatId: id });
    },

    addMessage: (chatId, message) => {
        set((state) => ({
            chats: state.chats.map((c) => {
                if (c.id !== chatId) return c;

                const updated = {
                    ...c,
                    messages: [...c.messages, message],
                    updatedAt: Date.now(),
                };

                // Auto-title from first user message
                if (message.role === 'user' && c.messages.length === 0 && c.title === 'Новый чат') {
                    const text = message.parts
                        .filter((p) => p.type === 'text')
                        .map((p) => p.text)
                        .join('');

                    updated.title = text.slice(0, 50) || 'Новый чат';
                }

                return updated;
            }),
        }));

        // Write file after adding user message (not for empty assistant placeholder)
        const textContent = message.parts
            .filter((p) => p.type === 'text')
            .map((p) => p.text)
            .join('');

        if (message.role === 'user' || textContent) {
            get().saveChat(chatId);
        }
    },

    updateLastMessage: (chatId, text) => {
        set((state) => ({
            chats: state.chats.map((c) => {
                if (c.id !== chatId) return c;

                const msgs = [...c.messages];
                const last = msgs[msgs.length - 1];

                if (last && last.role === 'assistant') {
                    msgs[msgs.length - 1] = {
                        ...last,
                        parts: [{ type: 'text', text }],
                    };
                }

                return { ...c, messages: msgs, updatedAt: Date.now() };
            }),
        }));
    },

    saveChat: (chatId) => {
        void (async () => {
            try {
                const chat = get().chats.find((c) => c.id === chatId);

                if (!chat) return;

                const dir = await getChatsDir();

                await writeMarkdownFile(dir, `${chatId}.md`, chatToMarkdown(chat));
            } catch (err) {
                console.error('[chat] save fail', err);
            }
        })();
    },
}));
