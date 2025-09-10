"use client";

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { createProductTemplate, FormState } from '../../actions'; 
import Link from 'next/link';
import { ArrowLeft, Loader2, Info, ExternalLink } from 'lucide-react';
import { ImageUpload } from '../../ImageUpload';
import { useState } from 'react';

type SelectOption = { id: string; name: string; };
type TaxOption = { id: string; name: string; rate: number; };
type ProductType = 'SINGLE' | 'VARIANT' | 'COMPOSITE' | 'SERVICE';

const initialState: FormState = { message: '' };

function SubmitButton({ productType }: { productType: ProductType }) {
    const { pending } = useFormStatus();
    const buttonText = {
        'SINGLE': 'Simpan Produk',
        'VARIANT': 'Lanjutkan & Tambah Varian',
        'COMPOSITE': 'Lanjutkan & Tambah Komposisi',
        'SERVICE': 'Simpan Jasa'
    };
    return ( <button type="submit" disabled={pending} className="inline-flex items-center justify-center px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50"> {pending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Menyimpan...</> : buttonText[productType]} </button> );
}

// Reusable Form Components
const FormInput = ({ id, label, type, required, error, step, placeholder }: { id: string, label: string, type: string, required?: boolean, error?: string[], step?: string, placeholder?: string }) => ( <div> <label htmlFor={id} className="block text-sm font-medium">{label}</label> <input type={type} id={id} name={id} required={required} step={step} placeholder={placeholder} className={`mt-1 block w-full p-2 border rounded bg-transparent ${error ? 'border-red-500' : 'border-gray-300'}`} /> {error && <p className="mt-1 text-xs text-red-500">{error.join(', ')}</p>} </div> );
const FormTextarea = ({ id, label, error }: { id: string, label: string, error?: string[] }) => ( <div> <label htmlFor={id} className="block text-sm font-medium">{label}</label> <textarea id={id} name={id} rows={3} className={`mt-1 block w-full p-2 border rounded bg-transparent ${error ? 'border-red-500' : 'border-gray-300'}`}></textarea> {error && <p className="mt-1 text-xs text-red-500">{error.join(', ')}</p>} </div> );
const FormSelect = ({ id, label, options, error, manageLink }: { id: string, label: string, options: SelectOption[], error?: string[], manageLink: { href: string, text: string } }) => ( <div> <div className="flex justify-between items-center"> <label htmlFor={id} className="block text-sm font-medium">{label}</label> <Link href={manageLink.href} target="_blank" className="text-xs text-teal-600 hover:underline flex items-center gap-1"> {manageLink.text} <ExternalLink size={12} /> </Link> </div> <select id={id} name={id} className={`mt-1 block w-full p-2 border rounded bg-transparent ${error ? 'border-red-500' : 'border-gray-300'}`}> <option value="">-- Opsional --</option> {options.map(opt => <option key={opt.id} value={opt.id}>{opt.name}</option>)} </select> {error && <p className="mt-1 text-xs text-red-500">{error.join(', ')}</p>} </div> );

const productTypes: { key: ProductType, label: string, disabled: boolean, comingSoon: boolean }[] = [
    { key: 'SINGLE', label: 'Produk Tunggal', disabled: false, comingSoon: false },
    { key: 'VARIANT', label: 'Produk dengan Varian', disabled: false, comingSoon: false },
    { key: 'COMPOSITE', label: 'Produk Komposit', disabled: true, comingSoon: true },
    { key: 'SERVICE', label: 'Jasa', disabled: true, comingSoon: true }
];

export function NewTemplateForm({ categories, brands, taxes }: { categories: SelectOption[], brands: SelectOption[], taxes: TaxOption[] }) {
    const [state, formAction] = useActionState(createProductTemplate, initialState);
    const [productType, setProductType] = useState<ProductType>('VARIANT');

    const pageInfo = {
        'SINGLE': {
            title: 'Buat Produk Tunggal Baru',
            description: 'Isi informasi umum, harga, dan stok untuk produk yang tidak memiliki varian.'
        },
        'VARIANT': {
            title: 'Buat Produk Baru (Langkah 1 dari 2)',
            description: 'Mulai dengan mengisi informasi umum produk. Varian seperti ukuran atau warna akan ditambahkan di langkah berikutnya.'
        },
        'COMPOSITE': {
            title: 'Buat Produk Komposit (Langkah 1 dari 2)',
            description: 'Mulai dengan info umum produk. Komponen atau resep akan ditambahkan di langkah berikutnya.'
        },
        'SERVICE': {
            title: 'Buat Jasa Baru',
            description: 'Isi informasi untuk layanan atau jasa yang Anda tawarkan.'
        }
    }

    return (
        <div>
            <div className="mb-6">
                <Link href="/dashboard/products" className="inline-flex items-center text-sm font-medium text-gray-600 hover:text-gray-900"><ArrowLeft className="h-4 w-4 mr-2" />Kembali ke Daftar Produk</Link>
                <h1 className="text-3xl font-bold tracking-tight mt-2">{pageInfo[productType].title}</h1>
                <p className="mt-1 text-md text-gray-600">{pageInfo[productType].description}</p>
            </div>
            
            <form action={formAction}>
                 <input type="hidden" name="product_type" value={productType} />
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-6">
                        <div className="p-6 bg-white dark:bg-gray-900/50 rounded-lg border dark:border-gray-800">
                             <h2 className="text-lg font-semibold mb-4">Tipe Produk</h2>
                             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {productTypes.map(typeInfo => (
                                    <label 
                                        key={typeInfo.key} 
                                        className={`flex items-center justify-between p-4 border rounded-lg cursor-pointer ${productType === typeInfo.key ? 'bg-teal-50 border-teal-500' : 'border-gray-300'} ${typeInfo.disabled ? 'cursor-not-allowed bg-gray-100 text-gray-400' : ''}`}
                                    >
                                        <div className="flex items-center">
                                            <input 
                                                type="radio" 
                                                name="product_type_selection" 
                                                value={typeInfo.key}
                                                checked={productType === typeInfo.key}
                                                onChange={(e) => setProductType(e.target.value as ProductType)}
                                                className="form-radio text-teal-600"
                                                disabled={typeInfo.disabled}
                                            />
                                            <span className="ml-3 font-medium">{typeInfo.label}</span>
                                        </div>
                                        {typeInfo.comingSoon && <span className="text-xs font-semibold bg-gray-200 text-gray-600 px-2 py-1 rounded-full">Segera Hadir</span>}
                                    </label>
                                ))}
                             </div>
                        </div>

                        <div className="p-6 bg-white dark:bg-gray-900/50 rounded-lg border dark:border-gray-800">
                            <h2 className="text-lg font-semibold mb-4">Informasi Dasar</h2>
                            <div className="space-y-4">
                                <FormInput id="name" label="Nama Produk" type="text" required error={state.errors?.name} />
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                     <FormSelect id="category_id" label="Kategori" options={categories} error={state.errors?.category_id} manageLink={{href: "/dashboard/categories", text: "Kelola Kategori"}} />
                                     <FormSelect id="brand_id" label="Merek" options={brands} error={state.errors?.brand_id} manageLink={{href: "/dashboard/brands", text: "Kelola Merek"}} />
                                </div>
                                <FormTextarea id="description" label="Deskripsi" error={state.errors?.description} />
                            </div>
                        </div>
                        
                        {productType === 'SINGLE' && (
                           <div className="p-6 bg-white dark:bg-gray-900/50 rounded-lg border dark:border-gray-800 transition-all duration-300 ease-in-out">
                                <h2 className="text-lg font-semibold mb-4">Harga & Stok</h2>
                                <div className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <FormInput id="selling_price" label="Harga Jual" type="number" required placeholder="Contoh: 50000" step="0.01" error={state.errors?.selling_price} />
                                        <FormInput id="cost_price" label="Harga Pokok" type="number" placeholder="Opsional" step="0.01" error={state.errors?.cost_price} />
                                    </div>
                                    <FormInput id="sku" label="SKU (Stock Keeping Unit)" placeholder="Opsional" type="text" error={state.errors?.sku} />
                                    <div className="pt-2">
                                        <label className="flex items-center gap-2 font-normal cursor-pointer">
                                            <input type="checkbox" name="track_stock" id="track_stock" defaultChecked className="form-checkbox rounded text-teal-600" />
                                            <span className="text-sm font-medium">Lacak Stok untuk produk ini</span>
                                        </label>
                                    </div>
                                </div>
                            </div>
                        )}

                         <div className="p-6 bg-white dark:bg-gray-900/50 rounded-lg border dark:border-gray-800">
                            <h2 className="text-lg font-semibold mb-4">Pajak</h2>
                            <div className="flex justify-between items-center">
                                <label className="block text-sm font-medium">Pajak yang berlaku untuk produk ini</label>
                                <Link href="/dashboard/taxes" target="_blank" className="text-xs text-teal-600 hover:underline flex items-center gap-1">Kelola Pajak <ExternalLink size={12} /></Link>
                            </div>
                            <div className="mt-2 space-y-2">
                                {taxes.map(tax => (
                                    <label key={tax.id} className="flex items-center gap-2 font-normal">
                                        <input type="checkbox" name="tax_rate_ids" value={tax.id} /> 
                                        {tax.name} ({tax.rate}%)
                                    </label>
                                ))}
                                {taxes.length === 0 && <p className="text-xs text-gray-500">Belum ada tarif pajak aktif. Tambahkan terlebih dahulu.</p>}
                            </div>
                             {state.errors?.tax_rate_ids && <p className="mt-1 text-xs text-red-500">{state.errors.tax_rate_ids.join(', ')}</p>}
                        </div>
                    </div>
                    <div className="lg:col-span-1 space-y-6">
                        <div className="p-6 bg-white dark:bg-gray-900/50 rounded-lg border dark:border-gray-800">
                             <h2 className="text-lg font-semibold mb-4">Media</h2>
                             <ImageUpload error={state.errors?.image_url} />
                        </div>
                    </div>
                </div>

                {state.message && <div className="mt-4 p-4 text-sm text-red-700 bg-red-100 rounded-lg flex items-center"><Info className="h-5 w-5 mr-2" />{state.message}</div>}
                
                <div className="mt-8 pt-6 border-t dark:border-gray-800 flex justify-end gap-3">
                    <Link href="/dashboard/products"><button type="button" className="px-6 py-2 bg-gray-200 rounded-lg hover:bg-gray-300">Batal</button></Link>
                    <SubmitButton productType={productType} />
                </div>
            </form>
        </div>
    );
}
