"use client";

import { useState, useEffect } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import { createCategory, updateCategory, deleteCategory, CategoryFormState } from './actions';
import { Edit, Trash2, PlusCircle, X, Loader2, Info, GitBranch } from 'lucide-react';

// ============== TYPE DEFINITIONS ==============
type Category = {
    id: string;
    name: string;
    description: string | null;
    parent: { name: string } | null;
    parent_id?: string | null;
};

// ============== SUB-COMPONENTS ==============
const initialState: CategoryFormState = { message: '', errors: {} };

function SubmitButton({ isEditing }: { isEditing: boolean }) {
    const { pending } = useFormStatus();
    return (
        <button type="submit" disabled={pending} className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50">
            {pending ? <Loader2 className="animate-spin" /> : (isEditing ? 'Simpan Perubahan' : 'Simpan Kategori')}
        </button>
    );
}

function DeleteButton() {
    const { pending } = useFormStatus();
    return (
        <button type="submit" disabled={pending} className="text-red-500 hover:text-red-700 disabled:opacity-50" title="Hapus">
             {pending ? <Loader2 className="animate-spin" /> : <Trash2 size={18} />}
        </button>
    )
}

// ============== MODAL COMPONENT ==============
const CategoryModal = ({ isOpen, onClose, category, allCategories }: { isOpen: boolean; onClose: () => void; category: Partial<Category> | null; allCategories: Category[]; }) => {
    const isEditing = !!category?.id;
    const action = isEditing ? updateCategory : createCategory;
    const [state, formAction] = useFormState(action, initialState);
    
    useEffect(() => {
        if (state.message === 'success') {
            onClose();
        }
    }, [state, onClose]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex justify-center items-center p-4 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-semibold">{isEditing ? 'Edit Kategori' : 'Tambah Kategori Baru'}</h3>
                    <button onClick={onClose}><X size={24} /></button>
                </div>
                <form action={formAction}>
                    {isEditing && <input type="hidden" name="category_id" value={category!.id} />}
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium">Nama Kategori</label>
                            <input id="name" name="name" type="text" defaultValue={category?.name || ''} required className="mt-1 w-full p-2 border rounded bg-transparent" />
                            {state.errors?.name && <p className="text-red-500 text-xs mt-1">{state.errors.name.join(', ')}</p>}
                        </div>
                        <div>
                            <label htmlFor="parent_id" className="block text-sm font-medium">Induk Kategori (Opsional)</label>
                            <select id="parent_id" name="parent_id" defaultValue={category?.parent_id || 'null'} className="mt-1 w-full p-2 border rounded bg-transparent">
                                <option value="null">-- Tidak Ada Induk --</option>
                                {allCategories.filter(c => c.id !== category?.id).map(c => (<option key={c.id} value={c.id}>{c.name}</option>))}
                            </select>
                            {state.errors?.parent_id && <p className="text-red-500 text-xs mt-1">{state.errors.parent_id.join(', ')}</p>}
                        </div>
                        <div>
                            <label htmlFor="description" className="block text-sm font-medium">Deskripsi</label>
                            <textarea id="description" name="description" rows={3} defaultValue={category?.description || ''} className="mt-1 w-full p-2 border rounded bg-transparent"></textarea>
                            {state.errors?.description && <p className="text-red-500 text-xs mt-1">{state.errors.description.join(', ')}</p>}
                        </div>
                    </div>
                    {state.message && state.message !== 'success' && <p className="text-red-500 text-sm mt-4"><Info size={16} className="inline mr-2"/>{state.message}</p>}
                    <div className="mt-6 flex justify-end gap-3">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 dark:bg-gray-600 rounded-lg">Batal</button>
                        <SubmitButton isEditing={isEditing} />
                    </div>
                </form>
            </div>
        </div>
    );
};

// ============== MAIN COMPONENT ==============
export function CategoriesTable({ allCategories }: { allCategories: Category[] }) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<Partial<Category> | null>(null);

    const handleOpenModal = (category: Partial<Category> | null = null) => {
        setEditingCategory(category);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingCategory(null);
    };

    return (
        <>
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">Kategori Produk</h1>
                    <p className="mt-1 text-md text-gray-600 dark:text-gray-400">Kelola semua kategori untuk mengelompokkan produk Anda.</p>
                </div>
                <button onClick={() => handleOpenModal()} className="inline-flex items-center px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700">
                    <PlusCircle className="h-5 w-5 mr-2" />
                    Tambah Kategori Baru
                </button>
            </div>
            <div className="bg-white dark:bg-gray-900/50 p-6 rounded-lg border dark:border-gray-800">
                {allCategories.length === 0 ? (
                    <div className="text-center py-12"><h3 className="text-xl font-semibold">Belum Ada Kategori</h3><p className="text-gray-500 mt-2">Mulai dengan menambahkan kategori pertama Anda.</p></div>
                ) : (
                    <div className="border rounded-lg">
                        <table className="min-w-full divide-y dark:divide-gray-700">
                            <thead className="bg-gray-50 dark:bg-gray-800">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium uppercase">Nama</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium uppercase">Induk Kategori</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium uppercase">Deskripsi</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium uppercase">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y dark:divide-gray-700">
                                {allCategories.map((cat) => (
                                    <tr key={cat.id}>
                                        <td className="px-6 py-4 font-medium">{cat.name}</td>
                                        <td className="px-6 py-4 text-sm text-gray-500">{cat.parent ? <span className="flex items-center gap-2"><GitBranch size={16} /> {cat.parent.name}</span> : '-'}</td>
                                        <td className="px-6 py-4 text-sm text-gray-500">{cat.description || '-'}</td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex gap-4 justify-end">
                                                <button onClick={() => handleOpenModal(cat)} className="text-blue-500 hover:text-blue-700" title="Edit"><Edit size={18} /></button>
                                                <form action={deleteCategory}><input type="hidden" name="category_id" value={cat.id} /><DeleteButton /></form>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
            <CategoryModal isOpen={isModalOpen} onClose={handleCloseModal} category={editingCategory} allCategories={allCategories} />
        </>
    );
}
