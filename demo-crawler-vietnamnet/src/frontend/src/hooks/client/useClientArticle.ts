// src/hooks/useClientArticleSearch.ts
import { useEffect, useState } from 'react';
import {
    searchPublicArticles,
    ClientArticleListItem,
    ClientArticleSearchParams,
    PageResponse,
} from '@/src/api/client/clientArticleApi';

export interface SearchFilters {
    keyword: string;
    category: string;
    source: string;
    fromDate: string;
    toDate: string;
}

export interface SearchArticle {
    id: number;
    headline: string;
    summary: string;
    imageUrl: string;
    timestamp: string;
    category: string;
    readTime: string;
    source?: string | null;
    sourceLogoUrl?: string | null;
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

function mapDtoToSearchArticle(dto: ClientArticleListItem): SearchArticle {
    return {
        id: dto.id,
        headline: dto.title,
        summary: dto.description,
        imageUrl: dto.imageUrl || '/default-article.jpg',
        timestamp: formatTimestamp(dto.createdAt),
        category: dto.categoryName,
        readTime: estimateReadTime(dto.description),
        source: dto.sourceName ?? null,
        sourceLogoUrl: dto.sourceLogoUrl ?? undefined,
    };
}

export function useClientArticleSearch(initialKeyword: string) {
    const [filters, setFilters] = useState<SearchFilters>({
        keyword: initialKeyword,
        category: '',
        source: '',
        fromDate: '',
        toDate: '',
    });

    const [results, setResults] = useState<SearchArticle[]>([]);
    const [page, setPage] = useState(0);
    const [size] = useState(12);
    const [totalPages, setTotalPages] = useState(0);
    const [totalElements, setTotalElements] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        setError(null);

        const params: ClientArticleSearchParams = {
            page,
            size,
        };

        if (filters.keyword.trim()) params.keyword = filters.keyword.trim();
        if (filters.category.trim()) params.categoryId = Number(filters.category.trim());
        if (filters.source.trim()) params.source = filters.source.trim();
        if (filters.fromDate) params.fromDate = filters.fromDate;
        if (filters.toDate) params.toDate = filters.toDate;

        searchPublicArticles(params)
            .then((pageData: PageResponse<ClientArticleListItem>) => {
                if (cancelled) return;
                const content = pageData.content || [];
                setResults(content.map(mapDtoToSearchArticle));
                setTotalPages(pageData.totalPages ?? 1);
                setTotalElements(pageData.totalElements ?? content.length);
            })
            .catch(err => {
                console.error('useClientArticleSearch error', err);
                if (!cancelled) setError('Không tải được dữ liệu tìm kiếm.');
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });

        return () => {
            cancelled = true;
        };
    }, [filters, page, size]);

    return {
        filters,
        setFilters,
        results,
        page,
        setPage,
        size,
        totalPages,
        totalElements,
        loading,
        error,
    };
}
