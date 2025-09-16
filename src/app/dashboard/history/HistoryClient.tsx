"use client";

import { useState } from 'react';
import { Eye, X } from 'lucide-react';
import { TransactionHistoryItem } from './actions';
import { ReceiptManager } from '@/components/shared/ReceiptManager'; // Menggunakan kembali ReceiptManager

// Modal untuk menampilkan detail struk
function ViewReceiptModal({ transactionId, onClose }: { transactionId: string, onClose: () => void }) {
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

// Komponen utama halaman riwayat
export function HistoryClient({ initialData }: { initialData: TransactionHistoryItem[] }) {
    const [transactions] = useState(initialData);
    const [selectedTransactionId, setSelectedTransactionId] = useState<string | null>(null);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
        }).format(amount);
    };

    const formatDate = (dateString: string) => {
        return new Intl.DateTimeFormat('id-ID', {
            dateStyle: 'medium',
            timeStyle: 'short',
        }).format(new Date(dateString));
    };
    
    return (
        <>
            {selectedTransactionId && (
                <ViewReceiptModal 
                    transactionId={selectedTransactionId} 
                    onClose={() => setSelectedTransactionId(null)} 
                />
            )}
            <div className="border rounded-lg w-full bg-white dark:bg-gray-800/50">
                <div className="relative w-full overflow-auto">
                    <table className="w-full caption-bottom text-sm">
                        <thead className="[&_tr]:border-b">
                            <tr className="border-b transition-colors hover:bg-muted/50">
                                <th className="h-12 px-4 text-left align-middle font-medium">Tanggal</th>
                                <th className="h-12 px-4 text-left align-middle font-medium hidden md:table-cell">No. Transaksi</th>
                                <th className="h-12 px-4 text-left align-middle font-medium">Pelanggan</th>
                                <th className="h-12 px-4 text-left align-middle font-medium hidden sm:table-cell">Kasir</th>
                                <th className="h-12 px-4 text-right align-middle font-medium">Total</th>
                                <th className="h-12 px-4 text-center align-middle font-medium">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="[&_tr:last-child]:border-0">
                            {transactions.length > 0 ? transactions.map((tx) => (
                                <tr key={tx.id} className="border-b transition-colors hover:bg-gray-50 dark:hover:bg-gray-800">
                                    <td className="p-4 align-middle">{formatDate(tx.transaction_date)}</td>
                                    <td className="p-4 align-middle font-mono hidden md:table-cell">{tx.transaction_number}</td>
                                    <td className="p-4 align-middle">{tx.customer_name}</td>
                                    <td className="p-4 align-middle hidden sm:table-cell">{tx.cashier_name}</td>
                                    <td className="p-4 align-middle text-right font-semibold">{formatCurrency(tx.grand_total)}</td>
                                    <td className="p-4 align-middle text-center">
                                        <button 
                                            onClick={() => setSelectedTransactionId(tx.id)}
                                            className="text-teal-600 hover:text-teal-800"
                                            title="Lihat Struk"
                                        >
                                            <Eye size={20} />
                                        </button>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={6} className="p-8 text-center text-gray-500">
                                        Tidak ada riwayat transaksi.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </>
    );
}
