"use client";

import { useState } from 'react';
import { UserPlus, X } from 'lucide-react';

// Tipe data sementara untuk pelanggan. Nantinya akan disesuaikan dengan skema database.
type Customer = {
    id: string;
    name: string;
    phone_number?: string;
};

interface CustomerSelectorProps {
    selectedCustomer: Customer | null;
    onSelectCustomer: (customer: Customer | null) => void;
}

export function CustomerSelector({ selectedCustomer, onSelectCustomer }: CustomerSelectorProps) {
    // State untuk mengontrol modal pencarian atau penambahan pelanggan
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Placeholder functions
    const handleOpenModal = () => {
        // Logika untuk membuka modal pencarian/penambahan akan ditambahkan di sini
        console.log("Membuka modal pelanggan...");
        setIsModalOpen(true); // Untuk sementara, hanya contoh
    };
    
    const handleRemoveCustomer = () => {
        onSelectCustomer(null);
    };

    // Nanti, modal akan ada di sini
    const renderModal = () => (
        <div className="fixed inset-0 bg-black/50 z-50 flex justify-center items-center">
            <div className="bg-white p-6 rounded-lg w-full max-w-lg">
                <h3 className="text-lg font-bold mb-4">Pilih atau Tambah Pelanggan</h3>
                {/* Konten modal (form pencarian, daftar pelanggan, form tambah) akan ada di sini */}
                <p>Fitur pencarian dan tambah pelanggan akan diimplementasikan di sini.</p>
                <button onClick={() => setIsModalOpen(false)} className="mt-4 bg-red-500 text-white px-4 py-2 rounded">
                    Tutup
                </button>
            </div>
        </div>
    );

    return (
        <div className="relative bg-gray-100 dark:bg-gray-700/50 p-3 rounded-lg">
            {isModalOpen && renderModal()}
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
