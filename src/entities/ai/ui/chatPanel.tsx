'use client';

import { useEffect, useRef, useState } from 'react';
import { useChat } from '@ai-sdk/react';
import { Send, Bot, User } from 'lucide-react';
import { DefaultChatTransport } from 'ai';

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { ScrollArea } from '@/shared/ui/scroll-area';
import { cn } from '@/shared/lib/utils';
import { Textarea } from '@/shared/ui/textarea';

export function ChatPanel() {
    const { messages, sendMessage } = useChat({
        transport: new DefaultChatTransport({
            api: '/api/chat',
        }),
    });
    const [input, setInput] = useState('');

    const scrollRef = useRef<HTMLDivElement>(null);

    // Автоскролл вниз при новых сообщениях
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    return (
        <Card className="bg-background flex h-screen w-80 flex-col rounded-l-xl rounded-r-none border-l shadow-2xl transition-all duration-300 md:w-96">
            {/* Шапка чата */}
            <CardHeader className="flex flex-row items-center justify-between space-y-0 border-b p-4">
                <div className="flex items-center gap-2">
                    <div className="bg-primary/10 rounded-full p-2">
                        <Bot className="text-primary h-5 w-5" />
                    </div>
                    <CardTitle className="text-sm font-semibold">AI Ассистент</CardTitle>
                </div>
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
                                    {/* Обработка цитат (простая реализация) */}
                                    {m.parts.map((part, i) =>
                                        part.type === 'text' ? (
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
                                        ) : null,
                                    )}
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
                        sendMessage({ text: input });
                    }}
                >
                    <Textarea
                        className="max-h-32 min-h-[44px] resize-none text-sm"
                        placeholder="Спросить AI..."
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                    />
                    <Button disabled={!input.trim()} size="icon" type="submit">
                        <Send className="h-4 w-4" />
                    </Button>
                </form>
            </CardFooter>
        </Card>
    );
}
