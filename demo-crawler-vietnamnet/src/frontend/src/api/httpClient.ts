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

async function request<T>(input: string, init: RequestInit = {}): Promise<T> {
    const headers: HeadersInit = {
        'Content-Type': 'application/json',
        ...(init.headers || {}),
    };

    const res = await fetch(API_BASE_URL + input, {
        ...init,
        headers,
        credentials: 'include', // 👈 gửi cookie (AUTH_TOKEN)
    });

    // ✅ THÊM: xử lý riêng trường hợp 401 (token hết hạn)
    if (res.status === 401) {
        const text = await res.text().catch(() => '');
        let body: unknown = null;
        let errorCode: string | null = null;

        if (text) {
            try {
                body = JSON.parse(text);
                errorCode =
                    body && typeof body === 'object'
                        ? (body as any).error ?? null
                        : null;
            } catch {
                body = text;
            }
        }

        if (errorCode === 'TOKEN_EXPIRED') {
            // Optional: dọn trạng thái login phía FE
            try {
                window.localStorage.removeItem('admin_username');
            } catch {
                // ignore
            }

            // Đẩy về trang login kèm query "expired=1"
            window.location.href = '/admin/login?expired=1';
        }

        throw new HttpError('Unauthorized', res.status, body ?? text ?? res.statusText);
    }

    // Giữ nguyên logic cũ cho các status khác
    if (!res.ok) {
        const text = await res.text().catch(() => '');
        let body: unknown = null;

        if (text) {
            try {
                body = JSON.parse(text);
            } catch {
                body = text;
            }
        }

        const message =
            (body && typeof body === 'object'
                ? (body as any).message || (body as any).error
                : null) ||
            text ||
            res.statusText ||
            'Request failed';

        throw new HttpError(message, res.status, body);
    }

    // nếu body rỗng (204) thì trả undefined
    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
        return undefined as T;
    }

    return (await res.json()) as T;
}

export const httpClient = {
    get:    <T>(url: string) => request<T>(url, { method: 'GET' }),
    post:   <T>(url: string, body?: unknown) =>
        request<T>(url, {
            method: 'POST',
            body: body !== undefined ? JSON.stringify(body) : undefined,
        }),
    put:    <T>(url: string, body?: unknown) =>
        request<T>(url, {
            method: 'PUT',
            body: body !== undefined ? JSON.stringify(body) : undefined,
        }),
    patch:  <T>(url: string, body?: unknown) =>
        request<T>(url, {
            method: 'PATCH',
            body: body !== undefined ? JSON.stringify(body) : undefined,
        }),
    delete: <T>(url: string) =>
        request<T>(url, { method: 'DELETE' }),
};
