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
    createdAt?: string; // nếu backend thêm vào DTO list
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
    keyword?: string;
    categoryId?: number;
    status?: string;
    page?: number;
    size?: number;
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

    if (params.keyword) searchParams.set('keyword', params.keyword);
    if (params.categoryId != null) searchParams.set('categoryId', String(params.categoryId));
    if (params.status) searchParams.set('status', params.status);
    searchParams.set('page', String(params.page ?? 0));
    searchParams.set('size', String(params.size ?? 20));

    const url = `${API_BASE_URL}/admin/api/articles?${searchParams.toString()}`;

    const res = await fetch(url, { credentials: 'include' });

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
