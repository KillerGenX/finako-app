"use client";

import { useState, useTransition, useEffect } from 'react';
import { Search, Plus, X, Loader2 } from 'lucide-react';
import Link from 'next/link'; // Impor Link
import { useDebounce } from '@/lib/hooks/useDebounce';

// Tipe data untuk Pelanggan
type Customer = {
    id: string;
    name: string;
    phone_number: string | null;
    email: string | null;
    address: string | null;
    created_at: string;
};

// Tipe untuk server actions yang diterima
type CustomerServerActions = {
    getCustomers: (query: string) => Promise<{ data?: Customer[], error?: string }>;
    createCustomer: (formData: FormData) => Promise<{ success: boolean, message: any }>;
    updateCustomer: (formData: FormData) => Promise<{ success: boolean, message: any }>;
    deleteCustomer: (id: string) => Promise<{ success: boolean, message: string }>;
}

// --- Komponen Modal Add/Edit ---
function CustomerModal({ 
    customer, 
    onClose, 
    onSave,
    isSaving 
}: { 
    customer: Partial<Customer> | null, 
    onClose: () => void, 
    onSave: (formData: FormData) => void,
    isSaving: boolean 
}) {
    const isEditMode = !!customer?.id;
    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex justify-center items-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md">
                <form action={onSave}>
                    <div className="p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold">{isEditMode ? 'Edit Pelanggan' : 'Tambah Pelanggan Baru'}</h3>
                            <button type="button" onClick={onClose}><X size={20} /></button>
                        </div>
                        {customer?.id && <input type="hidden" name="id" value={customer.id} />}
                        <div className="space-y-4">
                            <input name="name" defaultValue={customer?.name || ''} placeholder="Nama Lengkap" className="w-full p-2 border rounded" required />
                            <input name="phone" defaultValue={customer?.phone_number || ''} placeholder="Nomor Telepon" className="w-full p-2 border rounded" required />
                            <input name="email" defaultValue={customer?.email || ''} placeholder="Alamat Email (Opsional)" type="email" className="w-full p-2 border rounded" />
                            <textarea name="address" defaultValue={customer?.address || ''} placeholder="Alamat (Opsional)" className="w-full p-2 border rounded" rows={3}></textarea>
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
        </div>
    );
}


// --- Komponen Utama ---
export function CustomersClient({ initialCustomers, serverActions }: {
    initialCustomers: Customer[],
    serverActions: CustomerServerActions
}) {
    const [customers, setCustomers] = useState(initialCustomers);
    const [isPending, startTransition] = useTransition();
    
    // State UI
    const [searchQuery, setSearchQuery] = useState('');
    const [modalState, setModalState] = useState<{ isOpen: boolean; customer: Partial<Customer> | null }>({ isOpen: false, customer: null });
    const [confirmDelete, setConfirmDelete] = useState<Customer | null>(null);
    const debouncedSearch = useDebounce(searchQuery, 300);

    // Efek untuk pencarian
    useEffect(() => {
        startTransition(async () => {
            const { data } = await serverActions.getCustomers(debouncedSearch);
            setCustomers(data || []);
        });
    }, [debouncedSearch, serverActions]);

    // Handler untuk form actions
    const handleSave = async (formData: FormData) => {
        const isEdit = !!formData.get('id');
        const action = isEdit ? serverActions.updateCustomer : serverActions.createCustomer;
        
        startTransition(async () => {
            const result = await action(formData);
            if(result.success) {
                const { data } = await serverActions.getCustomers(debouncedSearch);
                setCustomers(data || []);
                setModalState({ isOpen: false, customer: null });
            } else {
                alert(JSON.stringify(result.message)); 
            }
        });
    };

    const handleDelete = async (customer: Customer) => {
        startTransition(async () => {
            const result = await serverActions.deleteCustomer(customer.id);
            if (result.success) {
                setCustomers(prev => prev.filter(c => c.id !== customer.id));
                setConfirmDelete(null);
            } else {
                alert(result.message);
            }
        });
    }

    return (
        <>
            {modalState.isOpen && <CustomerModal customer={modalState.customer} onClose={() => setModalState({ isOpen: false, customer: null })} onSave={handleSave} isSaving={isPending} />}
            
            {confirmDelete && (
                <div className="fixed inset-0 bg-black/50 z-50 flex justify-center items-center p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-sm">
                        <h3 className="font-bold text-lg">Konfirmasi Hapus</h3>
                        <p className="py-4">Anda yakin ingin menghapus pelanggan "{confirmDelete.name}"? Tindakan ini tidak dapat dibatalkan.</p>
                        <div className="flex justify-end gap-2">
                            <button onClick={() => setConfirmDelete(null)} className="px-4 py-2 rounded bg-gray-200 dark:bg-gray-600">Batal</button>
                            <button onClick={() => handleDelete(confirmDelete)} disabled={isPending} className="px-4 py-2 rounded bg-red-600 text-white disabled:bg-gray-400">
                                {isPending ? 'Menghapus...' : 'Hapus'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="flex justify-between items-center mb-4">
                <div className="relative w-full max-w-xs">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Cari pelanggan..." className="w-full pl-10 pr-4 py-2 border rounded-lg bg-white dark:bg-gray-800" />
                </div>
                <button onClick={() => setModalState({ isOpen: true, customer: null })} className="bg-teal-600 text-white px-4 py-2 rounded-lg flex items-center gap-2">
                    <Plus size={18} /> Tambah Pelanggan
                </button>
            </div>

            <div className="border rounded-lg w-full bg-white dark:bg-gray-800/50 relative">
                {isPending && !modalState.isOpen && <div className="absolute inset-0 bg-white/50 dark:bg-black/50 flex justify-center items-center"><Loader2 className="animate-spin text-teal-500" /></div>}
                <table className="w-full text-sm">
                    <thead className="[&_tr]:border-b"><tr className="border-b">
                        <th className="h-12 px-4 text-left font-medium">Nama</th>
                        <th className="h-12 px-4 text-left font-medium hidden md:table-cell">Kontak</th>
                        <th className="h-12 px-4 text-left font-medium hidden sm:table-cell">Alamat</th>
                        <th className="h-12 px-4 text-right font-medium">Aksi</th>
                    </tr></thead>
                    <tbody>
                        {customers.map(c => (
                            <tr key={c.id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800">
                                <td className="p-4 font-semibold">
                                    <Link href={`/dashboard/customers/${c.id}`} className="hover:underline text-teal-600">
                                        {c.name}
                                    </Link>
                                </td>
                                <td className="p-4 hidden md:table-cell">
                                    <div>{c.phone_number}</div>
                                    <div className="text-xs text-gray-500">{c.email}</div>
                                </td>
                                <td className="p-4 hidden sm:table-cell text-gray-600">{c.address || '-'}</td>
                                <td className="p-4 text-right">
                                    <div className="inline-flex rounded-md shadow-sm">
                                        <button onClick={() => setModalState({ isOpen: true, customer: c })} className="px-3 py-2 text-xs font-medium text-gray-900 bg-white border border-gray-200 rounded-l-lg hover:bg-gray-100">Edit</button>
                                        <button onClick={() => setConfirmDelete(c)} className="px-3 py-2 text-xs font-medium text-red-600 bg-white border-t border-b border-r border-gray-200 rounded-r-md hover:bg-gray-100">Hapus</button>
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
