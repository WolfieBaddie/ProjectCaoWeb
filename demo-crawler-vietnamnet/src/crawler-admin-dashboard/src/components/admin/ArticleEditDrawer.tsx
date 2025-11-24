// src/components/admin/articles/ArticleEditDrawer.tsx

import React, { useEffect, useState } from 'react';
import {
    fetchArticleDetail,
    updateArticle,
    type ArticleDetail,
    type UpdateArticlePayload,
} from '../../api/admin/adminArticleApi'; // ⚠️ chỉnh lại path cho đúng dự án của bạn

export interface ArticleEditDrawerProps {
    articleId: number | null;
    open: boolean;
    onClose: () => void;
    // callback sau khi cập nhật thành công (để Dashboard refetch hoặc update local state)
    onSuccess?: (updated: ArticleDetail) => void;
}

const ArticleEditDrawer: React.FC<ArticleEditDrawerProps> = ({
                                                                 articleId,
                                                                 open,
                                                                 onClose,
                                                                 onSuccess,
                                                             }) => {
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [article, setArticle] = useState<ArticleDetail | null>(null);

    // form state
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [status, setStatus] = useState<string>('DRAFT');

    // ====== LOAD DETAIL KHI OPEN + CÓ articleId ======
    useEffect(() => {
        if (!open || !articleId) return;

        let cancelled = false;

        async function loadDetail() {
            try {
                setLoading(true);
                setError(null);
                const detail = await fetchArticleDetail(articleId);
                if (cancelled) return;

                setArticle(detail);
                setTitle(detail.title ?? '');
                setDescription(detail.description ?? '');
                setImageUrl(detail.imageUrl ?? null);
                setStatus(detail.status ?? 'DRAFT');
            } catch (e: any) {
                if (cancelled) return;
                console.error(e);
                setError(e?.message ?? 'Không tải được dữ liệu bài viết');
            } finally {
                if (!cancelled) setLoading(false);
            }
        }

        loadDetail();

        return () => {
            cancelled = true;
        };
    }, [open, articleId]);

    // ====== ĐÓNG FORM: reset local state ======
    const handleClose = () => {
        if (saving) return; // đang save thì không cho đóng
        setArticle(null);
        setError(null);
        setTitle('');
        setDescription('');
        setImageUrl(null);
        setStatus('DRAFT');
        onClose();
    };

    // ====== SUBMIT UPDATE ======
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!articleId) return;

        try {
            setSaving(true);
            setError(null);

            const payload: UpdateArticlePayload = {
                title,
                description,
                imageUrl,
                status,
            };

            const updated = await updateArticle(articleId, payload);

            if (onSuccess) {
                onSuccess(updated);
            }

            handleClose();
        } catch (e: any) {
            console.error(e);
            setError(e?.message ?? 'Không cập nhật được bài viết');
        } finally {
            setSaving(false);
        }
    };

    if (!open) return null;

    // ====== UI DRAWER ======
    return (
        <div className="fixed inset-0 z-40 flex">
            {/* backdrop */}
            <div
                className="flex-1 bg-black/30"
                onClick={saving ? undefined : handleClose}
            />

            {/* drawer bên phải */}
            <div className="w-full max-w-md bg-white shadow-xl flex flex-col">
                {/* Header */}
                <div className="px-4 py-3 border-b flex items-center justify-between">
                    <h2 className="text-sm font-semibold text-gray-900">
                        Edit Article
                    </h2>
                    <button
                        onClick={handleClose}
                        disabled={saving}
                        className="text-gray-400 hover:text-gray-600 text-sm"
                    >
                        ✕
                    </button>
                </div>

                {/* Body */}
                <form
                    onSubmit={handleSubmit}
                    className="flex-1 overflow-y-auto px-4 py-4 space-y-4"
                >
                    {/* trạng thái loading detail */}
                    {loading && (
                        <div className="text-xs text-gray-500">
                            Đang tải dữ liệu bài viết…
                        </div>
                    )}

                    {error && (
                        <div className="text-xs text-red-600 bg-red-50 border border-red-100 px-3 py-2 rounded-lg">
                            {error}
                        </div>
                    )}

                    {/* URL */}
                    <div className="space-y-1">
                        <label className="text-xs font-medium text-gray-700">
                            URL (read-only)
                        </label>
                        <input
                            type="text"
                            value={article?.url ?? ''}
                            readOnly
                            className="input-field text-xs bg-gray-100 cursor-not-allowed"
                        />
                    </div>

                    {/* Title */}
                    <div className="space-y-1">
                        <label className="text-xs font-medium text-gray-700">
                            Title
                        </label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="input-field text-xs"
                            required
                        />
                    </div>

                    {/* Description */}
                    <div className="space-y-1">
                        <label className="text-xs font-medium text-gray-700">
                            Description
                        </label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="input-field text-xs min-h-[80px]"
                        />
                    </div>

                    {/* GALLERY ẢNH TỪ ArticleImage */}
                    {article && article.images && article.images.length > 0 && (
                        <div className="space-y-2">
                            <label className="text-xs font-medium text-gray-700">
                                Images (click để chọn làm ảnh chính)
                            </label>
                            <div className="grid grid-cols-3 gap-2">
                                {article.images.map((img) => {
                                    const isActive = imageUrl === img.url;
                                    const thumbSrc = img.thumbSmall || img.thumb || img.url;
                                    return (
                                        <button
                                            type="button"
                                            key={img.id}
                                            onClick={() => setImageUrl(img.url)}
                                            className={`relative border rounded-lg overflow-hidden focus:outline-none ${
                                                isActive
                                                    ? 'border-sky-500 ring-2 ring-sky-300'
                                                    : 'border-gray-200'
                                            }`}
                                        >
                                            <div className="w-full pb-[75%] bg-gray-100 relative">
                                                <img
                                                    src={thumbSrc}
                                                    alt={img.alt || ''}
                                                    className="absolute inset-0 w-full h-full object-cover"
                                                />
                                            </div>
                                            {img.caption && (
                                                <div className="px-1 py-0.5 text-[10px] text-gray-600 line-clamp-2 bg-white/80">
                                                    {img.caption}
                                                </div>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                            <p className="text-[10px] text-gray-400">
                                Ảnh đang chọn sẽ được set làm <code>imageUrl</code> của bài.
                            </p>
                        </div>
                    )}

                    {/* Status */}
                    <div className="space-y-1">
                        <label className="text-xs font-medium text-gray-700">
                            Status
                        </label>
                        <select
                            value={status}
                            onChange={(e) => setStatus(e.target.value)}
                            className="input-field text-xs"
                        >
                            <option value="DRAFT">DRAFT</option>
                            <option value="PUBLISHED">PUBLISHED</option>
                            <option value="FAILED">FAILED</option>
                            <option value="DELETED">DELETED</option>
                        </select>
                    </div>

                    {/* Footer buttons */}
                    <div className="pt-2 flex justify-end gap-2 border-t mt-4">
                        <button
                            type="button"
                            onClick={handleClose}
                            disabled={saving}
                            className="px-3 py-2 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-100"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            className="px-3 py-2 rounded-lg text-xs font-medium bg-sky-600 text-white hover:bg-sky-700 disabled:opacity-60"
                        >
                            {saving ? 'Saving…' : 'Save changes'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ArticleEditDrawer;
