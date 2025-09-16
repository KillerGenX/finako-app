"use client";

import { X } from 'lucide-react';
import { ReceiptManager } from '@/components/shared/ReceiptManager'; // Impor komponen manager

interface TransactionSuccessModalProps {
    transactionId: string;
    onClose: () => void;
}

export function TransactionSuccessModal({ transactionId, onClose }: TransactionSuccessModalProps) {
    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex justify-center items-center p-4">
            <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl w-full max-w-lg flex flex-col">
                {/* Header */}
                <div className="p-4 border-b dark:border-gray-700 flex justify-between items-center">
                    <h2 className="text-lg font-semibold">Transaksi Berhasil</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                        <X size={24} />
                    </button>
                </div>

                {/* Body (Sekarang hanya memanggil ReceiptManager) */}
                <div className="p-4 overflow-y-auto max-h-[70vh]">
                    <ReceiptManager transactionId={transactionId} />
                </div>

                {/* Footer (Hanya tombol Transaksi Baru) */}
                <div className="p-4 bg-gray-50 dark:bg-gray-800/50 border-t dark:border-gray-700 flex gap-4">
                    <button 
                        onClick={onClose}
                        className="w-full bg-teal-600 text-white font-bold py-3 rounded-lg hover:bg-teal-700 transition-colors"
                    >
                        Transaksi Baru
                    </button>
                </div>
            </div>
        </div>
    );
}
