// src/hooks/useAdminLogs.ts
import { useEffect, useState } from 'react';
import {
    fetchCrawlerLogs,
    PageResponse,
    CrawlerLogDto,
    BotType,
    LogLevel,
} from '../api/admin/adminCrawlerLogApi';

export interface UseAdminLogsOptions {
    sourceId: number;
    bot?: BotType | 'All';
    level?: LogLevel | 'All';
    categoryId?: number | null;
    keyword?: string;
    fromDate?: string; // 'YYYY-MM-DD'
    toDate?: string;
    page: number;
    size: number;
}

export function useAdminLogs(options: UseAdminLogsOptions) {
    const { sourceId, bot, level, categoryId, keyword, fromDate, toDate, page, size } = options;

    const [logs, setLogs] = useState<CrawlerLogDto[]>([]);
    const [totalElements, setTotalElements] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;

        async function load() {
            try {
                setLoading(true);
                setError(null);

                const res: PageResponse<CrawlerLogDto> = await fetchCrawlerLogs({
                    sourceId,
                    bot: bot && bot !== 'All' ? bot as BotType : undefined,
                    level: level && level !== 'All' ? level as LogLevel : undefined,
                    categoryId: categoryId ?? undefined,
                    keyword: keyword && keyword.trim() ? keyword.trim() : undefined,
                    fromDate,
                    toDate,
                    page,
                    size,
                });

                if (cancelled) return;

                setLogs(res.content ?? []);
                setTotalElements(res.totalElements ?? 0);
                setTotalPages(res.totalPages ?? 0);
            } catch (e: any) {
                if (cancelled) return;
                console.error('useAdminLogs: fetch failed', e);
                setError(e.message || 'Failed to load logs');
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        }

        if (!sourceId) {
            setLogs([]);
            return;
        }

        load();

        return () => {
            cancelled = true;
        };
    }, [sourceId, bot, level, categoryId, keyword, fromDate, toDate, page, size]);

    return {
        logs,
        totalElements,
        totalPages,
        loading,
        error,
        // helper chuyển page...
    };
}
