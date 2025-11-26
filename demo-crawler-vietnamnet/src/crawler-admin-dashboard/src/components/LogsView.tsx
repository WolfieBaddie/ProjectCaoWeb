import React, { useState, useMemo, useEffect } from 'react';
import {
    fetchArticleSources,
    fetchCrawlerLogDetail,
} from '../api/admin/adminCrawlerLogApi';
import Card from './Card';
import Modal from './Modal';
import { useAdminLogs } from '@/src/hooks/useAdminLogs';

// --- Types ---
type BotType = 'LINK' | 'CONTENT';
type LogLevel = 'INFO' | 'WARN' | 'ERROR';
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

interface LogEntry {
    id: string;
    timestamp: string;
    sourceId: string;
    sourceName: string;
    categoryId: string;
    categoryName: string;
    botType: BotType;
    taskKind: TaskKind;
    level: LogLevel;
    message: string;
    url: string;
    metadata?: string;
}

const formatTimestamp = (raw: string) => {
    if (!raw) return '';
    return raw.replace('T', ' ').split('.')[0];
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
    const colors = {
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
    const [selectedLog, setSelectedLog] = useState<LogEntry | null>(null);

    // Overview Filters
    const [overviewBotType, setOverviewBotType] = useState<string>('All');
    const [overviewSource, setOverviewSource] = useState<string>('All');
    const [overviewSearch, setOverviewSearch] = useState<string>('');

    // Log List Filters (UI)
    const [logBotType, setLogBotType] = useState<string>('All');
    const [logTaskKind, setLogTaskKind] = useState<string>('All');
    const [logCategory, setLogCategory] = useState<string>('All');
    const [logLevel, setLogLevel] = useState<string>('All');
    const [logSearch, setLogSearch] = useState<string>('');

    // Data: sources
    const [sources, setSources] = useState<SourceOverview[]>([]);
    const [loadingSources, setLoadingSources] = useState(false);
    const [sourceError, setSourceError] = useState<string | null>(null);

    // Phân trang logs (nếu cần paging sau này)
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
        bot: logBotType,      // 'All' | 'LINK' | 'CONTENT' (hook sẽ tự bỏ 'All')
        level: logLevel,      // 'All' | 'INFO' | 'WARN' | 'ERROR'
        categoryId: undefined, // tạm thời chưa filter category dưới DB
        keyword: logSearch,   // nếu hook/BE đã support keyword
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
                const apiSources = await fetchArticleSources();
                if (cancelled) return;

                const mapped: SourceOverview[] = apiSources.map(src => ({
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
        return sources.filter(source => {
            const matchBot =
                overviewBotType === 'All' || source.botTypes.includes(overviewBotType as BotType);
            const matchSource =
                overviewSource === 'All' || source.id === overviewSource;
            const matchSearch =
                overviewSearch.trim() === '' ||
                source.name.toLowerCase().includes(overviewSearch.toLowerCase());

            return matchBot && matchSource && matchSearch;
        });
    }, [sources, overviewBotType, overviewSource, overviewSearch]);

    const handleViewLogs = (source: SourceOverview) => {
        setSelectedSource(source);
        setPage(0);          // reset về trang 0
        setViewMode('list');
    };

    const handleLogClick = async (log: LogEntry) => {
        try {
            const detail = await fetchCrawlerLogDetail(Number(log.id));
            setSelectedLog({
                ...log,
                metadata: detail.exception || log.metadata,
            });
        } catch (e) {
            console.error('[LogsView] loadLogDetail error', e);
            setSelectedLog(log);
        }
    };

    // --- Log List Logic ---
    // Lúc này logs đã được filter theo sourceId + bot + level ở backend (qua useAdminLogs)
    // UI chỉ filter thêm TaskKind / Category / Search nếu cần
    const filteredLogs = useMemo(() => {
        return logs.filter((log: LogEntry) => {
            // Nếu BE chưa filter theo sourceId (phòng hờ)
            if (selectedSource && log.sourceId && log.sourceId !== selectedSource.id) {
                return false;
            }

            const matchTask =
                logTaskKind === 'All' || log.taskKind === (logTaskKind as TaskKind);

            const matchCategory =
                logCategory === 'All' || log.categoryId === logCategory;

            const matchSearch =
                logSearch.trim() === '' ||
                log.message.toLowerCase().includes(logSearch.toLowerCase()) ||
                log.url.toLowerCase().includes(logSearch.toLowerCase());

            return matchTask && matchCategory && matchSearch;
        });
    }, [logs, selectedSource, logTaskKind, logCategory, logSearch]);

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
                        className="input-field"
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
                        onChange={e => setOverviewSource(e.target.value)}
                        className="filter-select"
                    >
                        <option value="All">All sources</option>
                        {sources.map(source => (
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
                            filteredSources.map(source => (
                                <tr key={source.id} className="table-row group">
                                    <td className="px-6 py-4 font-medium text-gray-900">{source.name}</td>
                                    <td className="px-6 py-4">
                                        <div className="flex space-x-1">
                                            {source.botTypes.map(type => (
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
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none"
                         viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round"
                              d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                </button>
                <div>
                    <h2 className="text-xl font-bold text-gray-800">{selectedSource?.name} Logs</h2>
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
                        <label className="block text-xs font-medium text-gray-500 mb-1">Bot Type</label>
                        <select
                            value={logBotType}
                            onChange={(e) => setLogBotType(e.target.value)}
                            className="input-field text-xs py-2"
                        >
                            <option value="All">All</option>
                            <option value="LINK">LINK</option>
                            <option value="CONTENT">CONTENT</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Task Kind</label>
                        <select
                            value={logTaskKind}
                            onChange={(e) => setLogTaskKind(e.target.value)}
                            className="input-field text-xs py-2"
                        >
                            <option value="All">All</option>
                            {/* nếu hiện tại mọi log đều là ARTICLE thì chỉ nên cho ARTICLE, tránh chọn CATEGORY/LISTING mà ko có data */}
                            <option value="ARTICLE">ARTICLE</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Category</label>
                        <select
                            value={logCategory}
                            onChange={(e) => setLogCategory(e.target.value)}
                            className="input-field text-xs py-2"
                        >
                            <option value="All">All</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Level</label>
                        <select
                            value={logLevel}
                            onChange={(e) => setLogLevel(e.target.value)}
                            className="input-field text-xs py-2"
                        >
                            <option value="All">All</option>
                            <option value="INFO">INFO</option>
                            <option value="WARN">WARN</option>
                            <option value="ERROR">ERROR</option>
                        </select>
                    </div>
                    <div className="col-span-2">
                        <label className="block text-xs font-medium text-gray-500 mb-1">Search</label>
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
                            filteredLogs.map(log => (
                                <tr
                                    key={log.id}
                                    onClick={() => handleLogClick(log)}
                                    className="table-row cursor-pointer"
                                >
                                    <td className="px-6 py-3 text-xs text-gray-500 font-mono whitespace-nowrap truncate">
                                        {log.timestamp.split(' ')[1]}
                                    </td>
                                    <td className="px-6 py-3">
                                        <span className="bg-gray-100 text-gray-600 text-[10px] px-2 py-0.5 rounded font-bold">
                                            {log.taskKind}
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
                                                title={log.url}
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
                    <div className="space-y-4">
                        {/* ... giữ nguyên phần detail như bạn đang có ... */}
                    </div>
                )}
            </Modal>
        </>
    );
};

export default LogsView;
