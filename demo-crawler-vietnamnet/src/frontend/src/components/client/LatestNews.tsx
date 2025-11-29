// src/components/client/LatestNews.tsx
import React, { useEffect, useState } from 'react';
import {
    fetchLatestPublicArticles,
    ClientArticleListItem,
} from '@/src/api/client/clientArticleApi';

// 👉 Type dùng riêng cho LatestNews, không phụ thuộc types.ts
interface LatestArticle {
    id: number;
    headline: string;
    summary: string;
    imageUrl: string;
    timestamp: string;
    category: string;
    readTime: string;
    source?: string | null;
    sourceLogoUrl?: string | null;
}

const ArticleCard: React.FC<{ article: LatestArticle }> = ({ article }) => (
    <a href={`#article/${article.id}`} className="group block">
        <div className="overflow-hidden rounded-lg mb-4">
            <img
                src={article.imageUrl}
                alt={article.headline}
                className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
            />
        </div>
        <div className="flex items-center text-xs text-gray-500 mb-2">
            {article.sourceLogoUrl && (
                <img
                    src={article.sourceLogoUrl}
                    alt={article.source || ''}
                    className="w-4 h-4 mr-2 object-contain"
                />
            )}
            {article.source && (
                <>
                    <span className="font-medium text-gray-700">{article.source}</span>
                    <span className="mx-1.5">•</span>
                </>
            )}
            <span>{article.timestamp}</span>
        </div>
        <h3 className="font-bold text-lg text-gray-800 mb-2 leading-tight group-hover:text-blue-600 transition-colors">
            {article.headline}
        </h3>
        <p className="text-sm text-gray-600 mb-3">
            {article.summary || 'Click để đọc chi tiết.'}
        </p>
        <div className="text-xs">
            <span className="font-semibold text-red-600">{article.category}</span>
            <span className="text-gray-400 mx-1.5">•</span>
            <span className="text-gray-500">{article.readTime}</span>
        </div>
    </a>
);

function formatTimestamp(iso?: string | null): string {
    if (!iso) return '';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleString('vi-VN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
    });
}

function estimateReadTime(text?: string | null): string {
    if (!text) return '1 min read';
    const words = text.trim().split(/\s+/).length;
    const minutes = Math.max(1, Math.round(words / 200));
    return `${minutes} min read`;
}

// Map từ DTO client -> LatestArticle (UI)
function mapDtoToArticle(dto: ClientArticleListItem): LatestArticle {
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
    };
}

const LatestNews: React.FC = () => {
    const [articles, setArticles] = useState<LatestArticle[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        setError(null);

        // ✅ Dùng đúng hàm lấy bài mới nhất từ clientArticleApi
        fetchLatestPublicArticles()
            .then(list => {
                if (cancelled) return;
                // Backend đã trả sẵn danh sách "mới nhất"
                const mapped = list.map(mapDtoToArticle);
                console.log(mapped);
                setArticles(mapped);
            })
            .catch(err => {
                console.error('LatestNews fetchLatestPublicArticles error', err);
                if (!cancelled) {
                    setError('Không tải được danh sách bài viết mới nhất.');
                }
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });

        return () => {
            cancelled = true;
        };
    }, []);

    return (
        <section>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold text-gray-900">Tin mới nhất</h2>
                <a
                    href="/search"
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

            {loading && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {Array.from({ length: 3 }).map((_, idx) => (
                        <div
                            key={idx}
                            className="bg-gray-100 rounded-lg h-64 animate-pulse"
                        />
                    ))}
                </div>
            )}

            {!loading && error && (
                <div className="bg-red-50 text-red-700 rounded-lg p-4">{error}</div>
            )}

            {!loading && !error && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {articles.map(article => (
                        <ArticleCard key={article.id} article={article} />
                    ))}
                </div>
            )}
        </section>
    );
};

export default LatestNews;
