"use client";

import { useState, useTransition, useEffect } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { format } from 'date-fns';
import { Printer, Calendar as CalendarIcon, Store, User, Loader2, Eye } from 'lucide-react';
import { ClosingReportData } from './actions';
import { ViewReceiptModal } from './ViewReceiptModal';
import { PrintableClosingReport } from './PrintableClosingReport';

// --- Komponen Anak ---
const StatCard = ({ title, value }: { title: string, value: string }) => (
    <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
        <h3 className="text-sm font-medium text-gray-500">{title}</h3>
        <p className="text-xl font-semibold mt-1">{value}</p>
    </div>
);

// --- Komponen Utama ---
export function HistoryClient({
    initialReportData,
    outlets,
    cashiers,
    userRole
}: {
    initialReportData: ClosingReportData,
    outlets: { id: string; name: string }[],
    cashiers: { id: string; name: string }[],
    userRole: 'admin' | 'cashier'
}) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [isPending, startTransition] = useTransition();
    const [viewingTransactionId, setViewingTransactionId] = useState<string | null>(null);
    const [isPrinting, setIsPrinting] = useState(false);

    // State untuk filter
    const [date, setDate] = useState(searchParams.get('date') || format(new Date(), 'yyyy-MM-dd'));
    const [outletId, setOutletId] = useState(searchParams.get('outletId') || outlets[0]?.id || '');
    const [cashierId, setCashierId] = useState(searchParams.get('cashierId') || 'all');

    const handleApplyFilter = () => {
        const params = new URLSearchParams();
        params.set('date', date);
        if (outletId) params.set('outletId', outletId);
        if (cashierId !== 'all') params.set('cashierId', cashierId);
        
        startTransition(() => {
            router.push(`${pathname}?${params.toString()}`);
        });
    };
    
    const handlePrint = () => {
        setIsPrinting(true);
    };

    useEffect(() => {
        if (isPrinting) {
            setTimeout(() => {
                window.print();
                setIsPrinting(false);
            }, 50);
        }
    }, [isPrinting]);
    
    const formatCurrency = (value: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(value);

    const report = initialReportData;

    return (
        <>
            {viewingTransactionId && <ViewReceiptModal transactionId={viewingTransactionId} onClose={() => setViewingTransactionId(null)} />}
            
            {isPrinting && (
                <div className="printable-area">
                    <PrintableClosingReport reportData={report} orgName="Nama Organisasi Anda" />
                </div>
            )}

            <div className="w-full no-print">
                <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                    <div>
                        <h1 className="text-2xl font-bold">Laporan Penutupan Harian</h1>
                        <p className="text-gray-500">Ringkasan transaksi untuk rekonsiliasi kasir.</p>
                    </div>
                    <button 
                        onClick={handlePrint}
                        className="px-4 py-2 bg-teal-600 text-white rounded-lg flex items-center gap-2"
                    >
                        <Printer size={16} /> Cetak Laporan
                    </button>
                </div>

                {/* Filter Controls */}
                <div className="p-4 bg-white dark:bg-gray-800/50 rounded-lg border mb-6 flex flex-wrap items-end gap-4">
                    <div>
                        <label htmlFor="date" className="text-sm font-medium">Tanggal</label>
                        <input type="date" id="date" value={date} onChange={e => setDate(e.target.value)} className="p-2 border rounded w-full mt-1" />
                    </div>
                    {userRole !== 'cashier' && (
                        <>
                            <div>
                                <label htmlFor="outlet" className="text-sm font-medium">Outlet</label>
                                <select id="outlet" value={outletId} onChange={e => setOutletId(e.target.value)} className="p-2 border rounded w-full mt-1">
                                    {outlets.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label htmlFor="cashier" className="text-sm font-medium">Kasir</label>
                                <select id="cashier" value={cashierId} onChange={e => setCashierId(e.target.value)} className="p-2 border rounded w-full mt-1">
                                    <option value="all">Semua Kasir</option>
                                    {cashiers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                            </div>
                        </>
                    )}
                    <button onClick={handleApplyFilter} disabled={isPending} className="px-4 py-2 bg-blue-600 text-white rounded">
                        {isPending ? <Loader2 className="animate-spin" /> : "Tampilkan"}
                    </button>
                </div>
                
                {isPending ? (
                    <div className="text-center p-12"><Loader2 className="mx-auto h-12 w-12 animate-spin text-blue-600" /></div>
                ) : !report ? (
                    <div className="text-center p-12"><p>Tidak ada data transaksi untuk filter yang dipilih.</p></div>
                ) : (
                    <div className="space-y-6">
                        {/* Area Ringkasan */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <StatCard title="Total Penjualan Bersih" value={formatCurrency(report.summary.net_sales)} />
                            <StatCard title="Total Transaksi" value={report.summary.total_transactions.toString()} />
                            <StatCard title="Total Diskon" value={formatCurrency(report.summary.total_discounts)} />
                            <StatCard title="Pajak Terkumpul" value={formatCurrency(report.summary.total_tax_collected)} />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold mb-2">Rincian Metode Pembayaran</h2>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {report.summary.payment_methods.map(pm => (
                                    <StatCard key={pm.payment_method} title={`Total ${pm.payment_method.toUpperCase()}`} value={formatCurrency(pm.total_amount)} />
                                ))}
                            </div>
                        </div>

                        {/* Daftar Transaksi Rinci */}
                        <div>
                            <h2 className="text-lg font-semibold mb-2">Daftar Transaksi</h2>
                             <div className="border rounded-lg bg-white dark:bg-gray-800/50 overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b">
                                            <th className="p-3 text-left">Waktu</th>
                                            <th className="p-3 text-left">No. Struk</th>
                                            <th className="p-3 text-left">Kasir</th>
                                            <th className="p-3 text-left">Metode Bayar</th>
                                            <th className="p-3 text-right">Total</th>
                                            <th className="p-3 text-center">Aksi</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {report.transactions.map(tx => (
                                            <tr key={tx.id} className="border-b last:border-b-0 hover:bg-gray-50 dark:hover:bg-gray-900/50">
                                                <td className="p-3">{format(new Date(tx.transaction_date), 'HH:mm:ss')}</td>
                                                <td className="p-3 font-mono">{tx.transaction_number}</td>
                                                <td className="p-3">{tx.member_name}</td>
                                                <td className="p-3 capitalize">{(tx.payment_methods || '').replace(/_/g, ' ').replace(/,/g, ', ')}</td>
                                                <td className="p-3 text-right font-semibold">{formatCurrency(tx.grand_total)}</td>
                                                <td className="p-3 text-center">
                                                    <button onClick={() => setViewingTransactionId(tx.id)} className="text-gray-500 hover:text-teal-600" title="Lihat Struk">
                                                        <Eye size={16} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}
            </div>
            
            <style jsx global>{`
                @media print {
                    body * { visibility: hidden; }
                    .printable-area, .printable-area * { visibility: visible; }
                    .printable-area { position: absolute; left: 0; top: 0; width: 100%; }
                    .no-print { display: none !important; }
                }
            `}</style>
        </>
    );
}
