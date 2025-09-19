"use client";

import { useActionState, useEffect, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { addOrUpdateVariant, FormState } from '../../actions';
import { Variant } from './ProductDetailClient';
import { Loader2, Info } from 'lucide-react';

const initialState: FormState = { message: '' };

function SubmitButton() {
    const { pending } = useFormStatus();
    return (
        <button type="submit" disabled={pending} className="inline-flex items-center justify-center px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50">
            {pending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Menyimpan...</> : 'Simpan Perubahan'}
        </button>
    );
}

const FormInput = ({ id, label, type, required, error, step, defaultValue, placeholder, helpText }: { id: string, label: string, type: string, required?: boolean, error?: string[], step?: string, defaultValue: string | number | null, placeholder?: string, helpText?: string }) => (
    <div>
        <label htmlFor={id} className="block text-sm font-medium">{label}</label>
        <input type={type} id={id} name={id} required={required} step={step} placeholder={placeholder} defaultValue={defaultValue ?? ''} className={`mt-1 block w-full p-2 border rounded bg-transparent ${error ? 'border-red-500' : 'border-gray-300'}`} />
        {helpText && !error && <p className="mt-1 text-xs text-gray-500">{helpText}</p>}
        {error && <p className="mt-1 text-xs text-red-500">{error.join(', ')}</p>}
    </div>
);

export function SingleVariantEditor({ variant, productId }: { variant: Variant & { reorder_point?: number, reorder_quantity?: number }, productId: string }) {
    const [state, formAction] = useActionState(addOrUpdateVariant, initialState);
    const [isStockTracked, setIsStockTracked] = useState(variant.track_stock);

    useEffect(() => {
        if (state.message === 'success') {
           // Optionally, show a success toast here
        }
    }, [state]);

    return (
        <div>
            <h2 className="text-lg font-semibold mb-4">Detail Produk</h2>
            <form action={formAction}>
                <input type="hidden" name="product_id" value={productId} />
                <input type="hidden" name="variant_id" value={variant.id} />
                <input type="hidden" name="name" value={variant.name} />

                <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormInput id="selling_price" label="Harga Jual" type="number" required defaultValue={variant.selling_price} step="0.01" error={state.errors?.selling_price} />
                        <FormInput id="cost_price" label="Harga Pokok (HPP)" type="number" defaultValue={variant.cost_price} step="0.01" error={state.errors?.cost_price} placeholder="Opsional"/>
                    </div>
                    <FormInput id="sku" label="SKU (Stock Keeping Unit)" type="text" defaultValue={variant.sku} error={state.errors?.sku} placeholder="Opsional" />
                    
                    <div className="space-y-4 pt-4 border-t">
                        <label className="flex items-center gap-2 font-normal cursor-pointer">
                            <input 
                                type="checkbox" 
                                name="track_stock" 
                                id="track_stock" 
                                defaultChecked={isStockTracked}
                                onChange={(e) => setIsStockTracked(e.target.checked)}
                                className="form-checkbox rounded text-teal-600" 
                            />
                            <span className="text-sm font-medium">Lacak Stok untuk produk ini</span>
                        </label>
                        
                        {isStockTracked && (
                             <div className="pl-7 pt-2 space-y-4">
                                 <p className="text-sm font-medium">Notifikasi Stok Rendah</p>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <FormInput 
                                        id="reorder_point" 
                                        label="Batas Stok Minimum" 
                                        type="number" 
                                        defaultValue={variant.reorder_point ?? 0} 
                                        error={state.errors?.reorder_point}
                                        helpText="Notifikasi jika stok kurang dari angka ini."
                                    />
                                    <FormInput 
                                        id="reorder_quantity" 
                                        label="Jumlah Order Ulang" 
                                        type="number" 
                                        defaultValue={variant.reorder_quantity ?? 0} 
                                        error={state.errors?.reorder_quantity}
                                        helpText="Jumlah saran untuk dipesan kembali."
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    {state.message && state.message !== 'success' && <div className="mt-2 p-3 text-sm text-red-700 bg-red-100 rounded-lg flex items-center"><Info className="h-5 w-5 mr-2" />{state.message}</div>}
                    
                    <div className="mt-4 pt-4 border-t flex justify-end">
                        <SubmitButton />
                    </div>
                </div>
            </form>
        </div>
    );
}
