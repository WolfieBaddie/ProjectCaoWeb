// src/api/admin/adminCrawlerConfigApi.ts
export interface CrawlerBotConfigResponse {
    linkEnabled: boolean;
    contentEnabled: boolean;
}

const API_BASE_URL =
    (import.meta as any).env?.VITE_API_BASE_URL ?? 'http://localhost:8080';

async function handleError(res: Response) {
    if (!res.ok) {
        const text = await res.text();
        throw new Error(`HTTP ${res.status} - ${text}`);
    }
}

/** Lấy trạng thái hiện tại của 2 bot từ backend */
export async function getCrawlerBotConfig(): Promise<CrawlerBotConfigResponse> {
    const res = await fetch(`${API_BASE_URL}/admin/api/crawler-bot-config`, {
        credentials: 'include',
    });
    await handleError(res);
    return res.json() as Promise<CrawlerBotConfigResponse>;
}

/** Bật / tắt Link Crawler Bot */
export async function setLinkCrawlerEnabled(enabled: boolean): Promise<void> {
    const res = await fetch(
        `${API_BASE_URL}/admin/api/link?enabled=${enabled}`,
        {
            method: 'POST',
            credentials: 'include',
        },
    );
    await handleError(res);
}

/** Bật / tắt Content Crawler Bot */
export async function setContentCrawlerEnabled(enabled: boolean): Promise<void> {
    const res = await fetch(
        `${API_BASE_URL}/admin/api/content?enabled=${enabled}`,
        {
            method: 'POST',
            credentials: 'include',
        },
    );
    await handleError(res);
}
