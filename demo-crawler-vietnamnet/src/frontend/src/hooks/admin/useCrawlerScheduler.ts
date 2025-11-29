// src/hooks/useCrawlerScheduler.ts
import { useCallback, useEffect, useState } from 'react';
import {
    getCrawlerBotConfig,
    setContentCrawlerEnabled,
    setLinkCrawlerEnabled,
} from '../../api/admin/adminCrawlerConfigApi.ts';

export type ScheduleMode = 'always' | 'window';

export interface CrawlerSchedule {
    mode: ScheduleMode;
    startDate: string; // YYYY-MM-DD
    endDate: string;   // YYYY-MM-DD
    startTime: string; // HH:mm
    endTime: string;   // HH:mm
    intervalMinutes: number;
}

export interface ArticleSource {
    id: number;
    name: string;
    code?: string;
    baseUrl?: string;
    active: boolean;
}

export interface UseCrawlerSchedulerResult {
    // ... các field cũ
    sources: ArticleSource[];
    loadingSources: boolean;
    selectedSourceIds: number[];
    setSelectedSourceIds: (ids: number[]) => void;

    triggerRunNow: (opts?: { includeLink?: boolean; includeContent?: boolean }) => Promise<void>;
    isRunNowExecuting: boolean;
    lastRunNowMessage?: string;
}

export interface ArticleSourceSummary {
    id: number;
    name: string;
    baseUrl?: string;
    defaultCategorySlug?: string | null;
    active: boolean;
}

const STORAGE_KEY = 'crawlerSchedulerConfig_v1';

const DEFAULT_SCHEDULE: CrawlerSchedule = {
    mode: 'always',
    startDate: '',
    endDate: '',
    startTime: '00:00',
    endTime: '23:59',
    intervalMinutes: 10,
};

const API_BASE_URL =
    (import.meta as any).env?.VITE_API_BASE_URL ?? 'http://localhost:8080';
// nếu bạn có config sẵn thì import từ đó

function loadInitialSchedule(): CrawlerSchedule {
    if (typeof window === 'undefined') {
        return DEFAULT_SCHEDULE;
    }
    try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (!raw) return DEFAULT_SCHEDULE;

        const parsed = JSON.parse(raw) as Partial<CrawlerSchedule>;

        return {
            ...DEFAULT_SCHEDULE,
            ...parsed,
            intervalMinutes:
                parsed.intervalMinutes && parsed.intervalMinutes > 0
                    ? parsed.intervalMinutes
                    : DEFAULT_SCHEDULE.intervalMinutes,
        };
    } catch {
        return DEFAULT_SCHEDULE;
    }
}

function saveScheduleToStorage(schedule: CrawlerSchedule) {
    if (typeof window === 'undefined') return;
    try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(schedule));
    } catch {
        // best-effort, không crash UI
    }
}

function getErrorMessage(err: unknown): string {
    if (err instanceof Error) return err.message;
    return 'Unknown error';
}

type SavingBotKind = 'link' | 'content' | null;

/**
 * Hook quản lý:
 *  - trạng thái bật/tắt Link / Content bot
 *  - schedule (mode, date, time, interval)
 */
export function useCrawlerScheduler() {
    // bot state
    const [linkEnabled, setLinkEnabled] = useState<boolean>(true);
    const [contentEnabled, setContentEnabled] = useState<boolean>(true);
    const [savingBot, setSavingBot] = useState<SavingBotKind>(null);
    const [lastError, setLastError] = useState<string | null>(null);
    const [loadingConfig, setLoadingConfig] = useState<boolean>(false);

    // schedule
    const [schedule, setSchedule] =
        useState<CrawlerSchedule>(() => loadInitialSchedule());
    const [isScheduleSaving, setIsScheduleSaving] = useState(false);
    const [lastScheduleSavedAt, setLastScheduleSavedAt] =
        useState<Date | null>(null);

    const [sources, setSources] = useState<ArticleSourceSummary[]>([]);
    const [loadingSources, setLoadingSources] = useState<boolean>(false);
    const [selectedSourceIds, setSelectedSourceIds] = useState<number[]>([]);
    const [isSeedListingRunning, setIsSeedListingRunning] =
        useState<boolean>(false);
    const [lastSeedListingMessage, setLastSeedListingMessage] =
        useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;

        async function loadConfig() {
            try {
                setLoadingConfig(true);
                const cfg = await getCrawlerBotConfig();

                if (!cancelled) {
                    setLinkEnabled(cfg.linkEnabled);
                    setContentEnabled(cfg.contentEnabled);
                }
            } catch (err) {
                console.error('[useCrawlerScheduler] loadConfig error', err);
                if (!cancelled) {
                    setLastError('Không đọc được trạng thái crawler hiện tại');
                }
            } finally {
                if (!cancelled) {
                    setLoadingConfig(false);
                }
            }
        }

        loadConfig();

        return () => {
            cancelled = true;
        };
    }, []);


    useEffect(() => {
        let cancelled = false;

        async function loadSources() {
            try {
                setLoadingSources(true);

                const res = await fetch(
                    `${API_BASE_URL}/admin/api/article-sources?activeOnly=true`,
                    {
                        credentials: 'include',
                    }
                );

                // ĐỌC TEXT TRƯỚC để debug dễ hơn
                const text = await res.text();

                if (!res.ok) {
                    console.error(
                        '[useCrawlerScheduler] loadSources HTTP error',
                        res.status,
                        text.slice(0, 200)
                    );
                    throw new Error(`HTTP ${res.status}`);
                }

                let data: ArticleSourceSummary[];
                try {
                    data = JSON.parse(text) as ArticleSourceSummary[];
                } catch (e) {
                    console.error(
                        '[useCrawlerScheduler] Response is not JSON, body:',
                        text.slice(0, 200)
                    );
                    throw new Error(
                        'Response from /admin/api/article-sources is not valid JSON. Kiểm tra lại controller/backend.'
                    );
                }

                if (cancelled) return;

                setSources(data);
                setSelectedSourceIds(data.map((s) => s.id));
            } catch (err) {
                console.error('[useCrawlerScheduler] loadSources error', err);
                setLastError(
                    err instanceof Error ? err.message : 'Lỗi khi load ArticleSource'
                );
            } finally {
                if (!cancelled) setLoadingSources(false);
            }
        }

        loadSources();
        return () => {
            cancelled = true;
        };
    }, []);


    const runSeedListingNow = useCallback(async () => {
        if (!selectedSourceIds.length) {
            setLastError('Hãy chọn ít nhất một nguồn để chạy seedListing.');
            return;
        }

        setLastError(null);
        setIsSeedListingRunning(true);
        setLastSeedListingMessage(null);

        try {
            await Promise.all(
                selectedSourceIds.map(async (id) => {
                    const res = await fetch(
                        `/admin/api/article-sources/${id}/seed-listing`,
                        {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            credentials: 'include',
                        }
                    );
                    if (!res.ok) {
                        const text = await res.text();
                        throw new Error(
                            `Seed listing for source ${id} failed: ${res.status} ${text}`
                        );
                    }
                })
            );

            setLastSeedListingMessage(
                `Đã gửi job seed listing cho ${selectedSourceIds.length} nguồn.`
            );
        } catch (err: any) {
            console.error('[useCrawlerScheduler] runSeedListingNow error', err);
            setLastError(err.message || 'Lỗi chạy seed listing');
        } finally {
            setIsSeedListingRunning(false);
        }
    }, [selectedSourceIds]);



    // toggle Link bot
    const toggleLink = useCallback(async () => {
        setLastError(null);
        const prev = linkEnabled;
        const next = !prev;

        setLinkEnabled(next); // optimistic update
        setSavingBot('link');

        try {
            await setLinkCrawlerEnabled(next);
        } catch (err) {
            setLinkEnabled(prev); // revert
            setLastError(getErrorMessage(err));
        } finally {
            setSavingBot((cur) => (cur === 'link' ? null : cur));
        }
    }, [linkEnabled]);

    // toggle Content bot
    const toggleContent = useCallback(async () => {
        setLastError(null);
        const prev = contentEnabled;
        const next = !prev;

        setContentEnabled(next);
        setSavingBot('content');

        try {
            await setContentCrawlerEnabled(next);
        } catch (err) {
            setContentEnabled(prev);
            setLastError(getErrorMessage(err));
        } finally {
            setSavingBot((cur) => (cur === 'content' ? null : cur));
        }
    }, [contentEnabled]);

    // update từng field của schedule
    const updateScheduleField = useCallback(
        <K extends keyof CrawlerSchedule>(
            field: K,
            value: CrawlerSchedule[K],
        ) => {
            setSchedule((prev) => ({
                ...prev,
                [field]: value,
            }));
        },
        [],
    );

    // save schedule (hiện tại lưu localStorage, sau này đổi sang API)
    const saveSchedule = useCallback(async () => {
        setIsScheduleSaving(true);
        try {
            saveScheduleToStorage(schedule);
            setLastScheduleSavedAt(new Date());
        } finally {
            setIsScheduleSaving(false);
        }
    }, [schedule]);

    return {
        // bot controls
        linkEnabled,
        contentEnabled,
        isLinkSaving: savingBot === 'link',
        isContentSaving: savingBot === 'content',
        lastError,
        toggleLink,
        toggleContent,

        // schedule controls
        schedule,
        updateScheduleField,
        saveSchedule,
        isScheduleSaving,
        lastScheduleSavedAt,

        // manual seed listing
        sources,
        loadingSources,
        selectedSourceIds,
        setSelectedSourceIds,
        runSeedListingNow,
        isSeedListingRunning,
        lastSeedListingMessage,
    };
}


