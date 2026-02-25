import { openUrl as tauriOpenUrl } from '@tauri-apps/plugin-opener';

export async function openExternalUrl(url: string) {
    try {
        await tauriOpenUrl(url);
    } catch {
        window.open(url, '_blank');
    }
}
