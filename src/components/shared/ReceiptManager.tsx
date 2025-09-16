"use client";

import { useEffect, useState } from 'react';
import { Loader2, Printer, Receipt, FileText } from 'lucide-react';
import { getTransactionDetails } from '@/app/dashboard/pos/actions'; // Path harus disesuaikan jika komponen dipindah
import { TransactionReceipt } from './TransactionReceipt';
import { InvoiceView } from './InvoiceView';

// Tipe data untuk detail transaksi
type TransactionDetail = { /* ... (definisi tipe yang sama seperti sebelumnya) ... */ 
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

// Tipe untuk view yang aktif
type ViewMode = 'receipt' | 'invoice';

interface ReceiptManagerProps {
    transactionId: string;
    // Fungsi onPrint opsional jika kita ingin override behavior cetak dari luar
    onPrint?: (viewMode: ViewMode) => void; 
}

export function ReceiptManager({ transactionId, onPrint }: ReceiptManagerProps) {
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
        if (onPrint) {
            onPrint(viewMode);
            return;
        }

        const printableId = viewMode === 'receipt' ? 'printable-receipt' : 'printable-invoice';
        const printContents = document.getElementById(printableId)?.innerHTML;
        
        if (printContents) {
            // Membuat iframe tersembunyi untuk proses cetak
            const iframe = document.createElement('iframe');
            iframe.style.height = '0';
            iframe.style.width = '0';
            iframe.style.position = 'absolute';
            iframe.style.border = '0';
            document.body.appendChild(iframe);
            
            iframe.contentDocument?.write('<html><head><title>Cetak</title>');
            // Di sini kita bisa menambahkan stylesheet khusus untuk cetak jika perlu
            iframe.contentDocument?.write('</head><body>');
            iframe.contentDocument?.write(printContents);
            iframe.contentDocument?.write('</body></html>');
            iframe.contentDocument?.close();
            iframe.contentWindow?.focus();
            iframe.contentWindow?.print();
            
            // Hapus iframe setelah selesai
            setTimeout(() => {
                document.body.removeChild(iframe);
            }, 1000);

        }
    };
    
    return (
        <div className="w-full">
            {/* Kontrol */}
            <div className="bg-gray-100 dark:bg-gray-800 p-2 rounded-t-lg flex justify-between items-center">
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
            <div className="p-4 border dark:border-gray-700 rounded-b-lg">
                 {loading && (
                    <div className="flex justify-center items-center h-48">
                        <Loader2 className="animate-spin text-teal-500" size={40} />
                    </div>
                )}
                {error && <p className="text-red-500 text-center">{error}</p>}
                
                {!loading && !error && (
                    <div>
                        {viewMode === 'receipt' ? (
                            <div id="printable-receipt">
                                <TransactionReceipt details={details} />
                            </div>
                        ) : (
                            <div id="printable-invoice">
                                <InvoiceView details={details} />
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
