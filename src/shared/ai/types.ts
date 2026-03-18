export interface ChatMessage {
    id: string;
    role: 'user' | 'assistant';
    parts: { type: 'text'; text: string }[];
}

export interface Chat {
    id: string;
    title: string;
    createdAt: number;
    updatedAt: number;
    messages: ChatMessage[];
}
