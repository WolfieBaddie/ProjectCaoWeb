// import bổ sung ở đầu file (nếu chưa có)
import { useEffect, useState } from 'react';
import {
    getPublicArticleDetail,
    ClientArticleDetail,
} from '@/src/api/client/clientArticleApi';

// ...

export function useClientArticleDetail(id?: string) {
    const [data, setData] = useState<ClientArticleDetail | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!id) return;

        let cancelled = false;
        setLoading(true);
        setError(null);

        getPublicArticleDetail(id)
            .then(detail => {
                if (cancelled) return;
                setData(detail);
            })
            .catch(err => {
                if (cancelled) return;
                console.error('Failed to load article detail', err);
                setError('Không tải được chi tiết bài viết.');
            })
            .finally(() => {
                if (cancelled) return;
                setLoading(false);
            });

        return () => {
            cancelled = true;
        };
    }, [id]);

    return { data, loading, error };
}
