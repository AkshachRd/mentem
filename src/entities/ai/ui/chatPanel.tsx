'use client';

import type { QuoteBadgeData } from '@/shared/ui/chat-input-editor';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
    Send,
    Bot,
    User,
    PanelRightClose,
    Plus,
    MessageSquare,
    Trash2,
    ChevronDown,
} from 'lucide-react';

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { ScrollArea } from '@/shared/ui/scroll-area';
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
} from '@/shared/ui/dropdown-menu';
import { cn } from '@/shared/lib/utils';
import { ChatInputEditor } from '@/shared/ui/chat-input-editor';
import { useClaudeChat } from '@/shared/ai/use-claude-chat';
import { useQuoteStore, QuoteBlock, extractQuoteId, formatQuoteForChat } from '@/entities/quote';
import { useChatStore } from '@/entities/ai/model/store';
import { useSettingsStore } from '@/entities/settings/model/store';

type ChatPanelProps = {
    onCollapse?: () => void;
    bookFileName?: string;
};

function formatRelativeDate(timestamp: number): string {
    const diff = Date.now() - timestamp;
    const minutes = Math.floor(diff / 60000);

    if (minutes < 1) return 'только что';
    if (minutes < 60) return `${minutes} мин. назад`;
    const hours = Math.floor(minutes / 60);

    if (hours < 24) return `${hours} ч. назад`;
    const days = Math.floor(hours / 24);

    if (days < 7) return `${days} дн. назад`;

    return new Date(timestamp).toLocaleDateString('ru-RU');
}

export function ChatPanel({ onCollapse, bookFileName }: ChatPanelProps) {
    const chats = useChatStore((state) => state.chats);
    const activeChatId = useChatStore((state) => state.activeChatId);
    const loaded = useChatStore((state) => state.loaded);
    const loadChats = useChatStore((state) => state.loadChats);
    const createChat = useChatStore((state) => state.createChat);
    const deleteChat = useChatStore((state) => state.deleteChat);
    const setActiveChat = useChatStore((state) => state.setActiveChat);

    const [showHistory, setShowHistory] = useState(false);

    // Load chats on mount
    useEffect(() => {
        loadChats();
    }, [loadChats]);

    // Auto-create chat if none active after loading
    useEffect(() => {
        if (loaded && !activeChatId) {
            if (chats.length > 0) {
                setActiveChat(chats[0].id);
            } else {
                createChat();
            }
        }
    }, [loaded, activeChatId, chats, setActiveChat, createChat]);

    const handleNewChat = () => {
        createChat();
        setShowHistory(false);
    };

    const handleSelectChat = (id: string) => {
        setActiveChat(id);
        setShowHistory(false);
    };

    const handleDeleteChat = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        deleteChat(id);
    };

    if (!activeChatId) {
        return null;
    }

    return (
        <Card className="flex h-full flex-col">
            {/* Шапка чата */}
            <CardHeader className="flex flex-row items-center justify-between space-y-0 border-b p-4">
                <div className="flex items-center gap-2">
                    <div className="bg-primary/10 rounded-full p-2">
                        <Bot className="text-primary h-5 w-5" />
                    </div>
                    <CardTitle className="text-sm font-semibold">AI Ассистент</CardTitle>
                </div>
                <div className="flex items-center gap-1">
                    <Button
                        className="h-7 w-7"
                        size="icon"
                        title="Новый чат"
                        variant="ghost"
                        onClick={handleNewChat}
                    >
                        <Plus className="h-4 w-4" />
                    </Button>
                    <Button
                        className="h-7 w-7"
                        size="icon"
                        title="История чатов"
                        variant={showHistory ? 'secondary' : 'ghost'}
                        onClick={() => setShowHistory(!showHistory)}
                    >
                        <MessageSquare className="h-4 w-4" />
                    </Button>
                    {onCollapse && (
                        <Button
                            className="h-7 w-7"
                            size="icon"
                            variant="ghost"
                            onClick={onCollapse}
                        >
                            <PanelRightClose className="h-4 w-4" />
                        </Button>
                    )}
                </div>
            </CardHeader>

            {/* История чатов (dropdown) */}
            {showHistory && (
                <div className="border-b">
                    <ScrollArea className="max-h-60">
                        <div className="flex flex-col p-1">
                            {chats.length === 0 && (
                                <div className="text-muted-foreground p-3 text-center text-xs">
                                    Нет чатов
                                </div>
                            )}
                            {chats.map((chat) => (
                                <div
                                    key={chat.id}
                                    className={cn(
                                        'group flex cursor-pointer items-center justify-between rounded-md px-3 py-2 text-left text-sm transition-colors',
                                        'hover:bg-muted/50',
                                        chat.id === activeChatId && 'bg-muted',
                                    )}
                                    role="button"
                                    tabIndex={0}
                                    onClick={() => handleSelectChat(chat.id)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' || e.key === ' ') {
                                            e.preventDefault();
                                            handleSelectChat(chat.id);
                                        }
                                    }}
                                >
                                    <div className="min-w-0 flex-1">
                                        <div className="truncate font-medium">{chat.title}</div>
                                        <div className="text-muted-foreground text-xs">
                                            {formatRelativeDate(chat.updatedAt)}
                                        </div>
                                    </div>
                                    <Button
                                        className="ml-2 h-6 w-6 shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
                                        size="icon"
                                        variant="ghost"
                                        onClick={(e) => handleDeleteChat(e, chat.id)}
                                    >
                                        <Trash2 className="h-3 w-3" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </ScrollArea>
                </div>
            )}

            {/* Chat content */}
            <ChatContent
                bookFileName={bookFileName}
                chatId={activeChatId}
                onCollapse={onCollapse}
            />
        </Card>
    );
}

const MODEL_LABELS: Record<string, string> = {
    auto: 'Auto',
    sonnet: 'Claude Sonnet',
    opus: 'Claude Opus',
    haiku: 'Claude Haiku',
};

function ChatContent({
    chatId,
    bookFileName,
}: {
    chatId: string;
    onCollapse?: () => void;
    bookFileName?: string;
}) {
    const aiModel = useSettingsStore((s) => s.aiModel);
    const setAiModel = useSettingsStore((s) => s.setAiModel);

    const chats = useChatStore((state) => state.chats);
    const addMessage = useChatStore((state) => state.addMessage);
    const updateLastMessage = useChatStore((state) => state.updateLastMessage);
    const saveChat = useChatStore((state) => state.saveChat);

    const chatMessages = chats.find((c) => c.id === chatId)?.messages ?? [];

    const systemPrompt = useMemo(() => {
        const base =
            'Ты помощник-литературовед. Пользователь читает книгу. Твоя задача — объяснять контекст, значение слов или обсуждать идеи из присланных фрагментов.';

        if (!bookFileName) return base;

        return `${base}\n\nСейчас пользователь читает файл: "${bookFileName}".`;
    }, [bookFileName]);

    const { messages, sendMessage } = useClaudeChat({
        systemPrompt,
        chatId,
        messages: chatMessages,
        model: aiModel === 'auto' ? undefined : aiModel,
        store: {
            getMessages: () =>
                useChatStore.getState().chats.find((c) => c.id === chatId)?.messages ?? [],
            addMessage,
            updateLastMessage,
            saveChat,
        },
    });
    const [input, setInput] = useState('');

    // Quote store for rendering quote blocks and pending quotes
    const getQuote = useQuoteStore((state) => state.getQuote);
    const pendingQuotes = useQuoteStore((state) => state.pendingQuotes);
    const removePendingQuote = useQuoteStore((state) => state.removePendingQuote);
    const clearPendingQuotes = useQuoteStore((state) => state.clearPendingQuotes);
    const navigateToQuote = useQuoteStore((state) => state.navigateToQuote);

    const scrollRef = useRef<HTMLDivElement>(null);

    // Автоскролл вниз при новых сообщениях
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSubmit = () => {
        // Build message with quote markers
        const quoteParts = pendingQuotes.map(formatQuoteForChat);
        const fullMessage = [...quoteParts, input.trim()].filter(Boolean).join('\n\n');

        if (!fullMessage) return;

        sendMessage({ text: fullMessage });
        setInput('');
        clearPendingQuotes();
    };

    return (
        <>
            {/* Область сообщений */}
            <CardContent className="flex-1 overflow-hidden p-0">
                <ScrollArea ref={scrollRef} className="h-full p-4">
                    <div className="flex flex-col gap-4">
                        {messages.length === 0 && (
                            <div className="text-muted-foreground mt-10 text-center text-sm">
                                Выделите текст в книге и отправьте его сюда, чтобы обсудить.
                            </div>
                        )}

                        {messages.map((m) => (
                            <div
                                key={m.id}
                                className={cn(
                                    'flex gap-3 text-sm',
                                    m.role === 'user' ? 'flex-row-reverse' : 'flex-row',
                                )}
                            >
                                <div
                                    className={cn(
                                        'flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
                                        m.role === 'user'
                                            ? 'bg-primary text-primary-foreground'
                                            : 'bg-muted',
                                    )}
                                >
                                    {m.role === 'user' ? <User size={14} /> : <Bot size={14} />}
                                </div>

                                <div
                                    className={cn(
                                        'max-w-[85%] rounded-lg px-3 py-2',
                                        m.role === 'user'
                                            ? 'bg-primary text-primary-foreground rounded-tr-none'
                                            : 'bg-muted text-foreground rounded-tl-none',
                                    )}
                                >
                                    {/* Обработка цитат */}
                                    {m.parts.map((part, i) => {
                                        if (part.type !== 'text') return null;

                                        // Check for quote marker
                                        const quoteId = extractQuoteId(part.text);

                                        if (quoteId) {
                                            const quote = getQuote(quoteId);

                                            if (quote) {
                                                return (
                                                    <QuoteBlock
                                                        key={i}
                                                        className="my-1"
                                                        quote={quote}
                                                    />
                                                );
                                            }
                                        }

                                        // Regular text or quote-style text (starting with >)
                                        return (
                                            <p
                                                key={i}
                                                className={
                                                    part.text.startsWith('>')
                                                        ? 'border-background/30 mb-1 border-l-2 pl-2 italic opacity-90'
                                                        : 'mb-1'
                                                }
                                            >
                                                {part.text}
                                            </p>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                </ScrollArea>
            </CardContent>

            {/* Поле ввода */}
            <CardFooter className="bg-muted/20 flex-col items-stretch border-t p-3">
                <form
                    className="flex w-full items-end gap-2"
                    onSubmit={(e) => {
                        e.preventDefault();
                        handleSubmit();
                    }}
                >
                    <ChatInputEditor
                        placeholder={
                            pendingQuotes.length > 0
                                ? 'Добавьте вопрос к цитате...'
                                : 'Спросить AI...'
                        }
                        quotes={pendingQuotes.map(
                            (quote): QuoteBadgeData => ({
                                id: quote.id,
                                text:
                                    quote.text.length > 60
                                        ? quote.text.slice(0, 60) + '...'
                                        : quote.text,
                                fullText: quote.text,
                                source: `${quote.source.fileName}, стр. ${quote.source.position.pageNumber}`,
                            }),
                        )}
                        value={input}
                        onChange={setInput}
                        onQuoteClick={navigateToQuote}
                        onQuoteRemove={removePendingQuote}
                        onSubmit={handleSubmit}
                    />
                    <Button
                        disabled={!input.trim() && pendingQuotes.length === 0}
                        size="icon"
                        type="submit"
                    >
                        <Send className="h-4 w-4" />
                    </Button>
                </form>
                <div className="flex items-center gap-1 pt-1">
                    <DropdownMenu>
                        <DropdownMenuTrigger className="text-muted-foreground hover:text-foreground flex items-center gap-1 text-xs transition-colors">
                            {MODEL_LABELS[aiModel] ?? aiModel}
                            <ChevronDown className="h-3 w-3" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" side="top" sideOffset={8}>
                            <DropdownMenuRadioGroup
                                value={aiModel}
                                onValueChange={(value) => setAiModel(value as typeof aiModel)}
                            >
                                <DropdownMenuRadioItem value="auto">Auto</DropdownMenuRadioItem>
                                <DropdownMenuRadioItem value="sonnet">
                                    Claude Sonnet
                                </DropdownMenuRadioItem>
                                <DropdownMenuRadioItem value="opus">
                                    Claude Opus
                                </DropdownMenuRadioItem>
                                <DropdownMenuRadioItem value="haiku">
                                    Claude Haiku
                                </DropdownMenuRadioItem>
                            </DropdownMenuRadioGroup>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </CardFooter>
        </>
    );
}
