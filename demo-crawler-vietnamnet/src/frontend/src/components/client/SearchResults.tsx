// src/components/client/SearchResults.tsx
import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
    useClientArticleSearch,
    SearchFilters,
} from '@/src/hooks/client/useClientArticle';

// Props nhận query từ thanh search
interface SearchResultsProps {
    query: string;
}

// Kiểu dữ liệu bài viết dùng cho UI client
interface SearchArticle {
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

// Dropdown category – tham khảo các section client đang có
const CATEGORY_OPTIONS = [
    { value: '', label: 'Tất cả chuyên mục' },
    { value: '1', label: 'Chính trị' },
    { value: '2', label: 'Thời sự' },
    { value: '3', label: 'Kinh doanh' },
    // nếu sau này có thêm chuyên mục thì bổ sung ở đây
];

const SearchResults: React.FC<SearchResultsProps> = ({ query }) => {
    const [searchParams] = useSearchParams();

    // Lấy categoryid từ URL nếu có (VD: /search?categoryid=1)
    const categoryFromUrl =
        searchParams.get('categoryid') ||
        searchParams.get('categoryId') ||
        '';

    const initialKeyword = query.trim();

    // draftFilters: state cho form input (người dùng gõ nhưng chưa bấm submit)
    const [draftFilters, setDraftFilters] = useState<SearchFilters>({
        keyword: initialKeyword,
        category: categoryFromUrl,
        source: '',     // vẫn cần cho SearchFilters, nhưng không render input nữa
        fromDate: '',
        toDate: '',
    });

    // Hook client: tự gọi API /client/api/articles/search
    const {
        filters,
        setFilters,
        results,
        page,
        setPage,
        size,
        totalPages,
        totalElements,
        loading,
        error,
    } = useClientArticleSearch(initialKeyword);

    // ép kiểu cho yên tâm (để dùng SearchArticle ở UI)
    const typedResults = results as SearchArticle[];

    // Khi props query đổi (user gõ search mới ở header), update filters + draftFilters
    useEffect(() => {
        const trimmed = query.trim();
        setFilters(prev => ({ ...prev, keyword: trimmed }));
        setDraftFilters(prev => ({ ...prev, keyword: trimmed }));
        setPage(0);
    }, [query, setFilters, setPage]);

    // Khi URL có categoryid (VD: từ "See all" /search?categoryid=1)
    useEffect(() => {
        if (!categoryFromUrl) return;

        setFilters(prev => ({
            ...prev,
            category: categoryFromUrl,
        }));
        setDraftFilters(prev => ({
            ...prev,
            category: categoryFromUrl,
        }));
        setPage(0);
    }, [categoryFromUrl, setFilters, setPage]);

    // Submit form filter: apply draftFilters -> filters (hook sẽ tự fetch lại)
    const handleFiltersSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setFilters(draftFilters);
        setPage(0);
    };

    const handlePrevPage = () => {
        setPage(p => Math.max(0, p - 1));
    };

    const handleNextPage = () => {
        setPage(p => (p + 1 < totalPages ? p + 1 : p));
    };

    const hasAnyFilter =
        !!filters.keyword ||
        !!filters.category ||
        !!filters.source ||   // source luôn rỗng vì mình không cho nhập nữa
        !!filters.fromDate ||
        !!filters.toDate;

    return (
        <div className="max-w-screen-xl mx-auto px-4 md:px-8 py-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Search Results
            </h1>

            <p className="text-gray-600 mb-4">
                {hasAnyFilter
                    ? 'Lọc bài viết theo nhiều tiêu chí từ hệ thống.'
                    : 'Hiển thị tất cả bài viết đã xuất bản.'}
            </p>

            {/* ====== Thanh filter ====== */}
            <form
                onSubmit={handleFiltersSubmit}
                className="bg-gray-50 rounded-xl p-4 md:p-6 mb-8 flex flex-wrap gap-4 items-end"
            >
                <div className="flex-1 min-w-[180px]">
                    <label className="block text-xs font-semibold text-gray-600 mb-1">
                        Keyword
                    </label>
                    <input
                        type="text"
                        placeholder="Tìm theo tiêu đề / mô tả..."
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                        value={draftFilters.keyword}
                        onChange={e =>
                            setDraftFilters(prev => ({
                                ...prev,
                                keyword: e.target.value,
                            }))
                        }
                    />
                </div>

                {/* Category dropdown thay cho input number */}
                <div className="w-full sm:w-52">
                    <label className="block text-xs font-semibold text-gray-600 mb-1">
                        Category
                    </label>
                    <select
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 bg-white"
                        value={draftFilters.category}
                        onChange={e =>
                            setDraftFilters(prev => ({
                                ...prev,
                                category: e.target.value,
                            }))
                        }
                    >
                        {CATEGORY_OPTIONS.map(opt => (
                            <option key={opt.value} value={opt.value}>
                                {opt.label}
                            </option>
                        ))}
                    </select>
                </div>

                {/* BỎ Source input đi cho gọn, nhưng vẫn giữ fromDate/toDate */}
                <div className="w-full sm:w-40">
                    <label className="block text-xs font-semibold text-gray-600 mb-1">
                        From date
                    </label>
                    <input
                        type="date"
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                        value={draftFilters.fromDate}
                        onChange={e =>
                            setDraftFilters(prev => ({
                                ...prev,
                                fromDate: e.target.value,
                            }))
                        }
                    />
                </div>

                <div className="w-full sm:w-40">
                    <label className="block text-xs font-semibold text-gray-600 mb-1">
                        To date
                    </label>
                    <input
                        type="date"
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                        value={draftFilters.toDate}
                        onChange={e =>
                            setDraftFilters(prev => ({
                                ...prev,
                                toDate: e.target.value,
                            }))
                        }
                    />
                </div>

                <div className="w-full sm:w-auto">
                    <button
                        type="submit"
                        className="w-full inline-flex items-center justify-center px-4 py-2.5 rounded-lg bg-red-600 text-white text-sm font-semibold hover:bg-red-700 transition-colors"
                    >
                        Tìm kiếm
                    </button>
                </div>
            </form>

            {hasAnyFilter && (
                <p className="text-gray-600 mb-4">
                    Tìm thấy {totalElements} kết quả phù hợp.
                </p>
            )}

            {loading && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {Array.from({ length: size }).map((_, idx) => (
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

            {!loading && !error && typedResults.length === 0 && (
                <div className="bg-gray-50 rounded-lg p-12 text-center">
                    <p className="text-gray-500 text-lg">
                        Không tìm thấy bài viết nào phù hợp với tiêu chí.
                    </p>
                    <Link
                        to="/"
                        className="text-red-600 font-semibold mt-4 inline-block hover:underline"
                    >
                        Quay lại trang chủ
                    </Link>
                </div>
            )}

            {!loading && !error && typedResults.length > 0 && (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {typedResults.map(article => (
                            <Link
                                key={article.id}
                                to={`/article/${article.id}`}
                                className="group block"
                            >
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
                      <span className="font-medium text-gray-700">
                        {article.source}
                      </span>
                                            <span className="mx-1.5">•</span>
                                        </>
                                    )}
                                    <span>{article.timestamp}</span>
                                </div>
                                <h3 className="font-bold text-lg text-gray-800 mb-2 leading-tight group-hover:text-blue-600 transition-colors">
                                    {article.headline}
                                </h3>
                                <p className="text-sm text-gray-600 mb-3 line-clamp-3">
                                    {article.summary || 'Click để đọc chi tiết.'}
                                </p>
                                <div className="text-xs">
                  <span className="font-semibold text-red-600">
                    {article.category}
                  </span>
                                    <span className="text-gray-400 mx-1.5">•</span>
                                    <span className="text-gray-500">{article.readTime}</span>
                                </div>
                            </Link>
                        ))}
                    </div>

                    {totalPages > 1 && (
                        <div className="flex justify-center items-center space-x-4 mt-8">
                            <button
                                onClick={handlePrevPage}
                                disabled={page === 0}
                                className="px-4 py-2 rounded-full text-sm font-medium border border-gray-300 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Trang trước
                            </button>
                            <span className="text-sm text-gray-600">
                Trang <span className="font-semibold">{page + 1}</span> /{' '}
                                {totalPages || 1}
              </span>
                            <button
                                onClick={handleNextPage}
                                disabled={page + 1 >= totalPages}
                                className="px-4 py-2 rounded-full text-sm font-medium border border-gray-300 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Trang sau
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default SearchResults;
