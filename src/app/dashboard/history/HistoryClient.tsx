"use client";

import { useState, useEffect, useTransition } from 'react';
import { Eye, X, Search, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { TransactionHistoryItem, getTransactionHistory, HistoryQueryResult } from './actions';
import { useDebounce } from '@/lib/hooks/useDebounce';
import { ViewReceiptModal } from './ViewReceiptModal'; // Impor modal dari file barunya

export function HistoryClient({ initialData }: { initialData: HistoryQueryResult }) {
    const [result, setResult] = useState(initialData);
    const [selectedTransactionId, setSelectedTransactionId] = useState<string | null>(null);
    const [isPending, startTransition] = useTransition();

    // State untuk filter
    const [searchQuery, setSearchQuery] = useState('');
    const [page, setPage] = useState(1);
    const [dateRange, setDateRange] = useState<{ from?: string, to?: string }>({});

    const debouncedSearch = useDebounce(searchQuery, 500);
    const pageSize = 25;

    // Efek untuk mengambil data KETIKA FILTER UTAMA (pencarian, tanggal) BERUBAH
    useEffect(() => {
        if (page !== 1) {
            setPage(1);
            return;
        }
        startTransition(async () => {
            const filters = {
                search: debouncedSearch,
                startDate: dateRange.from,
                endDate: dateRange.to,
                page: 1,
                pageSize: pageSize
            };
            const newData = await getTransactionHistory(filters);
            setResult(newData);
        });
    }, [debouncedSearch, dateRange]);

    // Efek terpisah HANYA untuk mengambil data KETIKA HALAMAN (page) BERUBAH
    useEffect(() => {
        if (page === 1 && result.data.length > 0 && !debouncedSearch && !dateRange.from && !dateRange.to) return;

        startTransition(async () => {
            const filters = {
                search: debouncedSearch,
                startDate: dateRange.from,
                endDate: dateRange.to,
                page: page,
                pageSize: pageSize
            };
            const newData = await getTransactionHistory(filters);
            setResult(newData);
        });
    }, [page]);


    const totalPages = Math.ceil(result.total_count / pageSize);

    const handleDateChange = (boundary: 'from' | 'to', value: string) => {
        setDateRange(prev => ({...prev, [boundary]: value || undefined}));
    }

    // Helper functions
    const formatCurrency = (amount: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
    const formatDate = (dateString: string) => new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(dateString));

    return (
        <>
            {selectedTransactionId && <ViewReceiptModal transactionId={selectedTransactionId} onClose={() => setSelectedTransactionId(null)} />}
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input type="text" placeholder="Cari no. transaksi, pelanggan..." className="w-full pl-10 pr-4 py-2 border rounded-lg bg-white dark:bg-gray-800" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                </div>
                <div className="grid grid-cols-2 gap-2">
                    <input type="date" className="p-2 border rounded-lg bg-white dark:bg-gray-800" value={dateRange.from || ''} onChange={e => handleDateChange('from', e.target.value)} />
                    <input type="date" className="p-2 border rounded-lg bg-white dark:bg-gray-800" value={dateRange.to || ''} onChange={e => handleDateChange('to', e.target.value)} />
                </div>
            </div>

            <div className="border rounded-lg w-full bg-white dark:bg-gray-800/50 relative">
                {isPending && <div className="absolute inset-0 bg-white/50 dark:bg-black/50 flex justify-center items-center"><Loader2 className="animate-spin text-teal-500" /></div>}
                <div className="relative w-full overflow-auto">
                     <table className="w-full caption-bottom text-sm">
                        <thead className="[&_tr]:border-b"><tr className="border-b transition-colors hover:bg-muted/50">
                            <th className="h-12 px-4 text-left align-middle font-medium">Tanggal</th>
                            <th className="h-12 px-4 text-left align-middle font-medium hidden md:table-cell">No. Transaksi</th>
                            <th className="h-12 px-4 text-left align-middle font-medium">Pelanggan</th>
                            <th className="h-12 px-4 text-left align-middle font-medium hidden sm:table-cell">Kasir</th>
                            <th className="h-12 px-4 text-right align-middle font-medium">Total</th>
                            <th className="h-12 px-4 text-center align-middle font-medium">Aksi</th>
                        </tr></thead>
                        <tbody className="[&_tr:last-child]:border-0">
                            {result.data.length > 0 ? result.data.map((tx) => (
                                <tr key={tx.id} className="border-b transition-colors hover:bg-gray-50 dark:hover:bg-gray-800">
                                    <td className="p-4 align-middle">{formatDate(tx.transaction_date)}</td>
                                    <td className="p-4 align-middle font-mono hidden md:table-cell">{tx.transaction_number}</td>
                                    <td className="p-4 align-middle">{tx.customer_name}</td>
                                    <td className="p-4 align-middle hidden sm:table-cell">{tx.cashier_name}</td>
                                    <td className="p-4 align-middle text-right font-semibold">{formatCurrency(tx.grand_total)}</td>
                                    <td className="p-4 align-middle text-center">
                                        <button onClick={() => setSelectedTransactionId(tx.id)} className="text-teal-600 hover:text-teal-800" title="Lihat Struk"><Eye size={20} /></button>
                                    </td>
                                </tr>
                            )) : (
                                <tr><td colSpan={6} className="p-8 text-center text-gray-500">Tidak ada data yang cocok dengan filter Anda.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
            
            <div className="flex items-center justify-between mt-4">
                <span className="text-sm text-gray-600">Total {result.total_count} transaksi</span>
                <div className="flex items-center gap-2">
                    <button onClick={() => setPage(p => p - 1)} disabled={page <= 1 || isPending} className="p-2 disabled:opacity-50"><ChevronLeft /></button>
                    <span className="text-sm">Halaman {page} dari {totalPages > 0 ? totalPages : 1}</span>
                    <button onClick={() => setPage(p => p + 1)} disabled={page >= totalPages || isPending} className="p-2 disabled:opacity-50"><ChevronRight /></button>
                </div>
            </div>
        </>
    );
}
