// src/api/admin/adminArticleCategoryApi.ts

const API_BASE_URL =
    (import.meta as any).env?.VITE_API_BASE_URL ?? 'http://localhost:8080';

export interface ArticleCategory {
    id: number;
    name: string;
    deleted?: boolean; // backend có thể không trả, nhưng để sẵn cho future
}

export interface ApiErrorResponse {
    message: string;
    errors?: Record<string, string>;
}

export class ApiError extends Error {
    status: number;
    errors?: Record<string, string>;

    constructor(status: number, message: string, errors?: Record<string, string>) {
        super(message);
        this.status = status;
        this.errors = errors;
    }
}

// Helper xử lý response JSON + map lỗi từ backend (ApiErrorResponse)
async function handleJsonResponse<T>(res: Response): Promise<T> {
    if (res.ok) {
        // 204 No Content
        if (res.status === 204) {
            return undefined as unknown as T;
        }
        return (await res.json()) as T;
    }

    // Thử đọc body JSON lỗi theo format ApiErrorResponse
    try {
        const body = (await res.json()) as ApiErrorResponse;
        throw new ApiError(res.status, body.message ?? 'Request failed', body.errors);
    } catch {
        // Nếu backend không trả JSON đúng format thì fallback
        throw new ApiError(res.status, `HTTP ${res.status} - ${res.statusText}`);
    }
}

// ========== API: GET list categories (chưa bị xóa mềm) ==========
export async function fetchArticleCategories(): Promise<ArticleCategory[]> {
    const url = `${API_BASE_URL}/admin/api/article-categories`;
    const res = await fetch(url, {
        method: 'GET',
        credentials: 'include',
    });
    return handleJsonResponse<ArticleCategory[]>(res);
}

// ========== API: UPDATE category ==========
export interface UpdateArticleCategoryPayload {
    name: string;
}

export async function updateArticleCategory(
    id: number,
    payload: UpdateArticleCategoryPayload,
): Promise<ArticleCategory> {
    const url = `${API_BASE_URL}/admin/api/article-categories/${id}`;

    const res = await fetch(url, {
        method: 'PUT',
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
    });

    return handleJsonResponse<ArticleCategory>(res);
}

// ========== API: SOFT DELETE category ==========
export async function softDeleteArticleCategory(id: number): Promise<void> {
    const url = `${API_BASE_URL}/admin/api/article-categories/${id}`;

    const res = await fetch(url, {
        method: 'DELETE',
        credentials: 'include',
    });

    await handleJsonResponse<void>(res);
}
