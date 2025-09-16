"use client";

import { useEffect, useState, useMemo } from 'react';
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
    customer_phone: string | null; // Tambahkan nomor telepon pelanggan
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

// Komponen ikon WhatsApp sederhana
const WhatsAppIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
        <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.487 5.235 3.487 8.413.003 6.557-5.338 11.892-11.894 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.886-.001 2.267.651 4.383 1.803 6.166l-1.225 4.429 4.575-1.192z" />
    </svg>
);

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

    const formatCurrency = (amount: number) => new Intl.NumberFormat('id-ID').format(amount);
    
    const canShareToWhatsApp = useMemo(() => !!details?.customer_phone, [details]);

    const handleShareToWhatsApp = () => {
        if (!details || !details.customer_phone) return;

        let phoneNumber = details.customer_phone.replace(/\D/g, '');
        if (phoneNumber.startsWith('0')) {
            phoneNumber = '62' + phoneNumber.substring(1);
        }

        const summaryText = `*Struk Pembelian - ${details.outlet_name}*\n\nTerima kasih Bpk/Ibu *${details.customer_name}* atas kunjungan Anda.\n\nBerikut ringkasan transaksi Anda:\nNo: ${details.transaction_number}\nTotal: *Rp ${formatCurrency(details.grand_total)}*\n\nUntuk melihat struk lengkap, silakan klik tautan di bawah ini:\n`;
        
        // MODIFIKASI: Tambahkan query parameter ?view=... berdasarkan state viewMode
        const publicUrl = `${window.location.origin}/receipt/${transactionId}?view=${viewMode}`;

        const fullMessage = encodeURIComponent(summaryText + publicUrl);
        
        window.open(`https://wa.me/${phoneNumber}?text=${fullMessage}`, '_blank');
    };
    
    return (
        <div className="w-full">
            <style jsx global>{`
                @media print {
                    body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
                    body * { visibility: hidden; }
                    .printable-area, .printable-area * { visibility: visible; }
                    .printable-area { position: absolute; left: 0; top: 0; width: 100%; height: auto; }
                    .no-print { display: none !important; }
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
                <div className="flex gap-2">
                     <button 
                        onClick={handleShareToWhatsApp}
                        disabled={loading || !!error || !canShareToWhatsApp}
                        title={canShareToWhatsApp ? "Kirim ke WhatsApp" : "Pilih pelanggan dengan nomor telepon untuk mengaktifkan"}
                        className="px-3 py-1 rounded flex items-center gap-2 text-sm bg-green-500 text-white hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <WhatsAppIcon />
                    </button>
                    <button 
                        onClick={handlePrint}
                        disabled={loading || !!error}
                        className="px-3 py-1 rounded flex items-center gap-2 text-sm bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-50"
                    >
                        <Printer size={16} /> Cetak
                    </button>
                </div>
            </div>

            {/* Konten */}
            <div className="border dark:border-gray-700 rounded-b-lg">
                 {loading && ( <div className="flex justify-center items-center h-48 no-print p-4"><Loader2 className="animate-spin text-teal-500" size={40} /></div> )}
                {error && <p className="text-red-500 text-center no-print p-4">{error}</p>}
                {!loading && !error && (
                    <div className="printable-area">
                        {viewMode === 'receipt' ? <TransactionReceipt details={details} /> : <InvoiceView details={details} />}
                    </div>
                )}
            </div>
        </div>
    );
}
