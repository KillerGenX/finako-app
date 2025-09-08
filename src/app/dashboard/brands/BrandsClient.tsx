"use client";

import { useState, useEffect, useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { createBrand, updateBrand, deleteBrand, BrandFormState } from './actions';
import { Edit, Trash2, PlusCircle, X, Loader2, Info } from 'lucide-react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

// ============== TYPE DEFINITIONS ==============
type Brand = {
    id: string;
    name: string;
};

// ============== SUB-COMPONENTS ==============
const initialState: BrandFormState = { message: '' };

function SubmitButton({ isEditing }: { isEditing: boolean }) {
    const { pending } = useFormStatus();
    return (
        <button type="submit" disabled={pending} className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50">
            {pending ? <Loader2 className="animate-spin" /> : (isEditing ? 'Simpan' : 'Submit')}
        </button>
    );
}

function DeleteButton() {
    const { pending } = useFormStatus();
    return (
        <button type="submit" disabled={pending} className="text-red-500 hover:text-red-700 disabled:opacity-50" title="Hapus">
            {pending ? <Loader2 className="animate-spin" /> : <Trash2 size={18} />}
        </button>
    );
}

// ============== MODAL COMPONENT ==============
const BrandModal = ({ isOpen, onClose, brand }: { isOpen: boolean; onClose: () => void; brand: Partial<Brand> | null; }) => {
    const isEditing = !!brand?.id;
    const action = isEditing ? updateBrand : createBrand;
    const [state, formAction] = useActionState(action, initialState);

    useEffect(() => {
        if (state.message === 'success') onClose();
    }, [state, onClose]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex justify-center items-center p-4 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-semibold">{isEditing ? 'Edit Merek' : 'Tambah Merek Baru'}</h3>
                    <button onClick={onClose}><X size={24} /></button>
                </div>
                <form action={formAction}>
                    {isEditing && <input type="hidden" name="brand_id" value={brand!.id} />}
                    <div>
                        <label htmlFor="name" className="block text-sm font-medium">Nama Merek</label>
                        <input id="name" name="name" type="text" defaultValue={brand?.name || ''} required className="mt-1 w-full p-2 border rounded bg-transparent" />
                        {state.errors?.name && <p className="text-red-500 text-xs mt-1">{state.errors.name.join(', ')}</p>}
                    </div>
                    {state.message && state.message !== 'success' && <p className="text-red-500 text-sm mt-4 flex items-center gap-2"><Info size={16} />{state.message}</p>}
                    <div className="mt-6 flex justify-end gap-3">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 rounded-lg">Batal</button>
                        <SubmitButton isEditing={isEditing} />
                    </div>
                </form>
            </div>
        </div>
    );
};

// ============== MAIN COMPONENT ==============
export function BrandsClient({ allBrands }: { allBrands: Brand[] }) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingBrand, setEditingBrand] = useState<Partial<Brand> | null>(null);
    const [modalKey, setModalKey] = useState(Date.now());

    const handleOpenModal = (brand: Partial<Brand> | null = null) => {
        setModalKey(Date.now());
        setEditingBrand(brand);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingBrand(null);
    };

    return (
        <>
            <div className="mb-6">
                <Link href="/dashboard/products/new" className="inline-flex items-center text-sm font-medium text-gray-600 hover:text-gray-900"><ArrowLeft className="h-4 w-4 mr-2" />Kembali ke Produk</Link>
                <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100 mt-2">Kelola Merek</h1>
                <p className="mt-1 text-md text-gray-600 dark:text-gray-400">Tambah, edit, atau hapus merek untuk produk Anda.</p>
            </div>
            <div className="flex justify-end mb-6">
                 <button onClick={() => handleOpenModal()} className="inline-flex items-center px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700">
                    <PlusCircle className="h-5 w-5 mr-2" />
                    Tambah Merek Baru
                </button>
            </div>
            <div className="bg-white dark:bg-gray-900/50 p-6 rounded-lg border dark:border-gray-800">
                {allBrands.length === 0 ? (
                    <div className="text-center py-12"><h3 className="text-xl font-semibold">Belum Ada Merek</h3><p className="text-gray-500 mt-2">Mulai dengan menambahkan merek pertama Anda.</p></div>
                ) : (
                    <div className="border rounded-lg">
                        <table className="min-w-full divide-y dark:divide-gray-700">
                            <thead className="bg-gray-50 dark:bg-gray-800">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium uppercase">Nama Merek</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium uppercase">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y dark:divide-gray-700">
                                {allBrands.map((brand) => (
                                    <tr key={brand.id}>
                                        <td className="px-6 py-4 font-medium">{brand.name}</td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex gap-4 justify-end">
                                                <button onClick={() => handleOpenModal(brand)} className="text-blue-500 hover:text-blue-700" title="Edit"><Edit size={18} /></button>
                                                <form action={deleteBrand}><input type="hidden" name="brand_id" value={brand.id} /><DeleteButton /></form>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
            <BrandModal key={modalKey} isOpen={isModalOpen} onClose={handleCloseModal} brand={editingBrand} />
        </>
    );
}
