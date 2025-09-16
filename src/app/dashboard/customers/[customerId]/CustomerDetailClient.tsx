"use client";

import { useState, useEffect, useTransition } from 'react';
import { notFound, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Search, Loader2, ChevronLeft, ChevronRight, Eye } from 'lucide-react';
import { useDebounce } from '@/lib/hooks/useDebounce';
import { CustomerDetailResult, getCustomerDetails } from './actions';
import { ViewReceiptModal } from '../../history/ViewReceiptModal'; // PERBAIKAN: Impor dari file yang benar

// --- Helper Components ---
const StatCard = ({ title, value, icon }: { title: string, value: string | number, icon: React.ReactNode }) => (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border flex items-center gap-4">
        <div className="bg-teal-100 dark:bg-teal-900 text-teal-600 dark:text-teal-300 p-3 rounded-full">{icon}</div>
        <div>
            <p className="text-sm text-gray-500">{title}</p>
            <p className="text-xl font-bold">{value}</p>
        </div>
    </div>
);


// --- Main Component ---
export function CustomerDetailClient({ initialData }: { initialData: CustomerDetailResult }) {
    const [data, setData] = useState(initialData);
    const [isPending, startTransition] = useTransition();
    const router = useRouter();

    // State untuk filter transaksi
    const [searchQuery, setSearchQuery] = useState('');
    const [page, setPage] = useState(1);
    const [selectedTransactionId, setSelectedTransactionId] = useState<string | null>(null);

    const debouncedSearch = useDebounce(searchQuery, 500);
    const pageSize = 10;

    useEffect(() => {
        if (!data?.profile.id) return;
        startTransition(async () => {
            const newData = await getCustomerDetails(data.profile.id, debouncedSearch, page);
            if (newData) setData(newData);
        });
    }, [debouncedSearch, page, data?.profile.id]);

    if (!data) {
        notFound();
    }

    const { profile, stats, transactions } = data;
    const totalPages = Math.ceil(transactions.total_count / pageSize);

    const formatCurrency = (amount: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
    const formatDate = (dateString: string | null) => dateString ? new Intl.DateTimeFormat('id-ID', { dateStyle: 'long', timeStyle: 'short' }).format(new Date(dateString)) : '-';

    return (
        <div className="flex flex-col w-full h-full">
            {selectedTransactionId && <ViewReceiptModal transactionId={selectedTransactionId} onClose={() => setSelectedTransactionId(null)} />}
            
            <div className="mb-6">
                <Link href="/dashboard/customers" className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4">
                    <ArrowLeft size={18} /> Kembali ke Daftar Pelanggan
                </Link>
                <h1 className="text-3xl font-bold">{profile.name}</h1>
                <p className="text-gray-500">{profile.phone_number} &bull; {profile.email || 'Tidak ada email'}</p>
            </div>

            {/* Statistik Kunci */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <StatCard title="Total Belanja" value={formatCurrency(stats.total_spend)} icon={<div className="font-bold text-lg">Rp</div>} />
                <StatCard title="Total Transaksi" value={stats.total_transactions} icon={<div className="font-bold text-lg">#</div>} />
                <StatCard title="Kunjungan Terakhir" value={formatDate(stats.last_visit)} icon={<div className="font-bold text-lg">📅</div>} />
            </div>

            {/* Riwayat Transaksi */}
            <h2 className="text-2xl font-bold mb-4">Riwayat Transaksi</h2>
            <div className="relative w-full max-w-sm mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Cari no. transaksi..." className="w-full pl-10 pr-4 py-2 border rounded-lg bg-white dark:bg-gray-800" />
            </div>

            <div className="border rounded-lg w-full bg-white dark:bg-gray-800/50 relative">
                {isPending && <div className="absolute inset-0 bg-white/50 dark:bg-black/50 flex justify-center items-center"><Loader2 className="animate-spin text-teal-500" /></div>}
                <table className="w-full text-sm">
                    <thead><tr className="border-b">
                        <th className="h-12 px-4 text-left font-medium">Tanggal</th>
                        <th className="h-12 px-4 text-left font-medium">No. Transaksi</th>
                        <th className="h-12 px-4 text-left font-medium">Kasir</th>
                        <th className="h-12 px-4 text-right font-medium">Total</th>
                        <th className="h-12 px-4 text-center font-medium">Aksi</th>
                    </tr></thead>
                    <tbody>
                        {transactions.data.map(tx => (
                            <tr key={tx.id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800">
                                <td className="p-4">{formatDate(tx.transaction_date)}</td>
                                <td className="p-4 font-mono">{tx.transaction_number}</td>
                                <td className="p-4">{tx.cashier_name}</td>
                                <td className="p-4 text-right font-semibold">{formatCurrency(tx.grand_total)}</td>
                                <td className="p-4 text-center">
                                    <button onClick={() => setSelectedTransactionId(tx.id)} className="text-teal-600 hover:text-teal-800" title="Lihat Struk"><Eye size={20} /></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="flex items-center justify-between mt-4">
                <span className="text-sm text-gray-600">Total {transactions.total_count} transaksi</span>
                <div className="flex items-center gap-2">
                    <button onClick={() => setPage(p => p - 1)} disabled={page <= 1 || isPending} className="p-2 disabled:opacity-50"><ChevronLeft /></button>
                    <span className="text-sm">Halaman {page} dari {totalPages > 0 ? totalPages : 1}</span>
                    <button onClick={() => setPage(p => p + 1)} disabled={page >= totalPages || isPending} className="p-2 disabled:opacity-50"><ChevronRight /></button>
                </div>
            </div>
        </div>
    );
}
