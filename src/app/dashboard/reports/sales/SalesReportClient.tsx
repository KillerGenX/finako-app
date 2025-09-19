"use client";

import { useState, useTransition } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { AreaChart, BarChart, Loader2, Download } from 'lucide-react';
import { DateRange } from 'react-day-picker';
import { format, parseISO } from 'date-fns';
import { id as indonesia } from 'date-fns/locale';

import { SalesReportData, exportSalesReportToExcel } from './actions';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts';

// --- Tipe Data ---
type Outlet = { id: string; name: string };

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
    outlets,
    defaultStartDate, 
    defaultEndDate 
}: { 
    initialData: SalesReportData, 
    outlets: Outlet[],
    defaultStartDate: Date, 
    defaultEndDate: Date 
}) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [isFiltering, startFiltering] = useTransition();
    const [isExporting, startExporting] = useTransition();

    const [date, setDate] = useState<DateRange | undefined>({
        from: defaultStartDate,
        to: defaultEndDate,
    });
    const [selectedOutlet, setSelectedOutlet] = useState(searchParams.get('outletId') || 'all');

    const handleApplyFilter = () => {
        const current = new URLSearchParams(Array.from(searchParams.entries()));
        
        if (date?.from) current.set("from", format(date.from, 'yyyy-MM-dd'));
        else current.delete("from");

        if (date?.to) current.set("to", format(date.to, 'yyyy-MM-dd'));
        else current.delete("to");

        if (selectedOutlet && selectedOutlet !== 'all') {
            current.set("outletId", selectedOutlet);
        } else {
            current.delete("outletId");
        }

        const search = current.toString();
        const query = search ? `?${search}` : "";

        startFiltering(() => {
            router.push(`${pathname}${query}`);
        });
    };
    
    const handleExport = () => {
        startExporting(async () => {
            const startDate = date?.from || defaultStartDate;
            const endDate = date?.to || defaultEndDate;
            const outletId = selectedOutlet === 'all' ? null : selectedOutlet;
            const outletName = outlets.find(o => o.id === outletId)?.name || 'Semua Outlet';
            
            const result = await exportSalesReportToExcel(startDate, endDate, outletId, outletName);
            
            if (result.success && result.data) {
                const link = document.createElement("a");
                link.href = `data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,${result.data}`;
                const period = `${format(startDate, 'yyyyMMdd')}-${format(endDate, 'yyyyMMdd')}`;
                link.download = `Laporan_Penjualan_${period}.xlsx`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            } else {
                alert(`Gagal mengekspor data: ${result.message}`);
            }
        });
    };

    const formatCurrency = (value: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(value);
    const formatDateForChart = (dateString: string) => format(parseISO(dateString), 'd MMM', { locale: indonesia });
    
    return (
        <div className="w-full">
            <h1 className="text-2xl font-bold mb-2">Laporan Penjualan & Laba</h1>
            <p className="text-gray-500 mb-6">Analisis performa bisnis Anda dalam rentang waktu tertentu.</p>

            {/* Filter Controls */}
            <div className="p-4 bg-white dark:bg-gray-800/50 rounded-lg border mb-6 flex flex-wrap items-end gap-4">
                <div className="flex items-end gap-2">
                    <div>
                        <label htmlFor="from" className="text-sm font-medium text-gray-600">Dari Tanggal</label>
                        <input id="from" type="date" name="from" defaultValue={format(date?.from || new Date(), 'yyyy-MM-dd')} onChange={(e) => setDate(d => ({...d, from: new Date(e.target.value)}))} className="p-2 border rounded w-full mt-1" />
                    </div>
                    <div>
                         <label htmlFor="to" className="text-sm font-medium text-gray-600">Sampai Tanggal</label>
                        <input id="to" type="date" name="to" defaultValue={format(date?.to || new Date(), 'yyyy-MM-dd')} onChange={(e) => setDate(d => ({...d, to: new Date(e.target.value)}))} className="p-2 border rounded w-full mt-1" />
                    </div>
                </div>
                <div>
                     <label htmlFor="outlet" className="text-sm font-medium text-gray-600">Outlet</label>
                     <select id="outlet" value={selectedOutlet} onChange={(e) => setSelectedOutlet(e.target.value)} className="p-2 border rounded w-full mt-1 min-w-[150px]">
                         <option value="all">Semua Outlet</option>
                         {outlets.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                     </select>
                </div>
                <button onClick={handleApplyFilter} disabled={isFiltering || isExporting} className="px-4 py-2 bg-teal-600 text-white rounded disabled:opacity-50">
                    {isFiltering ? <Loader2 className="animate-spin" /> : "Terapkan"}
                </button>
                <button onClick={handleExport} disabled={isFiltering || isExporting} className="px-4 py-2 bg-green-600 text-white rounded flex items-center gap-2 disabled:opacity-50">
                    {isExporting ? <Loader2 className="animate-spin" /> : <><Download size={16} /> Export Excel</>}
                </button>
            </div>

            {isFiltering ? (
                <div className="text-center p-12">
                    <Loader2 className="mx-auto h-12 w-12 animate-spin text-teal-600" />
                    <p className="mt-4">Memuat laporan...</p>
                </div>
            ) : !initialData ? (
                <div className="text-center p-12">
                    <p>Gagal memuat data laporan atau tidak ada data pada rentang tanggal ini.</p>
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

                    {/* Grafik Tren */}
                    <div>
                        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2"><AreaChart /> Tren Harian</h2>
                         <div className="p-4 bg-white dark:bg-gray-800/50 rounded-lg border h-72">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={initialData.daily_trend}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="date" tickFormatter={formatDateForChart} />
                                    <YAxis tickFormatter={(value) => `Rp ${Number(value) / 1000}k`} />
                                    <Tooltip formatter={(value:any) => formatCurrency(Number(value))} />
                                    <Legend />
                                    <Line type="monotone" dataKey="net_revenue" name="Pendapatan" stroke="#0d9488" strokeWidth={2} />
                                    <Line type="monotone" dataKey="gross_profit" name="Laba Kotor" stroke="#8b5cf6" strokeWidth={2} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
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
