// src/api/client/clientArticleApi.ts
import { httpClient } from '@/src/api/httpClient';

// Nếu đã có PageResponse<T> dùng chung thì import, ở đây demo nhanh:
export interface PageResponse<T> {
    content: T[];
    totalPages: number;
    totalElements: number;
}

export interface ClientArticleListItem {
    id: number;
    title: string;
    description: string;
    imageUrl: string | null;
    createdAt: string | null;
    categoryName: string;
    sourceName?: string | null;
    sourceLogoUrl?: string | null;
}

export interface ClientArticleSearchParams {
    page?: number;
    size?: number;
    keyword?: string;
    categoryId?: number;
    source?: string;
    fromDate?: string; // 'YYYY-MM-DD'
    toDate?: string;   // 'YYYY-MM-DD'
}

interface ClientArticle {
    id: number;
    headline: string;
    summary: string;
    imageUrl: string;
    timestamp: string;
    category: string;
    readTime: string;
}

function formatTimestamp(iso: string | null | undefined): string {
    if (!iso) return '';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleString('vi-VN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
    });
}

function estimateReadTime(text: string | null | undefined): string {
    if (!text) return '1 min read';
    const words = text.trim().split(/\s+/).length;
    const minutes = Math.max(1, Math.round(words / 200));
    return `${minutes} min read`;
}

function mapDtoToClientArticle(dto: ClientArticleListItem): ClientArticle {
    return {
        id: dto.id,
        headline: dto.title,
        summary: dto.description,
        imageUrl: dto.imageUrl || '/default-article.jpg',
        timestamp: formatTimestamp(dto.createdAt),
        category: dto.categoryName,
        readTime: estimateReadTime(dto.description),
    };
}


// search public (không cần JWT, nhưng httpClient vẫn gửi cookie nếu có)
export async function searchPublicArticles(
    params: ClientArticleSearchParams,
): Promise<PageResponse<ClientArticleListItem>> {
    const query = new URLSearchParams();

    if (params.page != null) query.set('page', String(params.page));
    if (params.size != null) query.set('size', String(params.size));
    if (params.keyword) query.set('keyword', params.keyword);
    if (params.categoryId != null) query.set('categoryId', String(params.categoryId));
    if (params.source) query.set('source', params.source);
    if (params.fromDate) query.set('fromDate', params.fromDate);
    if (params.toDate) query.set('toDate', params.toDate);

    const qs = query.toString();
    const url = `/client/api/articles/search${qs ? `?${qs}` : ''}`;

    return httpClient.get<PageResponse<ClientArticleListItem>>(url);
}

export async function fetchLatestPublicArticles(
): Promise<ClientArticleListItem[]> {
    return httpClient.get<ClientArticleListItem[]>(
        '/client/api/articles/latest'
    );
}

export async function fetchPublicArticleDetail(
    id: number,
): Promise<ClientArticleListItem> {
    return httpClient.get<ClientArticleListItem>(`/client/api/articles/${id}`);
}
