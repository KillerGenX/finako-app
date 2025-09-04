"use client";

import { useState, useTransition } from 'react';
import { Eye, X, Printer, Mail } from 'lucide-react';
import { sendInvoiceByEmail } from './actions';

// ... (Helper functions dan StatusBadge tetap sama) ...
const formatPrice = (price: number | null) => {
    if (price === null) return 'N/A';
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(price);
};
const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
};
const StatusBadge = ({ status }: { status: string }) => {
    switch (status) {
        case 'paid': return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300">Lunas</span>;
        case 'failed': return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300">Gagal</span>;
        case 'awaiting_confirmation': return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300">Menunggu Konfirmasi</span>;
        default: return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">{status}</span>;
    }
};


const InvoiceModal = ({ invoice, onClose }: { invoice: any; onClose: () => void; }) => {
    const [isSending, startTransition] = useTransition();
    const [sendResult, setSendResult] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    const handlePrint = () => { /* ... (fungsi print tetap sama) ... */
        const printContent = document.getElementById('invoice-print-area');
        if (printContent) {
            const originalContents = document.body.innerHTML;
            document.body.innerHTML = printContent.innerHTML;
            window.print();
            document.body.innerHTML = originalContents;
            window.location.reload();
        }
    };

    const handleSendEmail = () => {
        setSendResult(null);
        startTransition(async () => {
            // ▼▼▼ PANGGILAN DIPERBARUI: HANYA MENGIRIM ID INVOICE ▼▼▼
            const result = await sendInvoiceByEmail(invoice.id);
            if (result.success) {
                setSendResult({ type: 'success', text: result.success });
            } else {
                setSendResult({ type: 'error', text: result.error! });
            }
        });
    };
    
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/80 p-4" onClick={onClose}>
            <div className="relative w-full max-w-2xl bg-white dark:bg-gray-900 rounded-lg shadow-xl" onClick={(e) => e.stopPropagation()}>
                <div id="invoice-print-area">
                    {/* ... (konten invoice tetap sama) ... */}
                    <div className="p-8">
                        <div className="flex justify-between items-start">
                            <div><img src="/finako.svg" alt="Finako Logo" className="h-7" /><h2 className="mt-2 text-2xl font-bold text-gray-900 dark:text-gray-100">INVOICE</h2></div>
                            <div className="text-right"><p className="text-lg font-semibold">Finako App</p><p className="text-sm text-gray-500">support@finako.app</p></div>
                        </div>
                        <div className="mt-8 grid grid-cols-2 gap-4">
                            <div><p className="text-sm font-semibold text-gray-500 dark:text-gray-400">DITAGIHKAN KEPADA:</p><p className="font-medium text-gray-800 dark:text-gray-200">{invoice.organizations?.name}</p></div>
                            <div className="text-right">
                                <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">Nomor Invoice:</p><p className="font-mono text-sm text-gray-800 dark:text-gray-200">{invoice.id.substring(0, 8).toUpperCase()}</p>
                                <p className="text-sm font-semibold text-gray-500 dark:text-gray-400 mt-2">Tanggal Invoice:</p><p className="font-medium text-gray-800 dark:text-gray-200">{formatDate(invoice.created_at)}</p>
                            </div>
                        </div>
                        <div className="mt-8">
                            <table className="w-full text-left">
                                <thead><tr className="bg-gray-50 dark:bg-gray-800">
                                    <th className="p-3 text-sm font-semibold text-gray-600 dark:text-gray-300">Deskripsi</th>
                                    <th className="p-3 text-right text-sm font-semibold text-gray-600 dark:text-gray-300">Total</th>
                                </tr></thead>
                                <tbody><tr className="border-b dark:border-gray-700">
                                    <td className="p-3">Langganan Paket {invoice.subscription_plans?.name}</td>
                                    <td className="p-3 text-right">{formatPrice(invoice.amount)}</td>
                                </tr></tbody>
                                <tfoot><tr><td className="p-3 font-bold text-right">GRAND TOTAL</td><td className="p-3 font-bold text-right">{formatPrice(invoice.amount)}</td></tr></tfoot>
                            </table>
                        </div>
                        <div className="mt-8 text-center"><StatusBadge status={invoice.status} /></div>
                    </div>
                </div>
                <div className="p-4 bg-gray-50 dark:bg-gray-800/50 flex justify-end gap-3 rounded-b-lg">
                    {sendResult && <p className={`text-sm my-auto mr-auto ${sendResult.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>{sendResult.text}</p>}
                    <button onClick={handlePrint} className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-gray-700 dark:text-gray-200 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-lg"><Printer className="h-4 w-4" /> Cetak</button>
                    <button onClick={handleSendEmail} disabled={isSending} className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg disabled:opacity-50"><Mail className="h-4 w-4" /> {isSending ? 'Mengirim...' : 'Kirim Email'}</button>
                </div>
            </div>
        </div>
    );
};

export default function HistoryTable({ invoices }: { invoices: any[] }) {
    const [selectedInvoice, setSelectedInvoice] = useState<any | null>(null);
    return (
        <>
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-sm">
                <div className="overflow-x-auto">
                     <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-800">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Invoice ID</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Organisasi</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Jumlah</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Tanggal</th>
                                <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                            {invoices.map((invoice: any) => (
                                <tr key={invoice.id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-500 dark:text-gray-400">{invoice.id.substring(0, 8)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">{invoice.organizations?.name || 'N/A'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm"><StatusBadge status={invoice.status} /></td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">{formatPrice(invoice.amount)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">{formatDate(invoice.created_at)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                                        <button onClick={() => setSelectedInvoice(invoice)} className="p-2 rounded-md text-blue-600 hover:bg-gray-200 dark:text-blue-400 dark:hover:bg-gray-700">
                                            <Eye className="h-4 w-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
            {selectedInvoice && <InvoiceModal invoice={selectedInvoice} onClose={() => setSelectedInvoice(null)} />}
        </>
    );
}
