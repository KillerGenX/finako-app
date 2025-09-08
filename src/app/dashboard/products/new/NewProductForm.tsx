"use client";

import { useFormState, useFormStatus } from 'react-dom';
import { createProduct, FormState } from '../actions';
import Link from 'next/link';
import { ArrowLeft, Loader2, Info, ExternalLink } from 'lucide-react';

type Category = {
    id: string;
    name: string;
};

const initialState: FormState = {
    message: '',
};

function SubmitButton() {
    const { pending } = useFormStatus();
    return (
        <button type="submit" disabled={pending} className="inline-flex items-center justify-center px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50">
            {pending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Menyimpan...</> : 'Simpan Produk'}
        </button>
    );
}

// Reusable Form Components
const FormInput = ({ id, label, type, required, error, helpText }: { id: string, label: string, type: string, required?: boolean, error?: string[], helpText?: string }) => (
    <div>
        <label htmlFor={id} className="block text-sm font-medium">{label}</label>
        <input type={type} id={id} name={id} required={required} className={`mt-1 block w-full p-2 border rounded bg-transparent ${error ? 'border-red-500' : 'border-gray-300'}`} />
        {helpText && !error && <p className="mt-1 text-xs text-gray-500">{helpText}</p>}
        {error && <p className="mt-1 text-xs text-red-500">{error.join(', ')}</p>}
    </div>
);

const FormTextarea = ({ id, label, error }: { id: string, label: string, error?: string[] }) => (
     <div>
        <label htmlFor={id} className="block text-sm font-medium">{label}</label>
        <textarea id={id} name={id} rows={3} className={`mt-1 block w-full p-2 border rounded bg-transparent ${error ? 'border-red-500' : 'border-gray-300'}`}></textarea>
        {error && <p className="mt-1 text-xs text-red-500">{error.join(', ')}</p>}
    </div>
);

const FormSelect = ({ id, label, options, error }: { id: string, label: string, options: Category[], error?: string[] }) => (
    <div>
        <div className="flex justify-between items-center">
            <label htmlFor={id} className="block text-sm font-medium">{label}</label>
            <Link href="/dashboard/categories" target="_blank" className="text-xs text-teal-600 hover:underline flex items-center gap-1">
                Kelola Kategori <ExternalLink size={12} />
            </Link>
        </div>
        <select id={id} name={id} className={`mt-1 block w-full p-2 border rounded bg-transparent ${error ? 'border-red-500' : 'border-gray-300'}`}>
            <option value="null">-- Pilih Kategori (Opsional) --</option>
            {options.map(opt => <option key={opt.id} value={opt.id}>{opt.name}</option>)}
        </select>
        {error && <p className="mt-1 text-xs text-red-500">{error.join(', ')}</p>}
    </div>
);

const FormCheckbox = ({ id, label, description, error }: { id: string, label: string, description: string, error?: string[] }) => (
    <div className="flex items-start"><div className="flex items-center h-5"><input id={id} name={id} type="checkbox" defaultChecked className="h-4 w-4 text-teal-600 border-gray-300 rounded" /></div><div className="ml-3 text-sm"><label htmlFor={id} className="font-medium">{label}</label><p className="text-gray-500">{description}</p>{error && <p className="mt-1 text-xs text-red-500">{error.join(', ')}</p>}</div></div>
);


export function NewProductForm({ categories }: { categories: Category[] }) {
    const [state, formAction] = useFormState(createProduct, initialState);

    return (
        <div>
            <div className="mb-6">
                <Link href="/dashboard/products" className="inline-flex items-center text-sm font-medium text-gray-600 hover:text-gray-900"><ArrowLeft className="h-4 w-4 mr-2" />Kembali ke Daftar Produk</Link>
                <h1 className="text-3xl font-bold tracking-tight mt-2">Tambah Produk Baru</h1>
                <p className="mt-1 text-md text-gray-600">Isi detail di bawah untuk produk tunggal.</p>
            </div>
            
            <form action={formAction}>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-6">
                        <div className="p-6 bg-white dark:bg-gray-900/50 rounded-lg border dark:border-gray-800">
                            <h2 className="text-lg font-semibold mb-4">Informasi Dasar</h2>
                            <div className="space-y-4">
                                <FormInput id="name" label="Nama Produk" type="text" required error={state.errors?.name} />
                                <FormSelect id="category_id" label="Kategori Produk" options={categories} error={state.errors?.category_id} />
                                <FormTextarea id="description" label="Deskripsi" error={state.errors?.description} />
                            </div>
                        </div>
                        <div className="p-6 bg-white dark:bg-gray-900/50 rounded-lg border dark:border-gray-800">
                            <h2 className="text-lg font-semibold mb-4">Harga & Stok</h2>
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormInput id="selling_price" label="Harga Jual (IDR)" type="number" required error={state.errors?.selling_price} />
                                <FormInput id="sku" label="SKU (Stock Keeping Unit)" type="text" error={state.errors?.sku} helpText="Biarkan kosong untuk generate otomatis." />
                            </div>
                        </div>
                        <div className="p-6 bg-white dark:bg-gray-900/50 rounded-lg border dark:border-gray-800">
                             <h2 className="text-lg font-semibold mb-4">Inventaris</h2>
                             <FormCheckbox id="track_stock" label="Lacak Stok" description="Aktifkan jika ingin mengelola jumlah stok produk ini." error={state.errors?.track_stock} />
                        </div>
                    </div>
                </div>

                {state.message && <div className="mt-4 p-4 text-sm text-red-700 bg-red-100 rounded-lg flex items-center"><Info className="h-5 w-5 mr-2" />{state.message}</div>}
                
                <div className="mt-8 pt-6 border-t dark:border-gray-800 flex justify-end gap-3">
                    <Link href="/dashboard/products"><button type="button" className="px-6 py-2 bg-gray-200 rounded-lg hover:bg-gray-300">Batal</button></Link>
                    <SubmitButton />
                </div>
            </form>
        </div>
    );
}
