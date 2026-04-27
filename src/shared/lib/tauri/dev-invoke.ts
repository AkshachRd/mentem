'use client';

type InvokeArgs = Record<string, unknown> | number[] | ArrayBuffer | Uint8Array | undefined;
type InvokeOptions = {
    headers?: HeadersInit;
};

type TauriInternals = {
    invoke?: (cmd: string, args?: InvokeArgs, options?: InvokeOptions) => Promise<unknown>;
};

declare global {
    interface Window {
        __TAURI_INTERNALS__?: TauriInternals;
    }
}

const DEFAULT_ENDPOINT = 'http://127.0.0.1:3030';

export function setupDevInvoke(httpEndpoint = DEFAULT_ENDPOINT) {
    if (typeof window === 'undefined') return;

    if (window.__TAURI_INTERNALS__?.invoke) {
        return;
    }

    window.__TAURI_INTERNALS__ = {
        invoke: async (cmd: string, args: InvokeArgs = {}, options?: InvokeOptions) => {
            const response = await fetch(httpEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(options?.headers ?? {}),
                },
                body: JSON.stringify({ cmd, args }),
            });

            if (!response.ok) {
                const error = await readError(response);

                throw new Error(error);
            }

            return await response.json();
        },
    };
}

async function readError(response: Response) {
    try {
        const data = (await response.json()) as { error?: unknown };

        if (typeof data.error === 'string') return data.error;
    } catch {
        /* fall through to text */
    }

    const text = await response.text().catch(() => '');

    return text || `HTTP ${response.status}`;
}
