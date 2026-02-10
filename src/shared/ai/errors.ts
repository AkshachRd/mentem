import { type APICallError } from 'ai';

interface GeminiError {
    error: {
        code: number;
        message: string;
        status: string;
    };
}

export function parseError(err: unknown): string {
    let errorMessage: string = 'Unknown Error';

    if (typeof err === 'string') {
        errorMessage = err;
    }
    if (typeof err === 'object' && err !== null) {
        const { error } = err as { error: APICallError };

        if (error.responseBody) {
            const response = JSON.parse(error.responseBody) as GeminiError;

            errorMessage = `[${response.error.status}]: ${response.error.message}`;
        } else {
            errorMessage = `[${error.name}]: ${error.message}`;
        }
    }

    return errorMessage;
}
