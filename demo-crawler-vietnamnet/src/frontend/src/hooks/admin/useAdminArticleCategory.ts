// src/hooks/useAdminArticleCategories.ts
import { useEffect, useState } from 'react';
import {
    ApiError,
    ArticleCategory,
    fetchArticleCategories,
    softDeleteArticleCategory,
    updateArticleCategory,
} from '../../api/admin/adminArticleCategory';

export interface UseAdminArticleCategoriesResult {
    categories: ArticleCategory[];
    loading: boolean;
    error: ApiError | null;
    refresh: () => Promise<void>;

    // API cho UI dùng
    handleUpdateCategory: (id: number, name: string) => Promise<ArticleCategory>;
    handleDeleteCategory: (id: number) => Promise<void>;
}

export function useAdminArticleCategories(): UseAdminArticleCategoriesResult {
    const [categories, setCategories] = useState<ArticleCategory[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<ApiError | null>(null);

    const loadCategories = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await fetchArticleCategories();
            setCategories(data);
        } catch (err) {
            setError(err as ApiError);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // load lần đầu
        void loadCategories();
    }, []);

    const handleUpdateCategory = async (id: number, name: string) => {
        try {
            const updated = await updateArticleCategory(id, { name });

            // cập nhật lại list trong state
            setCategories((prev) =>
                prev.map((cat) => (cat.id === id ? { ...cat, ...updated } : cat)),
            );

            return updated;
        } catch (err) {
            // ném lại để component bên ngoài có thể bắt và đọc err.errors[field]
            throw err;
        }
    };

    const handleDeleteCategory = async (id: number) => {
        try {
            await softDeleteArticleCategory(id);

            // xóa khỏi list state vì backend đã soft delete
            setCategories((prev) => prev.filter((cat) => cat.id !== id));
        } catch (err) {
            throw err;
        }
    };

    return {
        categories,
        loading,
        error,
        refresh: loadCategories,
        handleUpdateCategory,
        handleDeleteCategory,
    };
}
