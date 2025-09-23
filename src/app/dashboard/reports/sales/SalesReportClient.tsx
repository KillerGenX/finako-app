"use client";
import { useState, useTransition, Fragment } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { AreaChart, BarChart3, Clock, Users, CreditCard, ShoppingBag, Loader2, Download, Eye, X, PieChart as PieIcon, Crown, UserCheck, Wallet } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { id as indonesia } from 'date-fns/locale';

import { ComprehensiveReportData, exportComprehensiveReportToExcel } from './actions';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';

// --- Definisi Tipe Data yang Diperbaiki ---
type Outlet = { id: string; name: string };
type TransactionItemDetails = {
    product_name: string;
    variant_name: string;
    quantity: number;
    unit_price: number;
    discount_amount: number;
    tax_amount: number;
    line_total: number;
};
type TransactionHistoryEntry = {
    id: string;
    transaction_number: string;
    transaction_date: string;
    cashier_name: string;
    customer_name: string | null;
    grand_total: number;
    status: string;
    payment_methods: string | null;
    items: TransactionItemDetails[];
};

// --- Helper & Util ---
const formatCurrency = (value: number | null | undefined) => {
    if (value === null || value === undefined) return "Rp 0";
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(value);
}
const formatDateForChart = (dateString: string) => format(parseISO(dateString), 'd MMM', { locale: indonesia });
const formatFullDateTime = (dateString: string) => format(parseISO(dateString), 'd MMM yyyy, HH:mm', { locale: indonesia });

// --- Komponen Anak ---
const StatCard = ({ title, value, icon }: { title: string, value: string, icon: React.ReactNode }) => (
    <div className="p-4 bg-white dark:bg-gray-800/50 rounded-lg border flex items-center gap-4">
        <div className="p-3 bg-teal-100 dark:bg-teal-900 rounded-lg text-teal-600 dark:text-teal-300">
            {icon}
        </div>
        <div>
            <h3 className="text-sm font-medium text-gray-500">{title}</h3>
            <p className="text-2xl font-bold mt-1">{value}</p>
        </div>
    </div>
);

const TabButton = ({ active, onClick, children }: { active: boolean, onClick: () => void, children: React.ReactNode }) => (
    <button onClick={onClick} className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors ${active ? 'bg-teal-600 text-white' : 'hover:bg-gray-200 dark:hover:bg-gray-700'}`}>
        {children}
    </button>
);

const TransactionDetailModal = ({ transaction, onClose }: { transaction: TransactionHistoryEntry | null, onClose: () => void }) => {
    if (!transaction) return null;
    return (
    <div className="fixed inset-0 bg-black/60 z-50 flex justify-center items-center p-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b flex justify-between items-center sticky top-0 bg-white dark:bg-gray-800">
                <h2 className="text-lg font-bold">Detail Transaksi</h2>
                <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"><X size={20} /></button>
            </div>
            <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                    <div><strong>No. Transaksi:</strong> <span className="font-mono">{transaction.transaction_number}</span></div>
                    <div><strong>Tanggal:</strong> {formatFullDateTime(transaction.transaction_date)}</div>
                    <div><strong>Kasir:</strong> {transaction.cashier_name}</div>
                    <div><strong>Pelanggan:</strong> {transaction.customer_name || 'Umum'}</div>
                </div>
                <div className="border-t pt-4">
                    <h3 className="font-semibold mb-2">Item Dibeli:</h3>
                    <table className="w-full text-sm">
                        <thead><tr className="border-b"><th className="p-2 text-left">Produk</th><th className="p-2 text-right">Qty</th><th className="p-2 text-right">Harga</th><th className="p-2 text-right">Subtotal</th></tr></thead>
                        <tbody>{transaction.items.map((item: TransactionItemDetails, index: number) => (<tr key={index} className="border-b last:border-b-0"><td className="p-2">{item.variant_name}</td><td className="p-2 text-right">{item.quantity}</td><td className="p-2 text-right">{formatCurrency(item.unit_price)}</td><td className="p-2 text-right">{formatCurrency(item.line_total)}</td></tr>))}</tbody>
                    </table>
                </div>
                <div className="border-t pt-4 space-y-1 text-right text-sm">
                   <div className="flex justify-between"><span>Subtotal:</span> <span>{formatCurrency(transaction.items.reduce((acc: number, i: TransactionItemDetails) => acc + i.line_total, 0))}</span></div>
                    <div className="flex justify-between"><span>Pajak:</span> <span>{formatCurrency(transaction.items.reduce((acc: number, i: TransactionItemDetails) => acc + i.tax_amount, 0))}</span></div>
                    <div className="flex justify-between"><span>Diskon:</span> <span className="text-red-500">{formatCurrency(transaction.items.reduce((acc: number, i: TransactionItemDetails) => acc + i.discount_amount, 0))}</span></div>
                    <div className="flex justify-between font-semibold mt-2"><span>Dibayar dengan:</span> <span className="uppercase">{transaction.payment_methods || 'N/A'}</span></div>
                    <div className="flex justify-between text-base font-bold mt-1"><span>Grand Total:</span> <span>{formatCurrency(transaction.grand_total)}</span></div>
                </div>
            </div>
        </div>
    </div>
);
}

const ReportTable = ({ headers, data, renderRow }: { headers: string[], data: any[], renderRow: (item: any, index: number) => React.ReactNode}) => (
    <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b">{headers.map((h, i) => <th key={i} className={`p-3 text-left font-medium ${h.startsWith('Jumlah') || h.startsWith('Total') || h.startsWith('Rata-rata') ? 'text-right' : ''}`}>{h}</th>)}</tr></thead><tbody>{data.map(renderRow)}</tbody></table></div>
);

const CustomBarChartTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="p-2 bg-gray-800 text-white rounded-md border border-gray-700 shadow-lg text-sm">
        <p className="font-bold">{`Jam ${label}:00`}</p>
        <p>{`Total: ${payload[0].value} transaksi`}</p>
      </div>
    );
  }
  return null;
};

// --- Komponen Utama ---
export function SalesReportClient({ 
    initialData,
    outlets,
    defaultStartDate, 
    defaultEndDate 
}: { 
    initialData: ComprehensiveReportData, 
    outlets: Outlet[],
    defaultStartDate: Date, 
    defaultEndDate: Date 
}) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [isFiltering, startFiltering] = useTransition();
    const [isExporting, startExporting] = useTransition();
    const [activeTab, setActiveTab] = useState('summary');
    const [selectedTransaction, setSelectedTransaction] = useState<TransactionHistoryEntry | null>(null);
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
            const result = await exportComprehensiveReportToExcel(date.from, date.to, selectedOutlet === 'all' ? null : selectedOutlet, outletName);
            if (result.success && result.data) {
                const link = document.createElement("a");
                link.href = `data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,${result.data}`;
                link.download = `Laporan_Penjualan_${format(date.from, 'yyyyMMdd')}-${format(date.to, 'yyyyMMdd')}.xlsx`;
                link.click();
            } else {
                alert(`Gagal mengekspor data: ${result.message}`);
            }
        });
    };
    
    const PIE_COLORS = ['#0d9488', '#0ea5e9', '#f97316', '#8b5cf6', '#ef4444', '#f59e0b'];

    return (
        <div className="w-full">
            <h1 className="text-2xl font-bold mb-2">Dasbor Analisis Penjualan</h1>
            <p className="text-gray-500 mb-6">Analisis performa bisnis Anda secara komprehensif.</p>

            <div className="p-4 bg-white dark:bg-gray-800/50 rounded-lg border mb-6 flex flex-wrap items-end gap-4">
                 <div className="flex items-end gap-2">
                    <div><label htmlFor="from" className="text-sm font-medium text-gray-600">Dari Tanggal</label><input id="from" type="date" name="from" value={format(date.from, 'yyyy-MM-dd')} onChange={(e) => setDate(d => ({...d, from: new Date(e.target.value)}))} className="p-2 border rounded w-full mt-1 bg-white dark:bg-gray-800" /></div>
                    <div><label htmlFor="to" className="text-sm font-medium text-gray-600">Sampai Tanggal</label><input id="to" type="date" name="to" value={format(date.to, 'yyyy-MM-dd')} onChange={(e) => setDate(d => ({...d, to: new Date(e.target.value)}))} className="p-2 border rounded w-full mt-1 bg-white dark:bg-gray-800" /></div>
                </div>
                <div><label htmlFor="outlet" className="text-sm font-medium text-gray-600">Outlet</label><select id="outlet" value={selectedOutlet} onChange={(e) => setSelectedOutlet(e.target.value)} className="p-2 border rounded w-full mt-1 min-w-[150px] bg-white dark:bg-gray-800"><option value="all">Semua Outlet</option>{outlets.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}</select></div>
                <button onClick={handleApplyFilter} disabled={isFiltering || isExporting} className="px-4 py-2 bg-teal-600 text-white rounded disabled:opacity-50 h-10">{isFiltering ? <Loader2 className="animate-spin" /> : "Terapkan"}</button>
                <button onClick={handleExport} disabled={isFiltering || isExporting} className="px-4 py-2 bg-green-600 text-white rounded flex items-center gap-2 disabled:opacity-50 h-10">{isExporting ? <Loader2 className="animate-spin" /> : <><Download size={16} /> Export Excel</>}</button>
            </div>

            {isFiltering ? (<div className="text-center p-12"><Loader2 className="mx-auto h-12 w-12 animate-spin text-teal-600" /><p className="mt-4">Memuat laporan...</p></div>) 
            : !initialData ? (<div className="text-center p-12"><p>Gagal memuat data laporan atau tidak ada data pada rentang tanggal ini.</p></div>) 
            : (
                <>
                    <div className="mb-6 p-1 bg-gray-100 dark:bg-gray-900 rounded-lg flex gap-1 flex-wrap">
                        <TabButton active={activeTab === 'summary'} onClick={() => setActiveTab('summary')}>Ringkasan</TabButton>
                        <TabButton active={activeTab === 'products'} onClick={() => setActiveTab('products')}>Analisis Produk</TabButton>
                        <TabButton active={activeTab === 'staff'} onClick={() => setActiveTab('staff')}>Kinerja Staf & Pelanggan</TabButton>
                        <TabButton active={activeTab === 'payment'} onClick={() => setActiveTab('payment')}>Metode Bayar</TabButton>
                        <TabButton active={activeTab === 'history'} onClick={() => setActiveTab('history')}>Riwayat Transaksi</TabButton>
                    </div>
                    <div className="space-y-6">
                        {activeTab === 'summary' && (
                            <div className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                    <StatCard title="Pendapatan Bersih" value={formatCurrency(initialData.summary.net_revenue)} icon={<ShoppingBag />} />
                                    <StatCard title="Laba Kotor" value={formatCurrency(initialData.summary.gross_profit)} icon={<AreaChart />} />
                                    <StatCard title="Jumlah Transaksi" value={initialData.summary.transaction_count.toString()} icon={<CreditCard />} />
                                    <StatCard title="Pajak Terkumpul" value={formatCurrency(initialData.summary.total_tax_collected)} icon={<span className="font-bold text-lg">%</span>} />
                                </div>
                                <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                                    <div className="lg:col-span-3 p-4 bg-white dark:bg-gray-800/50 rounded-lg border">
                                        <h3 className="font-semibold mb-4 flex items-center gap-2"><AreaChart size={18}/> Tren Pendapatan & Laba Harian</h3>
                                        <ResponsiveContainer width="100%" height={300}>
                                            <LineChart data={initialData.daily_trend}>
                                                <CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="date" tickFormatter={formatDateForChart} /><YAxis tickFormatter={(v) => `Rp${v/1000}k`} />
                                                <Tooltip formatter={(value:any) => formatCurrency(Number(value))} /><Legend />
                                                <Line type="monotone" dataKey="net_revenue" name="Pendapatan" stroke="#0d9488" /><Line type="monotone" dataKey="gross_profit" name="Laba" stroke="#8b5cf6" />
                                            </LineChart>
                                        </ResponsiveContainer>
                                    </div>
                                    <div className="lg:col-span-2 p-4 bg-white dark:bg-gray-800/50 rounded-lg border">
                                        <h3 className="font-semibold mb-4 flex items-center gap-2"><Clock size={18}/> Transaksi per Jam</h3>
                                        <ResponsiveContainer width="100%" height={300}>
                                            <BarChart data={initialData.hourly_sales_trend}>
                                                 <XAxis dataKey="hour" type="category" tickFormatter={(h) => `${h}:00`} /><YAxis allowDecimals={false}/>
                                                 <Tooltip content={<CustomBarChartTooltip />} cursor={{fill: 'rgba(13, 148, 136, 0.2)'}} />
                                                 <Bar dataKey="transaction_count" name="Jumlah Transaksi" fill="#0d9488" />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            </div>
                        )}
                        {activeTab === 'products' && (
                           <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                               <div className="p-4 bg-white dark:bg-gray-800/50 rounded-lg border">
                                    <h3 className="font-semibold mb-4 flex items-center gap-2"><BarChart3 size={18}/> Produk Paling Menguntungkan</h3>
                                    <ReportTable headers={['Produk', 'Jumlah Terjual', 'Total Laba']} data={initialData.top_products} renderRow={(item, index) => (<tr key={index} className="border-b last:border-b-0"><td className="p-3"><p className="font-semibold">{item.product_name}</p><p className="text-xs text-gray-500">{item.template_name}</p></td><td className="p-3 text-right">{item.total_quantity_sold}</td><td className="p-3 text-right font-semibold text-green-600">{formatCurrency(item.gross_profit)}</td></tr>)}/>
                               </div>
                               <div className="p-4 bg-white dark:bg-gray-800/50 rounded-lg border">
                                    <h3 className="font-semibold mb-4 flex items-center gap-2"><PieIcon size={18}/> Pendapatan per Kategori</h3>
                                     <ResponsiveContainer width="100%" height={300}>
                                       <PieChart>
                                           <Pie data={initialData.category_performance} dataKey="net_revenue" nameKey="category_name" cx="50%" cy="50%" outerRadius={100} labelLine={false} label={({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => { const RADIAN = Math.PI / 180; const radius = innerRadius + (outerRadius - innerRadius) * 0.5; const x = cx + radius * Math.cos(-midAngle * RADIAN); const y = cy + radius * Math.sin(-midAngle * RADIAN); return ( <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central"> {`${(percent * 100).toFixed(0)}%`} </text> ); }}>
                                               {initialData.category_performance.map((entry, index) => <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />)}
                                           </Pie>
                                           <Tooltip formatter={(value:any) => formatCurrency(Number(value))}/><Legend />
                                       </PieChart>
                                   </ResponsiveContainer>
                               </div>
                          </div>
                        )}
                        {activeTab === 'staff' && (
                             <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                 <div className="p-4 bg-white dark:bg-gray-800/50 rounded-lg border">
                                     <h3 className="font-semibold mb-4 flex items-center gap-2"><UserCheck size={18}/> Kinerja Kasir</h3>
                                     <ReportTable headers={['Nama Kasir', 'Jumlah Transaksi', 'Total Penjualan']} data={initialData.cashier_performance} renderRow={(item, index) => (<tr key={index} className="border-b last:border-b-0"><td className="p-3 font-semibold">{item.cashier_name}</td><td className="p-3 text-right">{item.transaction_count}</td><td className="p-3 text-right">{formatCurrency(item.net_revenue)}</td></tr>)}/>
                                 </div>
                                  <div className="p-4 bg-white dark:bg-gray-800/50 rounded-lg border">
                                     <h3 className="font-semibold mb-4 flex items-center gap-2"><Crown size={18}/> Pelanggan Teratas</h3>
                                     <ReportTable headers={['Nama Pelanggan', 'Jumlah Transaksi', 'Total Belanja']} data={initialData.top_customers} renderRow={(item, index) => (<tr key={index} className="border-b last:border-b-0"><td className="p-3 font-semibold">{item.customer_name}</td><td className="p-3 text-right">{item.transaction_count}</td><td className="p-3 text-right">{formatCurrency(item.total_spent)}</td></tr>)}/>
                                 </div>
                             </div>
                        )}
                        {activeTab === 'payment' && (
                             <div className="p-4 bg-white dark:bg-gray-800/50 rounded-lg border">
                                 <h3 className="font-semibold mb-4 flex items-center gap-2"><Wallet size={18}/> Rincian Metode Pembayaran</h3>
                                 <ResponsiveContainer width="100%" height={300}>
                                     <PieChart>
                                         <Pie data={initialData.payment_method_summary} dataKey="total_amount" nameKey="payment_method" cx="50%" cy="50%" outerRadius={100} labelLine={false} label={({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => { const RADIAN = Math.PI / 180; const radius = innerRadius + (outerRadius - innerRadius) * 0.5; const x = cx + radius * Math.cos(-midAngle * RADIAN); const y = cy + radius * Math.sin(-midAngle * RADIAN); return ( <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central"> {`${(percent * 100).toFixed(0)}%`} </text> ); }}>
                                             {initialData.payment_method_summary.map((entry, index) => <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />)}
                                         </Pie>
                                         <Tooltip formatter={(value:any) => formatCurrency(Number(value))}/><Legend />
                                     </PieChart>
                                 </ResponsiveContainer>
                             </div>
                        )}
                        {activeTab === 'history' && (
                           <div className="p-4 bg-white dark:bg-gray-800/50 rounded-lg border">
                                <h3 className="font-semibold mb-4">Riwayat Transaksi</h3>
                                <ReportTable headers={['No. Transaksi', 'Tanggal', 'Kasir', 'Pelanggan', 'Total', 'Aksi']} data={initialData.transaction_history} renderRow={(tx: TransactionHistoryEntry, index) => (<tr key={tx.id} className="border-b last:border-b-0"><td className="p-3 font-mono text-xs">{tx.transaction_number}</td><td className="p-3">{formatFullDateTime(tx.transaction_date)}</td><td className="p-3">{tx.cashier_name}</td><td className="p-3">{tx.customer_name || 'Umum'}</td><td className="p-3 text-right font-semibold">{formatCurrency(tx.grand_total)}</td><td className="p-3 text-center"><button onClick={() => setSelectedTransaction(tx)} className="p-1 text-teal-600 hover:text-teal-800"><Eye size={16} /></button></td></tr>)}/>
                           </div>
                        )}
                    </div>
                </>
            )}
            <TransactionDetailModal transaction={selectedTransaction} onClose={() => setSelectedTransaction(null)} />
        </div>
    );
}
