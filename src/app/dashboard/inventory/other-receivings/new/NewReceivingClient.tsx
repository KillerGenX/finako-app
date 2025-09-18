"use client";

import { useState, useTransition, useEffect } from 'react';
import Link from 'next/link';
import { useDebounce } from '@/lib/hooks/useDebounce';
// PERBAIKAN: Impor fungsi pencarian yang sudah terbukti dari modul transfer
import { searchProductVariants } from '../../transfers/new/actions'; 
import { createOtherReceivingAction } from './actions';
import { ArrowLeft, Search, Trash2, Loader2 } from 'lucide-react';

// Tipe Data
type Outlet = { id: string; name: string };
// PERBAIKAN: Sesuaikan tipe data hasil pencarian agar cocok
type ProductVariantSearchResult = { id: string; name: string; sku: string | null; stock_on_hand: number; };
type ReceivingItem = { variant: ProductVariantSearchResult; quantity: number; notes: string };

// --- Komponen Pencarian Produk (Sekarang konsisten dengan modul lain) ---
function ProductSearch({ outletId, onProductSelect }: { outletId: string | null; onProductSelect: (product: ProductVariantSearchResult) => void }) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<ProductVariantSearchResult[]>([]);
    const [isSearching, startSearchTransition] = useTransition();
    const debouncedQuery = useDebounce(query, 300);

    useEffect(() => {
        // Hanya cari jika outlet sudah dipilih
        if (debouncedQuery.length > 2 && outletId) {
            startSearchTransition(async () => {
                const products = await searchProductVariants(debouncedQuery, outletId);
                setResults(products);
            });
        } else {
            setResults([]);
        }
    }, [debouncedQuery, outletId]);

    const handleSelect = (product: ProductVariantSearchResult) => {
        onProductSelect(product);
        setQuery('');
        setResults([]);
    };

    return (
        <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input type="text" value={query} onChange={(e) => setQuery(e.target.value)}
                placeholder={outletId ? "Cari produk..." : "Pilih outlet terlebih dahulu"}
                className="w-full pl-10 pr-4 py-2 border rounded-lg bg-white dark:bg-gray-800" 
                disabled={!outletId} />
            {isSearching && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 animate-spin" />}
            {results.length > 0 && (
                <div className="absolute top-full mt-1 w-full bg-white dark:bg-gray-800 border rounded-lg shadow-lg z-10">
                    {results.map(product => (
                        <div key={product.id} onClick={() => handleSelect(product)} className="p-3 hover:bg-gray-100 flex justify-between items-center">
                           <div>
                                <p className="font-semibold">{product.name}</p>
                                <p className="text-sm text-gray-500">{product.sku}</p>
                           </div>
                           <span className="text-sm font-mono bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">Stok: {product.stock_on_hand}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}


// --- Komponen Utama ---
export function NewReceivingClient({ outlets }: { outlets: Outlet[] }) {
    const [items, setItems] = useState<ReceivingItem[]>([]);
    const [isPending, startTransition] = useTransition();
    const [outletId, setOutletId] = useState<string | null>(outlets[0]?.id || null);

    const handleAddProduct = (product: ProductVariantSearchResult) => {
        if (!items.some(item => item.variant.id === product.id)) {
            setItems(prev => [...prev, { variant: product, quantity: 1, notes: '' }]);
        }
    };

    const handleItemChange = (variantId: string, field: 'quantity' | 'notes', value: string | number) => {
        setItems(prev => prev.map(item => item.variant.id === variantId ? { ...item, [field]: value } : item));
    };
    
    const handleRemoveItem = (variantId: string) => {
        setItems(prev => prev.filter(item => item.variant.id !== variantId));
    };

    const handleSubmit = async (formData: FormData) => {
        const itemsToSubmit = items.map(item => ({
            variant_id: item.variant.id,
            quantity: item.quantity,
            notes: item.notes
        }));
        formData.append('items', JSON.stringify(itemsToSubmit));

        startTransition(() => createOtherReceivingAction(formData));
    };

    return (
        <form action={handleSubmit} className="w-full">
             <div className="flex items-center justify-between mb-6">
                <div>
                    <Link href="/dashboard/inventory/other-receivings" className="flex items-center gap-2 text-gray-600 mb-2"><ArrowLeft size={18} /> Kembali ke Daftar</Link>
                    <h1 className="text-2xl font-bold">Catat Penerimaan Lainnya Baru</h1>
                </div>
                <button type="submit" disabled={isPending || items.length === 0} className="bg-teal-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 disabled:bg-gray-400">
                    {isPending ? <Loader2 className="animate-spin" /> : 'Simpan & Tambah Stok'}
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-1 space-y-4">
                     <div className="p-4 bg-white dark:bg-gray-800/50 rounded-lg border">
                        <label className="block text-sm font-medium mb-1">Terima di Outlet</label>
                        <select name="outlet_id" value={outletId || ''} onChange={e => setOutletId(e.target.value)} required className="w-full p-2 border rounded bg-white dark:bg-gray-800">
                            {outlets.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                        </select>
                    </div>
                     <div className="p-4 bg-white dark:bg-gray-800/50 rounded-lg border">
                        <label className="block text-sm font-medium mb-1">Catatan Umum (Opsional)</label>
                        <textarea name="notes" rows={4} className="w-full p-2 border rounded bg-white dark:bg-gray-800"></textarea>
                    </div>
                </div>

                <div className="md:col-span-2 space-y-4">
                    <div className="p-4 bg-white dark:bg-gray-800/50 rounded-lg border">
                        <label className="block text-sm font-medium mb-2">Tambah Produk</label>
                        <ProductSearch outletId={outletId} onProductSelect={handleAddProduct} />
                    </div>
                    <div className="border rounded-lg w-full bg-white dark:bg-gray-800/50">
                        <table className="w-full text-sm">
                            <thead><tr className="border-b"><th className="p-3 text-left">Produk</th><th className="p-3 w-48">Catatan Item</th><th className="p-3 w-24">Jumlah</th><th className="p-3 w-12"></th></tr></thead>
                            <tbody>
                                {items.length > 0 ? items.map(item => (
                                    <tr key={item.variant.id} className="border-b">
                                        <td className="p-3">{item.variant.name} <p className="text-xs text-gray-500">Stok Saat Ini: {item.variant.stock_on_hand}</p></td>
                                        <td className="p-3"><input type="text" value={item.notes} onChange={e => handleItemChange(item.variant.id, 'notes', e.target.value)} placeholder="Contoh: Sampel gratis" className="w-full p-1 border rounded" /></td>
                                        <td className="p-3"><input type="number" value={item.quantity} onChange={e => handleItemChange(item.variant.id, 'quantity', e.target.value)} className="w-full p-1 border rounded" /></td>
                                        <td className="p-3"><button type="button" onClick={() => handleRemoveItem(item.variant.id)} className="text-red-500"><Trash2 size={16}/></button></td>
                                    </tr>
                                )) : (
                                    <tr><td colSpan={4} className="p-6 text-center text-gray-500">Pilih outlet lalu cari produk.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </form>
    );
}
