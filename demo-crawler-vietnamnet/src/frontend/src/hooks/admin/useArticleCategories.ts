import { useEffect, useState } from 'react';
import { ArticleCategoryDto, fetchArticleCategories } from '../../api/admin/adminArticleApi';

export function useArticleCategories() {
    const [categories, setCategories] = useState<ArticleCategoryDto[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;

        async function load() {
            setLoading(true);
            setError(null);
            try {
                const data = await fetchArticleCategories();
                if (!cancelled) {
                    setCategories(data);
                }
            } catch (e: any) {
                if (!cancelled) {
                    setError(e?.message ?? 'Failed to load categories');
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        }

        load();

        return () => {
            cancelled = true;
        };
    }, []);

    return { categories, loading, error };
}
