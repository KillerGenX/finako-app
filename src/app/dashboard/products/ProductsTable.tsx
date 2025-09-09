"use client";

import Link from 'next/link';
import { MoreHorizontal, Edit, Trash2, Loader2, PlusCircle, Warehouse } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { deleteVariant } from './actions';
import { useFormStatus } from 'react-dom';

function DeleteButton() {
    const { pending } = useFormStatus();
    return (
        <button type="submit" disabled={pending} className="w-full text-left flex items-center px-4 py-2 text-sm text-red-600 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50">
            {pending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Menghapus...</> : <><Trash2 className="mr-2 h-4 w-4" /> Hapus</>}
        </button>
    );
}

const ActionsMenu = ({ product }: { product: any }) => {
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    return (
        <div className="relative inline-block text-left" ref={menuRef}>
            <button onClick={() => setIsOpen(!isOpen)} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800">
                <MoreHorizontal className="h-5 w-5" />
            </button>
            {isOpen && (
                <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5 z-10">
                    <div className="py-1">
                        <Link href={`/dashboard/inventory/${product.id}`} className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700">
                            <Warehouse className="mr-2 h-4 w-4" /> Kelola Stok
                        </Link>
                        <div className="border-t my-1 dark:border-gray-700"></div>
                        <form action={deleteVariant}>
                            <input type="hidden" name="variant_id" value={product.id} />
                            <DeleteButton />
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export function ProductsTable({ products }: { products: any[] }) {
    if (products.length === 0) {
        return (
            <div className="text-center py-12">
                <h3 className="text-xl font-semibold">Belum Ada Varian Produk</h3>
                <p className="text-gray-500 mt-2">Mulai dengan membuat template produk baru untuk menambahkan varian.</p>
                <Link href="/dashboard/products/templates/new">
                    <button className="mt-4 inline-flex items-center px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700">
                        <PlusCircle className="h-5 w-5 mr-2" />
                        Buat Produk Baru
                    </button>
                </Link>
            </div>
        );
    }

    return (
        <div className="border rounded-lg">
            <table className="min-w-full divide-y dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                        <th scope="col" className="w-20 px-6 py-3"></th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Nama Produk</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Harga Jual</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Total Stok</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                        <th scope="col" className="relative px-6 py-3">
                            <span className="sr-only">Actions</span>
                        </th>
                    </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-900 divide-y dark:divide-gray-700">
                    {products.map((product, index) => (
                        <tr key={product.id}>
                            <td className="px-6 py-4">
                               <Link href={`/dashboard/products/templates/${product.product_id}`}>
                                    <img 
                                        src={product.image_url || '/Finako JPG.jpg'} 
                                        alt={product.name} 
                                        className="h-10 w-10 rounded-md object-cover hover:ring-2 hover:ring-teal-500"
                                        onError={(e) => { e.currentTarget.src = '/Finako JPG.jpg'; }}
                                    />
                                </Link>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <Link href={`/dashboard/products/templates/${product.product_id}`} className="hover:underline">
                                    <div className="text-sm font-medium text-gray-900 dark:text-white">{product.name}</div>
                                    <div className="text-sm text-gray-500 dark:text-gray-400">{product.sku || 'No SKU'}</div>
                                 </Link>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(product.selling_price)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-700 dark:text-gray-300">
                                {product.track_stock ? `${product.total_stock} unit` : '-'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                                    Aktif
                                </span>
                            </td>
                            <td className={`px-6 py-4 whitespace-nowrap text-right text-sm font-medium ${index === products.length - 1 ? 'overflow-visible' : ''}`}>
                                <ActionsMenu product={product} />
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
