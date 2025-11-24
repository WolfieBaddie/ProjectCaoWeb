import React, { useState, useEffect } from 'react';
import Card from './Card.tsx';
import { ActiveCommand } from '../../App.tsx';

const mockCategories = [
    { id: 1, name: 'Technology', articleCount: 42 },
    { id: 2, name: 'Business', articleCount: 28 },
    { id: 3, name: 'Sports', articleCount: 15 },
    { id: 4, name: 'Science', articleCount: 22 },
    { id: 5, name: 'Health', articleCount: 18 },
];

interface CategoriesViewProps {
    activeCommand?: ActiveCommand | null;
}

const CategoriesView: React.FC<CategoriesViewProps> = ({ activeCommand }) => {
    const [categories, setCategories] = useState(mockCategories);

    useEffect(() => {
        if (activeCommand && activeCommand.view === 'categories' && activeCommand.action === 'add') {
             // Defer slightly to ensure render
             setTimeout(handleAddNew, 50);
        }
    }, [activeCommand]);

    const handleAddNew = () => {
        const newCategoryName = prompt("Enter new category name:");
        if (newCategoryName) {
            const newCategory = {
                id: Math.max(...categories.map(c => c.id)) + 1,
                name: newCategoryName,
                articleCount: 0,
            };
            setCategories(prev => [...prev, newCategory]);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-end">
                <button
                    onClick={handleAddNew}
                    className="btn-primary"
                >
                     <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                    <span>Add New Category</span>
                </button>
            </div>
            
            <Card className="p-0">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-gray-600">
                        <thead className="table-header">
                            <tr>
                                <th scope="col" className="px-6 py-3">Category Name</th>
                                <th scope="col" className="px-6 py-3">Article Count</th>
                                <th scope="col" className="px-6 py-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {categories.map((category) => (
                                <tr key={category.id} className="table-row">
                                    <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">
                                        {category.name}
                                    </td>
                                    <td className="px-6 py-4">
                                        {category.articleCount}
                                    </td>
                                    <td className="px-6 py-4 flex justify-end space-x-4">
                                        <button className="btn-text">
                                            Edit
                                        </button>
                                        <button className="btn-text-danger">
                                            Delete
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
};

export default CategoriesView;