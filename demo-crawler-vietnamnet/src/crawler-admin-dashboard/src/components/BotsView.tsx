import React, { useState, useMemo, useEffect } from 'react';
import Card from './Card.tsx';
import InputGroup from './InputGroup.tsx';
import SelectGroup from './SelectGroup.tsx';
import Modal from './Modal.tsx';
import ToggleSwitch from './ToggleSwitch.tsx';
import { ArticleSource, CrawlerConfig } from '../../types.ts';
import { ActiveCommand } from '../../App.tsx';

// --- Icons ---
const GlobeIcon = ({ className = "h-5 w-5 text-gray-400" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2h10a2 2 0 002-2v-1a2 2 0 012-2h1.945M7.722 16.545l.005.005a2 2 0 01-2.9-2.9l.005.005a2 2 0 012.9 2.9zM12 21a9 9 0 100-18 9 9 0 000 18z" />
    </svg>
);

const CodeIcon = ({ className = "h-5 w-5 text-gray-400" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
    </svg>
);

const PlusIcon = ({ className = "h-5 w-5" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
    </svg>
);

const PlayIcon = ({ className = "" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 ${className}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

// --- Mock Data ---
const initialSources: ArticleSource[] = [
    {
        id: 'src_1',
        name: 'TechCrunch',
        url: 'https://techcrunch.com',
        categoryId: 'cat_1',
        linkSelector: 'a.post-block__title__link',
        titleSelector: 'h1.article__title',
        descriptionSelector: 'div.article-content > p:first-child',
        contentSelector: 'div.article-content',
        removalSelector: '.ad-unit, script, style',
        imageSelector: 'img.article__featured-image',
        enabled: true
    },
    {
        id: 'src_2',
        name: 'Reuters Business',
        url: 'https://reuters.com/business',
        categoryId: 'cat_2',
        linkSelector: 'a.media-story-card__heading__link',
        titleSelector: 'h1.article-header__title',
        descriptionSelector: 'p.article-body__content__paragraph',
        contentSelector: 'div.article-body__content',
        removalSelector: 'div.ad, .share-bar',
        imageSelector: 'div.article-header__image img',
        enabled: false
    }
];

const mockCategories = [
    { id: 'cat_1', name: 'Technology' },
    { id: 'cat_2', name: 'Business' },
    { id: 'cat_3', name: 'Science' },
    { id: 'cat_4', name: 'Health' },
];

interface BotsViewProps {
    config: CrawlerConfig; 
    onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onSelectChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
    onSave: () => void;
    showToast: (message: string) => void;
    activeCommand?: ActiveCommand | null;
}

const BotsView: React.FC<BotsViewProps> = ({ showToast, activeCommand }) => {
    // --- State ---
    const [sources, setSources] = useState<ArticleSource[]>(initialSources);
    const [selectedSourceId, setSelectedSourceId] = useState<string | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [activeTab, setActiveTab] = useState<'config' | 'manual'>('config');
    const [searchTerm, setSearchTerm] = useState('');
    
    // Form State
    const [formData, setFormData] = useState<ArticleSource>({
        id: '', name: '', url: '', categoryId: mockCategories[0].id,
        linkSelector: '', titleSelector: '', descriptionSelector: '',
        contentSelector: '', removalSelector: '', imageSelector: '',
        enabled: true
    });

    // Manual Task State
    const [categorySeed, setCategorySeed] = useState({ href: '', force: false });
    const [listingSeed, setListingSeed] = useState({ href: '', depth: '0' });

    // Network Modal State
    const [networkModal, setNetworkModal] = useState<{ isOpen: boolean; type: 'ip' | 'ua'; content: string }>({
        isOpen: false, type: 'ip', content: ''
    });
    const [isSavingNetwork, setIsSavingNetwork] = useState(false);

    // --- Effects for Command Palette ---
    useEffect(() => {
        if (activeCommand && activeCommand.view === 'bots') {
            switch (activeCommand.action) {
                case 'add':
                    handleAddNew();
                    break;
                case 'manual':
                    // Need to select a source first if none selected, but for now just switch tab if source selected
                    if (selectedSourceId) {
                        setActiveTab('manual');
                    } else {
                        // Select first one to show UI
                        if (sources.length > 0) handleSelectSource(sources[0]);
                        setTimeout(() => setActiveTab('manual'), 50);
                    }
                    break;
                case 'ip':
                    openNetworkModal('ip');
                    break;
                case 'ua':
                    openNetworkModal('ua');
                    break;
                default:
                    break;
            }
        }
    }, [activeCommand]);

    // --- Computed ---
    const filteredSources = useMemo(() => {
        return sources.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()));
    }, [sources, searchTerm]);

    // --- Handlers ---
    const handleSelectSource = (source: ArticleSource) => {
        setSelectedSourceId(source.id);
        setFormData(source);
        setIsEditing(true);
        setActiveTab('config');
        setCategorySeed({ href: '', force: false });
        setListingSeed({ href: '', depth: '0' });
    };

    const handleAddNew = () => {
        const newId = `src_${Date.now()}`;
        const newSource: ArticleSource = {
            id: newId,
            name: 'New Source',
            url: 'https://',
            categoryId: mockCategories[0].id,
            linkSelector: '',
            titleSelector: '',
            descriptionSelector: '',
            contentSelector: '',
            removalSelector: '',
            imageSelector: '',
            enabled: true
        };
        setSources([...sources, newSource]);
        setSelectedSourceId(newId);
        setFormData(newSource);
        setIsEditing(true);
        setActiveTab('config');
    };

    const handleDelete = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (window.confirm('Are you sure you want to delete this source?')) {
            setSources(sources.filter(s => s.id !== id));
            if (selectedSourceId === id) {
                setSelectedSourceId(null);
                setIsEditing(false);
            }
            showToast('Source deleted.');
        }
    };

    const handleToggleStatus = (e: React.MouseEvent, source: ArticleSource) => {
        e.stopPropagation();
        const updatedSource = { ...source, enabled: !source.enabled };
        setSources(sources.map(s => s.id === source.id ? updatedSource : s));
        if (selectedSourceId === source.id) {
            setFormData(prev => ({ ...prev, enabled: updatedSource.enabled }));
        }
        showToast(`Source ${updatedSource.enabled ? 'enabled' : 'disabled'}.`);
    };

    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSaveConfig = () => {
        console.log('POST /admin/api/seed-article-source', formData);
        setSources(sources.map(s => s.id === formData.id ? formData : s));
        showToast('Configuration saved successfully!');
    };

    const handleRunCategory = () => {
        if (!categorySeed.href) {
            showToast('Please enter a category path/href.');
            return;
        }
        console.log(`GET /admin/api/seed-category?href=${categorySeed.href}&sourceId=${selectedSourceId}&force=${categorySeed.force}`);
        showToast(`Category seed started for ${categorySeed.href}`);
    };

    const handleRunListing = () => {
        if (!listingSeed.href) {
            showToast('Please enter a listing path/href.');
            return;
        }
        const catId = formData.categoryId;
        console.log(`GET /admin/api/seed-listing?href=${listingSeed.href}&sourceId=${selectedSourceId}&categoryId=${catId}&depth=${listingSeed.depth}`);
        showToast(`Listing seed started for ${listingSeed.href}`);
    };

    // Network Modal Handlers
    const openNetworkModal = (type: 'ip' | 'ua') => setNetworkModal({ isOpen: true, type, content: '' });
    const closeNetworkModal = () => setNetworkModal(prev => ({ ...prev, isOpen: false }));
    const handleNetworkSave = () => {
        const lines = networkModal.content.split('\n').filter(l => l.trim().length > 0);
        setIsSavingNetwork(true);
        console.log(`POST /admin/api/network/${networkModal.type === 'ip' ? 'fake-ips' : 'user-agents'}`, lines);
        setTimeout(() => {
            setIsSavingNetwork(false);
            showToast(`Imported ${lines.length} items.`);
            closeNetworkModal();
        }, 800);
    };

    return (
        <div className="space-y-6">
            
            {/* Header Toolbar */}
            <div className="flex justify-between items-center">
                <p className="text-gray-500 text-sm">Manage crawler sources and run manual tasks.</p>
                <div className="flex space-x-3">
                    <button onClick={() => openNetworkModal('ip')} className="btn-secondary text-sm py-2">
                        IP Management
                    </button>
                    <button onClick={() => openNetworkModal('ua')} className="btn-secondary text-sm py-2">
                        User Agents
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                
                {/* Left Column: Source List */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200/80 flex flex-col h-[600px] lg:h-[calc(100vh-14rem)] sticky top-6">
                    <div className="p-4 border-b border-gray-100 space-y-3">
                        <div className="flex justify-between items-center">
                            <h3 className="font-bold text-gray-700">Sources</h3>
                            <button onClick={handleAddNew} className="p-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors shadow-sm">
                                <PlusIcon className="w-4 h-4" />
                            </button>
                        </div>
                        <input 
                            type="text" 
                            placeholder="Filter sources..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="input-field text-sm py-2"
                        />
                    </div>
                    
                    <div className="flex-1 overflow-y-auto p-2 space-y-2">
                        {filteredSources.map(source => (
                            <div 
                                key={source.id}
                                onClick={() => handleSelectSource(source)}
                                className={`group p-3 rounded-xl cursor-pointer transition-all border ${selectedSourceId === source.id ? 'bg-blue-50 border-blue-200 ring-1 ring-blue-100' : 'bg-white border-transparent hover:bg-gray-50 hover:border-gray-200'}`}
                            >
                                <div className="flex justify-between items-start">
                                    <div className="flex-1 min-w-0">
                                        <h4 className={`text-sm font-semibold truncate ${selectedSourceId === source.id ? 'text-blue-800' : 'text-gray-800'}`}>
                                            {source.name}
                                        </h4>
                                        <p className="text-xs text-gray-500 truncate mt-0.5">{source.url}</p>
                                    </div>
                                    <div className="flex items-center space-x-2 ml-2">
                                        <div onClick={(e) => e.stopPropagation()} title={source.enabled ? "Enabled" : "Disabled"}>
                                             <div className={`w-2 h-2 rounded-full ${source.enabled ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex justify-between items-center mt-3">
                                    <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider bg-gray-100 px-1.5 py-0.5 rounded">
                                        {mockCategories.find(c => c.id === source.categoryId)?.name || 'Uncategorized'}
                                    </span>
                                    
                                    {/* Quick Actions on Hover */}
                                    <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button 
                                            onClick={(e) => handleToggleStatus(e, source)} 
                                            className={`text-xs px-2 py-1 rounded mr-1 ${source.enabled ? 'text-orange-600 hover:bg-orange-50' : 'text-green-600 hover:bg-green-50'}`}
                                        >
                                            {source.enabled ? 'Disable' : 'Enable'}
                                        </button>
                                        <button 
                                            onClick={(e) => handleDelete(e, source.id)} 
                                            className="text-red-400 hover:text-red-600 p-1"
                                        >
                                            &times;
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {filteredSources.length === 0 && (
                             <div className="text-center py-10 text-gray-400 text-sm">
                                 No sources found.
                             </div>
                        )}
                    </div>
                </div>

                {/* Right Column: Detail View */}
                <div className="lg:col-span-2 space-y-6 min-w-0">
                    {selectedSourceId ? (
                        <>
                            {/* Detail Header */}
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-200/80 p-6 flex justify-between items-center">
                                <div className="flex items-center space-x-4">
                                    <div className={`p-3 rounded-xl ${formData.enabled ? 'bg-blue-50 text-blue-600' : 'bg-gray-100 text-gray-400'}`}>
                                        <GlobeIcon className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold text-gray-800">{formData.name}</h2>
                                        <a href={formData.url} target="_blank" rel="noreferrer" className="text-sm text-blue-500 hover:underline">{formData.url}</a>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-3">
                                    <span className="text-sm text-gray-600 font-medium">{formData.enabled ? 'Active' : 'Disabled'}</span>
                                    <ToggleSwitch enabled={formData.enabled} onChange={() => handleToggleStatus({ stopPropagation: () => {} } as any, formData)} />
                                </div>
                            </div>

                            {/* Tabs */}
                            <div className="flex space-x-1 bg-gray-200/50 p-1 rounded-xl w-fit">
                                <button 
                                    onClick={() => setActiveTab('config')}
                                    className={`px-6 py-2 text-sm font-medium rounded-lg transition-all ${activeTab === 'config' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                                >
                                    Configuration
                                </button>
                                <button 
                                    onClick={() => setActiveTab('manual')}
                                    className={`px-6 py-2 text-sm font-medium rounded-lg transition-all ${activeTab === 'manual' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                                >
                                    Manual Operations
                                </button>
                            </div>

                            {/* Tab Content */}
                            <div className="animate-fade-in">
                                {activeTab === 'config' ? (
                                    <Card title="Source Configuration">
                                        <div className="space-y-5">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                                <InputGroup label="Display Name" name="name" value={formData.name} onChange={handleFormChange} placeholder="TechCrunch" />
                                                <InputGroup label="Base URL" name="url" value={formData.url} onChange={handleFormChange} placeholder="https://example.com" icon={<GlobeIcon />} />
                                            </div>
                                            
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                                <SelectGroup label="Default Category" name="categoryId" value={formData.categoryId} onChange={handleFormChange}>
                                                    {mockCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                                </SelectGroup>
                                                <InputGroup label="Link Selector" name="linkSelector" value={formData.linkSelector} onChange={handleFormChange} placeholder="a.post-link" icon={<CodeIcon />} />
                                            </div>

                                            <hr className="border-gray-100" />
                                            <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wide">Content Selectors</h4>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                                <InputGroup label="Title Selector" name="titleSelector" value={formData.titleSelector} onChange={handleFormChange} placeholder="h1.title" />
                                                <InputGroup label="Description Selector" name="descriptionSelector" value={formData.descriptionSelector} onChange={handleFormChange} placeholder="meta[name=description]" />
                                                <InputGroup label="Content Selector" name="contentSelector" value={formData.contentSelector} onChange={handleFormChange} placeholder=".content-body" />
                                                <InputGroup label="Image Selector" name="imageSelector" value={formData.imageSelector} onChange={handleFormChange} placeholder="img.featured" />
                                            </div>
                                            
                                            <InputGroup label="Removal Selector (CSS)" name="removalSelector" value={formData.removalSelector} onChange={handleFormChange} placeholder=".ads, .popup, script" />

                                            <div className="pt-4 flex justify-end">
                                                <button onClick={handleSaveConfig} className="btn-primary">
                                                    Save Configuration
                                                </button>
                                            </div>
                                        </div>
                                    </Card>
                                ) : (
                                    <div className="space-y-6">
                                        {/* Manual Seed: Category */}
                                        <Card title="Manual Seed: Category" className="border-l-4 border-l-blue-500">
                                            <div className="flex flex-col gap-4">
                                                <p className="text-sm text-gray-600">
                                                    Crawl a specific category page to find article listings.
                                                </p>
                                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                                    <div className="md:col-span-3">
                                                        <InputGroup 
                                                            label="Category Path (href)" 
                                                            name="catHref" 
                                                            value={categorySeed.href} 
                                                            onChange={(e) => setCategorySeed({...categorySeed, href: e.target.value})}
                                                            placeholder="/category/tech" 
                                                        />
                                                    </div>
                                                    <div className="flex items-center md:pt-7">
                                                        <label className="flex items-center space-x-2 cursor-pointer select-none text-gray-700 hover:text-gray-900">
                                                            <input 
                                                                type="checkbox" 
                                                                checked={categorySeed.force} 
                                                                onChange={(e) => setCategorySeed({...categorySeed, force: e.target.checked})}
                                                                className="checkbox" 
                                                            />
                                                            <span className="text-sm font-medium">Force re-crawl</span>
                                                        </label>
                                                    </div>
                                                </div>
                                                <div className="flex justify-end pt-2">
                                                    <button onClick={handleRunCategory} className="btn-primary w-full md:w-auto">
                                                        <PlayIcon className="mr-2" />
                                                        Run Category Now
                                                    </button>
                                                </div>
                                            </div>
                                        </Card>

                                        {/* Manual Seed: Listing */}
                                        <Card title="Manual Seed: Listing" className="border-l-4 border-l-purple-500">
                                            <div className="flex flex-col gap-4">
                                                <p className="text-sm text-gray-600">
                                                    Deep crawl a listing page. Uses the source's default category: <span className="font-semibold">{mockCategories.find(c => c.id === formData.categoryId)?.name}</span>
                                                </p>
                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                    <div className="md:col-span-2">
                                                        <InputGroup 
                                                            label="Listing Path (href)" 
                                                            name="listHref" 
                                                            value={listingSeed.href} 
                                                            onChange={(e) => setListingSeed({...listingSeed, href: e.target.value})}
                                                            placeholder="/category/tech/page/2" 
                                                        />
                                                    </div>
                                                    <div>
                                                        <InputGroup 
                                                            label="Depth" 
                                                            name="depth" 
                                                            type="number"
                                                            value={listingSeed.depth} 
                                                            onChange={(e) => setListingSeed({...listingSeed, depth: e.target.value})}
                                                            placeholder="0" 
                                                        />
                                                    </div>
                                                </div>
                                                <div className="flex justify-end pt-2">
                                                    <button onClick={handleRunListing} className="btn-primary w-full md:w-auto">
                                                        <PlayIcon className="mr-2" />
                                                        Run Listing Now
                                                    </button>
                                                </div>
                                            </div>
                                        </Card>
                                    </div>
                                )}
                            </div>
                        </>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-gray-400 bg-white rounded-2xl border border-gray-200/80 p-10">
                            <GlobeIcon className="h-16 w-16 mb-4 text-gray-300" />
                            <h3 className="text-lg font-semibold text-gray-500">No Source Selected</h3>
                            <p className="text-sm mt-2">Select a source from the list or create a new one to get started.</p>
                            <button onClick={handleAddNew} className="mt-6 btn-primary">
                                Create New Source
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Network Config Modal */}
            <Modal
                isOpen={networkModal.isOpen}
                onClose={closeNetworkModal}
                title={networkModal.type === 'ip' ? 'Manage Fake IPs' : 'Manage User Agents'}
            >
                <div className="space-y-4">
                    <p className="text-sm text-gray-500">
                        Enter one item per line.
                    </p>
                    <textarea
                        className="w-full h-48 p-3 input-field font-mono text-xs resize-none"
                        placeholder={networkModal.type === 'ip' ? "192.168.1.1\n10.0.0.1" : "Mozilla/5.0...\nChrome/90..."}
                        value={networkModal.content}
                        onChange={(e) => setNetworkModal(prev => ({ ...prev, content: e.target.value }))}
                    />
                    <div className="flex justify-end space-x-3">
                        <button onClick={closeNetworkModal} className="btn-text text-sm">Cancel</button>
                        <button onClick={handleNetworkSave} disabled={isSavingNetwork} className="btn-primary py-2 px-4 text-sm">
                            {isSavingNetwork ? 'Saving...' : 'Import List'}
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default BotsView;