"use client";

import { useState, useMemo, useTransition, useEffect } from 'react';
import { getStockReport, StockReportItem } from './actions';
import { useDebounce } from '@/lib/hooks/useDebounce';
import { Search, Loader2 } from 'lucide-react';
import Link from 'next/link';

export function StockReportClient({ initialData }: { initialData: StockReportItem[] }) {
    const [reportData, setReportData] = useState(initialData);
    const [searchQuery, setSearchQuery] = useState('');
    const [isPending, startTransition] = useTransition();
    const debouncedSearch = useDebounce(searchQuery, 300);

    useEffect(() => {
        startTransition(async () => {
            const newData = await getStockReport(debouncedSearch);
            setReportData(newData);
        });
    }, [debouncedSearch]);
    
    // Proses data menjadi format pivot table
    const pivotData = useMemo(() => {
        const products = new Map<string, { product_name: string; sku: string | null; outlets: Map<string, number>; total: number }>();
        const outletNames = new Set<string>();

        reportData.forEach(item => {
            if (!products.has(item.variant_id)) {
                products.set(item.variant_id, {
                    product_name: item.product_name,
                    sku: item.sku,
                    outlets: new Map<string, number>(),
                    total: 0
                });
            }
            const product = products.get(item.variant_id)!;
            product.outlets.set(item.outlet_name, item.quantity_on_hand);
            product.total += item.quantity_on_hand;
            outletNames.add(item.outlet_name);
        });
        
        return { products, outlets: Array.from(outletNames).sort() };
    }, [reportData]);

    return (
        <div>
            <div className="relative w-full max-w-sm mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input 
                    type="text" 
                    value={searchQuery} 
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Cari produk atau SKU..." 
                    className="w-full pl-10 pr-4 py-2 border rounded-lg bg-white dark:bg-gray-800" 
                />
                 {isPending && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 animate-spin" />}
            </div>

            <div className="border rounded-lg w-full bg-white dark:bg-gray-800/50 overflow-x-auto">
                <table className="w-full text-sm">
                    <thead className="[&_tr]:border-b bg-gray-50 dark:bg-gray-800">
                        <tr className="border-b">
                            <th className="p-3 text-left font-medium sticky left-0 bg-gray-50 dark:bg-gray-800">Produk</th>
                            {pivotData.outlets.map(name => <th key={name} className="p-3 text-right font-medium">{name}</th>)}
                            <th className="p-3 text-right font-medium">Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        {Array.from(pivotData.products.entries()).map(([variantId, product]) => (
                            <tr key={variantId} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800">
                                <td className="p-3 sticky left-0 bg-white dark:bg-gray-900/10 backdrop-blur-sm">
                                     <Link href={`/dashboard/inventory/${variantId}`} className="hover:underline text-teal-600 font-semibold">
                                        {product.product_name}
                                    </Link>
                                    <p className="text-xs text-gray-500">{product.sku}</p>
                                </td>
                                {pivotData.outlets.map(outletName => (
                                    <td key={outletName} className="p-3 text-right font-mono">
                                        {product.outlets.get(outletName) || 0}
                                    </td>
                                ))}
                                <td className="p-3 text-right font-mono font-bold">{product.total}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
