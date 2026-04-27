export type ChatMessagePart =
    | { type: 'text'; text: string }
    | { type: 'image'; path: string; name: string };

export interface ChatMessage {
    id: string;
    role: 'user' | 'assistant';
    parts: ChatMessagePart[];
}

export interface Chat {
    id: string;
    title: string;
    createdAt: number;
    updatedAt: number;
    messages: ChatMessage[];
}
