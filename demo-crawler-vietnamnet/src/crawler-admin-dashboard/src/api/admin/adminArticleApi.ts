// src/api/adminArticleApi.ts

const API_BASE_URL =
    (import.meta as any).env?.VITE_API_BASE_URL ?? 'http://localhost:8080';
// nếu bạn có config sẵn thì import từ đó

export interface ArticleListItem {
    id: number;
    url: string;
    title: string;
    description: string;
    imageUrl: string | null;
    crawled: boolean;
    status: string;
    categoryName: string | null;
    createdAt?: string; // ISO datetime từ backend
}


export interface PageResponse<T> {
    content: T[];
    totalElements: number;
    totalPages: number;
}

export interface ArticleImageDto {
    id: number;
    url: string;
    alt: string | null;
    caption: string | null;
    thumbSmall: string | null;
    thumb: string | null;
    sortOrder: number | null;
}

export interface ArticleDetail {
    id: number;
    url: string;
    title: string;
    description: string;
    content: string;
    categoryName: string | null;
    createdAt?: string;
    updatedAt?: string;
    publishedAt?: string;
    imageUrl: string | null;
    status: string;
    images: ArticleImageDto[];
}

export interface FetchArticlesParams {
    page: number;
    size: number;
    keyword?: string;
    categoryId?: number;
    status?: string;
    fromDate?: string; // 'YYYY-MM-DD'
    toDate?: string;
}

export interface ArticleCategoryDto {
    id: number;
    name: string;
    slug: string;
    articleCount: number;
}

export async function fetchArticleCategories(): Promise<ArticleCategoryDto[]> {
    const url = `${API_BASE_URL}/admin/api/article-categories`;

    const res = await fetch(url, {
        credentials: 'include',
    });

    if (!res.ok) {
        throw new Error(`HTTP ${res.status} - ${res.statusText}`);
    }

    return (await res.json()) as ArticleCategoryDto[];
}

export async function fetchArticles(
    params: FetchArticlesParams
): Promise<PageResponse<ArticleListItem>> {
    const searchParams = new URLSearchParams();
    searchParams.set('page', String(params.page));
    searchParams.set('size', String(params.size));


    if (params.keyword) searchParams.set('keyword', params.keyword);
    if (params.categoryId) searchParams.set('categoryId', String(params.categoryId));
    if (params.status) searchParams.set('status', params.status);
    if (params.fromDate) searchParams.set('fromDate', params.fromDate + 'T00:00:00');
    if (params.toDate) searchParams.set('toDate', params.toDate + 'T23:59:59');


    const url = `${API_BASE_URL}/admin/api/articles?${searchParams.toString()}`;

    const res = await fetch(url, {
        credentials: 'include', // gửi cookie/session
    });

    if (!res.ok) {
        throw new Error(`HTTP ${res.status} - ${res.statusText}`);
    }

    return (await res.json()) as PageResponse<ArticleListItem>;
}

export async function fetchArticleForEdit(id: number): Promise<ArticleDetail> {
    const url = `${API_BASE_URL}/admin/api/articles/${id}`;
    const res = await fetch(url, { credentials: 'include' });

    if (!res.ok) {
        throw new Error(`HTTP ${res.status} - ${res.statusText}`);
    }

    return (await res.json()) as ArticleDetail;
}

export interface UpdateArticlePayload {
    title: string;
    description: string;
    content: string;
    imageUrl: string | null;
    status: string;
}

export async function updateArticle(
    id: number,
    payload: UpdateArticlePayload
): Promise<ArticleDetail> {
    const url = `${API_BASE_URL}/admin/api/articles/${id}`;
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

    return (await res.json()) as ArticleDetail;
}
