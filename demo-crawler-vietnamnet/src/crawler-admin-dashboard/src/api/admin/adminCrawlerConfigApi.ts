// src/api/admin/adminCrawlerConfigApi.ts
import { httpClient } from '@/src/api/httpClient.ts';

export type CrawlerBotKind = 'link' | 'content';

export interface CrawlerBotConfig {
    linkEnabled: boolean;
    contentEnabled: boolean;
}

// Đọc base URL từ env (Vite) / CRA, fallback localhost:8080
const API_BASE_URL: string =
    (import.meta as any).env?.VITE_API_BASE_URL ??
    (typeof process !== 'undefined'
        ? (process as any).env?.REACT_APP_API_BASE_URL
        : undefined) ??
    'http://localhost:8080';

function buildUrl(path: string): string {
    // Nếu đã là absolute URL thì trả về luôn
    if (path.startsWith('http://') || path.startsWith('https://')) {
        return path;
    }
    const base = API_BASE_URL.replace(/\/+$/, '');
    const p = path.startsWith('/') ? path : `/${path}`;
    return `${base}${p}`;
}

/**
 * Bật/tắt bot crawl link.
 * Backend: POST /admin/api/link?enabled=true|false
 */
export async function setLinkCrawlerEnabled(enabled: boolean): Promise<void> {
    await httpClient.post<void>(
        buildUrl(`/admin/api/link?enabled=${enabled}`),
        undefined,
    );
}

/**
 * Bật/tắt bot crawl content.
 * Backend: POST /admin/api/content?enabled=true|false
 */
export async function setContentCrawlerEnabled(
    enabled: boolean,
): Promise<void> {
    await httpClient.post<void>(
        buildUrl(`/admin/api/content?enabled=${enabled}`),
        undefined,
    );
}
