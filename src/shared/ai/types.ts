export interface ChatMessage {
    id: string;
    role: 'user' | 'assistant';
    parts: { type: 'text'; text: string }[];
}
