"use client";

import { useEffect, useActionState, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { X, Loader2, Info } from 'lucide-react';
import { addOrUpdateVariant } from '../../actions';
import type { FormState } from '../../actions';

type VariantData = {
    id: string;
    name: string;
    sku: string | null;
    selling_price: number;
    cost_price: number | null;
    track_stock: boolean;
    reorder_point?: number; // << BARU
    reorder_quantity?: number; // << BARU
};

type ModalProps = {
    isOpen: boolean;
    onClose: () => void;
    productId: string;
    initialData?: VariantData | null;
};

const initialState: FormState = { message: '' };

function SubmitButton({ isEditing }: { isEditing: boolean }) {
    const { pending } = useFormStatus();
    const text = isEditing ? 'Simpan Perubahan' : 'Tambah Varian';
    const pendingText = isEditing ? 'Menyimpan...' : 'Menambahkan...';
    return (
        <button type="submit" disabled={pending} className="inline-flex items-center justify-center px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50">
            {pending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> {pendingText}</> : text}
        </button>
    );
}

const FormInput = ({ id, label, type, defaultValue, error, helpText }: { id: string, label: string, type: string, defaultValue?: string | number, error?: string[], helpText?: string }) => (
    <div>
        <label htmlFor={id} className="block text-sm font-medium">{label}</label>
        <input type={type} id={id} name={id} defaultValue={defaultValue} step="any" className={`mt-1 block w-full p-2 border rounded bg-transparent ${error ? 'border-red-500' : 'border-gray-300'}`} />
        {helpText && !error && <p className="mt-1 text-xs text-gray-500">{helpText}</p>}
        {error && <p className="mt-1 text-xs text-red-500">{error.join(', ')}</p>}
    </div>
);

const FormCheckbox = ({ id, label, description, defaultChecked, onChange }: { id: string, label: string, description: string, defaultChecked?: boolean, onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void }) => (
    <div className="flex items-start">
        <div className="flex items-center h-5">
            <input id={id} name={id} type="checkbox" defaultChecked={defaultChecked} onChange={onChange} className="h-4 w-4 text-teal-600 border-gray-300 rounded" />
        </div>
        <div className="ml-3 text-sm">
            <label htmlFor={id} className="font-medium">{label}</label>
            <p className="text-gray-500">{description}</p>
        </div>
    </div>
);


export function AddEditVariantModal({ isOpen, onClose, productId, initialData }: ModalProps) {
    const [state, formAction] = useActionState(addOrUpdateVariant, initialState);
    const isEditing = !!initialData;
    
    // State untuk mengontrol visibilitas field stok rendah
    const [isStockTracked, setIsStockTracked] = useState(initialData?.track_stock ?? true);

    useEffect(() => {
        if (state.message === 'success') {
            onClose();
        }
    }, [state, onClose]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex justify-center items-center p-4 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-lg" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-semibold">{isEditing ? 'Edit Varian' : 'Tambah Varian Baru'}</h3>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
                        <X size={24} />
                    </button>
                </div>
                
                <form action={formAction}>
                    <input type="hidden" name="product_id" value={productId} />
                    {isEditing && <input type="hidden" name="variant_id" value={initialData.id} />}
                    
                    <div className="space-y-4">
                        <FormInput id="name" label="Nama Varian (e.g., Merah, Ukuran L)" type="text" defaultValue={initialData?.name} error={state.errors?.name} />
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                           <FormInput id="cost_price" label="Harga Pokok (HPP)" type="number" defaultValue={initialData?.cost_price ?? ''} error={state.errors?.cost_price} />
                           <FormInput id="selling_price" label="Harga Jual" type="number" defaultValue={initialData?.selling_price} error={state.errors?.selling_price} />
                        </div>
                        
                        <FormInput id="sku" label="SKU (Stock Keeping Unit)" type="text" defaultValue={initialData?.sku ?? ''} error={state.errors?.sku} helpText="Biarkan kosong untuk generate otomatis." />
                        
                        <div className="space-y-4 pt-4 border-t">
                            <FormCheckbox 
                                id="track_stock" 
                                label="Lacak Stok" 
                                description="Aktifkan untuk mengelola jumlah stok varian ini." 
                                defaultChecked={isStockTracked}
                                onChange={(e) => setIsStockTracked(e.target.checked)}
                            />
                            
                            {/* -- FIELD BARU: Hanya tampil jika isStockTracked true -- */}
                            {isStockTracked && (
                                <div className="pl-7 pt-2 space-y-4">
                                     <p className="text-sm font-medium">Notifikasi Stok Rendah</p>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <FormInput 
                                            id="reorder_point" 
                                            label="Batas Stok Minimum" 
                                            type="number" 
                                            defaultValue={initialData?.reorder_point ?? 0} 
                                            error={state.errors?.reorder_point}
                                            helpText="Notifikasi akan muncul jika stok kurang dari angka ini."
                                        />
                                        <FormInput 
                                            id="reorder_quantity" 
                                            label="Jumlah Order Ulang" 
                                            type="number" 
                                            defaultValue={initialData?.reorder_quantity ?? 0} 
                                            error={state.errors?.reorder_quantity}
                                            helpText="Jumlah yang disarankan untuk dipesan kembali."
                                        />
                                    </div>
                                </div>
                            )}
                             {/* --------------------------------------------------- */}
                        </div>
                    </div>

                    {state.message && state.message !== 'success' && (
                        <div className="mt-4 p-3 text-sm text-red-700 bg-red-100 rounded-lg flex items-center">
                            <Info className="h-5 w-5 mr-2" />
                            {state.message}
                        </div>
                    )}
                    
                    <div className="mt-6 pt-4 border-t flex justify-end gap-3">
                        <button type="button" onClick={onClose} className="px-6 py-2 bg-gray-200 rounded-lg hover:bg-gray-300">Batal</button>
                        <SubmitButton isEditing={isEditing} />
                    </div>
                </form>
            </div>
        </div>
    );
}
