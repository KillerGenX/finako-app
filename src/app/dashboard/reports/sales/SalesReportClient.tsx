"use client";

import { useState, useTransition } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { AreaChart, BarChart, Calendar as CalendarIcon, Loader2, Landmark } from 'lucide-react';
import { DateRange } from 'react-day-picker';
import { format } from 'date-fns';
import { id as indonesia } from 'date-fns/locale';

import { SalesReportData } from './actions';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts';

// (Asumsi komponen UI ini ada di direktori yang benar)
// import { Button } from '@/components/ui/button';
// import { Calendar } from '@/components/ui/calendar';
// import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// --- Komponen UI Lokal (sementara) ---
const Button = ({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) => <button {...props}>{children}</button>;

// --- Komponen Anak ---

const StatCard = ({ title, value, helpText }: { title: string, value: string, helpText?: string }) => (
    <div className="p-4 bg-white dark:bg-gray-800/50 rounded-lg border">
        <h3 className="text-sm font-medium text-gray-500">{title}</h3>
        <p className="text-2xl font-bold mt-1">{value}</p>
        {helpText && <p className="text-xs text-gray-400 mt-1">{helpText}</p>}
    </div>
);

// --- Komponen Utama ---
export function SalesReportClient({ 
    initialData, 
    defaultStartDate, 
    defaultEndDate 
}: { 
    initialData: SalesReportData, 
    defaultStartDate: Date, 
    defaultEndDate: Date 
}) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [isPending, startTransition] = useTransition();

    const [date, setDate] = useState<DateRange | undefined>({
        from: defaultStartDate,
        to: defaultEndDate,
    });

    const handleApplyFilter = () => {
        const current = new URLSearchParams(Array.from(searchParams.entries()));
        
        if (date?.from) current.set("from", format(date.from, 'yyyy-MM-dd'));
        else current.delete("from");

        if (date?.to) current.set("to", format(date.to, 'yyyy-MM-dd'));
        else current.delete("to");

        const search = current.toString();
        const query = search ? `?${search}` : "";

        startTransition(() => {
            router.push(`${pathname}${query}`);
        });
    };

    const formatCurrency = (value: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(value);

    return (
        <div className="w-full">
            <h1 className="text-2xl font-bold mb-2">Laporan Penjualan & Laba</h1>
            <p className="text-gray-500 mb-6">Analisis performa bisnis Anda dalam rentang waktu tertentu.</p>

            {/* Filter Controls */}
            <div className="p-4 bg-white dark:bg-gray-800/50 rounded-lg border mb-6 flex flex-wrap items-center gap-4">
                <div className="grid gap-2">
                     {/* Placeholder untuk Date Range Picker */}
                    <p className="text-sm text-gray-600">Pilih Rentang Tanggal</p>
                    <input type="date" name="from" defaultValue={format(date?.from || new Date(), 'yyyy-MM-dd')} onChange={(e) => setDate(d => ({...d, from: new Date(e.target.value)}))} className="p-2 border rounded" />
                    <input type="date" name="to" defaultValue={format(date?.to || new Date(), 'yyyy-MM-dd')} onChange={(e) => setDate(d => ({...d, to: new Date(e.target.value)}))} className="p-2 border rounded" />
                </div>
                {/* Placeholder untuk Filter Outlet */}
                <Button onClick={handleApplyFilter} disabled={isPending} className="self-end px-4 py-2 bg-teal-600 text-white rounded">
                    {isPending ? <Loader2 className="animate-spin" /> : "Terapkan Filter"}
                </Button>
            </div>

            {isPending ? (
                <div className="text-center p-12">
                    <Loader2 className="mx-auto h-12 w-12 animate-spin text-teal-600" />
                    <p className="mt-4">Memuat laporan...</p>
                </div>
            ) : !initialData ? (
                <div className="text-center p-12">
                    <p>Gagal memuat data laporan. Silakan coba lagi.</p>
                </div>
            ) : (
                <div className="space-y-6">
                    {/* Summary Cards */}
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                        <StatCard title="Pendapatan Bersih" value={formatCurrency(initialData.summary.net_revenue)} helpText="Setelah diskon" />
                        <StatCard title="Total HPP (Modal)" value={formatCurrency(initialData.summary.total_cogs)} />
                        <StatCard title="Laba Kotor" value={formatCurrency(initialData.summary.gross_profit)} />
                        <StatCard title="Margin Laba" value={`${initialData.summary.gross_margin.toFixed(2)}%`} />
                        <StatCard title="Pajak Terkumpul" value={formatCurrency(initialData.summary.total_tax_collected)} helpText="Untuk disetor" />
                    </div>

                    {/* Top Products Table */}
                    <div>
                        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2"><BarChart /> Produk Paling Menguntungkan</h2>
                        <div className="border rounded-lg bg-white dark:bg-gray-800/50">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b">
                                        <th className="p-3 text-left font-medium">Produk</th>
                                        <th className="p-3 text-right font-medium">Unit Terjual</th>
                                        <th className="p-3 text-right font-medium">Pendapatan Bersih</th>
                                        <th className="p-3 text-right font-medium">Laba Kotor</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {initialData.top_products.map((product, index) => (
                                        <tr key={index} className="border-b">
                                            <td className="p-3">
                                                <p className="font-semibold">{product.product_name}</p>
                                                <p className="text-xs text-gray-500">{product.sku}</p>
                                            </td>
                                            <td className="p-3 text-right">{product.total_quantity_sold}</td>
                                            <td className="p-3 text-right">{formatCurrency(product.net_revenue)}</td>
                                            <td className="p-3 text-right font-semibold text-green-600">{formatCurrency(product.gross_profit)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
