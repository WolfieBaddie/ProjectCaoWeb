// src/hooks/useCrawlerScheduler.ts
import { useCallback, useState } from 'react';
import {
    setContentCrawlerEnabled,
    setLinkCrawlerEnabled,
} from '../api/admin/adminCrawlerConfigApi.ts';

export type ScheduleMode = 'always' | 'window';

export interface CrawlerSchedule {
    mode: ScheduleMode;
    startDate: string; // YYYY-MM-DD
    endDate: string;   // YYYY-MM-DD
    startTime: string; // HH:mm
    endTime: string;   // HH:mm
    intervalMinutes: number;
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

    // schedule
    const [schedule, setSchedule] =
        useState<CrawlerSchedule>(() => loadInitialSchedule());
    const [isScheduleSaving, setIsScheduleSaving] = useState(false);
    const [lastScheduleSavedAt, setLastScheduleSavedAt] =
        useState<Date | null>(null);

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
    };
}
