'use client';

import { join } from '@tauri-apps/api/path';

import { useSettingsStore } from '@/entities/settings/model/store';

type InvokeArgs = Record<string, unknown> | undefined;

async function invokeCmd<T>(cmd: string, params?: InvokeArgs): Promise<T> {
    const { invoke } = await import('@tauri-apps/api/core');

    return await invoke<T>(cmd, params);
}

async function ensureDir(path: string) {
    await invokeCmd('fs_any_mkdir', { path } as InvokeArgs);
}

export async function getDataRoot(): Promise<string> {
    const dest = useSettingsStore.getState()?.destinationDir;
    const dir = dest && dest.length > 0 ? dest : 'mentem';

    await ensureDir(dir);

    return dir;
}

export async function getCollectionDir(collection: 'memories' | 'tags'): Promise<string> {
    const root = await getDataRoot();
    const dir = await join(root, collection);

    await ensureDir(dir);

    return dir;
}

export async function getMemoriesDir(): Promise<string> {
    return getCollectionDir('memories');
}

export async function writeMarkdownFile(dir: string, fileName: string, content: string) {
    const filePath = await join(dir, fileName);

    await invokeCmd('fs_any_write_text_file', {
        path: filePath,
        contents: content,
    } as InvokeArgs);

    return filePath;
}

export async function readMarkdownFile(dir: string, fileName: string) {
    const filePath = await join(dir, fileName);

    return await invokeCmd<string>('fs_any_read_text_file', { path: filePath } as InvokeArgs);
}

export async function listFiles(dir: string) {
    const names = await invokeCmd<string[]>('fs_any_read_dir', { path: dir } as InvokeArgs);

    return names.map((name) => ({ name }) as { name: string });
}

export async function deleteFile(dir: string, fileName: string) {
    const filePath = await join(dir, fileName);

    await invokeCmd('fs_any_remove', { path: filePath } as InvokeArgs);
}

export async function fileExists(dir: string, fileName: string) {
    const filePath = await join(dir, fileName);

    return await invokeCmd<boolean>('fs_any_exists', { path: filePath } as InvokeArgs);
}

export async function appendTextFile(filePath: string, contents: string) {
    await invokeCmd('fs_any_append_text_file', { path: filePath, contents } as InvokeArgs);
}
