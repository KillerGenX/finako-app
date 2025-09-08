"use client";

import { useFormState, useFormStatus } from 'react-dom';
import { updateProduct, FormState } from '../../actions';
import Link from 'next/link';
import { Loader2, Info } from 'lucide-react';

const initialState: FormState = {
    message: '',
};

function SubmitButton() {
    const { pending } = useFormStatus();
    return (
        <button 
            type="submit" 
            disabled={pending} 
            className="inline-flex items-center justify-center px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
            {pending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Memperbarui...</> : 'Simpan Perubahan'}
        </button>
    );
}

const FormInput = ({ id, label, type, required, defaultValue, error, helpText }: { id: string, label: string, type: string, required?: boolean, defaultValue?: string | number, error?: string[], helpText?: string }) => (
    <div>
        <label htmlFor={id} className="block text-sm font-medium text-gray-700 dark:text-gray-300">{label}</label>
        <input 
            type={type} 
            id={id} 
            name={id} 
            required={required}
            defaultValue={defaultValue}
            className={`mt-1 block w-full px-3 py-2 border ${error ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} rounded-md shadow-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm bg-transparent`} 
        />
        {helpText && !error && <p className="mt-1 text-xs text-gray-500">{helpText}</p>}
        {error && <p className="mt-1 text-xs text-red-500">{error.join(', ')}</p>}
    </div>
);

const FormTextarea = ({ id, label, defaultValue, error }: { id: string, label: string, defaultValue?: string, error?: string[] }) => (
     <div>
        <label htmlFor={id} className="block text-sm font-medium text-gray-700 dark:text-gray-300">{label}</label>
        <textarea 
            id={id} 
            name={id} 
            rows={3}
            defaultValue={defaultValue}
            className={`mt-1 block w-full px-3 py-2 border ${error ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} rounded-md shadow-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm bg-transparent`}
        ></textarea>
        {error && <p className="mt-1 text-xs text-red-500">{error.join(', ')}</p>}
    </div>
);

const FormCheckbox = ({ id, label, description, defaultChecked, error }: { id: string, label: string, description: string, defaultChecked?: boolean, error?: string[] }) => (
    <div className="flex items-start">
        <div className="flex items-center h-5">
            <input
                id={id}
                name={id}
                type="checkbox"
                defaultChecked={defaultChecked}
                className="focus:ring-teal-500 h-4 w-4 text-teal-600 border-gray-300 rounded"
            />
        </div>
        <div className="ml-3 text-sm">
            <label htmlFor={id} className="font-medium text-gray-700 dark:text-gray-300">{label}</label>
            <p className="text-gray-500 dark:text-gray-400">{description}</p>
            {error && <p className="mt-1 text-xs text-red-500">{error.join(', ')}</p>}
        </div>
    </div>
);


export function EditProductForm({ product }: { product: any }) {
    const [state, formAction] = useFormState(updateProduct, initialState);

    return (
         <form action={formAction}>
            <input type="hidden" name="variant_id" value={product.id} />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white dark:bg-gray-900/50 p-6 rounded-lg border dark:border-gray-800">
                        <h2 className="text-lg font-semibold mb-4">Informasi Dasar</h2>
                        <div className="space-y-4">
                            <FormInput id="name" label="Nama Produk" type="text" required defaultValue={product.name} error={state.errors?.name} />
                            <FormTextarea id="description" label="Deskripsi" defaultValue={product.description} error={state.errors?.description} />
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-900/50 p-6 rounded-lg border dark:border-gray-800">
                        <h2 className="text-lg font-semibold mb-4">Harga & Stok</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormInput id="selling_price" label="Harga Jual (IDR)" type="number" required defaultValue={product.selling_price} error={state.errors?.selling_price} />
                            <FormInput id="sku" label="SKU (Stock Keeping Unit)" type="text" defaultValue={product.sku} error={state.errors?.sku} helpText="Biarkan kosong untuk generate otomatis." />
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-900/50 p-6 rounded-lg border dark:border-gray-800">
                            <h2 className="text-lg font-semibold mb-4">Inventaris</h2>
                            <FormCheckbox 
                            id="track_stock" 
                            label="Lacak Stok" 
                            description="Aktifkan jika Anda ingin mengelola jumlah stok untuk produk ini."
                            defaultChecked={product.track_stock}
                            error={state.errors?.track_stock} 
                            />
                    </div>
                </div>
            </div>

            {state.message && (
                <div className="mt-4 p-4 text-sm text-red-700 bg-red-100 rounded-lg flex items-center">
                    <Info className="h-5 w-5 mr-2" />
                    {state.message}
                </div>
            )}
            
            <div className="mt-8 pt-6 border-t dark:border-gray-800 flex justify-end gap-3">
                <Link href="/dashboard/products">
                    <button type="button" className="px-6 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600">
                        Batal
                    </button>
                </Link>
                <SubmitButton />
            </div>
        </form>
    );
}
