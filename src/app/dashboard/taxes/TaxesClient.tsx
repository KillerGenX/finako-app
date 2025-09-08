"use client";

import { useState, useEffect, useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { createTaxRate, updateTaxRate, deleteTaxRate, TaxFormState } from './actions';
import { Edit, Trash2, PlusCircle, X, Loader2, Info } from 'lucide-react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

// ============== TYPE DEFINITIONS ==============
type TaxRate = {
    id: string;
    name: string;
    rate: number;
    is_inclusive: boolean;
};

// ============== SUB-COMPONENTS ==============
const initialState: TaxFormState = { message: '' };

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
const TaxModal = ({ isOpen, onClose, taxRate }: { isOpen: boolean; onClose: () => void; taxRate: Partial<TaxRate> | null; }) => {
    const isEditing = !!taxRate?.id;
    const action = isEditing ? updateTaxRate : createTaxRate;
    const [state, formAction] = useActionState(action, initialState);

    useEffect(() => {
        if (state.message === 'success') onClose();
    }, [state, onClose]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex justify-center items-center p-4 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-semibold">{isEditing ? 'Edit Tarif Pajak' : 'Tambah Tarif Pajak'}</h3>
                    <button onClick={onClose}><X size={24} /></button>
                </div>
                <form action={formAction}>
                    {isEditing && <input type="hidden" name="tax_id" value={taxRate!.id} />}
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium">Nama Pajak</label>
                            <input id="name" name="name" type="text" defaultValue={taxRate?.name || ''} placeholder="Contoh: PPN" required className="mt-1 w-full p-2 border rounded bg-transparent" />
                            {state.errors?.name && <p className="text-red-500 text-xs mt-1">{state.errors.name.join(', ')}</p>}
                        </div>
                        <div>
                            <label htmlFor="rate" className="block text-sm font-medium">Tarif (%)</label>
                            <input id="rate" name="rate" type="number" step="0.01" defaultValue={taxRate?.rate || ''} placeholder="Contoh: 11" required className="mt-1 w-full p-2 border rounded bg-transparent" />
                            {state.errors?.rate && <p className="text-red-500 text-xs mt-1">{state.errors.rate.join(', ')}</p>}
                        </div>
                         <div className="flex items-start">
                            <div className="flex items-center h-5">
                                <input id="is_inclusive" name="is_inclusive" type="checkbox" defaultChecked={taxRate?.is_inclusive || false} className="h-4 w-4 text-teal-600 border-gray-300 rounded" />
                            </div>
                            <div className="ml-3 text-sm">
                                <label htmlFor="is_inclusive" className="font-medium">Harga Termasuk Pajak (Inclusive)</label>
                                <p className="text-gray-500 text-xs">Jika dicentang, pajak sudah termasuk dalam harga jual produk.</p>
                            </div>
                        </div>
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
export function TaxesClient({ allTaxRates }: { allTaxRates: TaxRate[] }) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTaxRate, setEditingTaxRate] = useState<Partial<TaxRate> | null>(null);
    const [modalKey, setModalKey] = useState(Date.now());

    const handleOpenModal = (taxRate: Partial<TaxRate> | null = null) => {
        setModalKey(Date.now());
        setEditingTaxRate(taxRate);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingTaxRate(null);
    };

    return (
        <>
            <div className="mb-6">
                <Link href="/dashboard/products/new" className="inline-flex items-center text-sm font-medium text-gray-600 hover:text-gray-900"><ArrowLeft className="h-4 w-4 mr-2" />Kembali ke Produk</Link>
                <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100 mt-2">Kelola Tarif Pajak</h1>
                <p className="mt-1 text-md text-gray-600 dark:text-gray-400">Atur semua tarif pajak yang berlaku di bisnis Anda.</p>
            </div>
            <div className="flex justify-end mb-6">
                 <button onClick={() => handleOpenModal()} className="inline-flex items-center px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700">
                    <PlusCircle className="h-5 w-5 mr-2" />
                    Tambah Tarif Pajak
                </button>
            </div>
            <div className="bg-white dark:bg-gray-900/50 p-6 rounded-lg border dark:border-gray-800">
                {allTaxRates.length === 0 ? (
                    <div className="text-center py-12"><h3 className="text-xl font-semibold">Belum Ada Tarif Pajak</h3><p className="text-gray-500 mt-2">Mulai dengan menambahkan tarif pajak pertama Anda.</p></div>
                ) : (
                    <div className="border rounded-lg">
                        <table className="min-w-full divide-y dark:divide-gray-700">
                            <thead className="bg-gray-50 dark:bg-gray-800">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium uppercase">Nama</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium uppercase">Tarif</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium uppercase">Tipe</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium uppercase">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y dark:divide-gray-700">
                                {allTaxRates.map((tax) => (
                                    <tr key={tax.id}>
                                        <td className="px-6 py-4 font-medium">{tax.name}</td>
                                        <td className="px-6 py-4 text-sm">{tax.rate}%</td>
                                        <td className="px-6 py-4 text-sm">
                                            <span className={`px-2 py-1 text-xs rounded-full ${tax.is_inclusive ? 'bg-blue-100 text-blue-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                                {tax.is_inclusive ? 'Inclusive' : 'Exclusive'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex gap-4 justify-end">
                                                <button onClick={() => handleOpenModal(tax)} className="text-blue-500 hover:text-blue-700" title="Edit"><Edit size={18} /></button>
                                                <form action={deleteTaxRate}><input type="hidden" name="tax_id" value={tax.id} /><DeleteButton /></form>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
            <TaxModal key={modalKey} isOpen={isModalOpen} onClose={handleCloseModal} taxRate={editingTaxRate} />
        </>
    );
}
