"use client";

import { useState, useTransition, useCallback, useEffect } from 'react';
import { PlusCircle, Loader2, Search, Trash2 } from 'lucide-react';
import { searchProductsForComponent, addComponentToComposite } from '../../actions';
import { useDebounce } from '@/lib/hooks/useDebounce';
import type { Product } from './ProductDetailClient';
import type { CompositeComponent as InitialCompositeComponent } from './page';

export type CompositeComponent = InitialCompositeComponent;

type SearchResult = {
    id: string; 
    name: string;
    sku: string | null;
    image_url: string | null;
};

export function CompositeManager({ product, initialComponents }: { product: Product, initialComponents: CompositeComponent[] }) {
    const [searchTerm, setSearchTerm] = useState('');
    const [results, setResults] = useState<SearchResult[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isPending, startTransition] = useTransition();

    const debouncedSearchTerm = useDebounce(searchTerm, 300);

    const handleSearch = useCallback(async (query: string) => {
        if (query.length < 2) {
            setResults([]);
            return;
        }
        setIsLoading(true);
        const searchResults = await searchProductsForComponent(query);
        setResults(searchResults);
        setIsLoading(false);
    }, []);

    useEffect(() => {
        handleSearch(debouncedSearchTerm);
    }, [debouncedSearchTerm, handleSearch]);
    
    const handleAddComponent = (result: SearchResult) => {
        const formData = new FormData();
        formData.append('parent_product_id', product.id);
        formData.append('component_variant_id', result.id);
        formData.append('quantity', '1');

        startTransition(async () => {
            await addComponentToComposite({ message: '' }, formData);
            setSearchTerm('');
            setResults([]);
        });
    };

    return (
        <div>
            <h2 className="text-lg font-semibold mb-4">Komponen Produk (Resep)</h2>
            
            <div className="relative mb-4">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Cari produk untuk ditambahkan sebagai komponen..."
                    className="w-full pl-10 pr-4 py-2 border rounded-lg bg-transparent"
                />
                {isLoading && (
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                        <Loader2 className="h-5 w-5 text-gray-400 animate-spin" />
                    </div>
                )}
            </div>

            {results.length > 0 && (
                <div className="border rounded-lg mb-4 max-h-60 overflow-y-auto">
                    <ul>
                        {results.map(result => (
                            <li key={result.id} className="border-b last:border-b-0">
                                <button 
                                    onClick={() => handleAddComponent(result)}
                                    disabled={isPending}
                                    className="w-full text-left flex items-center gap-4 p-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 disabled:opacity-50"
                                >
                                    <img src={result.image_url || '/Finako JPG.jpg'} alt={result.name} className="h-10 w-10 rounded object-cover" />
                                    <div className="flex-grow">
                                        <p className="font-medium">{result.name}</p>
                                        <p className="text-sm text-gray-500">{result.sku || 'No SKU'}</p>
                                    </div>
                                    {isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : <PlusCircle className="h-6 w-6 text-teal-500" />}
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
            
            <div className="mt-6">
                {initialComponents.length > 0 ? (
                    <table className="min-w-full text-sm">
                        <thead className="text-left text-gray-500">
                            <tr>
                                <th className="p-3 font-medium" colSpan={2}>Nama Komponen</th>
                                <th className="p-3 font-medium">SKU</th>
                                <th className="p-3 font-medium">Kuantitas</th>
                                <th className="p-3"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {initialComponents.map(c => {
                                // FIX: Access data through the correct path `component_details`
                                const details = c.component_details;
                                const displayName = details.product_name !== details.name 
                                    ? `${details.product_name} - ${details.name}` 
                                    : details.product_name;

                                return (
                                    <tr key={c.id} className="border-t">
                                        <td className="p-3 w-12">
                                            <img src={details.image_url || '/Finako JPG.jpg'} alt={displayName} className="h-10 w-10 rounded object-cover" />
                                        </td>
                                        <td className="p-3 font-medium">{displayName}</td>
                                        <td className="p-3">{details.sku || '-'}</td>
                                        <td className="p-3">
                                            <input type="number" defaultValue={c.quantity} className="w-20 p-1 border rounded bg-transparent" />
                                        </td>
                                        <td className="p-3 text-right">
                                            <button className="text-red-500 hover:text-red-700 p-1"><Trash2 size={16} /></button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                ) : (
                    !searchTerm && <div className="text-center py-12 border-2 border-dashed rounded-lg">
                        <h3 className="text-xl font-semibold">Belum Ada Komponen</h3>
                        <p className="text-gray-500 mt-2">Gunakan pencarian di atas untuk menambahkan komponen ke resep ini.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
