import React, { useState, useMemo } from 'react';

// Mock Data
const mockArticles = [
    { id: 'c1', title: 'AI predicts stock market trends', source: 'TechCrunch', category: 'Technology', status: 'Published', date: '2024-05-20' },
    { id: 'c2', title: 'Global business summit focuses on sustainable growth', source: 'Reuters', category: 'Business', status: 'Published', date: '2024-05-20' },
    { id: 'c3', title: 'Quantum computing breakthrough could change medicine', source: 'Wired', category: 'Technology', status: 'Draft', date: '2024-05-19' },
    { id: 'c4', title: 'Underdog team wins championship in stunning upset', source: 'ESPN', category: 'Sports', status: 'Published', date: '2024-05-19' },
    { id: 'c5', title: 'E-commerce giant to acquire streaming service', source: 'Bloomberg', category: 'Business', status: 'Archived', date: '2024-05-18' },
    { id: 'c6', title: 'New deep-sea species discovered', source: 'NatGeo', category: 'Science', status: 'Published', date: '2024-05-17' },
];

const StatusBadge = ({ status }: { status: string }) => {
    const statusClasses: { [key: string]: string } = {
        Published: "badge-published",
        Draft: "badge-draft",
        Archived: "badge-archived",
    };
    return <span className={`badge ${statusClasses[status] || 'bg-gray-200 text-gray-800'}`}>{status}</span>;
}

const ContentsView: React.FC = () => {
    const [articles, setArticles] = useState(mockArticles);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [searchTerm, setSearchTerm] = useState('');
    const [sourceFilter, setSourceFilter] = useState('all');
    const [categoryFilter, setCategoryFilter] = useState('all');

    const sources = useMemo(() => ['all', ...Array.from(new Set(mockArticles.map(item => item.source)))], [mockArticles]);
    const categories = useMemo(() => ['all', ...Array.from(new Set(mockArticles.map(item => item.category)))], [mockArticles]);

    const filteredArticles = useMemo(() => {
        return articles
            .filter(item => item.title.toLowerCase().includes(searchTerm.toLowerCase()))
            .filter(item => sourceFilter === 'all' || item.source === sourceFilter)
            .filter(item => categoryFilter === 'all' || item.category === categoryFilter);
    }, [articles, searchTerm, sourceFilter, categoryFilter]);
    
    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) {
            setSelectedIds(new Set(filteredArticles.map(a => a.id)));
        } else {
            setSelectedIds(new Set());
        }
    };
    
    const handleSelectOne = (id: string) => {
        const newSelectedIds = new Set(selectedIds);
        if (newSelectedIds.has(id)) {
            newSelectedIds.delete(id);
        } else {
            newSelectedIds.add(id);
        }
        setSelectedIds(newSelectedIds);
    };

    const deleteSelected = () => {
        setArticles(articles.filter(a => !selectedIds.has(a.id)));
        setSelectedIds(new Set());
    };

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="md:col-span-2">
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search by title..."
                        className="input-field"
                    />
                </div>
                <div>
                     <select value={sourceFilter} onChange={(e) => setSourceFilter(e.target.value)} className="input-field appearance-none">
                        {sources.map(s => <option key={s} value={s}>{s === 'all' ? 'All Sources' : s}</option>)}
                    </select>
                </div>
                 <div>
                     <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="input-field appearance-none">
                        {categories.map(c => <option key={c} value={c}>{c === 'all' ? 'All Categories' : c}</option>)}
                    </select>
                </div>
            </div>

            <div className="bg-white border border-gray-200/80 shadow-sm rounded-2xl overflow-hidden">
                <div className="p-4 flex items-center justify-between border-b border-gray-200/80">
                    <h3 className="font-semibold">{selectedIds.size} selected</h3>
                    <button onClick={deleteSelected} disabled={selectedIds.size === 0} className="btn-danger-light">
                        Delete Selected
                    </button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-gray-600">
                        <thead className="table-header">
                            <tr>
                                <th scope="col" className="p-4">
                                    <input type="checkbox" onChange={handleSelectAll} checked={selectedIds.size > 0 && selectedIds.size === filteredArticles.length} className="checkbox"/>
                                </th>
                                <th scope="col" className="px-6 py-3">Article</th>
                                <th scope="col" className="px-6 py-3">Source</th>
                                <th scope="col" className="px-6 py-3">Category</th>
                                <th scope="col" className="px-6 py-3">Status</th>
                                <th scope="col" className="px-6 py-3">Date</th>
                                <th scope="col" className="px-6 py-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredArticles.map((article) => (
                                <tr key={article.id} className="table-row">
                                    <td className="w-4 p-4">
                                        <input type="checkbox" checked={selectedIds.has(article.id)} onChange={() => handleSelectOne(article.id)} className="checkbox"/>
                                    </td>
                                    <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">{article.title}</td>
                                    <td className="px-6 py-4">{article.source}</td>
                                    <td className="px-6 py-4">{article.category}</td>
                                    <td className="px-6 py-4"><StatusBadge status={article.status} /></td>
                                    <td className="px-6 py-4">{article.date}</td>
                                    <td className="px-6 py-4 flex justify-end space-x-2">
                                        <button className="btn-text">Edit</button>
                                        <button className="btn-text-danger">Delete</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                 {filteredArticles.length === 0 && (
                     <div className="text-center py-12">
                         <h3 className="text-xl font-semibold text-gray-500">No Articles Found</h3>
                         <p className="mt-2 text-gray-400">Try adjusting your filters.</p>
                     </div>
                 )}
            </div>
        </div>
    );
};

export default ContentsView;