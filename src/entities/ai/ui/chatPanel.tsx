'use client';

import type { QuoteBadgeData } from '@/shared/ui/chat-input-editor';

import { useEffect, useRef, useState } from 'react';
import { useChat } from '@ai-sdk/react';
import { Send, Bot, User, PanelRightClose } from 'lucide-react';
import { DefaultChatTransport } from 'ai';

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { ScrollArea } from '@/shared/ui/scroll-area';
import { cn } from '@/shared/lib/utils';
import { ChatInputEditor } from '@/shared/ui/chat-input-editor';
import { useQuoteStore, QuoteBlock, extractQuoteId, formatQuoteForChat } from '@/entities/quote';

type ChatPanelProps = {
    onCollapse?: () => void;
};

export function ChatPanel({ onCollapse }: ChatPanelProps) {
    const { messages, sendMessage } = useChat({
        transport: new DefaultChatTransport({
            api: '/api/chat',
        }),
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
                {onCollapse && (
                    <Button className="h-7 w-7" size="icon" variant="ghost" onClick={onCollapse}>
                        <PanelRightClose className="h-4 w-4" />
                    </Button>
                )}
            </CardHeader>

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
            <CardFooter className="bg-muted/20 border-t p-3">
                <form
                    className="flex w-full items-end gap-2"
                    onSubmit={(e) => {
                        e.preventDefault();

                        // Build message with quote markers
                        const quoteParts = pendingQuotes.map(formatQuoteForChat);
                        const fullMessage = [...quoteParts, input.trim()]
                            .filter(Boolean)
                            .join('\n\n');

                        if (!fullMessage) return;

                        sendMessage({ text: fullMessage });
                        setInput('');
                        clearPendingQuotes();
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
                        onSubmit={() => {
                            // Build message with quote markers
                            const quoteParts = pendingQuotes.map(formatQuoteForChat);
                            const fullMessage = [...quoteParts, input.trim()]
                                .filter(Boolean)
                                .join('\n\n');

                            if (!fullMessage) return;

                            sendMessage({ text: fullMessage });
                            setInput('');
                            clearPendingQuotes();
                        }}
                    />
                    <Button
                        disabled={!input.trim() && pendingQuotes.length === 0}
                        size="icon"
                        type="submit"
                    >
                        <Send className="h-4 w-4" />
                    </Button>
                </form>
            </CardFooter>
        </Card>
    );
}
