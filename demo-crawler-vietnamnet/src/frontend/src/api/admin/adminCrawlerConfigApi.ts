// src/api/admin/adminCrawlerConfigApi.ts
import { httpClient } from '@/src/api/httpClient.ts';

export type CrawlerBotKind = 'link' | 'content';

export interface CrawlerBotConfig {
    linkEnabled: boolean;
    contentEnabled: boolean;
}

// ⛔️ Không cần tự build base URL ở đây nữa nếu httpClient đã có baseURL
// Nếu chỗ khác còn dùng thì bạn giữ lại, nhưng KHÔNG dùng trong 2 hàm dưới.

// Nếu vẫn muốn giữ helper:
function buildUrl(path: string): string {
    return path; // để nó trả về đúng path tương đối, cho httpClient tự xử lý
}

export async function getCrawlerBotConfig(): Promise<CrawlerBotConfig> {
    return httpClient.get<CrawlerBotConfig>(
        buildUrl('/admin/api/crawler-bot-config'),
    );
}


/**
 * Bật/tắt bot crawl link.
 * Backend: POST /admin/api/link?enabled=true|false
 */
export async function setLinkCrawlerEnabled(enabled: boolean): Promise<void> {
    await httpClient.post<void>(
        `/admin/api/link?enabled=${enabled}`,
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
        `/admin/api/content?enabled=${enabled}`,
        undefined,
    );
}
