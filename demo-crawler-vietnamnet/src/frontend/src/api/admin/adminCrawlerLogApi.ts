// src/api/admin/adminCrawlerLogApi.ts

import {useState} from "react";

const API_BASE_URL =
    (import.meta as any).env?.VITE_API_BASE_URL ?? 'http://localhost:8080';

// ========= Types =========

export type BotType = 'LINK' | 'CONTENT';
export type LogLevel = 'INFO' | 'WARN' | 'ERROR';

export interface ArticleSourceSummaryDto {
    id: number;
    name: string;
    code: string;
    baseUrl: string;
    status: number;          // 1 = active, 0 = inactive
    totalLogs: number;
    lastRun: string | null;  // ISO string hoặc null
}

export interface CrawlerLogDto {
    id: number;
    botType: BotType | null;
    level: LogLevel;
    message: string;
    url: string | null;
    sourceId: number | null;
    categoryId: number | null;
    articleId: number | null;
    categoryName?: string | null;  // 👈 thêm
    createdAt: string;
}

export interface CrawlerLogDetailDto {
    id: number;
    botType: BotType | null;
    level: LogLevel;
    message: string;
    url: string | null;
    sourceId: number | null;
    articleId: number | null;
    categoryId: number | null;      // 👈 thêm
    categoryName?: string | null;   // 👈 thêm
    exception: string | null;
    createdAt: string;
}


export interface PageResponse<T> {
    content: T[];
    totalElements: number;
    totalPages: number;
    size: number;
    number: number;
}

export interface LogQuery {
    bot?: BotType;         // 'LINK' | 'CONTENT'
    sourceId?: number;
    categoryId?: number;
    articleId?: number;
    level?: LogLevel;      // 'INFO' | 'WARN' | 'ERROR'
    keyword?: string;      // search message/url
    fromDate?: string;     // 'YYYY-MM-DD'
    toDate?: string;       // 'YYYY-MM-DD'
    page?: number;
    size?: number;
}


// ========= helper =========

function buildQuery(params: Record<string, unknown>) {
    const sp = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
        if (value === undefined || value === null || value === '') return;
        sp.append(key, String(value));
    });

    const qs = sp.toString();
    return qs ? `?${qs}` : '';
}

// ========= APIs =========

/**
 * Lấy danh sách nguồn crawler.
 * Backend: GET /admin/api/article-sources?activeOnly=true|false
 */


export async function fetchArticleSources(): Promise<ArticleSourceSummaryDto[]> {
    const res = await fetch(
        `${API_BASE_URL}/admin/api/crawler/logs/sources-overview`,
        {credentials: 'include'}
    );

    const text = await res.text();

    if (!res.ok) {
        console.error('[fetchArticleSources] HTTP error body =', text);
        throw new Error(
            `HTTP ${res.status} khi gọi /admin/api/crawler/logs/sources-overview`,
        );
    }

    try {
        return JSON.parse(text) as ArticleSourceSummaryDto[];
    } catch (e) {
        console.error(
            '[fetchArticleSources] Không parse được JSON. Body nhận về là:',
            text,
        );
        throw e;
    }
}

/**
 * Lấy danh sách log.
 * Backend: GET /admin/crawler/logs?sourceId=&bot=&level=&page=&size=
 */
export async function fetchCrawlerLogs(
    query: LogQuery,
): Promise<PageResponse<CrawlerLogDto>> {

    const qs = buildQuery({
        bot:       query.bot,
        sourceId:  query.sourceId,
        categoryId: query.categoryId,
        articleId:  query.articleId,
        level:     query.level,
        keyword:   query.keyword,
        fromDate:  query.fromDate,
        toDate:    query.toDate,
        page:      query.page ?? 0,
        size:      query.size ?? 50,
    });

    const res = await fetch(
        `${API_BASE_URL}/admin/api/crawler/logs${qs}`,
        {
            credentials: 'include',
        }
    );

    const text = await res.text();

    if (!res.ok) {
        console.error('[fetchCrawlerLogs] HTTP error body =', text);
        throw new Error(
            `HTTP ${res.status} khi gọi /admin/api/crawler/logs`,
        );
    }

    try {
        return JSON.parse(text) as PageResponse<CrawlerLogDto>;
    } catch (e) {
        console.error(
            '[fetchCrawlerLogs] Không parse được JSON. Body nhận về là:',
            text,
        );
        throw e;
    }
}

/**
 * Xem chi tiết 1 log.
 * Backend: GET /admin/crawler/logs/{id}
 */
export async function fetchCrawlerLogDetail(
    id: number,
): Promise<CrawlerLogDetailDto> {
    const res = await fetch(
        `${API_BASE_URL}/admin/api/crawler/logs/${id}`,
        { credentials: 'include' },
    );
    const text = await res.text();

    if (!res.ok) {
        console.error(
            '[fetchCrawlerLogDetail] HTTP error body =',
            text,
        );
        throw new Error(
            `HTTP ${res.status} khi gọi /admin/api/crawler/logs/${id}`,
        );
    }

    try {
        return JSON.parse(text) as CrawlerLogDetailDto;
    } catch (e) {
        console.error(
            '[fetchCrawlerLogDetail] Không parse được JSON. Body nhận về là:',
            text,
        );
        throw e;
    }
}
