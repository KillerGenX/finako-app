// src/app/dashboard/reports/inventory/InventoryReportClient.tsx
"use client";

import { useState, useTransition, Fragment, useEffect, useCallback } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { format, parseISO } from 'date-fns';
import { id as indonesia } from 'date-fns/locale';
import { BarChart, BookOpen, Truck, ClipboardCheck, ArchiveX, Loader2, Search, Package, RefreshCw, ChevronDown } from 'lucide-react';
import { ResponsiveContainer, BarChart as RechartsBarChart, XAxis, YAxis, Tooltip, Legend, Bar } from 'recharts';
import { useDebounce } from '@/lib/hooks/useDebounce';

import { 
    InventoryReportData, 
    InventoryLedgerData, 
    VariantSearchResult, 
    searchVariantsForLedger,
    getInventoryLedger
} from './actions';

// --- Helper & Util ---
const formatCurrency = (value: number | null | undefined) => {
    if (value === null || value === undefined) return "Rp 0";
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(value);
};
const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return "N/A";
    return format(parseISO(dateString), 'd MMM yyyy, HH:mm', { locale: indonesia });
};
const formatQty = (qty: number) => new Intl.NumberFormat('id-ID').format(qty);


// --- Komponen Anak ---
const StatCard = ({ title, value, icon }: { title: string, value: string, icon: React.ReactNode }) => (
    <div className="p-4 bg-white dark:bg-gray-800/50 rounded-lg border flex items-center gap-4">
        <div className="p-3 bg-sky-100 dark:bg-sky-900 rounded-lg text-sky-600 dark:text-sky-300">
            {icon}
        </div>
        <div>
            <h3 className="text-sm font-medium text-gray-500">{title}</h3>
            <p className="text-2xl font-bold mt-1">{value}</p>
        </div>
    </div>
);

const TabButton = ({ active, onClick, children }: { active: boolean, onClick: () => void, children: React.ReactNode }) => (
    <button onClick={onClick} className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors ${active ? 'bg-sky-600 text-white' : 'hover:bg-gray-200 dark:hover:bg-gray-700'}`}>
        {children}
    </button>
);

const ReportTable = ({ headers, data, renderRow }: { headers: string[], data: any[], renderRow: (item: any, index: number) => React.ReactNode}) => (
    <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b">{headers.map((h, i) => <th key={i} className={`p-3 text-left font-medium ${h.startsWith('Total') || h.startsWith('Saldo') || h.startsWith('Masuk') ? 'text-right' : ''}`}>{h}</th>)}</tr></thead><tbody>{data.map(renderRow)}</tbody></table></div>
);


// --- Komponen Kartu Stok (Implementasi Final v2) ---
const LedgerTab = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [results, setResults] = useState<VariantSearchResult[]>([]);
    const [isLoadingSearch, setIsLoadingSearch] = useState(false);
    const debouncedSearchTerm = useDebounce(searchTerm, 300);
    const [selectedVariant, setSelectedVariant] = useState<VariantSearchResult | null>(null);
    const [ledgerData, setLedgerData] = useState<InventoryLedgerData>(null);
    const [isLoadingLedger, setIsLoadingLedger] = useState(false);

    useEffect(() => {
        const performSearch = async () => {
            if (debouncedSearchTerm.length < 2) {
                setResults([]);
                return;
            }
            setIsLoadingSearch(true);
            const data = await searchVariantsForLedger(debouncedSearchTerm);
            setResults(data);
            setIsLoadingSearch(false);
        };
        performSearch();
    }, [debouncedSearchTerm]);
    
    const handleSelectVariant = async (variant: VariantSearchResult) => {
        setSearchTerm('');
        setResults([]);
        setSelectedVariant(variant);
        setIsLoadingLedger(true);
        const data = await getInventoryLedger(variant.id);
        setLedgerData(data);
        setIsLoadingLedger(false);
    };

    const resetSearch = () => {
        setSelectedVariant(null);
        setLedgerData(null);
        setSearchTerm('');
    }

    const summary = Array.isArray(ledgerData) 
        ? ledgerData.reduce((acc, curr) => {
            acc.totalStock += curr.quantity_on_hand;
            acc.totalValue += curr.total_value;
            return acc;
        }, { totalStock: 0, totalValue: 0 })
        : { totalStock: 0, totalValue: 0 };


    if (selectedVariant && !isLoadingLedger) {
        return (
            <div className="border rounded-lg p-4">
                <div className="flex justify-between items-start">
                    <div>
                        <h2 className="text-xl font-bold">{selectedVariant.name}</h2>
                        <p className="text-sm text-gray-500">SKU: {selectedVariant.sku} | Stok Gabungan: <strong>{formatQty(summary.totalStock)}</strong> | Total Nilai: <strong>{formatCurrency(summary.totalValue)}</strong></p>
                    </div>
                    <button onClick={resetSearch} className="flex items-center gap-1 text-sm text-sky-600 hover:underline">
                        <RefreshCw size={14} /> Cari Produk Lain
                    </button>
                </div>

                <h3 className="font-semibold mt-4 mb-2">Riwayat Pergerakan per Outlet</h3>
                <div className="space-y-2">
                {Array.isArray(ledgerData) && ledgerData.length > 0 ? (
                    ledgerData.map(outletData => (
                        <details key={outletData.outlet_id} className="bg-gray-50 dark:bg-gray-800/50 rounded" open={ledgerData.length === 1}>
                            <summary className="p-3 font-semibold cursor-pointer flex justify-between items-center">
                                <div>
                                    {outletData.outlet_name}
                                    <span className="ml-2 font-normal text-sm text-gray-500">Stok: {formatQty(outletData.quantity_on_hand)} | Nilai: {formatCurrency(outletData.total_value)}</span>
                                </div>
                                <ChevronDown className="transform transition-transform" />
                            </summary>
                            <div className="p-3 border-t max-h-[400px] overflow-y-auto">
                                <ReportTable headers={['Tanggal', 'Jenis', 'Referensi', 'Masuk/Keluar', 'Saldo Akhir']} data={outletData.movements} renderRow={(item, index) => (
                                     <tr key={index} className="border-b last:border-b-0">
                                        <td className="p-3">{formatDate(item.created_at)}</td>
                                        <td className="p-3">{item.movement_type}</td>
                                        <td className="p-3 font-mono text-xs">{item.reference_number || '-'}</td>
                                        <td className={`p-3 text-right font-semibold ${item.quantity_change > 0 ? 'text-green-600' : 'text-red-600'}`}>{item.quantity_change > 0 ? `+${formatQty(item.quantity_change)}` : formatQty(item.quantity_change)}</td>
                                        <td className="p-3 text-right">{formatQty(item.balance)}</td>
                                    </tr>
                                )}/>
                            </div>
                        </details>
                    ))
                ) : <p className="text-center text-gray-500 p-4">Tidak ada stok atau riwayat pergerakan ditemukan untuk produk ini.</p>}
                </div>
            </div>
        )
    }

    return (
        <div className="p-6 bg-white dark:bg-gray-800/50 rounded-lg border">
            <h3 className="text-lg font-semibold text-center mb-2">Investigasi Kartu Stok</h3>
            <p className="text-sm text-gray-500 text-center mb-6">Pilih satu produk untuk melihat seluruh riwayat pergerakannya.</p>
            <div className="relative max-w-lg mx-auto">
                <div className="flex items-center gap-2 p-2 border rounded-md">
                    <Search className="text-gray-500" />
                    <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Cari berdasarkan Nama atau SKU Produk..." className="w-full focus:outline-none bg-transparent" />
                    {isLoadingSearch && <Loader2 className="animate-spin text-gray-400" />}
                </div>
                {results.length > 0 && (
                    <ul className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-y-auto">
                        {results.map(variant => (
                            <li key={variant.id} onClick={() => handleSelectVariant(variant)} className="p-3 hover:bg-sky-100 cursor-pointer">
                                <p className="font-semibold">{variant.name}</p>
                                <p className="text-xs text-gray-500">SKU: {variant.sku}</p>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
            {isLoadingLedger && <div className="text-center p-8"><Loader2 className="mx-auto h-8 w-8 animate-spin text-sky-600" /></div>}
        </div>
    );
};


// --- Komponen Utama ---
export function InventoryReportClient({ 
    initialData,
    outlets,
    defaultStartDate, 
    defaultEndDate 
}: { 
    initialData: InventoryReportData, 
    outlets: {id: string, name: string}[],
    defaultStartDate: Date, 
    defaultEndDate: Date 
}) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [isFiltering, startFiltering] = useTransition();
    
    const [activeTab, setActiveTab] = useState('summary');
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
    
    return (
        <div className="w-full">
            <h1 className="text-2xl font-bold mb-2">Laporan Inventaris</h1>
            <p className="text-gray-500 mb-6">Analisis kesehatan stok, pergerakan, dan valuasi inventaris Anda.</p>
            <div className="p-4 bg-white dark:bg-gray-800/50 rounded-lg border mb-6 flex flex-wrap items-end gap-4">
                 <div className="flex items-end gap-2">
                    <div><label htmlFor="from" className="text-sm font-medium text-gray-600">Dari Tanggal</label><input id="from" type="date" name="from" value={format(date.from, 'yyyy-MM-dd')} onChange={(e) => setDate(d => ({...d, from: new Date(e.target.value)}))} className="p-2 border rounded w-full mt-1 bg-white dark:bg-gray-800" /></div>
                    <div><label htmlFor="to" className="text-sm font-medium text-gray-600">Sampai Tanggal</label><input id="to" type="date" name="to" value={format(date.to, 'yyyy-MM-dd')} onChange={(e) => setDate(d => ({...d, to: new Date(e.target.value)}))} className="p-2 border rounded w-full mt-1 bg-white dark:bg-gray-800" /></div>
                </div>
                <div><label htmlFor="outlet" className="text-sm font-medium text-gray-600">Outlet</label><select id="outlet" value={selectedOutlet} onChange={(e) => setSelectedOutlet(e.target.value)} className="p-2 border rounded w-full mt-1 min-w-[150px] bg-white dark:bg-gray-800"><option value="all">Semua Outlet</option>{outlets.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}</select></div>
                <button onClick={handleApplyFilter} disabled={isFiltering} className="px-4 py-2 bg-sky-600 text-white rounded disabled:opacity-50 h-10">{isFiltering ? <Loader2 className="animate-spin" /> : "Terapkan"}</button>
            </div>
            
            <div className="mb-6 p-1 bg-gray-100 dark:bg-gray-900 rounded-lg flex gap-1 flex-wrap">
                <TabButton active={activeTab === 'summary'} onClick={() => setActiveTab('summary')}>Ringkasan</TabButton>
                <TabButton active={activeTab === 'ledger'} onClick={() => setActiveTab('ledger')}>Kartu Stok</TabButton>
                <TabButton active={activeTab === 'transfers'} onClick={() => setActiveTab('transfers')}>Transfer Stok</TabButton>
                <TabButton active={activeTab === 'opnames'} onClick={() => setActiveTab('opnames')}>Stok Opname</TabButton>
                <TabButton active={activeTab === 'write_offs'} onClick={() => setActiveTab('write_offs')}>Barang Rusak</TabButton>
            </div>

            {isFiltering ? (<div className="text-center p-12"><Loader2 className="mx-auto h-12 w-12 animate-spin text-sky-600" /></div>) 
            : !initialData ? (<div className="text-center p-12"><p>Gagal memuat data laporan atau tidak ada data pada rentang tanggal ini.</p></div>) 
            : (
                <div className="space-y-6">
                    {activeTab === 'summary' && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                <StatCard title="Total Nilai Inventaris (HPP)" value={formatCurrency(initialData.summary.total_inventory_value)} icon={<Package />} />
                                <StatCard title="Jumlah SKU Aktif" value={initialData.summary.active_sku_count.toString()} icon={<BarChart />} />
                                <StatCard title="Potensi Kerugian" value={formatCurrency(initialData.summary.potential_loss)} icon={<ArchiveX />} />
                                <StatCard title="Item Stok Menipis" value={initialData.summary.low_stock_item_count.toString()} icon={<Loader2 />} />
                            </div>
                             <div className="p-4 bg-white dark:bg-gray-800/50 rounded-lg border">
                                <h3 className="font-semibold mb-4">Valuasi Stok per Kategori</h3>
                                <ResponsiveContainer width="100%" height={300}>
                                    <RechartsBarChart data={initialData.valuation_by_category}>
                                        <XAxis dataKey="category_name" />
                                        <YAxis tickFormatter={(v) => `Rp${v/1000000} Jt`} />
                                        <Tooltip formatter={(value:any) => formatCurrency(Number(value))} /><Legend /><Bar dataKey="total_value" name="Nilai Inventaris" fill="#0284c7" />
                                    </RechartsBarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    )}
                    {activeTab === 'ledger' && <LedgerTab />}
                    {activeTab === 'transfers' && (
                         <div className="p-4 bg-white dark:bg-gray-800/50 rounded-lg border">
                            <h3 className="font-semibold mb-4">Riwayat Transfer Stok</h3>
                            <ReportTable headers={['No. Surat Jalan', 'Tanggal Kirim', 'Asal', 'Tujuan', 'Status']} data={initialData.transfers} renderRow={(item, index) => (
                                <tr key={item.id} className="border-b last:border-b-0"><td className="p-3 font-mono text-xs">{item.transfer_number}</td><td className="p-3">{formatDate(item.sent_at)}</td><td className="p-3">{item.outlet_from}</td><td className="p-3">{item.outlet_to}</td><td className="p-3"><span className={`px-2 py-1 text-xs font-semibold rounded-full ${item.status === 'received' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>{item.status}</span></td></tr>
                            )}/>
                        </div>
                    )}
                     {activeTab === 'opnames' && (
                         <div className="p-4 bg-white dark:bg-gray-800/50 rounded-lg border">
                            <h3 className="font-semibold mb-4">Riwayat Stok Opname</h3>
                             <ReportTable headers={['No. Opname', 'Tanggal Selesai', 'Outlet', 'Status']} data={initialData.opnames} renderRow={(item, index) => (
                                <tr key={item.id} className="border-b last:border-b-0"><td className="p-3 font-mono text-xs">{item.opname_number}</td><td className="p-3">{formatDate(item.completed_at)}</td><td className="p-3">{item.outlet_name}</td><td className="p-3"><span className={`px-2 py-1 text-xs font-semibold rounded-full ${item.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>{item.status}</span></td></tr>
                            )}/>
                        </div>
                    )}
                     {activeTab === 'write_offs' && (
                         <div className="p-4 bg-white dark:bg-gray-800/50 rounded-lg border">
                            <h3 className="font-semibold mb-4">Riwayat Barang Rusak</h3>
                             <ReportTable headers={['No. Dokumen', 'Tanggal', 'Outlet', 'Catatan']} data={initialData.write_offs} renderRow={(item, index) => (
                                <tr key={item.id} className="border-b last:border-b-0"><td className="p-3 font-mono text-xs">{item.write_off_number}</td><td className="p-3">{formatDate(item.created_at)}</td><td className="p-3">{item.outlet_name}</td><td className="p-3">{item.notes || '-'}</td></tr>
                            )}/>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
