// src/app/dashboard/reports/tax/TaxReportClient.tsx
"use client";

import { useState, useTransition } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { format, parseISO } from 'date-fns';
import { Landmark, FileSpreadsheet, Percent, Loader2, Download, PieChart as PieIcon } from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';

import { TaxReportData, exportTaxReportToExcel } from './actions';

// --- Tipe Data Lokal ---
type Outlet = { id: string; name: string };

// --- Helper & Util ---
const formatCurrency = (value: number | null | undefined) => {
    if (value === null || value === undefined) return "Rp 0";
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(value);
};

// --- Komponen Anak ---
const StatCard = ({ title, value, icon }: { title: string, value: string, icon: React.ReactNode }) => (
    <div className="p-4 bg-white dark:bg-gray-800/50 rounded-lg border flex items-center gap-4">
        <div className="p-3 bg-indigo-100 dark:bg-indigo-900 rounded-lg text-indigo-600 dark:text-indigo-300">
            {icon}
        </div>
        <div>
            <h3 className="text-sm font-medium text-gray-500">{title}</h3>
            <p className="text-2xl font-bold mt-1">{value}</p>
        </div>
    </div>
);

const ReportTable = ({ headers, data, renderRow }: { headers: string[], data: any[], renderRow: (item: any, index: number) => React.ReactNode}) => (
    <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b">{headers.map((h, i) => <th key={i} className={`p-3 text-left font-medium ${['Harga', 'Qty', 'DPP', 'Jumlah Pajak'].includes(h) ? 'text-right' : ''}`}>{h}</th>)}</tr></thead><tbody>{data.map(renderRow)}</tbody></table></div>
);


// --- Komponen Utama ---
export function TaxReportClient({ 
    initialData,
    outlets,
    defaultStartDate, 
    defaultEndDate 
}: { 
    initialData: TaxReportData, 
    outlets: Outlet[],
    defaultStartDate: Date, 
    defaultEndDate: Date 
}) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [isFiltering, startFiltering] = useTransition();
    const [isExporting, startExporting] = useTransition();

    const [date, setDate] = useState({from: defaultStartDate, to: defaultEndDate});
    const [selectedOutlet, setSelectedOutlet] = useState(searchParams.get('outletId') || 'all');
    
    const handleApplyFilter = () => {
        const current = new URLSearchParams(Array.from(searchParams.entries()));
        current.set("from", format(date.from, 'yyyy-MM-dd'));
        current.set("to", format(date.to, 'yyyy-MM-dd'));
        if (selectedOutlet !== 'all') current.set("outletId", selectedOutlet);
        else current.delete("outletId");
        startFiltering(() => router.push(`${pathname}?${current.toString()}`));
    };
    
    const handleExport = () => {
        startExporting(async () => {
            const outletName = outlets.find(o => o.id === selectedOutlet)?.name || 'Semua Outlet';
            const result = await exportTaxReportToExcel(initialData, date.from, date.to, outletName);
            if (result.success && result.data) {
                const link = document.createElement("a");
                link.href = `data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,${result.data}`;
                link.download = `Laporan_Pajak_${format(date.from, 'yyyyMMdd')}-${format(date.to, 'yyyyMMdd')}.xlsx`;
                link.click();
            } else {
                alert(`Gagal mengekspor data: ${result.message}`);
            }
        });
    };
    
    const PIE_COLORS = ['#4f46e5', '#0ea5e9', '#f97316', '#10b981', '#ef4444', '#f59e0b'];

    return (
        <div className="w-full">
            <h1 className="text-2xl font-bold mb-2">Laporan Pajak</h1>
            <p className="text-gray-500 mb-6">Analisis rinci pajak penjualan untuk kebutuhan pelaporan.</p>

            {/* Panel Filter */}
            <div className="p-4 bg-white dark:bg-gray-800/50 rounded-lg border mb-6 flex flex-wrap items-end gap-4">
                 <div className="flex items-end gap-2">
                    <div><label htmlFor="from" className="text-sm font-medium text-gray-600">Dari Tanggal</label><input id="from" type="date" name="from" value={format(date.from, 'yyyy-MM-dd')} onChange={(e) => setDate(d => ({...d, from: new Date(e.target.value)}))} className="p-2 border rounded w-full mt-1 bg-white dark:bg-gray-800" /></div>
                    <div><label htmlFor="to" className="text-sm font-medium text-gray-600">Sampai Tanggal</label><input id="to" type="date" name="to" value={format(date.to, 'yyyy-MM-dd')} onChange={(e) => setDate(d => ({...d, to: new Date(e.target.value)}))} className="p-2 border rounded w-full mt-1 bg-white dark:bg-gray-800" /></div>
                </div>
                <div><label htmlFor="outlet" className="text-sm font-medium text-gray-600">Outlet</label><select id="outlet" value={selectedOutlet} onChange={(e) => setSelectedOutlet(e.target.value)} className="p-2 border rounded w-full mt-1 min-w-[150px] bg-white dark:bg-gray-800"><option value="all">Semua Outlet</option>{outlets.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}</select></div>
                <button onClick={handleApplyFilter} disabled={isFiltering || isExporting} className="px-4 py-2 bg-indigo-600 text-white rounded disabled:opacity-50 h-10">{isFiltering ? <Loader2 className="animate-spin" /> : "Terapkan"}</button>
                <button onClick={handleExport} disabled={isFiltering || isExporting || !initialData} className="px-4 py-2 bg-green-600 text-white rounded flex items-center gap-2 disabled:opacity-50 h-10">{isExporting ? <Loader2 className="animate-spin" /> : <><Download size={16} /> Export Excel</>}</button>
            </div>

            {/* Konten Laporan */}
            {isFiltering ? (
                <div className="text-center p-12"><Loader2 className="mx-auto h-12 w-12 animate-spin text-indigo-600" /><p className="mt-4">Memuat laporan...</p></div>
            ) : !initialData || initialData.details.length === 0 ? (
                <div className="text-center p-12"><p>Tidak ada data pajak yang ditemukan pada rentang tanggal ini.</p></div>
            ) : (
                <div className="space-y-6">
                    {/* Kartu Metrik */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <StatCard title="Dasar Pengenaan Pajak (DPP)" value={formatCurrency(initialData.summary.total_dpp)} icon={<FileSpreadsheet />} />
                        <StatCard title="Total Pajak Terkumpul" value={formatCurrency(initialData.summary.total_tax)} icon={<Landmark />} />
                        <StatCard title="Transaksi Kena Pajak" value={initialData.summary.transaction_count.toString()} icon={<Percent />} />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Pie Chart */}
                        <div className="lg:col-span-1 p-4 bg-white dark:bg-gray-800/50 rounded-lg border">
                            <h3 className="font-semibold mb-4 flex items-center gap-2"><PieIcon size={18}/> Komposisi Pajak</h3>
                            <ResponsiveContainer width="100%" height={300}>
                                <PieChart>
                                    <Pie data={initialData.composition} dataKey="amount" nameKey="name" cx="50%" cy="50%" outerRadius={100} labelLine={false} label={({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => { const RADIAN = Math.PI / 180; const radius = innerRadius + (outerRadius - innerRadius) * 0.5; const x = cx + radius * Math.cos(-midAngle * RADIAN); const y = cy + radius * Math.sin(-midAngle * RADIAN); return ( <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central"> {`${(percent * 100).toFixed(0)}%`} </text> ); }}>
                                        {initialData.composition.map((entry, index) => <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />)}
                                    </Pie>
                                    <Tooltip formatter={(value:any) => formatCurrency(Number(value))}/><Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>

                        {/* Tabel Rincian */}
                        <div className="lg:col-span-2 p-4 bg-white dark:bg-gray-800/50 rounded-lg border">
                            <h3 className="font-semibold mb-4">Rincian Pajak per Item Transaksi</h3>
                            <ReportTable 
                                headers={['No. Transaksi', 'Item', 'DPP', 'Jumlah Pajak']} 
                                data={initialData.details} 
                                renderRow={(item, index) => (
                                    <tr key={index} className="border-b last:border-b-0">
                                        <td className="p-3">
                                            <p className="font-mono text-xs">{item.transaction_number}</p>
                                            <p className="text-xs text-gray-500">{format(parseISO(item.transaction_date), 'd MMM yyyy, HH:mm')}</p>
                                        </td>
                                        <td className="p-3">
                                            <p className="font-semibold">{item.variant_name}</p>
                                            <p className="text-xs text-gray-500">{`${item.quantity} x ${formatCurrency(item.unit_price)}`}</p>
                                        </td>
                                        <td className="p-3 text-right">{formatCurrency(item.dpp)}</td>
                                        <td className="p-3 text-right font-semibold text-indigo-600">{formatCurrency(item.tax_amount)}</td>
                                    </tr>
                                )}
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
