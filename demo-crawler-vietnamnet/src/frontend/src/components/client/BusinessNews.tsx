import React, { useEffect, useState } from 'react';
import {
    searchPublicArticles,
    ClientArticleListItem,
} from '@/src/api/client/clientArticleApi';

// Kiểu article dùng cho Business (map từ DTO bên backend sang Article dùng cho UI)
type BusinessArticle = Article & {
    source?: string | null;
    sourceLogoUrl?: string | null;
};

// Format thời gian giống bên clientArticleApi
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

// Map từ DTO backend sang Article dùng cho component
function mapDtoToArticle(dto: ClientArticleListItem): BusinessArticle {
    return {
        // các field tối thiểu BusinessNews đang dùng
        id: dto.id,
        headline: dto.title,
        summary: dto.description,
        imageUrl: dto.imageUrl || '/default-article.jpg',
        timestamp: formatTimestamp(dto.createdAt),
        category: dto.categoryName,
        readTime: estimateReadTime(dto.description),
        source: dto.sourceName ?? null,
        sourceLogoUrl: dto.sourceLogoUrl ?? undefined,
    } as BusinessArticle;
}

const MainBusinessArticle: React.FC<{ article: BusinessArticle }> = ({ article }) => (
    <a href={`#article/${article.id}`} className="group block h-full">
        <div className="overflow-hidden rounded-lg mb-4">
            <img
                src={article.imageUrl}
                alt={article.headline}
                className="w-full h-80 object-cover group-hover:scale-105 transition-transform duration-300"
            />
        </div>
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
    </a>
);

const SideBusinessArticle: React.FC<{ article: BusinessArticle }> = ({ article }) => (
    <a
        href={`#article/${article.id}`}
        className="group py-4 border-b border-gray-200 last:border-b-0 block"
    >
        <div className="flex items-center text-xs text-gray-500 mb-1">
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
        <h3 className="font-semibold text-md text-gray-800 leading-tight group-hover:text-blue-600 transition-colors">
            {article.headline}
        </h3>
    </a>
);

const BusinessNews: React.FC = () => {
    const [articles, setArticles] = useState<BusinessArticle[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        setError(null);

        // Gọi API client, lọc category_id = 3
        searchPublicArticles({
            page: 0,
            size: 7,
            categoryId: 3,
        })
            .then((page) => {
                if (cancelled) return;
                const mapped = page.content.map(mapDtoToArticle);
                setArticles(mapped);
            })
            .catch((err) => {
                if (cancelled) return;
                console.error('Failed to load business articles', err);
                setError('Không tải được dữ liệu Business.');
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
                    <h2 className="text-3xl font-bold text-gray-900">Kinh doanh</h2>
                </div>
                <p className="text-sm text-gray-500">Đang tải tin Kinh doanh...</p>
            </section>
        );
    }

    if (error || !mainArticle) {
        return (
            <section className="mt-12">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-3xl font-bold text-gray-900">Kinh doanh</h2>
                </div>
                <p className="text-sm text-gray-500">
                    Hiện chưa có bài viết Kinh doanh.
                </p>
            </section>
        );
    }

    return (
        <section className="mt-12">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold text-gray-900">Kinh doanh</h2>
                <a
                    href="#"
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
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                    <MainBusinessArticle article={mainArticle} />
                </div>
                <div className="lg:col-span-1">
                    <div className="bg-gray-50 p-6 rounded-lg h-full">
                        {sideArticles.map((article) => (
                            <SideBusinessArticle key={article.id} article={article} />
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
};

export default BusinessNews;
