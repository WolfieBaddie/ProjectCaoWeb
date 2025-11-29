// src/api/admin/adminArticleSourceApi.ts

// Có thể dùng chung với adminArticleApi.ts, ở đây mình copy lại cho độc lập
const API_BASE_URL =
    (import.meta as any).env?.VITE_API_BASE_URL ?? 'http://localhost:8080';

// === DTO từ backend (map với ArticleSourceSummaryDto trong AdminArticleSourceController) ===
// :contentReference[oaicite:0]{index=0}
export interface ArticleSourceSummaryDto {
    id: number;
    name: string;
    baseUrl: string;
    defaultCategorySlug: string | null;
    active: boolean;

    categoryId: number | null;
    linkSelector: string | null;
    titleSelector: string | null;
    descriptionSelector: string | null;
    contentSelector: string | null;
    imageSelector: string | null;
    timeSelector: string | null;
    removeSelector: string | null;
}

// === Payload gửi lên cho ArticleSourceForm (backend) ===
// Map với ArticleSourceForm + ArticleSourceService.mapFormToEntity :contentReference[oaicite:1]{index=1}
export interface ArticleSourceFormPayload {
    categoryId: number;          // id category thật (LONG)
    title: string;
    description?: string | null;

    url: string;                 // listing URL
    listingSelector: string;     // linkSelector
    titleSelector: string;
    descriptionSelector: string;
    contentSelector: string;
    imageSelector: string;
    removeSelector: string;
    timeSelector?: string | null;

    status: number;              // 1 = active, 0 = inactive
}

export interface ArticleSourceDto {
    id: number;
    name: string;
    url: string;
    categoryId: number;

    linkSelector: string;
    titleSelector: string;
    descriptionSelector: string;
    contentSelector: string;
    imageSelector: string;
    removalSelector: string;   // hoặc removeSelector tùy backend
    status: number;            // 1 = active, 0 = inactive
}

// ---- 1. Lấy danh sách nguồn crawler ----
// GET /admin/api/article-sources?activeOnly=true|false :contentReference[oaicite:2]{index=2}
export async function fetchArticleSources(
    activeOnly: boolean = false
): Promise<ArticleSourceSummaryDto[]> {
    const url = `${API_BASE_URL}/admin/api/article-sources?activeOnly=${activeOnly}`;

    const res = await fetch(url, {
        credentials: 'include',
    });

    if (!res.ok) {
        throw new Error(`HTTP ${res.status} - ${res.statusText}`);
    }

    return (await res.json()) as ArticleSourceSummaryDto[];
}


// ---- 2. Seed / upsert ArticleSource (theo categoryId) ----
// POST /admin/api/seed-article-source :contentReference[oaicite:3]{index=3}
export async function seedArticleSource(
    payload: ArticleSourceFormPayload
): Promise<string> {
    const url = `${API_BASE_URL}/admin/api/seed-article-source`;

    const res = await fetch(url, {
        method: 'POST',
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
    });

    if (!res.ok) {
        throw new Error(`HTTP ${res.status} - ${res.statusText}`);
    }

    // backend trả String "Seed article source: ..."
    return await res.text();
}

// ---- 3. Update 1 ArticleSource theo id ----
// PUT /admin/api/article-sources/{id} :contentReference[oaicite:4]{index=4}
export async function updateArticleSource(
    id: number,
    payload: ArticleSourceFormPayload
): Promise<void> {
    const url = `${API_BASE_URL}/admin/api/article-sources/${id}`;

    const res = await fetch(url, {
        method: 'PUT',
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
    });

    if (!res.ok) {
        throw new Error(`HTTP ${res.status} - ${res.statusText}`);
    }
}

// ---- 4. Xóa mềm 1 ArticleSource ----
// DELETE /admin/api/article-sources/{id}
// Backend đã implement softDeleteArticleSource() :contentReference[oaicite:5]{index=5}
export async function softDeleteArticleSource(id: number): Promise<void> {
    const url = `${API_BASE_URL}/admin/api/article-sources/${id}`;

    const res = await fetch(url, {
        method: 'DELETE',
        credentials: 'include',
    });

    if (!res.ok) {
        throw new Error(`HTTP ${res.status} - ${res.statusText}`);
    }
}

// ---- 5. Bật / tắt nguồn crawler ----
// PATCH /admin/api/sources/{id}/status?enabled=true|false :contentReference[oaicite:6]{index=6}
export async function updateArticleSourceStatus(
    id: number,
    enabled: boolean
): Promise<void> {
    const url = `${API_BASE_URL}/admin/api/sources/${id}/status?enabled=${enabled}`;

    const res = await fetch(url, {
        method: 'PATCH',
        credentials: 'include',
    });

    if (!res.ok) {
        throw new Error(`HTTP ${res.status} - ${res.statusText}`);
    }
}

// ---- 6. Run full (seed listing + crawl) cho 1 source ----
// POST /admin/api/{id}/run-full :contentReference[oaicite:7]{index=7}
export async function runFullForSource(
    id: number,
    includeLink: boolean = true,
    includeContent: boolean = true
): Promise<void> {
    const url = `${API_BASE_URL}/admin/api/${id}/run-full`;

    const body = {
        includeLink,
        includeContent,
    };

    const res = await fetch(url, {
        method: 'POST',
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
    });

    if (!res.ok) {
        throw new Error(`HTTP ${res.status} - ${res.statusText}`);
    }
}
