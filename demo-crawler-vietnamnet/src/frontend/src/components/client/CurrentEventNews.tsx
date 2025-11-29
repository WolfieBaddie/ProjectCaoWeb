import React, { useEffect, useState } from 'react';
import { Article } from '../types';
import {
    searchPublicArticles,
    ClientArticleListItem,
} from '@/src/api/client/clientArticleApi';

type CurrentArticle = Article & {
    source?: string | null;
    sourceLogoUrl?: string | null;
};

function formatTimestamp(iso: string | null | undefined): string {
    if (!iso) return '';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso ?? '';
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

function mapDtoToArticle(dto: ClientArticleListItem): CurrentArticle {
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
    } as CurrentArticle;
}

const CurrentEventArticleCard: React.FC<{ article: CurrentArticle }> = ({ article }) => (
    <a
        href={`/article/${article.id}`}
        className="group relative rounded-lg overflow-hidden block"
    >
        <img
            src={article.imageUrl}
            alt={article.headline}
            className="w-full h-96 object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
        <div className="absolute bottom-0 left-0 p-6 text-white w-full">
            <div className="flex items-center text-xs mb-2 opacity-80">
                {article.sourceLogoUrl && (
                    <img
                        src={article.sourceLogoUrl}
                        alt={article.source ?? ''}
                        className="w-4 h-4 mr-2 object-contain filter invert"
                    />
                )}
                {article.source && (
                    <>
                        <span className="font-medium">{article.source}</span>
                        <span className="mx-1.5">•</span>
                    </>
                )}
                <span>{article.timestamp}</span>
            </div>
            <h3 className="font-bold text-xl leading-tight group-hover:underline">
                {article.headline}
            </h3>
            <div className="text-xs mt-2 opacity-80">
                <span className="font-semibold uppercase">{article.category}</span>
                <span className="mx-1.5">•</span>
                <span>{article.readTime}</span>
            </div>
        </div>
    </a>
);

const CurrentEventNews: React.FC = () => {
    const [articles, setArticles] = useState<CurrentArticle[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        setError(null);

        // Lấy bài viết với categoryId = 2
        searchPublicArticles({
            page: 0,
            size: 8, // đang hiển thị lưới 4 cột, lấy 8 bài
            categoryId: 2,
        })
            .then((page) => {
                if (cancelled) return;
                const mapped = page.content.map(mapDtoToArticle);
                setArticles(mapped);
            })
            .catch((err) => {
                if (cancelled) return;
                console.error('Failed to load current event articles', err);
                setError('Không tải được dữ liệu.');
            })
            .finally(() => {
                if (cancelled) return;
                setLoading(false);
            });

        return () => {
            cancelled = true;
        };
    }, []);

    if (loading) {
        return (
            <section className="mt-12">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-3xl font-bold text-gray-900">Thời sự</h2>
                    <span className="text-sm text-gray-500">Đang tải dữ liệu...</span>
                </div>
            </section>
        );
    }

    if (error || articles.length === 0) {
        return (
            <section className="mt-12">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-3xl font-bold text-gray-900">Thời sự</h2>
                </div>
                <p className="text-sm text-gray-500">
                    Hiện chưa có bài viết cho Thời sự.
                </p>
            </section>
        );
    }

    return (
        <section className="mt-12">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold text-gray-900">Thời sự</h2>
                <a
                    href="/search?categoryid=3"
                    className="text-sm font-semibold text-red-600 hover:text-red-700 flex items-center"
                >
                    See all
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4 ml-1"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 5l7 7-7 7"
                        />
                    </svg>
                </a>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {articles.map((article) => (
                    <CurrentEventArticleCard key={article.id} article={article} />
                ))}
            </div>
        </section>
    );
};

export default CurrentEventNews;
