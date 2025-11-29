import React, { useState, useMemo, useEffect } from 'react';
import Card from './Card.tsx';
import InputGroup from './InputGroup.tsx';
import SelectGroup from './SelectGroup.tsx';
import { ActiveCommand } from '../../../App.tsx';

// import { ArticleSource, CrawlerConfig } from '../../../types.ts';
import { CrawlerConfig } from '../../../types.ts';
import {
    useAdminArticleSources,
    ArticleSource,
} from '../../hooks/admin/useAdminArticleSource.ts';
import { useAdminArticleCategories } from '../../hooks/admin/useAdminArticleCategory';
// chỉnh lại path nếu project bạn khác: chỉ cần trỏ tới file useAdminArticleCategory.ts


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


interface BotsViewProps {
    config: CrawlerConfig;
    onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onSelectChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
    onSave: () => void;
    showToast: (message: string) => void;
    activeCommand?: ActiveCommand | null;
}


const BotsView: React.FC<BotsViewProps> = ({ showToast, activeCommand }) => {
    const {
        sources,
        loading,
        error,
        saveSource,
        removeSource,
        toggleStatus,
    } = useAdminArticleSources();

    const {
        categories,
        loading: loadingCategories,
        error: categoriesError,
    } = useAdminArticleCategories();

    const [selectedSourceId, setSelectedSourceId] = useState<string | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    // Form State
    const [formData, setFormData] = useState<ArticleSource>({
        id: '',
        name: '',
        url: '',
        categoryId: '',           // sẽ set bằng categories[0].id sau khi load
        linkSelector: '',
        titleSelector: '',
        descriptionSelector: '',
        contentSelector: '',
        removalSelector: '',
        imageSelector: '',
        timeSelector: '',
        enabled: true
    });

    useEffect(() => {
        if (!formData.categoryId && categories && categories.length > 0) {
            setFormData((prev) => ({
                ...prev,
                categoryId: String(categories[0].id), // FE dùng string, backend id là number
            }));
        }
    }, [categories]);
    // --- Effects for Command Palette ---
    useEffect(() => {
        if (activeCommand && activeCommand.view === 'bots') {
            switch (activeCommand.action) {
                case 'add':
                    handleAddNew();
                    break;
                default:
                    break;
            }
        }
    }, [activeCommand]);

    // --- Computed ---
    const filteredSources = useMemo(() => {
        return sources.filter((s) =>
            s.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [sources, searchTerm]);

    // --- Handlers ---
    const handleSelectSource = (source: ArticleSource) => {
        setSelectedSourceId(source.id);
        setFormData(source);
        setIsEditing(true);
    };

    const handleAddNew = () => {
        // chọn category đầu tiên trong list, nếu chưa có thì để rỗng
        const defaultCategoryId =
            categories && categories.length > 0 ? String(categories[0].id) : '';

        const newSource: ArticleSource = {
            id: '',
            name: 'New Source',
            url: 'https://',
            categoryId: defaultCategoryId,
            linkSelector: '',
            titleSelector: '',
            descriptionSelector: '',
            contentSelector: '',
            imageSelector: '',
            timeSelector: '',      // <<< THÊM
            removalSelector: '',
            enabled: true,
        };

        setSelectedSourceId('NEW');
        setFormData(newSource);
        setIsEditing(true);
    };




    const handleDelete = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (!window.confirm('Are you sure you want to delete this source?')) {
            return;
        }

        try {
            await removeSource(id);
            if (selectedSourceId === id) {
                setSelectedSourceId(null);
                setIsEditing(false);
            }
            showToast('Source soft-deleted (status = 1, articles = DELETED).');
        } catch (err: any) {
            console.error('Delete source failed', err);
            showToast(err.message || 'Delete source failed');
        }
    };


    // Giữ lại toggle status ở list bên trái (bạn có thể bỏ nếu muốn chỉ dùng dropdown)
    const handleToggleStatus = async (
        e: React.MouseEvent,
        source: ArticleSource
    ) => {
        e.stopPropagation();
        try {
            await toggleStatus(source);
            showToast(
                `Source ${!source.enabled ? 'enabled (status=1)' : 'disabled (status=0)'}.`
            );
        } catch (err: any) {
            console.error('Toggle status failed', err);
            showToast(err.message || 'Toggle status failed');
        }
    };


    const handleFormChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
    ) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSaveConfig = async () => {
        try {
            await saveSource(formData);
            showToast('Configuration saved to backend successfully!');
            setIsEditing(false);
        } catch (err: any) {
            console.error('Save config failed', err);
            showToast(err.message || 'Save configuration failed');
        }
    };


    // Dropdown Active 1/0
    const handleStatusDropdownChange = (
        e: React.ChangeEvent<HTMLSelectElement>
    ) => {
        const isActive = e.target.value === '1';
        setFormData((prev) => ({ ...prev, enabled: isActive }));
        // Không cần setSources ở đây nữa, list sẽ được reload sau khi save
    };


    return (
        <div className="space-y-6">
            {/* Header Toolbar */}
            <div className="flex justify-between items-center">
                <p className="text-gray-500 text-sm">
                    Manage crawler sources.
                </p>
                {/* Đã bỏ IP Management / User Agents */}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                {/* Left Column: Source List */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200/80 flex flex-col h-[600px] lg:h-[calc(100vh-14rem)] sticky top-6">
                    <div className="p-4 border-b border-gray-100 space-y-3">
                        <div className="flex justify-between items-center">
                            <h3 className="font-bold text-gray-700">Sources</h3>
                            <button
                                onClick={handleAddNew}
                                className="p-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors shadow-sm"
                            >
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
                        {filteredSources.map((source) => (
                            <div
                                key={source.id}
                                onClick={() => handleSelectSource(source)}
                                className={`group p-3 rounded-xl cursor-pointer transition-all border ${
                                    selectedSourceId === source.id
                                        ? 'bg-blue-50 border-blue-200 ring-1 ring-blue-100'
                                        : 'bg-white border-transparent hover:bg-gray-50 hover:border-gray-200'
                                }`}
                            >
                                <div className="flex justify-between items-start">
                                    <div className="flex-1 min-w-0">
                                        <h4
                                            className={`text-sm font-semibold truncate ${
                                                selectedSourceId === source.id
                                                    ? 'text-blue-800'
                                                    : 'text-gray-800'
                                            }`}
                                        >
                                            {source.name}
                                        </h4>
                                        <p className="text-xs text-gray-500 truncate mt-0.5">
                                            {source.url}
                                        </p>
                                    </div>
                                    <div className="flex items-center space-x-2 ml-2">
                                        <div
                                            onClick={(e) => e.stopPropagation()}
                                            title={
                                                source.enabled
                                                    ? 'Enabled'
                                                    : 'Disabled'
                                            }
                                        >
                                            <div
                                                className={`w-2 h-2 rounded-full ${
                                                    source.enabled
                                                        ? 'bg-green-500'
                                                        : 'bg-gray-300'
                                                }`}
                                            ></div>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex justify-between items-center mt-3">

                                    {/* Quick Actions on Hover */}
                                    <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={(e) =>
                                                handleToggleStatus(e, source)
                                            }
                                            className={`text-xs px-2 py-1 rounded mr-1 ${
                                                source.enabled
                                                    ? 'text-orange-600 hover:bg-orange-50'
                                                    : 'text-green-600 hover:bg-green-50'
                                            }`}
                                        >
                                            {source.enabled
                                                ? 'Disable'
                                                : 'Enable'}
                                        </button>
                                        <button
                                            onClick={(e) =>
                                                handleDelete(e, source.id)
                                            }
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
                                    <div
                                        className={`p-3 rounded-xl ${
                                            formData.enabled
                                                ? 'bg-blue-50 text-blue-600'
                                                : 'bg-gray-100 text-gray-400'
                                        }`}
                                    >
                                        <GlobeIcon className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold text-gray-800">
                                            {formData.name}
                                        </h2>
                                        <a
                                            href={formData.url}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="text-sm text-blue-500 hover:underline"
                                        >
                                            {formData.url}
                                        </a>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-3">
                                    <span className="text-sm text-gray-600 font-medium">
                                        Status
                                    </span>
                                    {/* Dropdown 1 = Active, 0 = Inactive */}
                                    <select
                                        className="input-field text-sm py-1 px-2 w-32"
                                        value={formData.enabled ? '1' : '0'}
                                        onChange={handleStatusDropdownChange}
                                    >
                                        <option value="1">
                                            1 - Active
                                        </option>
                                        <option value="0">
                                            0 - Inactive
                                        </option>
                                    </select>
                                </div>
                            </div>

                            {/* Chỉ còn tab cấu hình */}
                            <div className="animate-fade-in">
                                <Card title="Source Configuration">
                                    <div className="space-y-5">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                            <InputGroup
                                                label="Display Name"
                                                name="name"
                                                value={formData.name}
                                                onChange={handleFormChange}
                                                placeholder="TechCrunch"
                                            />
                                            <InputGroup
                                                label="Base URL"
                                                name="url"
                                                value={formData.url}
                                                onChange={handleFormChange}
                                                placeholder="https://example.com"
                                                icon={<GlobeIcon />}
                                            />
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                            <SelectGroup
                                                label="Default Category"
                                                name="categoryId"
                                                value={formData.categoryId}
                                                onChange={handleFormChange}
                                            >
                                                {loadingCategories && (
                                                    <option value="">Loading categories...</option>
                                                )}

                                                {!loadingCategories && categories.length === 0 && (
                                                    <option value="">No categories available</option>
                                                )}

                                                {!loadingCategories &&
                                                    categories.map((c) => (
                                                        <option key={c.id} value={String(c.id)}>
                                                            {c.name} {/* nếu muốn thêm số bài: `${c.name} (${c.articleCount})` */}
                                                        </option>
                                                    ))}
                                            </SelectGroup>

                                            <InputGroup
                                                label="Link Selector"
                                                name="linkSelector"
                                                value={formData.linkSelector}
                                                onChange={handleFormChange}
                                                placeholder="a.post-link"
                                                icon={<CodeIcon />}
                                            />
                                        </div>

                                        <hr className="border-gray-100" />
                                        <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wide">
                                            Content Selectors
                                        </h4>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                            <InputGroup
                                                label="Title Selector"
                                                name="titleSelector"
                                                value={formData.titleSelector}
                                                onChange={handleFormChange}
                                                placeholder="h1.title"
                                            />
                                            <InputGroup
                                                label="Description Selector"
                                                name="descriptionSelector"
                                                value={formData.descriptionSelector}
                                                onChange={handleFormChange}
                                                placeholder="meta[name=description]"
                                            />
                                            <InputGroup
                                                label="Content Selector"
                                                name="contentSelector"
                                                value={formData.contentSelector}
                                                onChange={handleFormChange}
                                                placeholder=".content-body"
                                            />
                                            <InputGroup
                                                label="Image Selector"
                                                name="imageSelector"
                                                value={formData.imageSelector}
                                                onChange={handleFormChange}
                                                placeholder="img.featured"
                                            />
                                            <InputGroup
                                                label="Time Selector"
                                                name="timeSelector"                      // <<< THÊM
                                                value={formData.timeSelector}
                                                onChange={handleFormChange}
                                                placeholder="div.bread-crumb-detail__time"
                                            />
                                        </div>

                                        <InputGroup
                                            label="Removal Selector (CSS)"
                                            name="removalSelector"
                                            value={formData.removalSelector}
                                            onChange={handleFormChange}
                                            placeholder=".ads, .popup, script"
                                        />


                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                            <InputGroup
                                                label="Title Selector"
                                                name="titleSelector"
                                                value={
                                                    formData.titleSelector
                                                }
                                                onChange={handleFormChange}
                                                placeholder="h1.title"
                                            />
                                            <InputGroup
                                                label="Description Selector"
                                                name="descriptionSelector"
                                                value={
                                                    formData.descriptionSelector
                                                }
                                                onChange={handleFormChange}
                                                placeholder="meta[name=description]"
                                            />
                                            <InputGroup
                                                label="Content Selector"
                                                name="contentSelector"
                                                value={
                                                    formData.contentSelector
                                                }
                                                onChange={handleFormChange}
                                                placeholder=".content-body"
                                            />
                                            <InputGroup
                                                label="Image Selector"
                                                name="imageSelector"
                                                value={formData.imageSelector}
                                                onChange={handleFormChange}
                                                placeholder="img.featured"
                                            />
                                        </div>

                                        <InputGroup
                                            label="Removal Selector (CSS)"
                                            name="removalSelector"
                                            value={formData.removalSelector}
                                            onChange={handleFormChange}
                                            placeholder=".ads, .popup, script"
                                        />

                                        <div className="pt-4 flex justify-end">
                                            <button
                                                onClick={handleSaveConfig}
                                                className="btn-primary"
                                            >
                                                Save Configuration
                                            </button>
                                        </div>
                                    </div>
                                </Card>
                            </div>
                        </>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-gray-400 bg-white rounded-2xl border border-gray-200/80 p-10">
                            <GlobeIcon className="h-16 w-16 mb-4 text-gray-300" />
                            <h3 className="text-lg font-semibold text-gray-500">
                                No Source Selected
                            </h3>
                            <p className="text-sm mt-2">
                                Select a source from the list or create a new
                                one to get started.
                            </p>
                            <button
                                onClick={handleAddNew}
                                className="mt-6 btn-primary"
                            >
                                Create New Source
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default BotsView;
