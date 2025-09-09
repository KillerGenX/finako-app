"use client";

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { createProductTemplate, FormState } from '../../actions'; // We will create this action
import Link from 'next/link';
import { ArrowLeft, Loader2, Info, ExternalLink } from 'lucide-react';
import { ImageUpload } from '../../ImageUpload';

type SelectOption = { id: string; name: string; };

const initialState: FormState = { message: '' };

function SubmitButton() {
    const { pending } = useFormStatus();
    return ( <button type="submit" disabled={pending} className="inline-flex items-center justify-center px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50"> {pending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Menyimpan...</> : 'Lanjutkan & Tambah Varian'} </button> );
}

// Reusable Form Components
const FormInput = ({ id, label, type, required, error }: { id: string, label: string, type: string, required?: boolean, error?: string[]}) => ( <div> <label htmlFor={id} className="block text-sm font-medium">{label}</label> <input type={type} id={id} name={id} required={required} className={`mt-1 block w-full p-2 border rounded bg-transparent ${error ? 'border-red-500' : 'border-gray-300'}`} /> {error && <p className="mt-1 text-xs text-red-500">{error.join(', ')}</p>} </div> );
const FormTextarea = ({ id, label, error }: { id: string, label: string, error?: string[] }) => ( <div> <label htmlFor={id} className="block text-sm font-medium">{label}</label> <textarea id={id} name={id} rows={3} className={`mt-1 block w-full p-2 border rounded bg-transparent ${error ? 'border-red-500' : 'border-gray-300'}`}></textarea> {error && <p className="mt-1 text-xs text-red-500">{error.join(', ')}</p>} </div> );
const FormSelect = ({ id, label, options, error, manageLink }: { id: string, label: string, options: SelectOption[], error?: string[], manageLink: { href: string, text: string } }) => ( <div> <div className="flex justify-between items-center"> <label htmlFor={id} className="block text-sm font-medium">{label}</label> <Link href={manageLink.href} target="_blank" className="text-xs text-teal-600 hover:underline flex items-center gap-1"> {manageLink.text} <ExternalLink size={12} /> </Link> </div> <select id={id} name={id} className={`mt-1 block w-full p-2 border rounded bg-transparent ${error ? 'border-red-500' : 'border-gray-300'}`}> <option value="null">-- Opsional --</option> {options.map(opt => <option key={opt.id} value={opt.id}>{opt.name}</option>)} </select> {error && <p className="mt-1 text-xs text-red-500">{error.join(', ')}</p>} </div> );

export function NewTemplateForm({ categories, brands }: { categories: SelectOption[], brands: SelectOption[] }) {
    const [state, formAction] = useActionState(createProductTemplate, initialState);

    return (
        <div>
            <div className="mb-6">
                <Link href="/dashboard/products" className="inline-flex items-center text-sm font-medium text-gray-600 hover:text-gray-900"><ArrowLeft className="h-4 w-4 mr-2" />Kembali ke Daftar Produk</Link>
                <h1 className="text-3xl font-bold tracking-tight mt-2">Buat Produk Baru (Langkah 1 dari 2)</h1>
                <p className="mt-1 text-md text-gray-600">Mulai dengan mengisi informasi umum produk. Varian seperti ukuran atau warna akan ditambahkan di langkah berikutnya.</p>
            </div>
            
            <form action={formAction}>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-6">
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
                    <SubmitButton />
                </div>
            </form>
        </div>
    );
}
