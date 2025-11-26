import React, {useEffect, useMemo, useRef, useState} from 'react';
import SchedulerCard from './SchedulerCard.tsx';
import {ActiveCommand} from '../../App.tsx';
import {useAdminArticles} from '../hooks/useAdminArticle.ts';
import type {ArticleListItem, ArticleDetail} from '../api/admin/adminArticleApi.ts';
import {useArticleCategories} from '../hooks/useArticleCategories';
import ArticleEditDrawer from '../components/admin/ArticleEditDrawer.tsx';
import {Link} from "react-router-dom"; // chỉnh path cho đúng


interface StatCardProps {
    title: string;
    value: string;
    bgColor: string;
}

const StatCard: React.FC<StatCardProps> = ({title, value, bgColor}) => (
    <div className={`card border-none shadow-none relative overflow-hidden ${bgColor}`}>
        <p className="text-sm font-medium text-gray-600 truncate">{title}</p>
        <p className="mt-1 text-3xl font-bold text-gray-900">{value}</p>
    </div>
);

interface DashboardProps {
    activeCommand?: ActiveCommand | null;
    onEditArticle?: (id: number) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ activeCommand, onEditArticle }) => {
    const schedulerRef = useRef<HTMLDivElement>(null);


    // filter local: category + crawl time
    const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
    const [fromDate, setFromDate] = useState<string>('');
    const [toDate, setToDate] = useState<string>('');

    // filter theo trạng thái bài viết
    const [selectedStatus, setSelectedStatus] = useState<string>('ALL');

    const statusOptions = ['ALL', 'DRAFT', 'PUBLISHED', 'FAILED', 'DELETED'];

    // danh sách id bài viết được chọn
    const [selectedIds, setSelectedIds] = useState<number[]>([]);

    // trạng thái muốn apply cho các bài được chọn (UI-only)
    const [bulkStatus, setBulkStatus] = useState<string>('');

    const {categories, loading: loadingCategories} = useArticleCategories();

    const resolvedCategoryId = useMemo(() => {
        if (selectedCategory === 'ALL') return undefined;
        const cat = categories.find((c) => c.name === selectedCategory);
        return cat ? cat.id : undefined;
    }, [selectedCategory, categories]);

    const {
        articles,
        totalElements,
        totalPages,
        page,
        pageSize,
        loading,
        error,
        searchTerm,
        setSearchTerm,
        setPageSize,
        goPrevPage,
        goNextPage,
    } = useAdminArticles({
        page: 0, size: 0,
        initialPageSize: 10,
        categoryId: resolvedCategoryId,
        status: selectedStatus !== 'ALL' ? selectedStatus : undefined,
        fromDate: fromDate || undefined,
        toDate: toDate || undefined
    });


    useEffect(() => {
        if (!articles) return;

        // Log full list bài viết để xem categoryName từng bài
        console.log(
            '[DEBUG] Articles from API:',
            (articles as ArticleListItem[]).map((a) => ({
                id: a.id,
                title: a.title,
                categoryName: a.categoryName,
                date: a.createdAt
            }))
        );
    }, [articles]);


    // scroll đến scheduler nếu được trigger từ command
    useEffect(() => {
        if (
            activeCommand &&
            activeCommand.view === 'dashboard' &&
            activeCommand.action === 'scheduler'
        ) {
            schedulerRef.current?.scrollIntoView({
                behavior: 'smooth',
                block: 'center',
            });
        }
    }, [activeCommand]);

    // danh mục lấy từ data hiện tại
    const categoryOptions = useMemo(() => {
        // 'ALL' + tất cả category name từ API
        const names = categories.map((c) => c.name);
        return ['ALL', ...names];
    }, [categories]);

    // áp filter local lên articles của page hiện tại
    const filteredArticles: ArticleListItem[] = useMemo(() => {
        return (articles as ArticleListItem[]).filter((a) => {
            // 1) Filter theo STATUS
            if (selectedStatus !== 'ALL') {
                if (!a.status || a.status !== selectedStatus) {
                    return false;
                }
            }

            // 2) Filter theo CATEGORY
            if (selectedCategory !== 'ALL') {
                if (!a.categoryName || a.categoryName !== selectedCategory) {
                    return false;
                }
            }

            // 3) Filter theo CREATED_AT (ngày tạo / ngày crawl)
            if (fromDate || toDate) {
                // nếu đã chọn khoảng ngày mà bài không có createdAt -> loại luôn
                if (!a.createdAt) return false;

                const createdDate = String(a.createdAt).substring(0, 10); // "YYYY-MM-DD"

                if (fromDate && createdDate < fromDate) return false;
                if (toDate && createdDate > toDate) return false;
            }

            return true;
        });
    }, [articles, selectedStatus, selectedCategory, fromDate, toDate]);



    // thống kê
    const runningBots = 2;
    const newsFound = totalElements;
    const pagesCrawled = totalElements;
    const avgRunTime = '2.5 min';
    const currentPageDisplay = totalPages > 0 ? page + 1 : 0;

    const handleToggleSelect = (id: number) => {
        setSelectedIds((prev) =>
            prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
        );
    };

    const allVisibleIds = useMemo(
        () => (articles ?? []).map((a) => a.id),
        [articles]
    );

    const allSelectedOnPage =
        allVisibleIds.length > 0 &&
        allVisibleIds.every((id) => selectedIds.includes(id));

    const handleToggleSelectAll = () => {
        setSelectedIds((prev) =>
            allSelectedOnPage ? [] : [...allVisibleIds]
        );
    };

// UI-only: hiện tại chỉ log ra console, chưa gọi API
    const handleApplyBulkStatus = () => {
        if (!bulkStatus || selectedIds.length === 0) return;

        console.log('Bulk change status (UI-only)', {
            ids: selectedIds,
            newStatus: bulkStatus,
        });

        // TODO: sau này gọi API đổi status, rồi refetch()
    };


// Sau khi update thành công
    const handleEditSuccess = (updated: ArticleDetail) => {
        // Cách 1: nếu bạn có hook useAdminArticles với refetch()
        // refetch();

        // Cách 2: update local mảng articles nếu đang giữ trong state
        // setArticles(prev => prev.map(a => a.id === updated.id ? { ...a, ...updated } : a));

        // Cách đơn giản nhất hiện giờ:
        window.location.reload();
    };


    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(e.target.value);
    };

    const handlePageSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newSize = Number(e.target.value) || 6;
        setPageSize(newSize);
    };

    // grid đều card, không bento
    const gridClass =
        'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4 sm:gap-5';

    return (
        <div className="space-y-8 min-w-0 overflow-x-hidden">
            {/* Statistics Section */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard
                    title="Running Bots"
                    value={String(runningBots)}
                    bgColor="bg-gray-200/50"
                />
                <StatCard
                    title="Pages Crawled (approx.)"
                    value={pagesCrawled.toLocaleString('en-US')}
                    bgColor="bg-yellow-100/60"
                />
                <StatCard
                    title="News Found"
                    value={newsFound.toLocaleString('en-US')}
                    bgColor="bg-rose-100/60"
                />
                <StatCard
                    title="Avg. Run Time"
                    value={avgRunTime}
                    bgColor="bg-cyan-100/60"
                />
            </div>

            {/* Scheduler */}
            <div ref={schedulerRef}>
                <SchedulerCard/>
            </div>

            {/* Latest Fetched News */}
            <div className="space-y-6 overflow-x-hidden">
                {/* Header + Filters */}
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <h2 className="text-xl font-bold text-gray-800">
                        Latest Fetched News
                    </h2>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                        {/* Keyword search */}
                        <div className="relative">
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={handleSearchChange}
                                placeholder="Search by title or description..."
                                className="input-field pl-4 pr-10 py-2 w-full sm:w-64"
                            />
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-5 w-5 text-gray-400"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                                    />
                                </svg>
                            </div>
                        </div>

                        {/* Status filter */}
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-500 whitespace-nowrap">
                                Status
                            </span>
                            <select
                                value={selectedStatus}
                                onChange={(e) => setSelectedStatus(e.target.value)}
                                className="input-field py-2 px-3 text-xs sm:text-sm w-32 sm:w-40"
                            >
                                {statusOptions.map((st) => (
                                    <option key={st} value={st}>
                                        {st === 'ALL' ? 'All statuses' : st}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Date range filter theo created_at */}
                        <div className="flex items-center gap-2">
        <span className="text-xs text-gray-500 whitespace-nowrap">
            Ngày tạo
        </span>
                            <input
                                type="date"
                                value={fromDate}
                                onChange={(e) => setFromDate(e.target.value)}
                                className="input-field py-2 px-3 text-xs sm:text-sm w-32"
                            />
                            <span className="text-xs text-gray-500">đến</span>
                            <input
                                type="date"
                                value={toDate}
                                onChange={(e) => setToDate(e.target.value)}
                                className="input-field py-2 px-3 text-xs sm:text-sm w-32"
                            />
                        </div>

                        {/* Category filter */}
                        <div className="flex items-center gap-2">
  <span className="text-xs text-gray-500 whitespace-nowrap">
    Category
  </span>
                            <select
                                value={selectedCategory}
                                onChange={(e) => setSelectedCategory(e.target.value)}
                                className="input-field py-2 px-3 text-xs sm:text-sm w-32 sm:w-40"
                            >
                                {categoryOptions.map((opt) => (
                                    <option key={opt} value={opt}>
                                        {opt === 'ALL' ? 'All categories' : opt}
                                    </option>
                                ))}
                            </select>
                        </div>


                        {/* LIMIT */}
                        <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 whitespace-nowrap">
                Limit
              </span>
                            <select
                                value={pageSize}
                                onChange={handlePageSizeChange}
                                className="input-field py-2 px-3 text-xs sm:text-sm w-20"
                            >
                                <option value={10}>10</option>
                                <option value={20}>20</option>
                                <option value={30}>30</option>
                                <option value={40}>40</option>
                                <option value={50}>50</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* CONTENT */}
                {loading ? (
                    <div className="text-center py-10 text-gray-500 text-sm">
                        Loading latest news…
                    </div>
                ) : error ? (
                    <div className="text-center py-10 text-red-500 text-sm">
                        Failed to load news: {error}
                    </div>
                ) : filteredArticles.length === 0 ? (
                    <div className="text-center py-12">
                        <h3 className="text-xl font-semibold text-gray-500">
                            No News Found
                        </h3>
                        <p className="mt-2 text-gray-400">
                            Try adjusting your search, category or time range.
                        </p>
                    </div>
                ) : (
                    <>
                        {/* Bulk selection bar */}
                        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    className="h-4 w-4"
                                    checked={allSelectedOnPage}
                                    onChange={handleToggleSelectAll}
                                />
                                <span className="text-xs text-gray-600">
            Đã chọn {selectedIds.length} bài
        </span>
                            </div>

                            <div className="flex items-center gap-2">
                                <select
                                    value={bulkStatus}
                                    onChange={(e) => setBulkStatus(e.target.value)}
                                    className="input-field py-1.5 px-3 text-xs sm:text-sm w-36"
                                >
                                    <option value="">Đổi trạng thái…</option>
                                    <option value="DRAFT">DRAFT</option>
                                    <option value="PUBLISHED">PUBLISHED</option>
                                    <option value="FAILED">FAILED</option>
                                    <option value="DELETED">DELETED</option>
                                </select>
                                <button
                                    onClick={handleApplyBulkStatus}
                                    disabled={!bulkStatus || selectedIds.length === 0}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition
            ${
                                        !bulkStatus || selectedIds.length === 0
                                            ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                            : 'bg-sky-600 text-white hover:bg-sky-700'
                                    }`}
                                >
                                    Áp dụng (UI-only)
                                </button>
                            </div>
                        </div>
                        {/* Cards grid – các card đồng đều kích thước */}
                        <div className={gridClass}>
                            {filteredArticles.map((article) => {
                                const createdAtLabel = article.createdAt
                                    ? new Date(article.createdAt).toLocaleString('vi-VN', {
                                        dateStyle: 'short',
                                        timeStyle: 'short',
                                    })
                                    : 'N/A';

                                const isSelected = selectedIds.includes(article.id);

                                return (
                                    <article
                                        key={article.id}
                                        className={`flex flex-col rounded-2xl border bg-white/80 shadow-sm hover:shadow-md transition-shadow overflow-hidden 
                    ${
                                            isSelected
                                                ? 'border-sky-300 ring-2 ring-sky-300'
                                                : 'border-gray-100'
                                        }`}
                                    >
                                        {/* Image */}
                                        {article.imageUrl ? (
                                            <div className="relative w-full pb-[56%] bg-gray-100 overflow-hidden">
                                                <img
                                                    src={article.imageUrl}
                                                    alt={article.title}
                                                    className="absolute inset-0 h-full w-full object-cover"
                                                    loading="lazy"
                                                />
                                            </div>
                                        ) : (
                                            <div
                                                className="relative w-full pb-[40%] bg-gradient-to-br from-slate-100 to-slate-200"/>
                                        )}

                                        {/* Content */}
                                        <div className="flex flex-1 flex-col p-4 gap-2">
                                            <div className="flex items-start justify-between gap-2">
                                                {/* checkbox + text */}
                                                <div className="flex items-start gap-2">
                                                    <input
                                                        type="checkbox"
                                                        className="mt-1 h-4 w-4 accent-sky-600"
                                                        checked={isSelected}
                                                        onChange={() => handleToggleSelect(article.id)}
                                                    />
                                                    <div className="space-y-1">
                                                        {article.categoryName && (
                                                            <span
                                                                className="inline-flex items-center rounded-full bg-sky-50 px-2 py-0.5 text-[10px] font-medium text-sky-700">
                                        {article.categoryName}
                                    </span>
                                                        )}
                                                        <h3 className="text-sm font-semibold text-gray-900 line-clamp-2">
                                                            {article.title}
                                                        </h3>
                                                    </div>
                                                </div>

                                                {article.status && (
                                                    <span
                                                        className="ml-1 inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                                {article.status}
                            </span>
                                                )}
                                            </div>

                                            {article.description && (
                                                <p className="text-xs text-gray-600 line-clamp-3">
                                                    {article.description}
                                                </p>
                                            )}

                                            {createdAtLabel && (
                                                <p className="mt-1 text-[10px] text-gray-400">
                                                    Created at:{' '}
                                                    <span className="font-medium">
                                {String(createdAtLabel)}
                            </span>
                                                </p>
                                            )}

                                            <div
                                                className="mt-auto pt-2 flex items-center justify-between text-[11px] text-gray-500 gap-2">
                                                <a
                                                    href={article.url}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="inline-flex items-center gap-1 font-medium text-sky-600 hover:text-sky-700"
                                                >
                                                    View article
                                                    <svg
                                                        xmlns="http://www.w3.org/2000/svg"
                                                        className="h-3.5 w-3.5"
                                                        fill="none"
                                                        viewBox="0 0 24 24"
                                                        stroke="currentColor"
                                                    >
                                                        <path
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            strokeWidth={2}
                                                            d="M13 7h4m0 0v4m0-4L10 14"
                                                        />
                                                    </svg>
                                                </a>
                                                <span className="truncate max-w-[55%]">
                            {article.url}
                        </span>

                                                <Link
                                                    to={`/admin/news/edit/${article.id}`}
                                                    className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-700 hover:bg-slate-200"
                                                >
                                                    Edit
                                                </Link>
                                            </div>
                                        </div>
                                    </article>
                                );
                            })}
                        </div>


                        {/* PAGINATION */}
                        <div
                            className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 pt-4 border-t border-gray-100">
                            <div className="text-xs text-gray-500">
                                Showing{' '}
                                <span className="font-semibold">
                  {filteredArticles.length}
                </span>{' '}
                                of{' '}
                                <span className="font-semibold">
                  {totalElements.toLocaleString('en-US')}
                </span>{' '}
                                crawled articles.
                            </div>
                            <div className="flex items-center justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={goPrevPage}
                                    disabled={page === 0}
                                    className={`px-3 py-1 rounded-lg text-xs font-medium border ${
                                        page === 0
                                            ? 'border-gray-200 text-gray-400 cursor-not-allowed'
                                            : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                                    }`}
                                >
                                    Prev
                                </button>
                                <span className="text-xs text-gray-600">
                  Page{' '}
                                    <span className="font-semibold">
                    {currentPageDisplay}
                  </span>{' '}
                                    /{' '}
                                    <span className="font-semibold">
                    {totalPages || 1}
                  </span>
                </span>
                                <button
                                    type="button"
                                    onClick={goNextPage}
                                    disabled={totalPages === 0 || page + 1 >= totalPages}
                                    className={`px-3 py-1 rounded-lg text-xs font-medium border ${
                                        totalPages === 0 || page + 1 >= totalPages
                                            ? 'border-gray-200 text-gray-400 cursor-not-allowed'
                                            : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                                    }`}
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>


    );
};

export default Dashboard;
