"use client";

import { useState, useTransition, useEffect } from 'react';
import Link from 'next/link';
import { useDebounce } from '@/lib/hooks/useDebounce';
import { searchProductVariants, createPOAction, getPurchaseHistory, PurchaseHistoryEntry } from './actions';
import { ArrowLeft, Search, Trash2, Loader2, Info, History, X } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';


// --- Tipe Data ---
type Outlet = { id: string; name: string };
type Supplier = { id: string; name: string };
type ProductVariantSearchResult = { id: string; name: string; sku: string | null; };
type POItem = { variant: ProductVariantSearchResult; quantity: number; unit_cost: number };


// --- Komponen Pencarian Produk ---
function ProductSearch({ onProductSelect }: { onProductSelect: (product: ProductVariantSearchResult) => void }) {
    // ... (Fungsionalitas tidak berubah, tetap sama)
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<ProductVariantSearchResult[]>([]);
    const [isSearching, startSearchTransition] = useTransition();
    const debouncedQuery = useDebounce(query, 300);
    useEffect(() => {
        if (debouncedQuery.length > 2) {
            startSearchTransition(async () => {
                const products = await searchProductVariants(debouncedQuery);
                setResults(products);
            });
        } else {
            setResults([]);
        }
    }, [debouncedQuery]);
    const handleSelect = (product: ProductVariantSearchResult) => {
        onProductSelect(product);
        setQuery('');
        setResults([]);
    };
    return (
        <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input type="text" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Cari produk berdasarkan nama atau SKU..." className="w-full pl-10 pr-4 py-2 border rounded-lg bg-white dark:bg-gray-800" />
            {isSearching && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 animate-spin" />}
            {results.length > 0 && (
                <div className="absolute top-full mt-1 w-full bg-white dark:bg-gray-800 border rounded-lg shadow-lg z-10 max-h-60 overflow-y-auto">
                    {results.map(product => (<div key={product.id} onClick={() => handleSelect(product)} className="p-3 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"><p className="font-semibold">{product.name}</p><p className="text-sm text-gray-500">{product.sku}</p></div>))}
                </div>
            )}
        </div>
    );
}

// --- Komponen Modal Riwayat Harga ---
function PriceHistoryModal({ variant, onClose, onSelectPrice }: {
    variant: ProductVariantSearchResult;
    onClose: () => void;
    onSelectPrice: (price: number) => void;
}) {
    const [history, setHistory] = useState<PurchaseHistoryEntry[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function fetchHistory() {
            setIsLoading(true);
            const data = await getPurchaseHistory(variant.id);
            setHistory(data);
            setIsLoading(false);
        }
        fetchHistory();
    }, [variant.id]);

    const formatCurrency = (amount: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
    const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });

    // Data untuk grafik, dibalik agar urutan tanggal dari kiri ke kanan (asc)
    const chartData = [...history].reverse().map(h => ({
        date: formatDate(h.order_date),
        price: h.unit_cost,
        supplier: h.supplier_name
    }));

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex justify-center items-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl h-[90vh] flex flex-col">
                <div className="p-4 border-b flex justify-between items-center">
                    <h3 className="text-lg font-semibold">Riwayat Harga: {variant.name}</h3>
                    <button onClick={onClose}><X size={24} /></button>
                </div>
                
                {isLoading ? (
                    <div className="flex-grow flex justify-center items-center"><Loader2 className="animate-spin" size={32} /></div>
                ) : history.length === 0 ? (
                    <div className="flex-grow flex justify-center items-center"><p>Tidak ada riwayat pembelian ditemukan.</p></div>
                ) : (
                    <div className="flex-grow p-4 overflow-y-auto grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Grafik */}
                        <div className="lg:col-span-2 h-64">
                            <h4 className="font-semibold mb-2">Grafik Tren Harga</h4>
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="date" />
                                    <YAxis tickFormatter={(value) => `Rp ${Number(value) / 1000}k`} />
                                    <Tooltip formatter={(value:any) => formatCurrency(Number(value))} />
                                    <Legend />
                                    <Line type="monotone" dataKey="price" name="Harga Beli" stroke="#10b981" activeDot={{ r: 8 }} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                        {/* Tabel */}
                        <div className="lg:col-span-2">
                             <h4 className="font-semibold mb-2">Detail Riwayat</h4>
                            <div className="border rounded-lg overflow-hidden max-h-96 overflow-y-auto">
                                <table className="w-full text-sm">
                                    <thead className="bg-gray-50 dark:bg-gray-700"><tr>
                                        <th className="p-3 text-left">Tanggal</th>
                                        <th className="p-3 text-left">Pemasok</th>
                                        <th className="p-3 text-left">No. PO</th>
                                        <th className="p-3 text-right">Harga Beli</th>
                                        <th className="p-3 text-center">Aksi</th>
                                    </tr></thead>
                                    <tbody>
                                        {history.map((entry, index) => (
                                            <tr key={index} className="border-b">
                                                <td className="p-3">{formatDate(entry.order_date)}</td>
                                                <td className="p-3">{entry.supplier_name}</td>
                                                <td className="p-3">{entry.po_number}</td>
                                                <td className="p-3 text-right font-mono">{formatCurrency(entry.unit_cost)}</td>
                                                <td className="p-3 text-center">
                                                    <button onClick={() => onSelectPrice(entry.unit_cost)} className="text-xs bg-teal-500 text-white px-2 py-1 rounded hover:bg-teal-600">Gunakan</button>
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
        </div>
    );
}


// --- Komponen Utama ---
export function NewPOClient({ suppliers, outlets }: { suppliers: Supplier[], outlets: Outlet[] }) {
    const [items, setItems] = useState<POItem[]>([]);
    const [isPending, startTransition] = useTransition();
    const [formError, setFormError] = useState<string | null>(null);
    const [historyModalVariant, setHistoryModalVariant] = useState<ProductVariantSearchResult | null>(null);

    const handleAddProduct = async (product: ProductVariantSearchResult) => {
        if (!items.some(item => item.variant.id === product.id)) {
            // Ambil harga terakhir secara otomatis
            const history = await getPurchaseHistory(product.id);
            const lastPrice = history.length > 0 ? history[0].unit_cost : 0;
            setItems(prev => [...prev, { variant: product, quantity: 1, unit_cost: lastPrice }]);
        }
    };
    
    const handleItemChange = (variantId: string, field: 'quantity' | 'unit_cost', value: number) => {
        setItems(prev => prev.map(item => item.variant.id === variantId ? { ...item, [field]: Math.max(0, value) } : item));
    };
    
    const handleRemoveItem = (variantId: string) => {
        setItems(prev => prev.filter(item => item.variant.id !== variantId));
    };

    const handleSelectPriceFromHistory = (price: number) => {
        if (historyModalVariant) {
            handleItemChange(historyModalVariant.id, 'unit_cost', price);
            setHistoryModalVariant(null);
        }
    };

    const handleSubmit = async (formData: FormData) => {
        // ... (Fungsionalitas tidak berubah, tetap sama)
        setFormError(null);
        const itemsToSubmit = items.map(item => ({ variant_id: item.variant.id, quantity: item.quantity, unit_cost: item.unit_cost }));
        formData.append('items', JSON.stringify(itemsToSubmit));

        startTransition(async () => {
            const result = await createPOAction(formData);
            if (result?.errors) {
                const errorMessages = Object.values(result.errors).flat().join('\\n');
                setFormError(errorMessages);
            } else if (result?.message) {
                setFormError(result.message);
            }
        });
    };

    return (
        <>
            {historyModalVariant && (
                <PriceHistoryModal 
                    variant={historyModalVariant} 
                    onClose={() => setHistoryModalVariant(null)} 
                    onSelectPrice={handleSelectPriceFromHistory}
                />
            )}
            <form action={handleSubmit} className="flex flex-col w-full h-full">
                 <div className="flex items-center justify-between mb-6">
                    <div>
                        <Link href="/dashboard/inventory/purchase-orders" className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-2"><ArrowLeft size={18} /> Kembali ke Daftar PO</Link>
                        <h1 className="text-2xl font-bold">Buat Pesanan Pembelian Baru</h1>
                    </div>
                    <button type="submit" disabled={isPending || items.length === 0} className="bg-teal-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 disabled:bg-gray-400">
                        {isPending ? <Loader2 className="animate-spin" /> : 'Simpan Draft PO'}
                    </button>
                </div>

                {formError && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
                        <strong className="font-bold">Error!</strong><span className="block sm:inline ml-2">{formError}</span>
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="md:col-span-1 space-y-4">
                        {/* Form Pemasok, Outlet, dll. tidak berubah */}
                        <div className="p-4 bg-white dark:bg-gray-800/50 rounded-lg border">
                            <label className="block text-sm font-medium mb-1">Pemasok</label>
                            <select name="supplier_id" required className="w-full p-2 border rounded bg-white dark:bg-gray-800">{suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select>
                        </div>
                        <div className="p-4 bg-white dark:bg-gray-800/50 rounded-lg border">
                            <label className="block text-sm font-medium mb-1">Terima di Outlet</label>
                            <select name="outlet_id" required className="w-full p-2 border rounded bg-white dark:bg-gray-800">{outlets.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}</select>
                        </div>
                        <div className="p-4 bg-white dark:bg-gray-800/50 rounded-lg border">
                            <label className="block text-sm font-medium mb-1">Perkiraan Tgl. Tiba (Opsional)</label>
                            <input type="date" name="expected_delivery_date" className="w-full p-2 border rounded bg-white dark:bg-gray-800" />
                        </div>
                        <div className="p-4 bg-white dark:bg-gray-800/50 rounded-lg border">
                            <label className="block text-sm font-medium mb-1">Catatan (Opsional)</label>
                            <textarea name="notes" rows={3} className="w-full p-2 border rounded bg-white dark:bg-gray-800"></textarea>
                        </div>
                    </div>

                    <div className="md:col-span-2 space-y-4">
                        <div className="p-4 bg-white dark:bg-gray-800/50 rounded-lg border">
                            <label className="block text-sm font-medium mb-2">Tambah Produk</label>
                            <ProductSearch onProductSelect={handleAddProduct} />
                        </div>
                        <div className="border rounded-lg w-full bg-white dark:bg-gray-800/50">
                            <table className="w-full text-sm">
                                <thead><tr className="border-b"><th className="p-3 text-left font-medium">Produk</th><th className="p-3 font-medium w-40">Harga Beli/Unit</th><th className="p-3 font-medium w-24">Jumlah</th><th className="p-3 font-medium w-12"></th></tr></thead>
                                <tbody>
                                    {items.length > 0 ? items.map(item => (
                                        <tr key={item.variant.id} className="border-b">
                                            <td className="p-3">{item.variant.name} <span className="text-xs text-gray-500">{item.variant.sku}</span></td>
                                            <td className="p-3">
                                                <div className="flex items-center gap-1">
                                                    <input type="number" value={item.unit_cost} onChange={e => handleItemChange(item.variant.id, 'unit_cost', parseFloat(e.target.value))} className="w-full p-1 border rounded" />
                                                    <button type="button" onClick={() => setHistoryModalVariant(item.variant)} className="p-1.5 text-gray-500 hover:text-teal-600">
                                                        <History size={16}/>
                                                    </button>
                                                </div>
                                            </td>
                                            <td className="p-3"><input type="number" value={item.quantity} onChange={e => handleItemChange(item.variant.id, 'quantity', parseInt(e.target.value, 10))} className="w-full p-1 border rounded text-center" /></td>
                                            <td className="p-3 text-center"><button type="button" onClick={() => handleRemoveItem(item.variant.id)} className="text-red-500"><Trash2 size={16}/></button></td>
                                        </tr>
                                    )) : (
                                        <tr><td colSpan={4} className="p-6 text-center text-gray-500">Cari dan tambahkan produk untuk memulai.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </form>
        </>
    );
}
