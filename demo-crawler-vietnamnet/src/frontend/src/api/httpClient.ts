// src/api/httpClient.ts
const API_BASE_URL =
    (import.meta as any).env?.VITE_API_BASE_URL ?? 'http://localhost:8080';

export class HttpError extends Error {
    status: number;
    body: unknown;

    constructor(message: string, status: number, body?: unknown) {
        super(message);
        this.name = 'HttpError';
        this.status = status;
        this.body = body;
    }
}

// Chuẩn hoá URL để tránh lỗi 'http://localhost:8080admin/...'
function buildUrl(url: string): string {
    // Nếu url đã là absolute (http/https) thì dùng luôn
    if (url.startsWith('http://') || url.startsWith('https://')) {
        return url;
    }

    const base = API_BASE_URL.replace(/\/+$/, ''); // bỏ / ở cuối base
    const path = url.startsWith('/') ? url : `/${url}`; // thêm / nếu thiếu

    return base + path;
}

// Chỉ coi là API admin cần bảo vệ nếu: path bắt đầu bằng /admin/ và không phải /admin/login
function isAdminProtectedApi(url: string): boolean {
    try {
        const full = buildUrl(url);
        const u = new URL(full);
        const path = u.pathname;
        return path.startsWith('/admin/') && !path.startsWith('/admin/login');
    } catch {
        return false;
    }
}

async function request<T>(url: string, init: RequestInit = {}): Promise<T> {
    const headers: HeadersInit = {
        'Content-Type': 'application/json',
        ...(init.headers || {}),
    };

    const fullUrl = buildUrl(url);

    let res: Response;
    try {
        res = await fetch(fullUrl, {
            ...init,
            headers,
            credentials: 'include', // => gửi cookie AUTH_TOKEN lên backend
        });
    } catch (e) {
        console.error('Fetch error to', fullUrl, e);
        throw new HttpError('Không kết nối được tới API backend', 0, null);
    }

    const text = await res.text().catch(() => '');
    let body: any = null;

    if (text) {
        try {
            body = JSON.parse(text);
        } catch {
            body = text;
        }
    }

    // 401 chỉ xử lý đặc biệt cho API /admin/** (trừ /admin/login)
    if (res.status === 401 && isAdminProtectedApi(url)) {
        const errorCode =
            body && typeof body === 'object' ? (body as any).error ?? null : null;

        if (errorCode === 'TOKEN_EXPIRED') {
            // Nếu trước đó có dùng admin_username để guard FE thì dọn đi (không đụng đến token)
            try {
                window.localStorage.removeItem('admin_username');
            } catch {
                // ignore
            }

            // Redirect về trang login admin, báo hết hạn
            window.location.href = '/admin/login?expired=1';
        }

        throw new HttpError(
            'Unauthorized',
            res.status,
            body ?? text ?? res.statusText,
        );
    }

    // Các status lỗi khác (400, 404, 500, 401 non-admin) -> ném HttpError bình thường
    if (!res.ok) {
        const message =
            (body && typeof body === 'object'
                ? (body as any).message || (body as any).error
                : null) ||
            text ||
            res.statusText ||
            'Request failed';

        throw new HttpError(message, res.status, body);
    }

    // Không có body (204, v.v.)
    if (!text) {
        return undefined as T;
    }

    return body as T;
}

export const httpClient = {
    get: <T>(url: string) => request<T>(url, { method: 'GET' }),
    post: <T>(url: string, body?: unknown) =>
        request<T>(url, {
            method: 'POST',
            body: body !== undefined ? JSON.stringify(body) : undefined,
        }),
    put: <T>(url: string, body?: unknown) =>
        request<T>(url, {
            method: 'PUT',
            body: body !== undefined ? JSON.stringify(body) : undefined,
        }),
    patch: <T>(url: string, body?: unknown) =>
        request<T>(url, {
            method: 'PATCH',
            body: body !== undefined ? JSON.stringify(body) : undefined,
        }),
    delete: <T>(url: string) => request<T>(url, { method: 'DELETE' }),
};
