// src/hooks/useAdminArticleSources.ts
import { useEffect, useState } from 'react';
import {
    ArticleSourceSummaryDto,
    fetchArticleSources,
    seedArticleSource,
    softDeleteArticleSource,
    updateArticleSource,
    updateArticleSourceStatus,
    ArticleSourceFormPayload,
} from '../../api/admin/adminArticleSourceApi.ts';
// ⚠️ Sửa path cho đúng với cấu trúc project của bạn

// Nếu trong ../../../types.ts đã có ArticleSource rồi thì có thể import từ đó.
// Ở đây mình khai báo lại theo đúng shape mà BotsView đang dùng. :contentReference[oaicite:8]{index=8}
export interface ArticleSource {
    id: string;
    name: string;
    url: string;
    categoryId: string;

    linkSelector: string;
    titleSelector: string;
    descriptionSelector: string;
    contentSelector: string;
    imageSelector: string;
    timeSelector: string;     // <<< THÊM
    removalSelector: string;

    enabled: boolean;
}

function mapDtoToArticleSource(dto: ArticleSourceSummaryDto): ArticleSource {
    return {
        id: String(dto.id),
        name: dto.name,
        url: dto.baseUrl,
        // tạm thời map defaultCategorySlug vào categoryId (sau này chuyển sang id thật)
        categoryId: dto.defaultCategorySlug ?? '',

        linkSelector: dto.linkSelector ?? '',
        titleSelector: dto.titleSelector ?? '',
        descriptionSelector: dto.descriptionSelector ?? '',
        contentSelector: dto.contentSelector ?? '',
        imageSelector: dto.imageSelector ?? '',
        removalSelector: dto.removeSelector ?? '',
        timeSelector: dto.timeSelector ?? '',
        enabled: dto.active,
    };
}

// Map ArticleSource (form bên FE) -> ArticleSourceFormPayload để gửi backend
function mapFormToPayload(source: ArticleSource): ArticleSourceFormPayload {
    return {
        // ⚠⚠⚠ IMPORTANT:
        // Ở đây giả định categoryId bên FE là "số" (id thật) hoặc string số.
        // Nếu hiện tại bạn đang dùng 'cat_1', 'cat_2' thì cần sửa lại type
        // và dropdown để lưu đúng id: number của ArticleCategory. :contentReference[oaicite:9]{index=9}
        categoryId: Number(source.categoryId),

        title: source.name,
        description: null,
        url: source.url,

        listingSelector: source.linkSelector,
        titleSelector: source.titleSelector,
        descriptionSelector: source.descriptionSelector,
        contentSelector: source.contentSelector,
        imageSelector: source.imageSelector,
        removeSelector: source.removalSelector,
        timeSelector: source.timeSelector || null,

        status: source.enabled ? 1 : 0,
    };
}

export interface UseAdminArticleSourcesResult {
    sources: ArticleSource[];
    loading: boolean;
    error: string | null;

    reload: () => void;
    saveSource: (form: ArticleSource) => Promise<void>;
    removeSource: (id: string) => Promise<void>;
    toggleStatus: (src: ArticleSource) => Promise<void>;
}

export function useAdminArticleSources(): UseAdminArticleSourcesResult {
    const [sources, setSources] = useState<ArticleSource[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const loadSources = async (activeOnly: boolean = false) => {
        try {
            setLoading(true);
            setError(null);
            const dtos: ArticleSourceSummaryDto[] = await fetchArticleSources(
                activeOnly
            );
            setSources(dtos.map(mapDtoToArticleSource));
        } catch (err: any) {
            console.error('[useAdminArticleSources] load failed', err);
            setError(err.message || 'Failed to load article sources');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // mặc định load tất cả (cả inactive) để quản lý
        loadSources(false);
    }, []);

    const reload = () => {
        loadSources(false);
    };

    const saveSource = async (form: ArticleSource) => {
        const payload = mapFormToPayload(form);
        const hasId = !!form.id;

        if (!payload.categoryId || Number.isNaN(payload.categoryId)) {
            throw new Error(
                'categoryId không hợp lệ, cần map sang id dạng number trước khi gọi API'
            );
        }

        if (!hasId) {
            // tạo mới (upsert theo categoryId)
            await seedArticleSource(payload);
        } else {
            await updateArticleSource(Number(form.id), payload);
        }

        await loadSources(false);
    };

    const removeSource = async (id: string) => {
        await softDeleteArticleSource(Number(id));
        await loadSources(false);
    };

    const toggleStatus = async (src: ArticleSource) => {
        const newEnabled = !src.enabled;
        await updateArticleSourceStatus(Number(src.id), newEnabled);
        await loadSources(false);
    };

    return {
        sources,
        loading,
        error,
        reload,
        saveSource,
        removeSource,
        toggleStatus,
    };
}
