import React, { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useClientArticleDetail } from '@/src/hooks/client/useClientArticleDetail.ts';
import {
    searchPublicArticles,
    ClientArticleListItem,
} from '@/src/api/client/clientArticleApi';

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

type RelatedArticle = {
    id: number;
    headline: string;
    imageUrl: string;
    timestamp: string;
};

const ArticleDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();

    // 1) Chi tiết bài viết
    const { data, loading, error } = useClientArticleDetail(id);

    // 2) Bài viết liên quan
    const [related, setRelated] = useState<RelatedArticle[]>([]);
    const [relatedLoading, setRelatedLoading] = useState(false);
    const [relatedError, setRelatedError] = useState<string | null>(null);

    useEffect(() => {
        window.scrollTo(0, 0);
    }, [id]);

    // HTML nội dung bài viết
    const contentHtml = useMemo(() => {
        if (!data) return '';

        if (data.content) return data.content; // backend đã trả HTML
        const summary =
            data.description ||
            'Hiện tại bài viết chưa có nội dung chi tiết. Vui lòng quay lại sau.';
        return `
      <p class="mb-4 text-lg leading-relaxed text-gray-700">
        ${summary}
      </p>
    `;
    }, [data]);

    // Fetch bài viết liên quan sau khi đã có chi tiết
    useEffect(() => {
        if (!data) return;

        console.log('[ArticleDetail] detail data =', data);

        // Cố gắng lấy categoryId từ nhiều kiểu khác nhau (debug)
        const catId =
            (data as any).categoryId ??
            (data as any).categoryID ??
            (data as any).category_id ??
            null;

        console.log('[ArticleDetail] resolved categoryId for related =', catId);

        if (!catId) {
            setRelated([]);
            setRelatedError(
                'Không tìm thấy categoryId từ chi tiết bài viết (debug). Kiểm tra ArticleDetailDto / API.',
            );
            return;
        }

        let cancelled = false;
        setRelatedLoading(true);
        setRelatedError(null);

        searchPublicArticles({
            page: 0,
            size: 5, // số bài liên quan muốn lấy
            categoryId: catId,
        })
            .then(page => {
                if (cancelled) return;
                console.log(
                    '[ArticleDetail] related raw page =',
                    page,
                );
                const mapped: RelatedArticle[] = page.content
                    .filter((dto: ClientArticleListItem) => dto.id !== data.id)
                    .map((dto: ClientArticleListItem) => ({
                        id: dto.id,
                        headline: dto.title,
                        imageUrl: dto.imageUrl || '/default-article.jpg',
                        timestamp: formatTimestamp(dto.createdAt),
                    }));
                console.log(
                    '[ArticleDetail] mapped related articles =',
                    mapped,
                );
                setRelated(mapped);
            })
            .catch(err => {
                if (cancelled) return;
                console.error(
                    'Failed to load related articles',
                    err,
                );
                setRelatedError('Không tải được các bài viết liên quan.');
            })
            .finally(() => {
                if (cancelled) return;
                setRelatedLoading(false);
            });

        return () => {
            cancelled = true;
        };
    }, [data]);

    if (!id) {
        return (
            <div className="max-w-screen-xl mx-auto px-4 py-20 text-center">
                <h2 className="text-2xl font-bold text-gray-800">
                    Invalid article id
                </h2>
                <Link
                    to="/"
                    className="text-red-600 hover:underline mt-4 inline-block"
                >
                    Return Home
                </Link>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="max-w-screen-xl mx-auto px-4 py-20 text-center">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">
                    Đang tải bài viết...
                </h2>
                <p className="text-gray-500">
                    Vui lòng chờ trong giây lát, chúng tôi đang tải
                    nội dung bài viết.
                </p>
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="max-w-screen-xl mx-auto px-4 py-20 text-center">
                <h2 className="text-2xl font-bold text-gray-800 mb-2">
                    Article not found
                </h2>
                {error && (
                    <p className="text-gray-500 mb-2">{error}</p>
                )}
                <Link
                    to="/"
                    className="text-red-600 hover:underline mt-4 inline-block"
                >
                    Return Home
                </Link>
            </div>
        );
    }

    const breadcrumbCategory = data.categoryName || 'News';
    const timestamp = formatTimestamp(data.createdAt);
    const readTime = data.readTime || '5 min read';
    const authorName = data.authorName || data.sourceName || 'Unknown';
    const avatarChar = (authorName || 'N')[0]?.toUpperCase();

    return (
        <div className="max-w-5xl mx-auto px-4 py-8">
            <nav className="text-sm text-gray-500 mb-6">
                <Link to="/" className="hover:text-red-600">
                    Home
                </Link>
                <span className="mx-2">/</span>
                <span className="text-red-600 font-semibold">
                    {breadcrumbCategory}
                </span>
            </nav>

            <h1 className="text-3xl md:text-5xl font-bold text-gray-900 mb-6 leading-tight">
                {data.title}
            </h1>

            <div className="flex items-center justify-between mb-8 border-b border-gray-200 pb-6">
                <div className="flex items-center">
                    {data.authorAvatarUrl ? (
                        <img
                            src={data.authorAvatarUrl}
                            alt={authorName}
                            className="w-12 h-12 rounded-full mr-4"
                        />
                    ) : (
                        <div className="w-12 h-12 rounded-full bg-gray-200 mr-4 flex items-center justify-center text-gray-500 font-bold">
                            {avatarChar}
                        </div>
                    )}
                    <div>
                        <div className="font-bold text-gray-900">
                            {authorName}
                        </div>
                        <div className="text-sm text-gray-500 flex items-center">
                            <span>{timestamp}</span>
                            <span className="mx-2">•</span>
                            <span>{readTime}</span>
                        </div>
                    </div>
                </div>
                <div className="flex space-x-2">
                    <button className="p-2 text-gray-500 hover:text-blue-600 transition-colors">
                        {/* Twitter */}
                        <svg
                            className="w-5 h-5"
                            fill="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z" />
                        </svg>
                    </button>
                    <button className="p-2 text-gray-500 hover:text-blue-800 transition-colors">
                        {/* LinkedIn */}
                        <svg
                            className="w-5 h-5"
                            fill="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                        </svg>
                    </button>
                </div>
            </div>

            <div className="mb-8">
                {data.imageUrl && (
                    <img
                        src={data.imageUrl}
                        alt={data.title}
                        className="w-full h-[400px] object-cover rounded-lg shadow-lg mb-2"
                    />
                )}
                {data.sourceName && (
                    <p className="text-sm text-gray-500 text-right italic">
                        Image source: {data.sourceName}
                    </p>
                )}
            </div>

            <div
                className="article-content prose max-w-none prose-lg prose-headings:mt-6 prose-headings:mb-3 prose-p:mb-4"
                dangerouslySetInnerHTML={{ __html: contentHtml }}
            />

            {/* ====== Bài viết liên quan ====== */}
            <div className="mt-12 border-t border-gray-200 pt-8">
                <h3 className="text-xl font-bold text-gray-900 mb-4">
                    Bài viết liên quan
                </h3>

                {relatedLoading && (
                    <p className="text-sm text-gray-500">
                        Đang tải các bài viết liên quan...
                    </p>
                )}

                {!relatedLoading && relatedError && (
                    <p className="text-sm text-red-500">
                        {relatedError}
                    </p>
                )}

                {!relatedLoading &&
                    !relatedError &&
                    related.length === 0 && (
                        <p className="text-sm text-gray-500">
                            Hiện chưa có bài viết liên quan.
                        </p>
                    )}

                {!relatedLoading &&
                    !relatedError &&
                    related.length > 0 && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {related.map(item => (
                                <Link
                                    key={item.id}
                                    to={`/article/${item.id}`}
                                    className="flex items-center group"
                                >
                                    <div className="w-24 h-24 mr-4 overflow-hidden rounded-md flex-shrink-0">
                                        <img
                                            src={item.imageUrl}
                                            alt={item.headline}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                        />
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-gray-800 group-hover:text-red-600 leading-tight line-clamp-2">
                                            {item.headline}
                                        </h4>
                                        <span className="text-xs text-gray-500 mt-1 block">
                                            {item.timestamp}
                                        </span>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
            </div>
        </div>
    );
};

export default ArticleDetail;
