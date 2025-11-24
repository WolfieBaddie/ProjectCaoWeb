import React, { useState, useMemo } from 'react';
import Card from './Card.tsx';
import Modal from './Modal.tsx';

// --- Types ---
type BotType = 'LINK' | 'CONTENT';
type LogLevel = 'INFO' | 'WARN' | 'ERROR';
type TaskKind = 'CATEGORY' | 'LISTING' | 'ARTICLE';
type BotStatus = 'Running' | 'Idle' | 'Disabled';

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

// --- Mock Data ---
const mockSources: SourceOverview[] = [
    { id: 'src_1', name: 'TechCrunch', botTypes: ['LINK', 'CONTENT'], status: 'Running', lastRun: '10:32 23/11', totalLogs: 142 },
    { id: 'src_2', name: 'Reuters', botTypes: ['LINK'], status: 'Idle', lastRun: '09:15 23/11', totalLogs: 56 },
    { id: 'src_3', name: 'Wired', botTypes: ['CONTENT'], status: 'Disabled', lastRun: 'Yesterday', totalLogs: 12 },
    { id: 'src_4', name: 'Bloomberg', botTypes: ['LINK', 'CONTENT'], status: 'Idle', lastRun: '08:00 23/11', totalLogs: 89 },
];

const mockLogs: LogEntry[] = [
    { id: 'log_1', timestamp: '2024-11-23 10:32:05', sourceId: 'src_1', sourceName: 'TechCrunch', categoryId: 'cat_1', categoryName: 'Tech', botType: 'LINK', taskKind: 'LISTING', level: 'INFO', message: 'Fetched listing page successfully', url: 'https://techcrunch.com/startups/' },
    { id: 'log_2', timestamp: '2024-11-23 10:32:10', sourceId: 'src_1', sourceName: 'TechCrunch', categoryId: 'cat_1', categoryName: 'Tech', botType: 'LINK', taskKind: 'ARTICLE', level: 'INFO', message: 'Found 15 new articles', url: 'https://techcrunch.com/startups/' },
    { id: 'log_3', timestamp: '2024-11-23 10:33:01', sourceId: 'src_1', sourceName: 'TechCrunch', categoryId: 'cat_1', categoryName: 'Tech', botType: 'CONTENT', taskKind: 'ARTICLE', level: 'WARN', message: 'Timeout waiting for selector .article-content', url: 'https://techcrunch.com/2024/11/23/ai-news' },
    { id: 'log_4', timestamp: '2024-11-23 10:33:05', sourceId: 'src_1', sourceName: 'TechCrunch', categoryId: 'cat_1', categoryName: 'Tech', botType: 'CONTENT', taskKind: 'ARTICLE', level: 'ERROR', message: 'Failed to parse article date', url: 'https://techcrunch.com/2024/11/23/ai-news', metadata: 'Error: Invalid Date format...' },
    { id: 'log_5', timestamp: '2024-11-23 09:15:00', sourceId: 'src_2', sourceName: 'Reuters', categoryId: 'cat_2', categoryName: 'Business', botType: 'LINK', taskKind: 'CATEGORY', level: 'INFO', message: 'Started category scan', url: 'https://reuters.com/business' },
    { id: 'log_6', timestamp: '2024-11-23 09:15:45', sourceId: 'src_2', sourceName: 'Reuters', categoryId: 'cat_2', categoryName: 'Business', botType: 'LINK', taskKind: 'LISTING', level: 'INFO', message: 'Pagination detected: page 2', url: 'https://reuters.com/business?page=2' },
];

const mockCategories = [
    { id: 'cat_1', name: 'Tech' },
    { id: 'cat_2', name: 'Business' },
    { id: 'cat_3', name: 'Science' },
];

// --- Utility Components ---
const StatusBadge = ({ status }: { status: BotStatus }) => {
    const colors = {
        Running: 'bg-green-100 text-green-800',
        Idle: 'bg-gray-100 text-gray-800',
        Disabled: 'bg-red-100 text-red-800',
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
    const [viewMode, setViewMode] = useState<'overview' | 'list'>('overview');
    const [selectedSource, setSelectedSource] = useState<SourceOverview | null>(null);
    const [selectedLog, setSelectedLog] = useState<LogEntry | null>(null);

    // Overview Filters
    const [overviewBotType, setOverviewBotType] = useState<string>('All');
    const [overviewSource, setOverviewSource] = useState<string>('All');
    const [overviewSearch, setOverviewSearch] = useState<string>('');

    // Log List Filters
    const [logBotType, setLogBotType] = useState<string>('All');
    const [logTaskKind, setLogTaskKind] = useState<string>('All');
    const [logCategory, setLogCategory] = useState<string>('All');
    const [logLevel, setLogLevel] = useState<string>('All');
    const [logSearch, setLogSearch] = useState<string>('');

    // --- Overview Logic ---
    const filteredSources = useMemo(() => {
        return mockSources.filter(source => {
            const matchesBotType = overviewBotType === 'All' || source.botTypes.includes(overviewBotType as BotType);
            const matchesSource = overviewSource === 'All' || source.id === overviewSource;
            const matchesSearch = source.name.toLowerCase().includes(overviewSearch.toLowerCase());
            return matchesBotType && matchesSource && matchesSearch;
        });
    }, [overviewBotType, overviewSource, overviewSearch]);

    const handleViewLogs = (source: SourceOverview) => {
        setSelectedSource(source);
        setViewMode('list');
        // Reset specific log filters when entering list view? Optional.
    };

    // --- Log List Logic ---
    const filteredLogs = useMemo(() => {
        if (!selectedSource) return [];
        return mockLogs.filter(log => {
            const matchesSource = log.sourceId === selectedSource.id;
            const matchesBotType = logBotType === 'All' || log.botType === logBotType;
            const matchesTaskKind = logTaskKind === 'All' || log.taskKind === logTaskKind;
            const matchesCategory = logCategory === 'All' || log.categoryId === logCategory;
            const matchesLevel = logLevel === 'All' || log.level === logLevel;
            const matchesSearch = logSearch === '' || 
                                  log.message.toLowerCase().includes(logSearch.toLowerCase()) || 
                                  log.url.toLowerCase().includes(logSearch.toLowerCase());
            
            return matchesSource && matchesBotType && matchesTaskKind && matchesCategory && matchesLevel && matchesSearch;
        });
    }, [selectedSource, logBotType, logTaskKind, logCategory, logLevel, logSearch]);

    const handleBackToOverview = () => {
        setSelectedSource(null);
        setViewMode('overview');
    };

    // --- Renders ---

    const renderOverview = () => (
        <div className="space-y-6 animate-fade-in">
            {/* Overview Filter Bar */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                <div>
                    <label className="block text-sm font-medium text-gray-600 mb-2">Bot Type</label>
                    <select value={overviewBotType} onChange={(e) => setOverviewBotType(e.target.value)} className="input-field">
                        <option value="All">All Types</option>
                        <option value="LINK">LINK</option>
                        <option value="CONTENT">CONTENT</option>
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-600 mb-2">Source</label>
                    <select value={overviewSource} onChange={(e) => setOverviewSource(e.target.value)} className="input-field">
                        <option value="All">All Sources</option>
                        {mockSources.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
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
                            {filteredSources.map(source => (
                                <tr key={source.id} className="table-row group">
                                    <td className="px-6 py-4 font-medium text-gray-900">{source.name}</td>
                                    <td className="px-6 py-4">
                                        <div className="flex space-x-1">
                                            {source.botTypes.map(type => (
                                                <span key={type} className="text-[10px] uppercase font-bold bg-gray-100 text-gray-600 px-2 py-0.5 rounded">{type}</span>
                                            ))}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4"><StatusBadge status={source.status} /></td>
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
                            {filteredSources.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="px-6 py-8 text-center text-gray-400">No sources found matching filters.</td>
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
                <button onClick={handleBackToOverview} className="p-2 rounded-full hover:bg-gray-100 text-gray-500 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                </button>
                <div>
                    <h2 className="text-xl font-bold text-gray-800">{selectedSource?.name} Logs</h2>
                    <p className="text-sm text-gray-500">Viewing detailed logs for {selectedSource?.name}</p>
                </div>
            </div>

            {/* Log List Filter Bar */}
            <div className="bg-white p-4 rounded-xl border border-gray-200/80 shadow-sm">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                     <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Bot Type</label>
                        <select value={logBotType} onChange={(e) => setLogBotType(e.target.value)} className="input-field text-xs py-2">
                            <option value="All">All</option>
                            <option value="LINK">LINK</option>
                            <option value="CONTENT">CONTENT</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Task Kind</label>
                        <select value={logTaskKind} onChange={(e) => setLogTaskKind(e.target.value)} className="input-field text-xs py-2">
                            <option value="All">All</option>
                            <option value="CATEGORY">CATEGORY</option>
                            <option value="LISTING">LISTING</option>
                            <option value="ARTICLE">ARTICLE</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Category</label>
                        <select value={logCategory} onChange={(e) => setLogCategory(e.target.value)} className="input-field text-xs py-2">
                            <option value="All">All</option>
                            {mockCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Level</label>
                        <select value={logLevel} onChange={(e) => setLogLevel(e.target.value)} className="input-field text-xs py-2">
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
                            {filteredLogs.map(log => (
                                <tr 
                                    key={log.id} 
                                    onClick={() => setSelectedLog(log)}
                                    className="table-row cursor-pointer"
                                >
                                    <td className="px-6 py-3 text-xs text-gray-500 font-mono whitespace-nowrap truncate">{log.timestamp.split(' ')[1]}</td>
                                    <td className="px-6 py-3"><span className="bg-gray-100 text-gray-600 text-[10px] px-2 py-0.5 rounded font-bold">{log.taskKind}</span></td>
                                    <td className="px-6 py-3"><span className="text-xs font-medium text-gray-700">{log.botType}</span></td>
                                    <td className="px-6 py-3"><LevelBadge level={log.level} /></td>
                                    <td className="px-6 py-3">
                                        <div className="flex flex-col">
                                            <span className="font-medium text-gray-800 truncate" title={log.message}>{log.message}</span>
                                            <span className="text-xs text-blue-500 truncate hover:underline" title={log.url}>{log.url}</span>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                             {filteredLogs.length === 0 && (
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
                         <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <span className="block text-gray-500 text-xs uppercase tracking-wide">Timestamp</span>
                                <span className="font-mono text-gray-800">{selectedLog.timestamp}</span>
                            </div>
                             <div>
                                <span className="block text-gray-500 text-xs uppercase tracking-wide">Level</span>
                                <LevelBadge level={selectedLog.level} />
                            </div>
                            <div>
                                <span className="block text-gray-500 text-xs uppercase tracking-wide">Source</span>
                                <span className="text-gray-800 font-medium">{selectedLog.sourceName}</span>
                            </div>
                             <div>
                                <span className="block text-gray-500 text-xs uppercase tracking-wide">Bot Type</span>
                                <span className="text-gray-800">{selectedLog.botType}</span>
                            </div>
                            <div>
                                <span className="block text-gray-500 text-xs uppercase tracking-wide">Category</span>
                                <span className="text-gray-800">{selectedLog.categoryName}</span>
                            </div>
                             <div>
                                <span className="block text-gray-500 text-xs uppercase tracking-wide">Task Kind</span>
                                <span className="text-gray-800">{selectedLog.taskKind}</span>
                            </div>
                         </div>

                         <div className="bg-gray-50 p-3 rounded-lg border border-gray-200/60">
                            <span className="block text-gray-500 text-xs uppercase tracking-wide mb-1">Message</span>
                            <p className="text-gray-900 font-medium">{selectedLog.message}</p>
                         </div>

                         <div className="bg-blue-50/50 p-3 rounded-lg border border-blue-100">
                            <span className="block text-blue-400 text-xs uppercase tracking-wide mb-1">Target URL</span>
                            <a href={selectedLog.url} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline text-sm break-all">{selectedLog.url}</a>
                         </div>

                         {selectedLog.metadata && (
                             <div className="bg-red-50 p-3 rounded-lg border border-red-100">
                                <span className="block text-red-400 text-xs uppercase tracking-wide mb-1">Error Metadata</span>
                                <pre className="text-red-700 text-xs whitespace-pre-wrap font-mono overflow-x-auto">{selectedLog.metadata}</pre>
                             </div>
                         )}
                    </div>
                )}
            </Modal>
        </>
    );
};

export default LogsView;