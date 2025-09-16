"use client";

import { useEffect, useState } from 'react';
import { Loader2, Printer, X } from 'lucide-react';
import { getTransactionDetails } from './actions'; // Import the new server action

// Tipe data untuk menampung detail transaksi yang akan kita fetch
// Pastikan tipe ini cocok dengan struktur JSON yang dikembalikan oleh RPC
type TransactionDetail = {
    transaction_number: string;
    transaction_date: string;
    outlet_name: string;
    cashier_name: string | null;
    customer_name: string | null;
    subtotal: number;
    total_discount: number;
    total_tax: number;
    grand_total: number;
    notes: string | null;
    items: {
        product_name: string;
        quantity: number;
        unit_price: number;
        line_total: number;
        discount_amount: number;
    }[] | null; // Allow items to be null
    payments: {
        payment_method: string;
        amount: number;
    }[] | null; // Allow payments to be null
};

// Props untuk komponen
interface TransactionSuccessModalProps {
    transactionId: string;
    onClose: () => void; // Fungsi untuk menutup modal (aksi "Transaksi Baru")
}

export function TransactionSuccessModal({ transactionId, onClose }: TransactionSuccessModalProps) {
    const [details, setDetails] = useState<TransactionDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchDetails() {
            if (!transactionId) return;
            try {
                setLoading(true);
                setError(null);
                
                // Panggil Server Action untuk mengambil data dari RPC
                const data = await getTransactionDetails(transactionId);
                
                if (data) {
                    setDetails(data);
                } else {
                    throw new Error("Data transaksi tidak ditemukan.");
                }

            } catch (err: any) {
                setError("Gagal memuat detail transaksi.");
                console.error(err);
            } finally {
                setLoading(false);
            }
        }
        fetchDetails();
    }, [transactionId]);

    const formatDate = (dateString: string) => {
        return new Intl.DateTimeFormat('id-ID', {
            dateStyle: 'long',
            timeStyle: 'short',
        }).format(new Date(dateString));
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
        }).format(amount);
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex justify-center items-center p-4">
            <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl w-full max-w-md flex flex-col">
                {/* Header */}
                <div className="p-4 border-b dark:border-gray-700 flex justify-between items-center">
                    <h2 className="text-lg font-semibold">Transaksi Berhasil</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                        <X size={24} />
                    </button>
                </div>

                {/* Body (Struk) */}
                <div className="p-6 overflow-y-auto max-h-[70vh]">
                    {loading && (
                        <div className="flex justify-center items-center h-48">
                            <Loader2 className="animate-spin text-teal-500" size={40} />
                        </div>
                    )}
                    {error && <p className="text-red-500 text-center">{error}</p>}
                    {details && (
                        <div className="space-y-4 text-sm font-mono">
                            <div className="text-center">
                                <h3 className="font-bold text-lg">Finako POS</h3>
                                <p>{details.outlet_name}</p>
                            </div>
                            <div className="border-t border-dashed my-2 dark:border-gray-700"></div>
                            <div className="flex justify-between"><span>No. Struk:</span><span>{details.transaction_number}</span></div>
                            <div className="flex justify-between"><span>Tanggal:</span><span>{formatDate(details.transaction_date)}</span></div>
                            <div className="flex justify-between"><span>Kasir:</span><span>{details.cashier_name || 'N/A'}</span></div>
                            {details.customer_name && <div className="flex justify-between"><span>Pelanggan:</span><span>{details.customer_name}</span></div>}
                            <div className="border-t border-dashed my-2 dark:border-gray-700"></div>

                            {/* Items */}
                            <div>
                                {details.items?.map((item, index) => (
                                    <div key={index} className="mb-1">
                                        <p className="font-semibold">{item.product_name}</p>
                                        <div className="flex justify-between">
                                            <span>{item.quantity} x {formatCurrency(item.unit_price)}</span>
                                            <span>{formatCurrency(item.line_total)}</span>
                                        </div>
                                        {item.discount_amount > 0 && <p className="text-xs text-red-500">Diskon: -{formatCurrency(item.discount_amount)}</p>}
                                    </div>
                                ))}
                            </div>

                            <div className="border-t border-dashed my-2 dark:border-gray-700"></div>

                            {/* Summary */}
                            <div className="space-y-1">
                                <div className="flex justify-between"><span>Subtotal:</span><span>{formatCurrency(details.subtotal)}</span></div>
                                <div className="flex justify-between"><span>Diskon:</span><span>-{formatCurrency(details.total_discount)}</span></div>
                                <div className="flex justify-between"><span>Pajak:</span><span>{formatCurrency(details.total_tax)}</span></div>
                                <div className="border-t my-1 dark:border-gray-700"></div>
                                <div className="flex justify-between font-bold text-base"><span>TOTAL:</span><span>{formatCurrency(details.grand_total)}</span></div>
                            </div>
                            
                            <div className="border-t border-dashed my-2 dark:border-gray-700"></div>

                            {/* Payment */}
                            <div>
                                {details.payments?.map((p, i) => (
                                    <div key={i} className="flex justify-between"><span>{p.payment_method.toUpperCase()}:</span><span>{formatCurrency(p.amount)}</span></div>
                                ))}
                            </div>

                            {details.notes && (
                                <>
                                    <div className="border-t border-dashed my-2 dark:border-gray-700"></div>
                                    <p className="text-xs text-center">Catatan: {details.notes}</p>
                                </>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 bg-gray-50 dark:bg-gray-800/50 border-t dark:border-gray-700 flex gap-4">
                    <button 
                        onClick={onClose}
                        className="w-full bg-teal-600 text-white font-bold py-3 rounded-lg hover:bg-teal-700 transition-colors"
                    >
                        Transaksi Baru
                    </button>
                    <button 
                        onClick={() => window.print()} 
                        className="w-full bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200 font-bold py-3 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors flex items-center justify-center gap-2"
                    >
                        <Printer size={18} /> Cetak
                    </button>
                </div>
            </div>
        </div>
    );
}
