type InvokeArgs = Record<string, unknown> | undefined;

async function invokeCmd<T>(cmd: string, params?: InvokeArgs): Promise<T> {
    const { invoke } = await import('@tauri-apps/api/core');

    return await invoke<T>(cmd, params);
}

export async function checkClaudeCli(): Promise<boolean> {
    return invokeCmd<boolean>('ai_check_cli');
}

export async function claudePrompt(systemPrompt: string, userPrompt: string): Promise<string> {
    return invokeCmd<string>('ai_prompt', {
        systemPrompt,
        userPrompt,
    } as InvokeArgs);
}

export async function claudeStreamStart(
    sessionId: string,
    systemPrompt: string,
    userPrompt: string,
    model?: string,
    images?: string[],
): Promise<void> {
    return invokeCmd<void>('ai_stream_start', {
        sessionId,
        systemPrompt,
        userPrompt,
        model: model || null,
        images: images && images.length > 0 ? images : null,
    } as InvokeArgs);
}

export async function claudeStreamCancel(sessionId: string): Promise<void> {
    return invokeCmd<void>('ai_stream_cancel', { sessionId } as InvokeArgs);
}
