// src/App.tsx
import React, { useState, useCallback, useEffect, useMemo } from 'react';
import {
    Routes,
    Route,
    useLocation,
    useNavigate,
    Navigate,
} from 'react-router-dom';

import ArticleEditPage from '@/src/pages/ArticleEditPage.tsx';
import { CrawlerConfig, CrawlerStatus } from './types';
import Sidebar from '@/src/components/admin/Navbar.tsx';
import Dashboard from '@/src/components/admin/Dashboard.tsx';
import CategoriesView from '@/src/components/admin/CategoriesView.tsx';
import LogsView from '@/src/components/admin/LogsView.tsx';
import BotsView from '@/src/components/admin/BotsView.tsx';
import Toast from '@/src/components/admin/Toast.tsx';
import CommandPalette from '@/src/components/admin/CommandPalette.tsx';
import Client from '@/src/pages/Client.tsx';
import Login from '@/src/pages/Login.tsx';

export interface ActiveCommand {
    view: string;
    action?: string;
    timestamp: number;
}

const Placeholder = ({ title }: { title: string }) => (
    <div className="flex items-center justify-center h-96">
        <div className="text-center">
            <h2 className="text-2xl font-semibold text-gray-400">{title}</h2>
            <p className="mt-2 text-gray-400">This section is under construction.</p>
        </div>
    </div>
);

// ================== ADMIN LAYOUT ==================
const AdminLayout: React.FC = () => {
    const [config, setConfig] = useState<CrawlerConfig>({
        domain: 'https://example.com',
        path: '/news',
        category: 'Tech',
        linkSelector: 'a.article-link',
        titleSelector: 'h1.article-title',
        descriptionSelector: 'p.article-summary',
        contentSelector: 'div.article-body',
        removalSelector: 'div.ads, script',
        status: CrawlerStatus.ACTIVE,
    });

    const [toast, setToast] = useState<{ message: string; show: boolean }>({
        message: '',
        show: false,
    });

    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [activeCommand, setActiveCommand] = useState<ActiveCommand | null>(null);

    const showToast = (message: string) => {
        setToast({ message, show: true });
    };

    useEffect(() => {
        if (toast.show) {
            const timer = setTimeout(() => {
                setToast({ message: '', show: false });
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [toast.show]);

    // ========== React Router ==========
    const location = useLocation();
    const navigate = useNavigate();

    // map view -> path cho CommandPalette / Sidebar
    const viewToPath: Record<string, string> = {
        dashboard: '/admin/news',
        categories: '/admin/categories',
        bots: '/admin/bots',
        logs: '/admin/logs',
    };

    const handleNavigation = (view: string, action?: string) => {
        const path = viewToPath[view] ?? '/admin/news';
        navigate(path);
        if (action) {
            setActiveCommand({ view, action, timestamp: Date.now() });
        }
    };

    // Tiêu đề dựa theo pathname
    const pageTitle = useMemo(() => {
        if (location.pathname.startsWith('/admin/news/edit')) {
            return 'Edit Article';
        }
        switch (location.pathname) {
            case '/admin/news':
                return 'Dashboard';
            case '/admin/categories':
                return 'Categories Management';
            case '/admin/bots':
                return 'Crawler Bots';
            case '/admin/logs':
                return 'Crawler Logs';
            default:
                return 'Dashboard';
        }
    }, [location.pathname]);

    // ========== Handlers khác ==========
    const handleInputChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const { name, value } = e.target;
            setConfig(prev => ({ ...prev, [name]: value }));
        },
        [],
    );

    const handleSelectChange = useCallback(
        (e: React.ChangeEvent<HTMLSelectElement>) => {
            const { name, value } = e.target;
            setConfig(prev => ({ ...prev, [name]: value as CrawlerStatus }));
        },
        [],
    );

    const handleSave = () => {
        console.log('Saving configuration:', config);
        showToast('Configuration saved successfully!');
    };

    const handleSearchClick = useCallback(() => {
        setIsSearchOpen(true);
    }, []);

    return (
        <div className="flex min-h-screen bg-[#F7F7F8] text-gray-800 font-sans">
            {/* Sidebar điều hướng cho admin */}
            <Sidebar onSearchClick={handleSearchClick} />

            <main className="flex-1 p-4 sm:p-6 lg:p-8">
                <div className="w-full bg-white rounded-3xl shadow-sm p-6 lg:p-8">
                    <h1 className="text-2xl font-bold text-gray-800 mb-8">
                        {pageTitle}
                    </h1>

                    <div>
                        {/* Routes con cho khu vực /admin/* */}
                        <Routes>
                            <Route
                                path="news"
                                element={<Dashboard activeCommand={activeCommand} />}
                            />
                            <Route path="news/edit/:id" element={<ArticleEditPage />} />
                            <Route
                                path="categories"
                                element={<CategoriesView activeCommand={activeCommand} />}
                            />
                            <Route path="logs" element={<LogsView />} />
                            <Route
                                path="bots"
                                element={
                                    <BotsView
                                        config={config}
                                        onInputChange={handleInputChange}
                                        onSelectChange={handleSelectChange}
                                        onSave={handleSave}
                                        showToast={showToast}
                                        activeCommand={activeCommand}
                                    />
                                }
                            />
                            {/* fallback: /admin hoặc bất kỳ path lạ dưới /admin -> Dashboard */}
                            <Route
                                path="*"
                                element={<Dashboard activeCommand={activeCommand} />}
                            />
                        </Routes>
                    </div>
                </div>
            </main>

            <Toast
                message={toast.message}
                show={toast.show}
                onClose={() => setToast(prev => ({ ...prev, show: false }))}
            />

            <CommandPalette
                isOpen={isSearchOpen}
                onClose={() => setIsSearchOpen(false)}
                onNavigate={handleNavigation}
            />
        </div>
    );
};

// ================== ADMIN GUARD ==================
const AdminGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    // nếu trong useAdminAuth bạn set 'admin_username' thì xài đúng key này
    const isLoggedIn = Boolean(localStorage.getItem('admin_username'));

    if (!isLoggedIn) {
        // Chưa đăng nhập -> đẩy về trang login
        return <Navigate to="/admin/login" replace />;
    }

    // Đã login → cho render AdminLayout
    return <>{children}</>;
};

// ================== APP ROOT ==================
const App: React.FC = () => {
    return (
        <Routes>
            {/* Public client site */}
            <Route path="/" element={<Client />} />
            <Route path="/article/:id" element={<Client />} />
            <Route path="/search" element={<Client />} />

            {/* Admin login */}
            <Route path="/admin/login" element={<Login />} />

            {/* Admin dashboard – bọc guard */}
            <Route
                path="/admin/*"
                element={
                    <AdminGuard>
                        <AdminLayout />
                    </AdminGuard>
                }
            />
        </Routes>
    );
};

export default App;
