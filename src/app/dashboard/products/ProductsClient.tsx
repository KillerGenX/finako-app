"use client";

import { useState, useMemo } from 'react';
import { ProductsTable } from './ProductsTable';
import { Search, X } from 'lucide-react';

type Product = {
    id: string;
    product_id: string;
    name: string;
    sku: string | null;
    category_id: string | null;
};
type Category = {
    id: string;
    name: string;
};

export function ProductsClient({ allProducts, categories }: { allProducts: Product[], categories: Category[] }) {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');

    const filteredProducts = useMemo(() => {
        return allProducts.filter(product => {
            const searchMatch = searchTerm.toLowerCase() === '' || 
                                product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                (product.sku && product.sku.toLowerCase().includes(searchTerm.toLowerCase()));
            
            const categoryMatch = selectedCategory === 'all' || product.category_id === selectedCategory;
            
            return searchMatch && categoryMatch;
        });
    }, [allProducts, searchTerm, selectedCategory]);

    return (
        <div>
            {/* Toolbar for Search and Filter */}
            <div className="flex items-center justify-between mb-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border dark:border-gray-800 gap-4">
                <div className="relative w-full max-w-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                        type="text"
                        placeholder="Cari nama produk atau SKU..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="block w-full pl-10 pr-10 p-2 border rounded-md bg-transparent"
                    />
                    {searchTerm && (
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                            <button onClick={() => setSearchTerm('')} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
                                <X className="h-4 w-4 text-gray-500" />
                            </button>
                        </div>
                    )}
                </div>
                <div className="w-full max-w-xs">
                     <select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="block w-full p-2 border rounded-md bg-transparent"
                    >
                        <option value="all">Semua Kategori</option>
                        {categories.map(category => (
                            <option key={category.id} value={category.id}>
                                {category.name}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            <ProductsTable products={filteredProducts} />
        </div>
    );
}
