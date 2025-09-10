"use client";

import { useState, useRef, useEffect, useOptimistic, useCallback } from 'react';
import Link from 'next/link';
import { ArrowLeft, PlusCircle, Edit, Trash2, MoreHorizontal, Warehouse, Loader2, AlertTriangle } from 'lucide-react';
import { AddEditVariantModal } from './AddEditVariantModal';
import { EditTemplateModal } from './EditTemplateModal';
import { CompositeManager, CompositeComponent } from './CompositeManager'; // Import the new component and its type
import { deleteVariant, deleteProductTemplate } from '../../actions';
import { useFormStatus } from 'react-dom';

// ============== TYPE DEFINITIONS ==============
export type Product = {
    id: string; name: string; description: string | null; image_url: string | null;
    category_id: string | null; brand_id: string | null;
    product_tax_rates: { tax_rate_id: string }[];
    product_type: 'SINGLE' | 'VARIANT' | 'COMPOSITE' | 'SERVICE';
};
export type Variant = {
    id: string; name: string; sku: string | null; selling_price: number;
    cost_price: number | null; track_stock: boolean; total_stock?: number;
};
type SelectOption = { id: string; name: string; };
type TaxOption = { id: string; name: string; rate: number; };

// ============== SUB-COMPONENTS (Unchanged) ==============
function DeleteVariantButton() {
    const { pending } = useFormStatus();
    return ( <button type="submit" disabled={pending} className="w-full text-left flex items-center px-4 py-2 text-sm text-red-600 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50"> {pending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Menghapus...</> : <><Trash2 className="mr-2 h-4 w-4" /> Hapus Varian</>} </button> );
}

function DeleteTemplateButton() {
    const { pending } = useFormStatus();
    return ( <button type="submit" disabled={pending} className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 disabled:opacity-50 sm:ml-3 sm:w-auto sm:text-sm"> {pending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Menghapus...</> : 'Ya, Hapus Produk'} </button> );
}

const ActionsMenu = ({ variant, onEdit }: { variant: Variant, onEdit: () => void }) => {
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => { if (menuRef.current && !menuRef.current.contains(event.target as Node)) setIsOpen(false); };
        if (isOpen) document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    return (
        <div className="relative inline-block text-left" ref={menuRef}>
            <button onClick={() => setIsOpen(!isOpen)} className="text-gray-500 p-2 rounded-full hover:bg-gray-100"><MoreHorizontal size={20} /></button>
            {isOpen && (
                <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5 z-10">
                    <div className="py-1">
                        <Link href={`/dashboard/inventory/${variant.id}`} className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"><Warehouse className="mr-2 h-4 w-4" /> Kelola Stok</Link>
                        <button onClick={() => { onEdit(); setIsOpen(false); }} className="w-full text-left flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"><Edit className="mr-2 h-4 w-4" /> Edit Varian</button>
                        <div className="border-t my-1 dark:border-gray-700"></div>
                        <form action={deleteVariant}><input type="hidden" name="variant_id" value={variant.id} /><DeleteVariantButton /></form>
                    </div>
                </div>
            )}
        </div>
    );
};


// ============== MAIN CLIENT COMPONENT ==============
export function ProductDetailClient({ 
    product, 
    initialVariants, 
    initialComponents,
    categories, 
    brands, 
    taxes 
}: { 
    product: Product; 
    initialVariants: Variant[]; 
    initialComponents: CompositeComponent[];
    categories: SelectOption[];
    brands: SelectOption[]; 
    taxes: TaxOption[];
}) {
    const [variantModal, setVariantModal] = useState<{ isOpen: boolean; variant: Variant | null }>({ isOpen: false, variant: null });
    const [isTemplateModalOpen, setTemplateModalOpen] = useState(false);
    const [isDeleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    
    const [optimisticVariants] = useOptimistic(initialVariants, (state) => state);

    const handleOpenVariantModal = useCallback((v: Variant | null = null) => setVariantModal({ isOpen: true, variant: v }), []);
    const handleCloseVariantModal = useCallback(() => setVariantModal({ isOpen: false, variant: null }), []);
    const handleOpenTemplateModal = useCallback(() => setTemplateModalOpen(true), []);
    const handleCloseTemplateModal = useCallback(() => setTemplateModalOpen(false), []);

    const VariantManager = () => (
        <>
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">Varian Produk</h2>
                {product.product_type === 'VARIANT' && (
                    <button onClick={() => handleOpenVariantModal()} className="inline-flex items-center px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"><PlusCircle className="h-5 w-5 mr-2" />Tambah Varian</button>
                )}
            </div>
            {optimisticVariants.length > 0 ? (
                <table className="min-w-full text-sm">
                    <thead className="text-left text-gray-500"><tr><th className="p-3 font-medium">Nama</th><th className="p-3 font-medium">SKU</th><th className="p-3 font-medium">Harga Jual</th><th className="p-3 font-medium">Stok</th><th className="p-3"></th></tr></thead>
                    <tbody>
                        {optimisticVariants.map(v => <tr key={v.id} className="border-t"><td className="p-3">{v.name}</td><td className="p-3">{v.sku || '-'}</td><td className="p-3">{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(v.selling_price)}</td><td className="p-3 font-semibold">{v.total_stock ?? 'N/A'} unit</td><td className="p-3 text-right"><ActionsMenu variant={v} onEdit={() => handleOpenVariantModal(v)} /></td></tr>)}
                    </tbody>
                </table>
            ) : (
                <div className="text-center py-12 border-2 border-dashed rounded-lg">
                    <h3 className="text-xl font-semibold">Belum Ada Varian</h3>
                    <p className="text-gray-500 mt-2">Produk ini belum memiliki varian yang bisa dijual.</p>
                    <button onClick={() => handleOpenVariantModal()} className="mt-4 inline-flex items-center px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"><PlusCircle className="h-5 w-5 mr-2" />Tambah Varian Pertama</button>
                </div>
            )}
        </>
    );

    return (
        <>
            <div className="mb-6"><Link href="/dashboard/products" className="inline-flex items-center text-sm font-medium text-gray-600 hover:text-gray-900"><ArrowLeft className="h-4 w-4 mr-2" />Kembali ke Daftar Produk</Link></div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                <div className="lg:col-span-1 p-6 bg-white dark:bg-gray-900/50 rounded-lg border flex flex-col items-center">
                    <img src={product.image_url || '/Finako JPG.jpg'} alt={product.name} className="h-40 w-40 rounded-lg object-cover mb-4" onError={(e) => { e.currentTarget.src = '/Finako JPG.jpg'; }} />
                    <h1 className="text-2xl font-bold text-center">{product.name}</h1>
                    <p className="mt-2 text-sm text-gray-500 text-center">{product.description || 'Tidak ada deskripsi.'}</p>
                    <div className="mt-4 flex gap-4">
                        <button onClick={handleOpenTemplateModal} className="text-sm text-teal-600 hover:underline">Edit</button>
                        <button onClick={() => setDeleteConfirmOpen(true)} className="text-sm text-red-600 hover:underline">Hapus</button>
                    </div>
                </div>
                
                <div className="lg:col-span-2 p-6 bg-white dark:bg-gray-900/50 rounded-lg border">
                    {product.product_type === 'COMPOSITE' ? (
                        <CompositeManager product={product} initialComponents={initialComponents} />
                    ) : (
                        <VariantManager />
                    )}
                </div>
            </div>
            
            <AddEditVariantModal key={variantModal.variant?.id || 'newVariant'} isOpen={variantModal.isOpen} onClose={handleCloseVariantModal} productId={product.id} initialData={variantModal.variant} />
            <EditTemplateModal key={product.id} isOpen={isTemplateModalOpen} onClose={handleCloseTemplateModal} initialData={product} categories={categories} brands={brands} taxes={taxes} />
            
            {isDeleteConfirmOpen && (
                <div className="fixed z-50 inset-0 overflow-y-auto">
                    <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                        <div className="fixed inset-0 transition-opacity" aria-hidden="true"><div className="absolute inset-0 bg-gray-500 opacity-75"></div></div>
                        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
                        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                                <div className="sm:flex sm:items-start">
                                    <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10"><AlertTriangle className="h-6 w-6 text-red-600" /></div>
                                    <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                                        <h3 className="text-lg leading-6 font-medium text-gray-900">Hapus Produk</h3>
                                        <div className="mt-2"><p className="text-sm text-gray-500">Anda yakin ingin menghapus produk "{product.name}"? Semua varian terkait akan dihapus secara permanen. Tindakan ini tidak dapat diurungkan.</p></div>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                                <form action={deleteProductTemplate}><input type="hidden" name="product_id" value={product.id} /><DeleteTemplateButton /></form>
                                <button type="button" onClick={() => setDeleteConfirmOpen(false)} className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 sm:mt-0 sm:w-auto sm:text-sm">Batal</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
