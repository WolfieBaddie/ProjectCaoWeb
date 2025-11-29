// src/pages/admin/ArticleEditPage.tsx

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
    fetchArticleForEdit,
    updateArticle,
    type ArticleDetail,
    type UpdateArticlePayload,
} from '../api/admin/adminArticleApi';
import { CKEditor } from '@ckeditor/ckeditor5-react';
import ClassicEditor from '@ckeditor/ckeditor5-build-classic';

const ArticleEditPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [article, setArticle] = useState<ArticleDetail | null>(null);

    // form state
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [content, setContent] = useState('');
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [status, setStatus] = useState<string>('DRAFT');

    // load detail
    useEffect(() => {
        if (!id) return;
        let cancelled = false;

        async function load() {
            try {
                setLoading(true);
                setError(null);
                const detail = await fetchArticleForEdit(Number(id));
                if (cancelled) return;

                setArticle(detail);
                setTitle(detail.title ?? '');
                setDescription(detail.description ?? '');
                setContent(detail.content ?? '');
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

        load();
        return () => {
            cancelled = true;
        };
    }, [id]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!id) return;

        try {
            setSaving(true);
            setError(null);

            const payload: UpdateArticlePayload = {
                title,
                description,
                content,
                imageUrl,
                status,
            };

            await updateArticle(Number(id), payload);

            // sau khi save xong quay lại dashboard
            navigate('/admin/news');
        } catch (e: any) {
            console.error(e);
            setError(e?.message ?? 'Không cập nhật được bài viết');
        } finally {
            setSaving(false);
        }
    };

    const handleSelectImage = (url: string) => {
        setImageUrl(url);
    };

    return (
        <div className="min-h-screen bg-slate-50">
            <header className="border-b bg-white">
                <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
                    <div>
                        <h1 className="text-base font-semibold text-gray-900">
                            Edit Article
                        </h1>
                        {article && (
                            <p className="text-xs text-gray-500">
                                ID: {article.id} · Category: {article.categoryName ?? 'N/A'}
                            </p>
                        )}
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                        <Link
                            to="/admin/news"
                            className="px-3 py-1.5 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-100"
                        >
                            Back to Dashboard
                        </Link>
                        <button
                            type="submit"
                            form="article-edit-form"
                            disabled={saving}
                            className="px-3 py-1.5 rounded-lg bg-sky-600 text-white font-medium hover:bg-sky-700 disabled:opacity-60"
                        >
                            {saving ? 'Saving…' : 'Save'}
                        </button>
                    </div>
                </div>
            </header>

            <main className="mx-auto max-w-6xl px-4 py-4">
                {loading && (
                    <p className="text-xs text-gray-500">Đang tải dữ liệu…</p>
                )}

                {error && (
                    <div className="mb-3 text-xs text-red-600 bg-red-50 border border-red-100 px-3 py-2 rounded-lg">
                        {error}
                    </div>
                )}

                {article && (
                    <form
                        id="article-edit-form"
                        onSubmit={handleSubmit}
                        className="grid grid-cols-1 lg:grid-cols-3 gap-4"
                    >
                        {/* left column: meta fields */}
                        <div className="space-y-4 lg:col-span-1">
                            <div className="card bg-white rounded-2xl border border-gray-100 p-4 shadow-sm space-y-2">
                                <label className="text-xs font-medium text-gray-700">
                                    URL (read-only)
                                </label>
                                <input
                                    type="text"
                                    value={article.url}
                                    readOnly
                                    className="input-field text-xs bg-gray-100 cursor-not-allowed"
                                />
                            </div>

                            <div className="card bg-white rounded-2xl border border-gray-100 p-4 shadow-sm space-y-3">
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

                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-gray-700">
                                        Main image URL
                                    </label>
                                    <input
                                        type="text"
                                        value={imageUrl ?? ''}
                                        onChange={(e) =>
                                            setImageUrl(e.target.value || null)
                                        }
                                        className="input-field text-xs"
                                    />
                                </div>
                            </div>

                            {/* gallery images */}
                            {article.images && article.images.length > 0 && (
                                <div className="card bg-white rounded-2xl border border-gray-100 p-4 shadow-sm space-y-2">
                                    <label className="text-xs font-medium text-gray-700">
                                        Images (click để chọn làm ảnh chính)
                                    </label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {article.images.map((img) => {
                                            const isActive = imageUrl === img.url;
                                            const thumbSrc =
                                                img.thumbSmall || img.thumb || img.url;
                                            return (
                                                <button
                                                    type="button"
                                                    key={img.id}
                                                    onClick={() => handleSelectImage(img.url)}
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
                                        Ảnh đang chọn sẽ được set làm{' '}
                                        <code>imageUrl</code> của bài.
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* right column: CKEditor content */}
                        <div className="lg:col-span-2">
                            <div className="card bg-white rounded-2xl border border-gray-100 p-4 shadow-sm space-y-2">
                                <label className="text-xs font-medium text-gray-700">
                                    Content
                                </label>
                                <div className="border border-gray-200 rounded-lg overflow-hidden">
                                    <CKEditor
                                        editor={ClassicEditor}
                                        data={content}
                                        onChange={(_, editor) => {
                                            // @ts-ignore
                                            const data = editor.getData();
                                            setContent(data);
                                        }}
                                    />
                                </div>
                            </div>
                        </div>
                    </form>
                )}
            </main>
        </div>
    );
};

export default ArticleEditPage;
