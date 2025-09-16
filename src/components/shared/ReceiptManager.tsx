"use client";

import { useEffect, useState } from 'react';
import { Loader2, Printer, Receipt, FileText } from 'lucide-react';
import { getTransactionDetails } from '@/app/dashboard/pos/actions';
import { TransactionReceipt } from './TransactionReceipt';
import { InvoiceView } from './InvoiceView';

// Tipe data untuk detail transaksi
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
    }[] | null;
    payments: {
        payment_method: string;
        amount: number;
    }[] | null;
};

type ViewMode = 'receipt' | 'invoice';

interface ReceiptManagerProps {
    transactionId: string;
}

export function ReceiptManager({ transactionId }: ReceiptManagerProps) {
    const [details, setDetails] = useState<TransactionDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<ViewMode>('receipt');

    useEffect(() => {
        async function fetchDetails() {
            if (!transactionId) return;
            try {
                setLoading(true);
                setError(null);
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

    const handlePrint = () => {
        window.print();
    };
    
    return (
        <div className="w-full">
            <style jsx global>{`
                @media print {
                    /* Paksa browser untuk mencetak warna latar belakang dan teks */
                    body {
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }
                    body * {
                        visibility: hidden;
                    }
                    .printable-area, .printable-area * {
                        visibility: visible;
                    }
                    .printable-area {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100%;
                        height: auto;
                    }
                    .no-print {
                        display: none !important;
                    }
                }
            `}</style>

            {/* Kontrol */}
            <div className="bg-gray-100 dark:bg-gray-800 p-2 rounded-t-lg flex justify-between items-center no-print">
                <div className="flex gap-2">
                    <button onClick={() => setViewMode('receipt')} disabled={viewMode === 'receipt'} className="px-3 py-1 rounded flex items-center gap-2 text-sm disabled:bg-teal-500 disabled:text-white bg-white dark:bg-gray-700">
                        <Receipt size={16} /> Struk
                    </button>
                    <button onClick={() => setViewMode('invoice')} disabled={viewMode === 'invoice'} className="px-3 py-1 rounded flex items-center gap-2 text-sm disabled:bg-teal-500 disabled:text-white bg-white dark:bg-gray-700">
                        <FileText size={16} /> Invoice
                    </button>
                </div>
                <button 
                    onClick={handlePrint}
                    disabled={loading || !!error}
                    className="px-3 py-1 rounded flex items-center gap-2 text-sm bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-50"
                >
                    <Printer size={16} /> Cetak
                </button>
            </div>

            {/* Konten */}
            <div className="border dark:border-gray-700 rounded-b-lg">
                 {loading && (
                    <div className="flex justify-center items-center h-48 no-print p-4">
                        <Loader2 className="animate-spin text-teal-500" size={40} />
                    </div>
                )}
                {error && <p className="text-red-500 text-center no-print p-4">{error}</p>}
                
                {!loading && !error && (
                    <div className="printable-area">
                        {viewMode === 'receipt' ? (
                            <TransactionReceipt details={details} />
                        ) : (
                            <InvoiceView details={details} />
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
