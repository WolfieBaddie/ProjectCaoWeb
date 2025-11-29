// src/pages/admin/LoginPage.tsx

import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAdminAuth } from '@/src/hooks/admin/useAdminAuth.ts';

const Login: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { login, loading, error } = useAdminAuth();

    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [touched, setTouched] = useState(false);

    const hasBasicError =
        touched && (username.trim().length === 0 || password.trim().length === 0);

    //THÊM: check query ?expired=1
    const searchParams = new URLSearchParams(location.search);
    const isExpired = searchParams.get('expired') === '1';
    const redirect = searchParams.get('redirect') || '/admin/news';

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setTouched(true);
        if (!username.trim() || !password.trim()) return;

        const res = await login(username.trim(), password);
        if (res) {
            navigate(redirect, { replace: true });
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
            <div className="w-full max-w-md bg-white shadow-lg rounded-xl border border-slate-200">
                {/* Header giống style ArticleEditPage */}
                <div className="border-b px-6 py-4">
                    <h1 className="text-base font-semibold text-gray-900">
                        Admin Login
                    </h1>
                    <p className="text-xs text-gray-500 mt-1">
                        Đăng nhập để truy cập trang quản trị.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
                    {isExpired && (
                        <div className="text-xs text-amber-700 bg-amber-50 border border-amber-100 px-3 py-2 rounded-lg">
                            Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại.
                        </div>
                    )}

                    {/* Error từ backend */}
                    {error && (
                        <div className="text-xs text-red-600 bg-red-50 border border-red-100 px-3 py-2 rounded-lg">
                            {error}
                        </div>
                    )}

                    {/* Username */}
                    <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">
                            Tên đăng nhập
                        </label>
                        <input
                            type="text"
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                            value={username}
                            onChange={e => setUsername(e.target.value)}
                            onBlur={() => setTouched(true)}
                            placeholder="Nhập username..."
                        />
                    </div>

                    {/* Password */}
                    <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">
                            Mật khẩu
                        </label>
                        <input
                            type="password"
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            onBlur={() => setTouched(true)}
                            placeholder="Nhập mật khẩu..."
                        />
                    </div>

                    {/* Basic validation */}
                    {hasBasicError && (
                        <p className="text-xs text-red-500">
                            Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu.
                        </p>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full inline-flex items-center justify-center px-4 py-2.5 rounded-lg bg-sky-600 text-white text-sm font-semibold hover:bg-sky-700 disabled:opacity-60"
                    >
                        {loading ? 'Đang đăng nhập…' : 'Đăng nhập'}
                    </button>

                    <p className="text-[11px] text-gray-400 text-center mt-2">
                        Phiên đăng nhập sẽ được bảo vệ bằng JWT trong cookie{' '}
                        <span className="font-mono">AUTH_TOKEN</span>.
                    </p>
                </form>
            </div>
        </div>
    );
};

export default Login;
