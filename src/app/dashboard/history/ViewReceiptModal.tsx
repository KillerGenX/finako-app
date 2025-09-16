"use client";

import { X } from 'lucide-react';
import { ReceiptManager } from '@/components/shared/ReceiptManager';

export function ViewReceiptModal({ transactionId, onClose }: { transactionId: string, onClose: () => void }) {
    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex justify-center items-center p-4">
            <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl w-full max-w-lg flex flex-col relative">
                <div className="p-4 border-b dark:border-gray-700 flex justify-between items-center">
                    <h2 className="text-lg font-semibold">Detail Transaksi</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                        <X size={24} />
                    </button>
                </div>
                <div className="p-4 overflow-y-auto max-h-[80vh]">
                    <ReceiptManager transactionId={transactionId} />
                </div>
            </div>
        </div>
    );
}
