// src/hooks/useAdminArticles.ts
import { useEffect, useState } from 'react';
import {
    ArticleListItem,
    fetchArticles,
    PageResponse,
} from '../../api/admin/adminArticleApi.ts';

export interface UseAdminArticlesOptions {
    initialPageSize?: number;
    page: number;
    size: number;
    keyword?: string;
    categoryId?: number;
    status?: string;
    fromDate?: string; // 'YYYY-MM-DD'
    toDate?: string;
}

export interface UseAdminArticlesResult {
    // data
    articles: ArticleListItem[];
    totalElements: number;
    totalPages: number;

    // paging
    page: number;         // 0-based
    pageSize: number;

    // state
    loading: boolean;
    error: string | null;

    // search
    searchTerm: string;
    setSearchTerm: (value: string) => void;

    // limit
    setPageSize: (size: number) => void;

    // pagination helpers
    goToPage: (page: number) => void;
    goNextPage: () => void;
    goPrevPage: () => void;
}

/**
 * Hook quản lý search + phân trang cho danh sách Article (đã crawl).
 */
export function useAdminArticles(
    options: UseAdminArticlesOptions = {page: 0, size: 0}
): UseAdminArticlesResult  {
    const { initialPageSize, categoryId, status, fromDate, toDate } = options;
    const [articles, setArticles] = useState<ArticleListItem[]>([]);
    const [totalElements, setTotalElements] = useState(0);
    const [totalPages, setTotalPages] = useState(0);

    const [page, setPage] = useState(0);
    const [pageSize, setPageSizeState] = useState(options.initialPageSize ?? 6);

    const [searchTerm, setSearchTermState] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // thay đổi search -> reset về page 0
    const setSearchTerm = (value: string) => {
        setSearchTermState(value);
        setPage(0);
    };

    // thay đổi pageSize -> reset page
    const setPageSize = (size: number) => {
        setPageSizeState(size);
        setPage(0);
    };

    const goToPage = (p: number) => {
        setPage(p < 0 ? 0 : p);
    };

    const goNextPage = () => {
        setPage((prev) => prev + 1);
    };

    const goPrevPage = () => {
        setPage((prev) => (prev > 0 ? prev - 1 : 0));
    };

    // side-effect: gọi API mỗi khi searchTerm/page/pageSize thay đổi
    useEffect(() => {
        let cancelled = false;
        const abortController = new AbortController();

        async function load() {
            try {
                setLoading(true);
                setError(null);

                console.log('[useAdminArticles] params', {
                    keyword: searchTerm,
                    categoryId,
                    status,
                    fromDate,
                    toDate,
                    page,
                    size: pageSize,
                });

                const response: PageResponse<ArticleListItem> = await fetchArticles({
                    keyword: searchTerm,
                    categoryId,
                    status,
                    fromDate,
                    toDate,
                    page,
                    size: pageSize,
                });

                if (cancelled) return;

                setArticles(response.content ?? []);
                setTotalElements(response.totalElements ?? 0);
                setTotalPages(response.totalPages ?? 0);
            } catch (err: any) {
                if (cancelled) return;
                if (err.name === 'AbortError') return;

                console.error('useAdminArticles: fetch failed', err);
                setError(err.message || 'Failed to load articles');
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        }

        load();

        return () => {
            cancelled = true;
            abortController.abort();
        };
    }, [searchTerm, categoryId, status, fromDate, toDate, page, pageSize]);


    return {
        articles,
        totalElements,
        totalPages,
        page,
        pageSize,
        loading,
        error,
        searchTerm,
        setSearchTerm,
        setPageSize,
        goToPage,
        goNextPage,
        goPrevPage,
    };
}
