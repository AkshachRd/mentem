import { JSONValue } from 'ai';

export interface Source {
    sourceType: 'url';
    id: string;
    url: string;
    title?: string;
}

export interface SearchTask {
    state: 'unprocessed' | 'processing' | 'completed';
    query: string;
    researchGoal: string;
    learning: string;
    sources: Source[];
}

export interface Source {
    title?: string;
    content?: string;
    url: string;
}

export interface PartialJson {
    value: JSONValue | undefined;
    state: 'undefined-input' | 'successful-parse' | 'repaired-parse' | 'failed-parse';
}

export interface WebSearchResult {
    content: string;
    url: string;
    title?: string;
}
