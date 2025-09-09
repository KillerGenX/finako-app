"use client";

import { useEffect, useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { X, Loader2, Info, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { updateProductTemplate } from '../../actions'; // This action needs to be created
import type { FormState } from '../../actions';
import { ImageUpload } from '../../ImageUpload';

type ProductData = {
    id: string;
    name: string;
    description: string | null;
    category_id: string | null;
    brand_id: string | null;
    image_url: string | null;
    product_tax_rates: { tax_rate_id: string }[];
};
type SelectOption = { id: string; name: string; };
type TaxOption = { id: string; name: string; rate: number; };

type ModalProps = {
    isOpen: boolean;
    onClose: () => void;
    initialData: ProductData;
    categories: SelectOption[];
    brands: SelectOption[];
    taxes: TaxOption[];
};

const initialState: FormState = { message: '' };

function SubmitButton() {
    const { pending } = useFormStatus();
    return (
        <button type="submit" disabled={pending} className="inline-flex items-center justify-center px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50">
            {pending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Menyimpan...</> : 'Simpan Perubahan'}
        </button>
    );
}

// Reusing form components from our previous work
const FormInput = ({ id, label, defaultValue, error }: { id: string, label: string, defaultValue?: string | null, error?: string[] }) => ( <div> <label htmlFor={id} className="block text-sm font-medium">{label}</label> <input type="text" id={id} name={id} defaultValue={defaultValue ?? ''} className={`mt-1 block w-full p-2 border rounded bg-transparent ${error ? 'border-red-500' : 'border-gray-300'}`} /> {error && <p className="mt-1 text-xs text-red-500">{error.join(', ')}</p>} </div> );
const FormTextarea = ({ id, label, defaultValue, error }: { id: string, label: string, defaultValue?: string | null, error?: string[] }) => ( <div> <label htmlFor={id} className="block text-sm font-medium">{label}</label> <textarea id={id} name={id} rows={3} defaultValue={defaultValue ?? ''} className={`mt-1 block w-full p-2 border rounded bg-transparent ${error ? 'border-red-500' : 'border-gray-300'}`}></textarea> {error && <p className="mt-1 text-xs text-red-500">{error.join(', ')}</p>} </div> );
const FormSelect = ({ id, label, options, defaultValue, error, manageLink }: { id: string, label: string, options: SelectOption[], defaultValue?: string | null, error?: string[], manageLink: { href: string, text: string } }) => ( <div> <div className="flex justify-between items-center"> <label htmlFor={id} className="block text-sm font-medium">{label}</label> <Link href={manageLink.href} target="_blank" className="text-xs text-teal-600 hover:underline flex items-center gap-1"> {manageLink.text} <ExternalLink size={12} /> </Link> </div> <select id={id} name={id} defaultValue={defaultValue ?? 'null'} className={`mt-1 block w-full p-2 border rounded bg-transparent ${error ? 'border-red-500' : 'border-gray-300'}`}> <option value="null">-- Opsional --</option> {options.map(opt => <option key={opt.id} value={opt.id}>{opt.name}</option>)} </select> {error && <p className="mt-1 text-xs text-red-500">{error.join(', ')}</p>} </div> );

export function EditTemplateModal({ isOpen, onClose, initialData, categories, brands, taxes }: ModalProps) {
    const [state, formAction] = useActionState(updateProductTemplate, initialState);
    const existingTaxIds = initialData.product_tax_rates.map(t => t.tax_rate_id);

    useEffect(() => {
        if (state.message === 'success') {
            onClose();
        }
    }, [state, onClose]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex justify-center items-center p-4 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-2xl" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-semibold">Edit Informasi Dasar Produk</h3>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"><X size={24} /></button>
                </div>
                
                <form action={formAction}>
                    <input type="hidden" name="product_id" value={initialData.id} />
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-h-[70vh] overflow-y-auto pr-2">
                        {/* Left Column */}
                        <div className="md:col-span-2 space-y-4">
                            <FormInput id="name" label="Nama Produk" defaultValue={initialData.name} error={state.errors?.name} />
                            <FormTextarea id="description" label="Deskripsi" defaultValue={initialData.description} error={state.errors?.description} />
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <FormSelect id="category_id" label="Kategori" options={categories} defaultValue={initialData.category_id} error={state.errors?.category_id} manageLink={{href: "/dashboard/categories", text: "Kelola"}} />
                                <FormSelect id="brand_id" label="Merek" options={brands} defaultValue={initialData.brand_id} error={state.errors?.brand_id} manageLink={{href: "/dashboard/brands", text: "Kelola"}} />
                            </div>
                             <div>
                                <h4 className="text-sm font-medium mb-2">Pajak</h4>
                                <div className="space-y-2">
                                    {taxes.map(tax => (
                                        <label key={tax.id} className="flex items-center gap-2 font-normal">
                                            <input type="checkbox" name="tax_rate_ids" value={tax.id} defaultChecked={existingTaxIds.includes(tax.id)} /> 
                                            {tax.name} ({tax.rate}%)
                                        </label>
                                    ))}
                                </div>
                            </div>
                        </div>
                        {/* Right Column */}
                        <div className="md:col-span-1">
                             <h4 className="text-sm font-medium mb-1">Media</h4>
                            <ImageUpload existingImageUrl={initialData.image_url} error={state.errors?.image_url} />
                        </div>
                    </div>

                    {state.message && state.message !== 'success' && <div className="mt-4 p-3 text-sm text-red-700 bg-red-100 rounded-lg flex items-center"><Info className="h-5 w-5 mr-2" />{state.message}</div>}
                    
                    <div className="mt-6 pt-4 border-t flex justify-end gap-3">
                        <button type="button" onClick={onClose} className="px-6 py-2 bg-gray-200 rounded-lg hover:bg-gray-300">Batal</button>
                        <SubmitButton />
                    </div>
                </form>
            </div>
        </div>
    );
}
