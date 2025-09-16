"use client";

import { useState, useEffect, useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import Link from 'next/link'; // Import Link
import { createOutlet, updateOutlet, deleteOutlet, OutletFormState } from './actions';
import { Edit, Trash2, PlusCircle, X, Loader2, Info, Store, Warehouse } from 'lucide-react';

// ============== TYPE DEFINITIONS ==============
type Outlet = {
    id: string;
    name: string;
    address: string | null;
    phone_number: string | null;
    location_types: string[];
};

const LOCATION_TYPES = [
    { id: 'store', label: 'Toko/Gerai', icon: Store },
    { id: 'warehouse', label: 'Gudang', icon: Warehouse },
    { id: 'office', label: 'Kantor', icon: null },
    { id: 'other', label: 'Lainnya', icon: null },
];

// ============== SUB-COMPONENTS FOR ACTIONS ==============
const initialState: OutletFormState = { message: '' };

function SubmitButton({ isEditing }: { isEditing: boolean }) {
    const { pending } = useFormStatus();
    return (
        <button type="submit" disabled={pending} className="inline-flex items-center justify-center px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50">
            {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : (isEditing ? 'Simpan' : 'Submit')}
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
const OutletModal = ({ isOpen, onClose, outlet }: { isOpen: boolean; onClose: () => void; outlet: Partial<Outlet> | null; }) => {
    const isEditing = !!outlet?.id;
    const action = isEditing ? updateOutlet : createOutlet;
    const [state, formAction] = useActionState(action, initialState);

    useEffect(() => {
        if (state.message === 'success') {
            onClose();
        }
    }, [state, onClose]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex justify-center items-center p-4 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-lg">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-semibold">{isEditing ? 'Edit Outlet' : 'Tambah Outlet Baru'}</h3>
                    <button onClick={onClose}><X size={24} /></button>
                </div>
                <form action={formAction}>
                    {isEditing && <input type="hidden" name="outlet_id" value={outlet!.id} />}
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium">Nama Outlet/Lokasi</label>
                            <input id="name" name="name" type="text" defaultValue={outlet?.name || ''} required className="mt-1 w-full p-2 border rounded bg-transparent" />
                            {state.errors?.name && <p className="text-red-500 text-xs mt-1">{state.errors.name.join(', ')}</p>}
                        </div>
                        <div>
                            <label htmlFor="address" className="block text-sm font-medium">Alamat (Opsional)</label>
                            <textarea id="address" name="address" rows={3} defaultValue={outlet?.address || ''} className="mt-1 w-full p-2 border rounded bg-transparent"></textarea>
                        </div>
                        <div>
                            <label htmlFor="phone_number" className="block text-sm font-medium">No. Telepon (Opsional)</label>
                            <input id="phone_number" name="phone_number" type="tel" defaultValue={outlet?.phone_number || ''} className="mt-1 w-full p-2 border rounded bg-transparent" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium">Tipe Lokasi</label>
                            <div className="mt-2 grid grid-cols-2 gap-2">
                                {LOCATION_TYPES.map(type => (
                                    <label key={type.id} className="flex items-center gap-2 p-2 border rounded has-[:checked]:bg-teal-50 has-[:checked]:border-teal-300">
                                        <input type="checkbox" name="location_types" value={type.id} defaultChecked={outlet?.location_types?.includes(type.id)} />
                                        <span>{type.label}</span>
                                    </label>
                                ))}
                            </div>
                            {state.errors?.location_types && <p className="text-red-500 text-xs mt-1">{state.errors.location_types.join(', ')}</p>}
                        </div>
                    </div>
                    {state.message && state.message !== 'success' && <p className="text-red-500 text-sm mt-4 flex items-center gap-2"><Info size={16} />{state.message}</p>}
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
export function OutletsClient({ allOutlets }: { allOutlets: Outlet[] }) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingOutlet, setEditingOutlet] = useState<Partial<Outlet> | null>(null);
    const [modalKey, setModalKey] = useState(Date.now());

    const handleOpenModal = (outlet: Partial<Outlet> | null = null) => {
        setModalKey(Date.now());
        setEditingOutlet(outlet);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingOutlet(null);
    };

    return (
        <>
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">Outlet & Lokasi</h1>
                    <p className="mt-1 text-md text-gray-600 dark:text-gray-400">Kelola semua lokasi fisik bisnis Anda.</p>
                </div>
                <button onClick={() => handleOpenModal()} className="inline-flex items-center px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700">
                    <PlusCircle className="h-5 w-5 mr-2" />
                    Tambah Outlet
                </button>
            </div>
            <div className="bg-white dark:bg-gray-900/50 p-6 rounded-lg border dark:border-gray-800">
                {allOutlets.length === 0 ? (
                    <div className="text-center py-12"><h3 className="text-xl font-semibold">Belum Ada Outlet</h3><p className="text-gray-500 mt-2">Mulai dengan menambahkan lokasi pertama Anda.</p></div>
                ) : (
                    <div className="border rounded-lg">
                        <table className="min-w-full divide-y dark:divide-gray-700">
                            <thead className="bg-gray-50 dark:bg-gray-800">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium uppercase">Nama</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium uppercase">Alamat</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium uppercase">Tipe</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium uppercase">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y dark:divide-gray-700">
                                {allOutlets.map((outlet) => (
                                    <tr key={outlet.id}>
                                        <td className="px-6 py-4 font-medium">
                                            <Link href={`/dashboard/outlets/${outlet.id}`} className="hover:underline text-teal-600">
                                                {outlet.name}
                                            </Link>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500">{outlet.address || '-'}</td>
                                        <td className="px-6 py-4 text-sm text-gray-500">
                                            <div className="flex flex-wrap gap-1">
                                                {outlet.location_types.map(type => {
                                                    const typeInfo = LOCATION_TYPES.find(t => t.id === type);
                                                    return <span key={type} className="px-2 py-1 text-xs rounded-full bg-gray-100 dark:bg-gray-700">{typeInfo?.label || type}</span>
                                                })}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex gap-4 justify-end">
                                                <button onClick={() => handleOpenModal(outlet)} className="text-blue-500 hover:text-blue-700" title="Edit"><Edit size={18} /></button>
                                                <form action={deleteOutlet}><input type="hidden" name="outlet_id" value={outlet.id} /><DeleteButton /></form>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
            <OutletModal key={modalKey} isOpen={isModalOpen} onClose={handleCloseModal} outlet={editingOutlet} />
        </>
    );
}
