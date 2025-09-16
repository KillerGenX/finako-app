"use client";

import { useState, useTransition, useEffect } from 'react';
import { UserPlus, X, Search, Loader2 } from 'lucide-react';
import { searchCustomers, createCustomer } from './actions';
import { useDebounce } from '@/lib/hooks/useDebounce';

// Tipe data untuk pelanggan
export type Customer = {
    id: string;
    name: string;
    phone_number?: string | null;
};

interface CustomerSelectorProps {
    selectedCustomer: Customer | null;
    onSelectCustomer: (customer: Customer | null) => void;
}

export function CustomerSelector({ selectedCustomer, onSelectCustomer }: CustomerSelectorProps) {
    const [isModalOpen, setIsModalOpen] = useState(false);

    const handleOpenModal = () => setIsModalOpen(true);
    const handleCloseModal = () => setIsModalOpen(false);
    
    const handleRemoveCustomer = () => {
        onSelectCustomer(null);
    };

    return (
        <div className="relative bg-gray-100 dark:bg-gray-700/50 p-3 rounded-lg">
            {isModalOpen && <CustomerModal onClose={handleCloseModal} onSelectCustomer={onSelectCustomer} />}
            
            <div className="flex items-center justify-between">
                {selectedCustomer ? (
                    <div className="flex-grow">
                        <p className="text-xs text-gray-500 dark:text-gray-400">Pelanggan</p>
                        <div className="flex items-center justify-between">
                            <p className="font-semibold">{selectedCustomer.name}</p>
                             <button onClick={handleRemoveCustomer} title="Hapus Pelanggan" className="text-red-500 hover:text-red-700">
                                <X size={18} />
                            </button>
                        </div>
                    </div>
                ) : (
                    <button onClick={handleOpenModal} className="flex items-center gap-2 text-teal-600 hover:text-teal-800 dark:text-teal-400 dark:hover:text-teal-300 w-full">
                        <UserPlus size={20} />
                        <span className="font-semibold">Pilih Pelanggan</span>
                    </button>
                )}
            </div>
        </div>
    );
}


// ========= KOMPONEN MODAL (TERPISAH) =========
function CustomerModal({ onClose, onSelectCustomer }: { onClose: () => void, onSelectCustomer: (customer: Customer) => void }) {
    const [view, setView] = useState<'search' | 'new'>('search');
    
    // State untuk Pencarian
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<Customer[]>([]);
    const [isSearching, startSearchTransition] = useTransition();
    const debouncedQuery = useDebounce(query, 300);

    // State untuk Form Pelanggan Baru
    const [newName, setNewName] = useState('');
    const [newPhone, setNewPhone] = useState('');
    const [isCreating, startCreateTransition] = useTransition();
    const [formError, setFormError] = useState<string | null>(null);


    useEffect(() => {
        if (debouncedQuery) {
            startSearchTransition(async () => {
                const customers = await searchCustomers(debouncedQuery);
                setResults(customers);
            });
        } else {
            setResults([]);
        }
    }, [debouncedQuery]);

    const handleSelect = (customer: Customer) => {
        onSelectCustomer(customer);
        onClose();
    };

    const handleCreate = async () => {
        setFormError(null);
        startCreateTransition(async () => {
            const formData = new FormData();
            formData.append('name', newName);
            formData.append('phone', newPhone);
            
            const result = await createCustomer(formData);

            if (result.success && result.customer) {
                handleSelect(result.customer as Customer);
            } else {
                // Menangani error validasi dari Zod
                if (typeof result.message === 'object' && result.message !== null) {
                    const errorMessages = Object.values(result.message).flat().join(' ');
                    setFormError(errorMessages);
                } else {
                    setFormError(result.message as string);
                }
            }
        });
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex justify-center items-start pt-16">
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg w-full max-w-lg shadow-xl relative">
                <button onClick={onClose} className="absolute top-3 right-3 text-gray-500 hover:text-gray-800"><X size={20}/></button>
                <div className="flex border-b mb-4">
                    <button onClick={() => setView('search')} className={`px-4 py-2 ${view === 'search' ? 'border-b-2 border-teal-500 font-semibold' : ''}`}>Cari Pelanggan</button>
                    <button onClick={() => setView('new')} className={`px-4 py-2 ${view === 'new' ? 'border-b-2 border-teal-500 font-semibold' : ''}`}>Tambah Baru</button>
                </div>

                {view === 'search' && (
                    <div>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                            <input type="text" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Cari nama atau nomor telepon..." className="w-full pl-10 pr-4 py-2 border rounded-lg bg-transparent" />
                        </div>
                        <div className="mt-4 h-64 overflow-y-auto">
                            {isSearching && <div className="flex justify-center p-4"><Loader2 className="animate-spin" /></div>}
                            {results.length > 0 ? results.map(cust => (
                                <div key={cust.id} onClick={() => handleSelect(cust)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer rounded">
                                    <p className="font-semibold">{cust.name}</p>
                                    <p className="text-sm text-gray-500">{cust.phone_number}</p>
                                </div>
                            )) : !isSearching && debouncedQuery && <p className="text-center text-gray-500 p-4">Tidak ada hasil ditemukan.</p>}
                        </div>
                    </div>
                )}

                {view === 'new' && (
                    <div className="space-y-4">
                        <input type="text" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Nama Pelanggan" className="w-full p-2 border rounded-lg" />
                        <input type="tel" value={newPhone} onChange={(e) => setNewPhone(e.target.value)} placeholder="Nomor Telepon (e.g. 0812...)" className="w-full p-2 border rounded-lg" />
                        {formError && <p className="text-sm text-red-500">{formError}</p>}
                        <button onClick={handleCreate} disabled={isCreating} className="w-full bg-teal-600 text-white font-bold py-2 rounded-lg hover:bg-teal-700 disabled:bg-gray-400">
                            {isCreating ? 'Menyimpan...' : 'Simpan Pelanggan'}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
