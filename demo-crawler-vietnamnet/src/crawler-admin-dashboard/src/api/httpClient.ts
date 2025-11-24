// src/api/httpClient.ts
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

const API_BASE_URL =
    (import.meta as any).env?.VITE_API_BASE_URL ?? '';

async function request<T>(input: string, init: RequestInit = {}): Promise<T> {
    const token =
        typeof window !== 'undefined'
            ? window.localStorage.getItem('authToken')
            : null;

    const headers: HeadersInit = {
        'Content-Type': 'application/json',
        ...(init.headers || {}),
    };

    if (token) {
        (headers as any).Authorization = `Bearer ${token}`;
    }

    const res = await fetch(API_BASE_URL + input, {
        ...init,
        headers,
        credentials: 'include',
    });

    const contentType = res.headers.get('content-type') || '';
    const isJson = contentType.includes('application/json');

    if (!res.ok) {
        let body: unknown = null;

        if (isJson) {
            try {
                body = await res.json();
            } catch {
                // ignore
            }
        } else {
            try {
                const text = await res.text();
                body = text || null;
            } catch {
                // ignore
            }
        }

        const message =
            (body as any)?.message ||
            (body as any)?.error ||
            res.statusText ||
            'Request failed';

        throw new HttpError(message, res.status, body);
    }

    if (res.status === 204 || init.method === 'HEAD') {
        return undefined as unknown as T;
    }

    if (isJson) {
        return (await res.json()) as T;
    }

    const text = await res.text();
    return text as unknown as T;
}

export const httpClient = {
    get: <T>(url: string) => request<T>(url, { method: 'GET' }),
    post: <T>(url: string, body?: unknown) =>
        request<T>(url, {
            method: 'POST',
            body: body !== undefined ? JSON.stringify(body) : undefined,
        }),
};
