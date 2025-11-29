import React, { useState, useMemo, useEffect } from 'react';
import {
    fetchArticleSources,
    fetchCrawlerLogDetail,
    type ArticleSourceSummaryDto,
    type CrawlerLogDto,
    type CrawlerLogDetailDto,
    type BotType,
    type LogLevel,
} from '../../api/admin/adminCrawlerLogApi';
import Card from './Card';
import Modal from './Modal';
import { useAdminLogs } from '@/src/hooks/admin/useAdminLogs.ts';

// --- Types ---
type TaskKind = 'CATEGORY' | 'LISTING' | 'ARTICLE';
type BotStatus = 'ACTIVE' | 'INACTIVE' | 'DISABLED';

interface SourceOverview {
    id: string;
    name: string;
    botTypes: BotType[];
    status: BotStatus;
    lastRun: string;
    totalLogs: number;
}

// DTO cho log list & detail (gộp thêm field exception để hiển thị trong modal)
type LogDetail = CrawlerLogDto & { exception?: string | null };

// --- Helpers ---
const formatTimestamp = (raw: string | null | undefined) => {
    if (!raw) return '';
    return raw.replace('T', ' ').split('.')[0];
};

const formatTimeOnly = (raw?: string | null) => {
    if (!raw) return '';
    const ts = formatTimestamp(raw); // "YYYY-MM-DD HH:mm:ss"
    if (!ts) return '';
    const parts = ts.split(' ');
    return parts[1] || ts;
};

// Chuẩn hoá tiếng Việt: bỏ dấu + bỏ khoảng trắng
const normalizeVi = (value: string) => {
    if (!value) return '';
    return value
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // bỏ dấu
        .replace(/đ/g, 'd')
        .replace(/\s+/g, ''); // bỏ khoảng trắng
};

// --- Utility Components ---
const StatusBadge = ({ status }: { status: BotStatus }) => {
    const colors: Record<BotStatus, string> = {
        ACTIVE: 'bg-green-100 text-green-800',
        INACTIVE: 'bg-gray-100 text-gray-800',
        DISABLED: 'bg-red-100 text-red-800',
    };
    return <span className={`badge ${colors[status]}`}>{status}</span>;
};

const LevelBadge = ({ level }: { level: LogLevel }) => {
    const colors: Record<LogLevel, string> = {
        INFO: 'badge-info',
        WARN: 'badge-warn',
        ERROR: 'badge-error',
    };
    return <span className={`badge ${colors[level]}`}>{level}</span>;
};

// --- Main Component ---
const LogsView: React.FC = () => {
    // Tab: overview / log list
    const [viewMode, setViewMode] = useState<'overview' | 'list'>('overview');

    const [selectedSource, setSelectedSource] = useState<SourceOverview | null>(null);
    const [selectedLog, setSelectedLog] = useState<LogDetail | null>(null);

    // Overview Filters
    const [overviewBotType, setOverviewBotType] = useState<string>('All');
    const [overviewSource, setOverviewSource] = useState<string>('All');
    const [overviewSearch, setOverviewSearch] = useState<string>('');

    // Log List Filters (UI)
    const [logBotType, setLogBotType] = useState<string>('All');
    const [logTaskKind, setLogTaskKind] = useState<TaskKind | 'All'>('All');
    const [logCategory, setLogCategory] = useState<string>('All');
    const [logLevel, setLogLevel] = useState<string>('All');
    const [logSearch, setLogSearch] = useState<string>('');

    // Data: sources
    const [sources, setSources] = useState<SourceOverview[]>([]);
    const [loadingSources, setLoadingSources] = useState(false);
    const [sourceError, setSourceError] = useState<string | null>(null);

    // Phân trang logs
    const [page, setPage] = useState(0);
    const pageSize = 20;

    // Dùng hook để gọi backend lấy logs (filter chính ở backend)
    const {
        logs,
        totalPages,
        loading: loadingLogs,
        error: logsError,
    } = useAdminLogs({
        sourceId: selectedSource ? Number(selectedSource.id) : 0,
        bot: logBotType,      // hook sẽ tự xử lý 'All'
        level: logLevel,      // hook sẽ tự xử lý 'All'
        categoryId: undefined,
        keyword: logSearch,
        page,
        size: pageSize,
    });

    // Load danh sách source từ backend
    useEffect(() => {
        let cancelled = false;

        async function loadSources() {
            setLoadingSources(true);
            setSourceError(null);

            try {
                const apiSources: ArticleSourceSummaryDto[] = await fetchArticleSources();
                if (cancelled) return;

                const mapped: SourceOverview[] = apiSources.map((src) => ({
                    id: String(src.id),
                    name: src.name,
                    botTypes: ['LINK', 'CONTENT'], // hiện tại 2 bot đều chạy trên 1 source
                    status: src.status === 1 ? 'ACTIVE' : 'DISABLED',
                    lastRun: src.lastRun ? formatTimestamp(src.lastRun) : '',
                    totalLogs: src.totalLogs ?? 0,
                }));
                setSources(mapped);
            } catch (e) {
                if (cancelled) return;
                console.error('[LogsView] loadSources error', e);
                setSourceError('Không tải được danh sách nguồn crawler');
            } finally {
                if (!cancelled) {
                    setLoadingSources(false);
                }
            }
        }

        loadSources();

        return () => {
            cancelled = true;
        };
    }, []);

    // --- Overview Logic ---
    const filteredSources = useMemo(() => {
        const keyword = normalizeVi(overviewSearch);
        return sources.filter((source) => {
            const matchBot =
                overviewBotType === 'All' || source.botTypes.includes(overviewBotType as BotType);
            const matchSource =
                overviewSource === 'All' || source.id === overviewSource;
            const matchSearch =
                keyword === '' || normalizeVi(source.name).includes(keyword);

            return matchBot && matchSource && matchSearch;
        });
    }, [sources, overviewBotType, overviewSource, overviewSearch]);

    const handleViewLogs = (source: SourceOverview) => {
        setSelectedSource(source);
        setPage(0); // reset về trang 0
        setViewMode('list');
    };

    const handleLogClick = async (log: CrawlerLogDto) => {
        try {
            const detail: CrawlerLogDetailDto = await fetchCrawlerLogDetail(log.id);
            // Ưu tiên dữ liệu detail (có exception), gộp với log list để mapping chuẩn
            setSelectedLog({
                ...log,
                ...detail,
            });
        } catch (e) {
            console.error('[LogsView] loadLogDetail error', e);
            // Nếu gọi detail lỗi thì vẫn hiển thị thông tin cơ bản từ list
            setSelectedLog({
                ...log,
                exception: null,
            } as LogDetail);
        }
    };

    // --- Log List Logic ---
    const filteredLogs = useMemo(() => {
        const normalizedKeyword = normalizeVi(logSearch);

        return (logs as CrawlerLogDto[]).filter((log) => {
            // Task kind: hiện tại tất cả đều là ARTICLE
            const matchTask = logTaskKind === 'All' || logTaskKind === 'ARTICLE';

            const matchCategory =
                logCategory === 'All' ||
                (log.categoryId != null && String(log.categoryId) === logCategory);

            const message = log.message ?? '';
            const url = log.url ?? '';

            const matchSearch =
                normalizedKeyword === '' ||
                normalizeVi(message).includes(normalizedKeyword) ||
                normalizeVi(url).includes(normalizedKeyword);

            return matchTask && matchCategory && matchSearch;
        });
    }, [logs, logTaskKind, logCategory, logSearch]);

    const handleBackToOverview = () => {
        setSelectedSource(null);
        setViewMode('overview');
    };

    // --- Renders ---
    const renderOverview = () => (
        <div className="space-y-6 animate-fade-in">
            {(sourceError || logsError) && (
                <div className="text-xs text-red-500 bg-red-50 border border-red-100 rounded-md px-3 py-2">
                    {sourceError || logsError}
                </div>
            )}

            {/* Overview Filter Bar */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                <div>
                    <label className="block text-sm font-medium text-gray-600 mb-2">Bot Type</label>
                    <select
                        value={overviewBotType}
                        onChange={(e) => setOverviewBotType(e.target.value)}
                        className="filter-select input-field"
                    >
                        <option value="All">All Types</option>
                        <option value="LINK">LINK</option>
                        <option value="CONTENT">CONTENT</option>
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-600 mb-2">Source</label>
                    <select
                        value={overviewSource}
                        onChange={(e) => setOverviewSource(e.target.value)}
                        className="filter-select input-field"
                    >
                        <option value="All">All sources</option>
                        {sources.map((source) => (
                            <option key={source.id} value={source.id}>
                                {source.name}
                            </option>
                        ))}
                    </select>
                </div>
                <div className="md:col-span-1">
                    <label className="block text-sm font-medium text-gray-600 mb-2">Date Range</label>
                    <div className="flex space-x-2">
                        <input type="date" className="input-field text-xs px-2" />
                        <input type="date" className="input-field text-xs px-2" />
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-600 mb-2">Search</label>
                    <input
                        type="text"
                        placeholder="Search source..."
                        value={overviewSearch}
                        onChange={(e) => setOverviewSearch(e.target.value)}
                        className="input-field"
                    />
                </div>
            </div>

            {/* Overview Table */}
            <Card className="p-0 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-gray-600">
                        <thead className="table-header">
                        <tr>
                            <th className="px-6 py-3">Source Name</th>
                            <th className="px-6 py-3">Bot Types</th>
                            <th className="px-6 py-3">Status</th>
                            <th className="px-6 py-3">Last Run</th>
                            <th className="px-6 py-3">Total Logs</th>
                            <th className="px-6 py-3 text-right">Actions</th>
                        </tr>
                        </thead>
                        <tbody>
                        {loadingSources && (
                            <tr>
                                <td colSpan={6} className="px-6 py-8 text-center text-gray-400">
                                    Loading sources...
                                </td>
                            </tr>
                        )}

                        {!loadingSources &&
                            filteredSources.map((source) => (
                                <tr key={source.id} className="table-row group">
                                    <td className="px-6 py-4 font-medium text-gray-900">
                                        {source.name}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex space-x-1">
                                            {source.botTypes.map((type) => (
                                                <span
                                                    key={type}
                                                    className="text-[10px] uppercase font-bold bg-gray-100 text-gray-600 px-2 py-0.5 rounded"
                                                >
                                                        {type}
                                                    </span>
                                            ))}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <StatusBadge status={source.status} />
                                    </td>
                                    <td className="px-6 py-4 text-gray-500">{source.lastRun}</td>
                                    <td className="px-6 py-4 font-mono">{source.totalLogs}</td>
                                    <td className="px-6 py-4 text-right">
                                        <button
                                            onClick={() => handleViewLogs(source)}
                                            className="btn-secondary py-1.5 px-3 text-xs"
                                        >
                                            View Logs
                                        </button>
                                    </td>
                                </tr>
                            ))}

                        {!loadingSources && filteredSources.length === 0 && (
                            <tr>
                                <td colSpan={6} className="px-6 py-8 text-center text-gray-400">
                                    No sources found matching filters.
                                </td>
                            </tr>
                        )}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );

    const renderLogList = () => (
        <div className="space-y-6 animate-fade-in">
            <div className="flex items-center space-x-4 mb-2">
                <button
                    onClick={handleBackToOverview}
                    className="p-2 rounded-full hover:bg-gray-100 text-gray-500 transition-colors"
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M10 19l-7-7m0 0l7-7m-7 7h18"
                        />
                    </svg>
                </button>
                <div>
                    <h2 className="text-xl font-bold text-gray-800">
                        {selectedSource?.name} Logs
                    </h2>
                    <p className="text-sm text-gray-500">
                        Viewing detailed logs for {selectedSource?.name}
                    </p>
                </div>
            </div>

            {logsError && (
                <div className="text-xs text-red-500 bg-red-50 border border-red-100 rounded-md px-3 py-2">
                    {logsError}
                </div>
            )}

            {/* Log List Filter Bar */}
            <div className="bg-white p-4 rounded-xl border border-gray-200/80 shadow-sm">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">
                            Bot Type
                        </label>
                        <select
                            value={logBotType}
                            onChange={(e) => setLogBotType(e.target.value)}
                            className="filter-select input-field text-xs py-2"
                        >
                            <option value="All">All</option>
                            <option value="LINK">LINK</option>
                            <option value="CONTENT">CONTENT</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">
                            Task Kind
                        </label>
                        <select
                            value={logTaskKind}
                            onChange={(e) =>
                                setLogTaskKind(e.target.value as TaskKind | 'All')
                            }
                            className="filter-select input-field text-xs py-2"
                        >
                            <option value="All">All</option>
                            <option value="ARTICLE">ARTICLE</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">
                            Category
                        </label>
                        <select
                            value={logCategory}
                            onChange={(e) => setLogCategory(e.target.value)}
                            className="filter-select input-field text-xs py-2"
                        >
                            <option value="All">All</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">
                            Level
                        </label>
                        <select
                            value={logLevel}
                            onChange={(e) => setLogLevel(e.target.value)}
                            className="filter-select input-field text-xs py-2"
                        >
                            <option value="All">All</option>
                            <option value="INFO">INFO</option>
                            <option value="WARN">WARN</option>
                            <option value="ERROR">ERROR</option>
                        </select>
                    </div>
                    <div className="col-span-2">
                        <label className="block text-xs font-medium text-gray-500 mb-1">
                            Search
                        </label>
                        <input
                            type="text"
                            placeholder="Message or URL..."
                            value={logSearch}
                            onChange={(e) => setLogSearch(e.target.value)}
                            className="input-field text-xs py-2"
                        />
                    </div>
                </div>
            </div>

            {/* Log Table */}
            <Card className="p-0 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-gray-600 table-fixed">
                        <thead className="table-header">
                        <tr>
                            <th className="w-32 px-6 py-3">Time</th>
                            <th className="w-24 px-6 py-3">Kind</th>
                            <th className="w-24 px-6 py-3">Bot</th>
                            <th className="w-24 px-6 py-3">Level</th>
                            <th className="w-auto px-6 py-3">Message / URL</th>
                        </tr>
                        </thead>
                        <tbody>
                        {loadingLogs && (
                            <tr>
                                <td colSpan={5} className="px-6 py-12 text-center text-gray-400">
                                    Loading logs...
                                </td>
                            </tr>
                        )}

                        {!loadingLogs &&
                            filteredLogs.map((log) => (
                                <tr
                                    key={log.id}
                                    onClick={() => handleLogClick(log)}
                                    className="table-row cursor-pointer"
                                >
                                    <td className="px-6 py-3 text-xs text-gray-500 font-mono whitespace-nowrap truncate">
                                        {formatTimeOnly(log.createdAt)}
                                    </td>
                                    <td className="px-6 py-3">
                                            <span className="bg-gray-100 text-gray-600 text-[10px] px-2 py-0.5 rounded font-bold">
                                                ARTICLE
                                            </span>
                                    </td>
                                    <td className="px-6 py-3">
                                            <span className="text-xs font-medium text-gray-700">
                                                {log.botType}
                                            </span>
                                    </td>
                                    <td className="px-6 py-3">
                                        <LevelBadge level={log.level} />
                                    </td>
                                    <td className="px-6 py-3">
                                        <div className="flex flex-col">
                                                <span
                                                    className="font-medium text-gray-800 truncate"
                                                    title={log.message}
                                                >
                                                    {log.message}
                                                </span>
                                            <span
                                                className="text-xs text-blue-500 truncate hover:underline"
                                                title={log.url || undefined}
                                            >
                                                    {log.url}
                                                </span>
                                        </div>
                                    </td>
                                </tr>
                            ))}

                        {!loadingLogs && filteredLogs.length === 0 && (
                            <tr>
                                <td colSpan={5} className="px-6 py-12 text-center text-gray-400">
                                    No logs found. Try changing the filters.
                                </td>
                            </tr>
                        )}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );

    return (
        <>
            {viewMode === 'overview' ? renderOverview() : renderLogList()}

            {/* Log Detail Modal */}
            <Modal
                isOpen={!!selectedLog}
                onClose={() => setSelectedLog(null)}
                title="Log Details"
            >
                {selectedLog && (
                    <div className="space-y-4 text-sm">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                                <div className="text-xs font-medium text-gray-500">Time</div>
                                <div className="font-mono text-gray-800">
                                    {formatTimestamp(selectedLog.createdAt)}
                                </div>
                            </div>
                            <div>
                                <div className="text-xs font-medium text-gray-500">Level</div>
                                <div className="mt-1">
                                    <LevelBadge level={selectedLog.level as LogLevel} />
                                </div>
                            </div>
                            <div>
                                <div className="text-xs font-medium text-gray-500">
                                    Bot Type
                                </div>
                                <div className="mt-1 text-gray-800">
                                    {selectedLog.botType}
                                </div>
                            </div>
                            <div>
                                <div className="text-xs font-medium text-gray-500">
                                    Source ID
                                </div>
                                <div className="mt-1 text-gray-800">
                                    {selectedLog.categoryName ??
                                        (selectedLog.categoryId != null ? `#${selectedLog.categoryId}` : '-')}
                                </div>
                            </div>
                            <div>
                                <div className="text-xs font-medium text-gray-500">
                                    Article ID
                                </div>
                                <div className="mt-1 text-gray-800">
                                    {selectedLog.articleId ?? '-'}
                                </div>
                            </div>
                        </div>

                        <div>
                            <div className="text-xs font-medium text-gray-500 mb-1">
                                URL
                            </div>
                            {selectedLog.url ? (
                                <a
                                    href={selectedLog.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs text-blue-600 hover:underline break-all"
                                >
                                    {selectedLog.url}
                                </a>
                            ) : (
                                <div className="text-xs text-gray-400">N/A</div>
                            )}
                        </div>

                        <div>
                            <div className="text-xs font-medium text-gray-500 mb-1">
                                Message
                            </div>
                            <div className="text-gray-800 whitespace-pre-wrap">
                                {selectedLog.message}
                            </div>
                        </div>

                        {selectedLog.exception && (
                            <div>
                                <div className="text-xs font-medium text-gray-500 mb-1">
                                    Exception
                                </div>
                                <pre className="text-xs bg-gray-50 border border-gray-200 rounded-md p-3 max-h-64 overflow-auto whitespace-pre-wrap">
                                    {selectedLog.exception}
                                </pre>
                            </div>
                        )}
                    </div>
                )}
            </Modal>
        </>
    );
};

export default LogsView;
