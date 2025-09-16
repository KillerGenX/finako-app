"use client";

import { useState, useEffect, useTransition } from 'react';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, ChevronLeft, ChevronRight, Eye, Package, Receipt } from 'lucide-react';
import { getOutletDetails, OutletDetailResult } from './actions';
import { ViewReceiptModal } from '../../history/ViewReceiptModal';

// --- Helper Components ---
// PERBAIKAN: Mengganti <p> menjadi <div> untuk value agar bisa menerima elemen blok.
const InfoCard = ({ title, value }: { title: string, value: string | React.ReactNode }) => (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border">
        <p className="text-sm text-gray-500">{title}</p>
        <div className="text-md font-semibold mt-1">{value || '-'}</div>
    </div>
);


// --- Main Component ---
export function OutletDetailClient({ initialData }: { initialData: OutletDetailResult }) {
    const [data, setData] = useState(initialData);
    const [isPending, startTransition] = useTransition();
    
    const [txPage, setTxPage] = useState(1);
    const [selectedTransactionId, setSelectedTransactionId] = useState<string | null>(null);

    useEffect(() => {
        if (!data?.profile.id) return;
        startTransition(async () => {
            const newData = await getOutletDetails(data.profile.id, txPage);
            if (newData) setData(newData);
        });
    }, [txPage, data?.profile.id]);

    if (!data) {
        notFound();
    }

    const { profile, inventory, transactions } = data;
    const totalTxPages = Math.ceil(transactions.total_count / 10);

    const formatCurrency = (amount: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
    const formatDate = (dateString: string | null) => dateString ? new Intl.DateTimeFormat('id-ID', { dateStyle: 'long', timeStyle: 'short' }).format(new Date(dateString)) : '-';

    return (
        <div className="flex flex-col w-full h-full gap-8">
            {selectedTransactionId && <ViewReceiptModal transactionId={selectedTransactionId} onClose={() => setSelectedTransactionId(null)} />}
            
            <div>
                <Link href="/dashboard/outlets" className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4">
                    <ArrowLeft size={18} /> Kembali ke Daftar Outlet
                </Link>
                <h1 className="text-3xl font-bold">{profile.name}</h1>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <InfoCard title="Alamat" value={profile.address} />
                <InfoCard title="No. Telepon" value={profile.phone_number} />
                <InfoCard title="Tipe Lokasi" value={<div className="flex flex-wrap gap-1 mt-1">{profile.location_types.map(t => <span key={t} className="px-2 py-1 text-xs rounded-full bg-gray-100 dark:bg-gray-700">{t}</span>)}</div>} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Kolom Inventaris */}
                <div>
                    <h2 className="text-2xl font-bold mb-4 flex items-center gap-3"><Package />Stok Inventaris</h2>
                    <div className="border rounded-lg w-full bg-white dark:bg-gray-800/50 max-h-96 overflow-y-auto">
                        <table className="w-full text-sm">
                            <thead><tr className="border-b"><th className="p-4 text-left font-medium">Produk</th><th className="p-4 text-right font-medium">Jumlah Stok</th></tr></thead>
                            <tbody>
                                {inventory.map(item => (
                                    <tr key={item.variant_id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800">
                                        <td className="p-4">{item.product_name}<p className="text-xs text-gray-500">{item.sku}</p></td>
                                        <td className="p-4 text-right font-mono font-semibold">{item.quantity_on_hand}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Kolom Riwayat Transaksi */}
                <div>
                    <h2 className="text-2xl font-bold mb-4 flex items-center gap-3"><Receipt />Riwayat Transaksi</h2>
                    <div className="border rounded-lg w-full bg-white dark:bg-gray-800/50">
                        <table className="w-full text-sm">
                             <thead><tr className="border-b"><th className="p-4 text-left font-medium">Tanggal</th><th className="p-4 text-left font-medium">Pelanggan</th><th className="p-4 text-right font-medium">Total</th><th className="p-4 text-center font-medium">Aksi</th></tr></thead>
                            <tbody>
                                {transactions.data.map(tx => (
                                    <tr key={tx.id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800">
                                        <td className="p-4">{formatDate(tx.transaction_date)}</td>
                                        <td className="p-4">{tx.customer_name}</td>
                                        <td className="p-4 text-right font-semibold">{formatCurrency(tx.grand_total)}</td>
                                        <td className="p-4 text-center">
                                            <button onClick={() => setSelectedTransactionId(tx.id)} className="text-teal-600 hover:text-teal-800" title="Lihat Struk"><Eye size={20} /></button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                     <div className="flex items-center justify-between mt-2">
                        <span className="text-sm text-gray-600">Total {transactions.total_count} transaksi</span>
                        <div className="flex items-center gap-2">
                            <button onClick={() => setTxPage(p => p - 1)} disabled={txPage <= 1 || isPending} className="p-2 disabled:opacity-50"><ChevronLeft /></button>
                            <span className="text-sm">Halaman {txPage} dari {totalTxPages > 0 ? totalTxPages : 1}</span>
                            <button onClick={() => setTxPage(p => p + 1)} disabled={txPage >= totalTxPages || isPending} className="p-2 disabled:opacity-50"><ChevronRight /></button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
