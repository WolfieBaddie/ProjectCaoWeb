import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

interface NavIconProps {
    children: React.ReactNode;
    tooltip: string;
    isActive: boolean;
    onClick: () => void;
}

const NavIcon: React.FC<NavIconProps> = ({ children, tooltip, isActive, onClick }) => (
    <div className="group relative flex justify-center">
        <button
            type="button"
            onClick={onClick}
            className={`nav-icon ${isActive ? 'nav-icon-active' : 'nav-icon-inactive'}`}
        >
            {children}
        </button>
        <span className="absolute left-full ml-4 w-auto p-2 min-w-max rounded-md shadow-md text-white bg-gray-900 text-xs font-bold transition-all duration-100 scale-0 origin-left group-hover:scale-100 z-10">
            {tooltip}
        </span>
    </div>
);

const UserAvatar = () => (
    <img
        className="h-8 w-8 rounded-full object-cover"
        src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=50&q=80"
        alt="User avatar"
    />
);

interface SidebarProps {
    onSearchClick: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ onSearchClick }) => {
    const navigate = useNavigate();
    const location = useLocation();

    // map pathname -> view name để tô active icon
    const currentView = (() => {
        const path = location.pathname || '';

        if (path.startsWith('/admin/contents')) return 'contents';
        if (path.startsWith('/admin/categories')) return 'categories';
        if (path.startsWith('/admin/bots')) return 'bots';
        if (path.startsWith('/admin/logs')) return 'logs';
        // default: dashboard (/admin/news, /admin, v.v.)
        return 'dashboard';
    })();

    return (
        <aside className="w-20 bg-white/80 backdrop-blur-lg flex flex-col items-center py-6 space-y-6 border-r border-gray-200/80 sticky top-0 h-screen z-20">
            {/* Logo + search */}
            <div className="flex flex-col items-center space-y-4">
                {/* Logo bấm về /admin/news */}
                <button
                    type="button"
                    onClick={() => navigate('/admin/news')}
                    className="h-10 w-10 rounded-2xl bg-gray-900 text-white flex items-center justify-center font-black tracking-tight shadow-sm hover:bg-gray-800 transition-colors"
                >
                    VN
                </button>

                {/* Search button */}
                <button
                    type="button"
                    onClick={onSearchClick}
                    className="p-3 rounded-2xl bg-gray-100 hover:bg-gray-200 transition-colors"
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 text-gray-500"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <circle cx="11" cy="11" r="6" />
                        <line x1="16.5" y1="16.5" x2="21" y2="21" />
                    </svg>
                </button>
            </div>

            {/* Nav icons chính */}
            <nav className="flex flex-col items-center space-y-4 flex-1 overflow-y-auto w-full no-scrollbar">
                {/* Dashboard */}
                <NavIcon
                    tooltip="Dashboard"
                    isActive={currentView === 'dashboard'}
                    onClick={() => navigate('/admin/news')}
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <path d="M3 11L12 3l9 8" />
                        <path d="M5 10v10h5v-6h4v6h5V10" />
                    </svg>
                </NavIcon>

                {/* Categories */}
                <NavIcon
                    tooltip="Categories"
                    isActive={currentView === 'categories'}
                    onClick={() => navigate('/admin/categories')}
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <rect x="3" y="3" width="7" height="7" rx="1" />
                        <rect x="14" y="3" width="7" height="7" rx="1" />
                        <rect x="14" y="14" width="7" height="7" rx="1" />
                        <rect x="3" y="14" width="7" height="7" rx="1" />
                    </svg>
                </NavIcon>

                {/* Crawler Bots */}
                <NavIcon
                    tooltip="Crawler Bots"
                    isActive={currentView === 'bots'}
                    onClick={() => navigate('/admin/bots')}
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <rect x="9" y="3" width="6" height="4" rx="1" />
                        <rect x="4" y="7" width="16" height="10" rx="2" />
                        <path d="M8 21h2" />
                        <path d="M14 21h2" />
                        <path d="M7 11h.01" />
                        <path d="M17 11h.01" />
                    </svg>
                </NavIcon>

                {/* Crawler Logs */}
                <NavIcon
                    tooltip="Crawler Logs"
                    isActive={currentView === 'logs'}
                    onClick={() => navigate('/admin/logs')}
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <path d="M11 3h7a2 2 0 0 1 2 2v14l-4-2-4 2V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v12" />
                        <path d="M5 7h4" />
                        <path d="M5 11h3" />
                    </svg>
                </NavIcon>
            </nav>

            {/* bottom section: settings + avatar */}
            <div className="flex flex-col items-center space-y-4">
                <button
                    type="button"
                    className="p-3 rounded-2xl bg-gray-100 hover:bg-gray-200 transition-colors"
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 text-gray-500"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <circle cx="12" cy="12" r="3" />
                        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 8 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 3.6 15a1.65 1.65 0 0 0-1.51-1H2a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 3.6 8a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 8 3.6 1.65 1.65 0 0 0 9.51 2.09H10a2 2 0 0 1 4 0v.09A1.65 1.65 0 0 0 16 3.6a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 20.4 8a1.65 1.65 0 0 0 1.51 1H22a2 2 0 0 1 0 4h-.09A1.65 1.65 0 0 0 19.4 15z" />
                    </svg>
                </button>
                <UserAvatar />
            </div>
        </aside>
    );
};

export default Sidebar;
