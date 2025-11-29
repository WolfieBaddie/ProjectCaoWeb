// src/components/client/PoliticNews.tsx
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Article } from '../types';
import {
    searchPublicArticles,
    ClientArticleListItem,
} from '@/src/api/client/clientArticleApi';

// Kiểu article dùng cho Politic section
type PoliticArticle = Article & {
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

// Map DTO backend -> Article dùng cho UI
function mapDtoToArticle(dto: ClientArticleListItem): PoliticArticle {
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
    } as PoliticArticle;
}

const LargePoliticCard: React.FC<{ article: PoliticArticle }> = ({ article }) => (
    <Link
        to={`/article/${article.id}`}
        className="group grid grid-cols-1 md:grid-cols-2 gap-6 items-center bg-gray-50 p-6 rounded-lg block hover:bg-gray-100 transition-colors"
    >
        <div className="overflow-hidden rounded-lg">
            <img
                src={article.imageUrl}
                alt={article.headline}
                className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-300"
            />
        </div>
        <div>
            <div className="flex items-center text-xs text-gray-500 mb-2">
                {article.sourceLogoUrl && (
                    <img
                        src={article.sourceLogoUrl}
                        alt={article.source ?? ''}
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
            <h3 className="font-bold text-2xl text-gray-800 mb-2 leading-tight group-hover:text-blue-600 transition-colors">
                {article.headline}
            </h3>
            <p className="text-sm text-gray-600 mb-3">{article.summary}</p>
            <div className="text-xs">
                <span className="font-semibold text-red-600">{article.category}</span>
                <span className="text-gray-400 mx-1.5">•</span>
                <span className="text-gray-500">{article.readTime}</span>
            </div>
        </div>
    </Link>
);

const SmallPoliticCard: React.FC<{ article: PoliticArticle }> = ({ article }) => (
    <Link to={`/article/${article.id}`} className="group block">
        <div className="overflow-hidden rounded-lg mb-4">
            <img
                src={article.imageUrl}
                alt={article.headline}
                className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
            />
        </div>
        <h3 className="font-bold text-lg text-gray-800 mb-2 leading-tight group-hover:text-blue-600 transition-colors">
            {article.headline}
        </h3>
        <div className="flex items-center text-xs text-gray-500">
            {article.source && (
                <>
                    <span className="font-medium text-gray-700">{article.source}</span>
                    <span className="mx-1.5">•</span>
                </>
            )}
            <span>{article.timestamp}</span>
        </div>
    </Link>
);

const PoliticNews: React.FC = () => {
    const [articles, setArticles] = useState<PoliticArticle[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        setError(null);

        // Lấy các bài viết có categoryId = 1
        searchPublicArticles({
            page: 0,
            size: 5, // 1 bài lớn + 4 bài nhỏ
            categoryId: 1,
        })
            .then(page => {
                if (cancelled) return;
                const mapped = page.content.map(mapDtoToArticle);
                setArticles(mapped);
            })
            .catch(err => {
                if (cancelled) return;
                console.error('Failed to load politic articles', err);
                setError('Không tải được dữ liệu tin Chính trị.');
            })
            .finally(() => {
                if (cancelled) return;
                setLoading(false);
            });

        return () => {
            cancelled = true;
        };
    }, []);

    const mainArticle = articles[0];
    const sideArticles = articles.slice(1);

    if (loading) {
        return (
            <section className="mt-12">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-3xl font-bold text-gray-900">Politics</h2>
                    <span className="text-sm text-gray-500">Đang tải dữ liệu...</span>
                </div>
            </section>
        );
    }

    if (error || !mainArticle) {
        return (
            <section className="mt-12">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-3xl font-bold text-gray-900">Chính trị</h2>
                </div>
                <p className="text-sm text-gray-500">
                    Hiện chưa có bài viết Chính trị.
                </p>
            </section>
        );
    }

    return (
        <section className="mt-12">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold text-gray-900">Chính trị</h2>
                {/* See all: điều hướng sang SearchResults với tham số categoryid=1 */}
                <Link
                    to="/search?categoryid=1"
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
                </Link>
            </div>
            <div className="space-y-8">
                <LargePoliticCard article={mainArticle} />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {sideArticles.map(article => (
                        <SmallPoliticCard key={article.id} article={article} />
                    ))}
                </div>
            </div>
        </section>
    );
};

export default PoliticNews;
