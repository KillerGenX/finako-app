"use client";

import { useState, useTransition, useEffect } from 'react';
import { getSuppliers, saveSupplier, deleteSupplier } from './actions';
import { useDebounce } from '@/lib/hooks/useDebounce';
import { Search, Plus, X, Loader2 } from 'lucide-react';

// Tipe Data
type Supplier = {
    id: string;
    name: string;
    contact_person: string | null;
    email: string | null;
    phone_number: string | null;
    address: string | null;
    notes: string | null;
};

// --- Komponen Modal ---
function SupplierModal({ supplier, onClose, onSave, isSaving }: { 
    supplier: Partial<Supplier> | null; 
    onClose: () => void; 
    onSave: (formData: FormData) => void;
    isSaving: boolean; 
}) {
    const isEditMode = !!supplier?.id;

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex justify-center items-center p-4">
            <form action={onSave} className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-lg">
                <div className="p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold">{isEditMode ? 'Edit Pemasok' : 'Tambah Pemasok Baru'}</h3>
                        <button type="button" onClick={onClose}><X size={20} /></button>
                    </div>
                    {supplier?.id && <input type="hidden" name="id" value={supplier.id} />}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <input name="name" defaultValue={supplier?.name || ''} placeholder="Nama Pemasok" className="w-full p-2 border rounded md:col-span-2" required />
                        <input name="contact_person" defaultValue={supplier?.contact_person || ''} placeholder="Narahubung (Opsional)" className="w-full p-2 border rounded" />
                        <input name="phone_number" defaultValue={supplier?.phone_number || ''} placeholder="No. Telepon (Opsional)" className="w-full p-2 border rounded" />
                        <input name="email" defaultValue={supplier?.email || ''} placeholder="Email (Opsional)" type="email" className="w-full p-2 border rounded md:col-span-2" />
                        <textarea name="address" defaultValue={supplier?.address || ''} placeholder="Alamat (Opsional)" className="w-full p-2 border rounded md:col-span-2" rows={2}></textarea>
                        <textarea name="notes" defaultValue={supplier?.notes || ''} placeholder="Catatan (Opsional)" className="w-full p-2 border rounded md:col-span-2" rows={2}></textarea>
                    </div>
                </div>
                <div className="p-4 bg-gray-50 dark:bg-gray-700/50 flex justify-end gap-2 rounded-b-lg">
                    <button type="button" onClick={onClose} className="px-4 py-2 rounded bg-gray-200 dark:bg-gray-600">Batal</button>
                    <button type="submit" disabled={isSaving} className="px-4 py-2 rounded bg-teal-600 text-white disabled:bg-gray-400">
                        {isSaving ? 'Menyimpan...' : 'Simpan'}
                    </button>
                </div>
            </form>
        </div>
    );
}


// --- Komponen Utama ---
export function SuppliersClient({ initialSuppliers }: { initialSuppliers: Supplier[] }) {
    const [suppliers, setSuppliers] = useState(initialSuppliers);
    const [isPending, startTransition] = useTransition();
    
    const [searchQuery, setSearchQuery] = useState('');
    const [modalState, setModalState] = useState<{ isOpen: boolean; supplier: Partial<Supplier> | null }>({ isOpen: false, supplier: null });
    const debouncedSearch = useDebounce(searchQuery, 300);

    useEffect(() => {
        startTransition(async () => {
            const data = await getSuppliers(debouncedSearch);
            setSuppliers(data);
        });
    }, [debouncedSearch]);

    const handleSave = async (formData: FormData) => {
        startTransition(async () => {
            const result = await saveSupplier(formData);
            if (result.success) {
                const data = await getSuppliers(debouncedSearch);
                setSuppliers(data);
                setModalState({ isOpen: false, supplier: null });
            } else {
                alert(`Error: ${JSON.stringify(result.errors || result.message)}`);
            }
        });
    };

    const handleDelete = (supplierId: string) => {
        if (confirm("Anda yakin ingin menghapus pemasok ini?")) {
            startTransition(async () => {
                await deleteSupplier(supplierId);
            });
        }
    };

    return (
        <>
            {modalState.isOpen && <SupplierModal supplier={modalState.supplier} onClose={() => setModalState({ isOpen: false, supplier: null })} onSave={handleSave} isSaving={isPending} />}
            
            <div className="flex justify-between items-center mb-4">
                <div className="relative w-full max-w-xs">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Cari pemasok..." className="w-full pl-10 pr-4 py-2 border rounded-lg bg-white dark:bg-gray-800" />
                </div>
                <button onClick={() => setModalState({ isOpen: true, supplier: null })} className="bg-teal-600 text-white px-4 py-2 rounded-lg flex items-center gap-2">
                    <Plus size={18} /> Tambah Pemasok
                </button>
            </div>

            <div className="border rounded-lg w-full bg-white dark:bg-gray-800/50 relative">
                {isPending && !modalState.isOpen && <div className="absolute inset-0 bg-white/50 dark:bg-black/50 flex justify-center items-center"><Loader2 className="animate-spin text-teal-500" /></div>}
                <table className="w-full text-sm">
                    <thead><tr className="border-b"><th className="p-4 text-left font-medium">Nama Pemasok</th><th className="p-4 text-left font-medium hidden sm:table-cell">Narahubung</th><th className="p-4 text-left font-medium hidden md:table-cell">Kontak</th><th className="p-4 text-right font-medium">Aksi</th></tr></thead>
                    <tbody>
                        {suppliers.map(s => (
                            <tr key={s.id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800">
                                <td className="p-4 font-semibold">{s.name}</td>
                                <td className="p-4 hidden sm:table-cell">{s.contact_person || '-'}</td>
                                <td className="p-4 hidden md:table-cell">
                                    <div>{s.phone_number}</div>
                                    <div className="text-xs text-gray-500">{s.email}</div>
                                </td>
                                <td className="p-4 text-right">
                                     <div className="inline-flex rounded-md shadow-sm">
                                        <button onClick={() => setModalState({ isOpen: true, supplier: s })} className="px-3 py-2 text-xs font-medium text-gray-900 bg-white border border-gray-200 rounded-l-lg hover:bg-gray-100">Edit</button>
                                        <button onClick={() => handleDelete(s.id)} className="px-3 py-2 text-xs font-medium text-red-600 bg-white border-t border-b border-r border-gray-200 rounded-r-md hover:bg-gray-100">Hapus</button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </>
    );
}
