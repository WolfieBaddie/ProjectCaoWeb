import React, { useState, useEffect } from 'react';
import Card from './Card.tsx';
import { ActiveCommand } from '../../../App.tsx';
import {useAdminArticleCategories} from "@/src/hooks/admin/useAdminArticleCategory.ts";
import { ApiError } from '../../api/admin/adminArticleCategory.ts';

interface CategoriesViewProps {
    activeCommand?: ActiveCommand | null;
}

const CategoriesView: React.FC<CategoriesViewProps> = ({ activeCommand }) => {
    const {
        categories,
        loading,
        error,
        refresh,
        handleUpdateCategory,
        handleDeleteCategory,
    } = useAdminArticleCategories();

    const [editingId, setEditingId] = useState<number | null>(null);
    const [editingName, setEditingName] = useState('');
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        if (
            activeCommand &&
            activeCommand.view === 'categories' &&
            activeCommand.action === 'add'
        ) {
            // nếu bạn sau này có API tạo category thì gọi ở đây
            handleAddNew();
        }
    }, [activeCommand]);

    const handleAddNew = () => {
        // TẠM THỜI: chưa có API tạo category -> để TODO
        // Sau này bạn có thể mở modal + gọi API createCategory, rồi refresh()
        const name = prompt('Nhập tên danh mục mới:');
        if (!name) return;
        alert('TODO: gọi API tạo danh mục, sau đó gọi refresh()');
        // ví dụ tương lai:
        // await createArticleCategory({ name });
        // await refresh();
    };

    const startEdit = (id: number, name: string) => {
        setEditingId(id);
        setEditingName(name);
        setFieldErrors({});
    };

    const cancelEdit = () => {
        setEditingId(null);
        setEditingName('');
        setFieldErrors({});
    };

    const submitEdit = async () => {
        if (editingId == null) return;

        try {
            await handleUpdateCategory(editingId, editingName);
            setEditingId(null);
        } catch (e) {
            const err = e as ApiError;
            setFieldErrors(err.errors ?? {});
        }
    };

    const onDelete = async (id: number) => {
        if (!window.confirm('Bạn có chắc muốn xóa mềm danh mục này?')) return;
        try {
            await handleDeleteCategory(id);
        } catch (e) {
            const err = e as ApiError;
            alert(err.message);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    {loading && (
                        <p className="text-sm text-gray-500">
                            Đang tải danh mục...
                        </p>
                    )}
                    {error && (
                        <p className="text-sm text-red-500">
                            {error.message}
                        </p>
                    )}
                </div>
                <button onClick={handleAddNew} className="btn-primary">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                        />
                    </svg>
                    <span>Add New Category</span>
                </button>
            </div>

            <Card className="p-0">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-gray-600">
                        <thead className="table-header">
                        <tr>
                            <th scope="col" className="px-6 py-3">
                                Category Name
                            </th>
                            <th scope="col" className="px-6 py-3">
                                Article Count
                            </th>
                            <th
                                scope="col"
                                className="px-6 py-3 text-right"
                            >
                                Actions
                            </th>
                        </tr>
                        </thead>
                        <tbody>
                        {categories.map((category) => (
                            <tr key={category.id} className="table-row">
                                <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">
                                    {editingId === category.id ? (
                                        <div className="flex flex-col gap-1">
                                            <input
                                                className="border rounded px-2 py-1 text-sm"
                                                value={editingName}
                                                onChange={(e) =>
                                                    setEditingName(
                                                        e.target.value,
                                                    )
                                                }
                                            />
                                            {fieldErrors.name && (
                                                <span className="text-xs text-red-500">
                                                        {fieldErrors.name}
                                                    </span>
                                            )}
                                        </div>
                                    ) : (
                                        category.name
                                    )}
                                </td>
                                <td className="px-6 py-4">
                                    {/* backend hiện tại chưa trả articleCount, nên để 0 hoặc '—' */}
                                    {'articleCount' in category
                                        ? // @ts-ignore nếu type chưa có articleCount
                                        (category as any).articleCount ??
                                        0
                                        : 0}
                                </td>
                                <td className="px-6 py-4 flex justify-end space-x-4">
                                    {editingId === category.id ? (
                                        <>
                                            <button
                                                onClick={submitEdit}
                                                className="btn-text"
                                            >
                                                Save
                                            </button>
                                            <button
                                                onClick={cancelEdit}
                                                className="btn-text-danger"
                                            >
                                                Cancel
                                            </button>
                                        </>
                                    ) : (
                                        <>
                                            <button
                                                className="btn-text"
                                                onClick={() =>
                                                    startEdit(
                                                        category.id,
                                                        category.name,
                                                    )
                                                }
                                            >
                                                Edit
                                            </button>
                                            <button
                                                className="btn-text-danger"
                                                onClick={() =>
                                                    onDelete(category.id)
                                                }
                                            >
                                                Delete
                                            </button>
                                        </>
                                    )}
                                </td>
                            </tr>
                        ))}

                        {categories.length === 0 && !loading && (
                            <tr>
                                <td
                                    colSpan={3}
                                    className="px-6 py-4 text-center text-sm text-gray-500"
                                >
                                    Không có danh mục nào.
                                </td>
                            </tr>
                        )}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
};

export default CategoriesView;
