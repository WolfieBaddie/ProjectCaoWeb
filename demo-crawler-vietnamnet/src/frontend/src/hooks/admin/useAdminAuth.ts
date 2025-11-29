import { useState } from 'react';
import { loginAdmin, AdminLoginResponse } from '@/src/api/admin/adminAuthApi';
import { HttpError } from '@/src/api/httpClient';

export function useAdminAuth() {
    const [loading, setLoading] = useState(false);
    const [error, setError]   = useState<string | null>(null);

    async function login(
        username: string,
        password: string,
    ): Promise<AdminLoginResponse | null> {
        setLoading(true);
        setError(null);

        try {
            const res = await loginAdmin(username, password);

            if (!res || !res.username) {
                setError('Phản hồi đăng nhập không hợp lệ.');
                return null;
            }

            // ✅ lưu trạng thái đã login cho AdminGuard (chỉ lưu username, không phải token)
            localStorage.setItem('admin_username', res.username);

            return res;
        } catch (err: unknown) {
            if (err instanceof HttpError) {
                if (err.status === 400 || err.status === 401) {
                    setError('Sai username hoặc mật khẩu.');
                } else {
                    setError(`Lỗi đăng nhập (HTTP ${err.status}).`);
                }
            } else if (err instanceof Error) {
                setError(err.message);
            } else {
                setError('Đăng nhập thất bại, vui lòng thử lại.');
            }
            return null;
        } finally {
            setLoading(false);
        }
    }

    function logout() {
        // Xoá flag frontend
        localStorage.removeItem('admin_username');
        // TODO: nếu sau này bạn làm /admin/logout để clear cookie JWT thì gọi thêm ở đây
        window.location.href = '/admin/login';
    }

    return { login, logout, loading, error };
}
