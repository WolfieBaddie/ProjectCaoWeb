// src/api/admin/adminAuthApi.ts
import { httpClient } from '@/src/api/httpClient';

export interface AdminLoginResponse {
    username: string;
    accessToken?: string | null;
}

export async function loginAdmin(
    username: string,
    password: string,
): Promise<AdminLoginResponse> {
    return httpClient.post<AdminLoginResponse>('/admin/login', {
        username,
        password,
    });
}
