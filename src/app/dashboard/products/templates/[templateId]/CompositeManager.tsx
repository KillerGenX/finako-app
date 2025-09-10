"use client";

import { useState, useTransition, useCallback, useEffect } from 'react'; // Import useEffect
import { PlusCircle, X, Loader2, Search } from 'lucide-react';
import { searchProductsForComponent } from '../../actions';
import { useDebounce } from '@/lib/hooks/useDebounce';

// Type for search results
type SearchResult = {
    id: string; // This is the variant_id
    name: string;
    sku: string | null;
    image_url: string | null;
};

export function CompositeManager() {
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

    // CORRECTED: Use useEffect to trigger the search
    useEffect(() => {
        handleSearch(debouncedSearchTerm);
    }, [debouncedSearchTerm, handleSearch]);
    

    const handleAddComponent = (result: SearchResult) => {
        startTransition(() => {
            // Here you would call the server action to add the component to the database
            // e.g., addComponentToComposite({ parentVariantId: product.id, componentVariantId: result.id, quantity: 1 })
            console.log("Adding component:", result);
            // For now, we just clear the search
            setSearchTerm('');
            setResults([]);
        });
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">Komponen Produk (Resep)</h2>
            </div>
            
            {/* Search Input */}
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

            {/* Search Results */}
            {results.length > 0 && (
                <div className="border rounded-lg mb-4 max-h-60 overflow-y-auto">
                    <ul>
                        {results.map(result => (
                            <li key={result.id} className="border-b last:border-b-0">
                                <button 
                                    onClick={() => handleAddComponent(result)}
                                    className="w-full text-left flex items-center gap-4 p-3 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                                >
                                    <img src={result.image_url || '/Finako JPG.jpg'} alt={result.name} className="h-10 w-10 rounded object-cover" />
                                    <div className="flex-grow">
                                        <p className="font-medium">{result.name}</p>
                                        <p className="text-sm text-gray-500">{result.sku || 'No SKU'}</p>
                                    </div>
                                    <PlusCircle className="h-6 w-6 text-teal-500" />
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
            
            {/* Existing Components List (Placeholder) */}
            <div className="mt-6">
                <div className="text-center py-12 border-2 border-dashed rounded-lg">
                    <h3 className="text-xl font-semibold">Belum Ada Komponen</h3>
                    <p className="text-gray-500 mt-2">Gunakan pencarian di atas untuk menambahkan komponen ke resep ini.</p>
                </div>
            </div>
        </div>
    );
}
