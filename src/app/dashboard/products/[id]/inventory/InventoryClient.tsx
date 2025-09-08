"use client";

import { useState, useEffect, useActionState } from 'react';
import Link from 'next/link';
import { ArrowLeft, PlusCircle, MinusCircle, History, Info, Loader2, X, Move } from 'lucide-react';
import { useFormStatus } from 'react-dom';
import { adjustStock, transferStock, StockFormState } from './actions';

// ============== TYPE DEFINITIONS ==============
type ProductVariant = { id: string; name: string; sku: string | null };
type Outlet = { id: string; name: string };
type StockLevel = { quantity_on_hand: number; outlet: Outlet };
type StockMovement = { created_at: string; quantity_change: number; movement_type: string; outlet: { name: string } };

// ============== MODAL COMPONENTS ==============
const initialState: StockFormState = { message: '' };

const StockAdjustmentModal = ({ isOpen, onClose, productVariant, outlets }: { 
    isOpen: boolean; onClose: () => void; productVariant: ProductVariant; outlets: Outlet[];
}) => {
    const [state, formAction] = useActionState(adjustStock, initialState);

    useEffect(() => { if (state.message === 'success') onClose(); }, [state, onClose]);
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex justify-center items-center p-4 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md">
                <h3 className="text-xl font-semibold mb-4">Pemasukan / Penyesuaian Stok</h3>
                <form action={formAction}>
                    <input type="hidden" name="product_variant_id" value={productVariant.id} />
                    {/* The movement_type is now part of the form data, not a prop */}
                    <input type="hidden" name="movement_type" value="adjustment" />
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="outlet_id_adjust" className="block text-sm font-medium">Outlet</label>
                            <select id="outlet_id_adjust" name="outlet_id" required className="mt-1 w-full p-2 border rounded bg-transparent">{outlets.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}</select>
                            {state.errors?.outlet_id && <p className="text-red-500 text-xs mt-1">{state.errors.outlet_id.join(', ')}</p>}
                        </div>
                        <div>
                            <label htmlFor="quantity_change" className="block text-sm font-medium">Perubahan Kuantitas (+/-)</label>
                            <input type="number" id="quantity_change" name="quantity_change" placeholder="Contoh: -5 atau 50" required className="mt-1 w-full p-2 border rounded bg-transparent"/>
                            {state.errors?.quantity_change && <p className="text-red-500 text-xs mt-1">{state.errors.quantity_change.join(', ')}</p>}
                        </div>
                         <div>
                            <label htmlFor="notes" className="block text-sm font-medium">Catatan (Opsional)</label>
                            <input type="text" id="notes" name="notes" placeholder="Contoh: Stok opname 2024" className="mt-1 w-full p-2 border rounded bg-transparent"/>
                        </div>
                    </div>
                    {state.message && state.message !== 'success' && <p className="text-red-500 text-sm mt-4 flex items-center gap-2"><Info size={16} />{state.message}</p>}
                    <div className="mt-6 flex justify-end gap-3">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 rounded-lg">Batal</button>
                        <button type="submit" className="px-4 py-2 bg-teal-600 text-white rounded-lg">Simpan</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const StockTransferModal = ({ isOpen, onClose, productVariant, stockLevels, outlets }: {
    isOpen: boolean; onClose: () => void; productVariant: ProductVariant; stockLevels: StockLevel[]; outlets: Outlet[];
}) => {
    const [state, formAction] = useActionState(transferStock, initialState);
    const outletsWithStock = outlets.filter(o => stockLevels.some(sl => sl.outlet.id === o.id && sl.quantity_on_hand > 0));

    useEffect(() => { if (state.message === 'success') onClose(); }, [state, onClose]);
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex justify-center items-center p-4 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md">
                 <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-semibold">Transfer Stok</h3>
                    <button onClick={onClose}><X size={24} /></button>
                </div>
                <form action={formAction}>
                    <input type="hidden" name="product_variant_id" value={productVariant.id} />
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="outlet_from_id" className="block text-sm font-medium">Dari Outlet</label>
                            <select name="outlet_from_id" required className="mt-1 w-full p-2 border rounded bg-transparent">
                                {outletsWithStock.map(o => <option key={o.id} value={o.id}>{o.name} ({stockLevels.find(sl => sl.outlet.id === o.id)?.quantity_on_hand} unit)</option>)}
                            </select>
                             {state.errors?.outlet_from_id && <p className="text-red-500 text-xs mt-1">{state.errors.outlet_from_id.join(', ')}</p>}
                        </div>
                         <div>
                            <label htmlFor="outlet_to_id" className="block text-sm font-medium">Ke Outlet</label>
                            <select name="outlet_to_id" required className="mt-1 w-full p-2 border rounded bg-transparent">
                                {outlets.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                            </select>
                             {state.errors?.outlet_to_id && <p className="text-red-500 text-xs mt-1">{state.errors.outlet_to_id.join(', ')}</p>}
                        </div>
                        <div>
                            <label htmlFor="quantity" className="block text-sm font-medium">Jumlah Transfer</label>
                            <input type="number" name="quantity" min="1" required className="mt-1 w-full p-2 border rounded bg-transparent" />
                            {state.errors?.quantity && <p className="text-red-500 text-xs mt-1">{state.errors.quantity.join(', ')}</p>}
                        </div>
                    </div>
                    {state.message && state.message !== 'success' && <p className="text-red-500 text-sm mt-4 flex items-center gap-2"><Info size={16} />{state.message}</p>}
                    <div className="mt-6 flex justify-end gap-3">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 rounded-lg">Batal</button>
                        <button type="submit" className="px-4 py-2 bg-teal-600 text-white rounded-lg">Transfer</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// ============== MAIN CLIENT COMPONENT ==============
export function InventoryClient({ productVariant, outlets, initialStockLevels, stockMovements }: {
    productVariant: ProductVariant; outlets: Outlet[]; initialStockLevels: StockLevel[]; stockMovements: StockMovement[];
}) {
    const [modal, setModal] = useState<'adjustment' | 'transfer' | null>(null);
    const [modalKey, setModalKey] = useState(Date.now());

    const handleOpenModal = (type: 'adjustment' | 'transfer') => {
        setModalKey(Date.now()); // Generate a new key each time a modal is opened
        setModal(type);
    };

    const handleCloseModal = () => {
        setModal(null);
    };

    const totalStock = initialStockLevels.reduce((acc, level) => acc + level.quantity_on_hand, 0);

    return (
        <>
            <div className="mb-6">
                 <Link href="/dashboard/products" className="inline-flex items-center text-sm font-medium text-gray-600 hover:text-gray-900"><ArrowLeft className="h-4 w-4 mr-2" />Kembali ke Daftar Produk</Link>
                <h1 className="text-3xl font-bold tracking-tight mt-2">Manajemen Stok</h1>
                <p className="mt-1 text-md text-gray-600">{productVariant.name} <span className="text-xs bg-gray-200 p-1 rounded">{productVariant.sku || 'No SKU'}</span></p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1 space-y-6">
                    <div className="p-6 bg-white dark:bg-gray-900/50 rounded-lg border">
                        <h2 className="font-semibold mb-1">Total Stok Saat Ini</h2>
                        <p className="text-4xl font-bold">{totalStock} <span className="text-lg font-normal">unit</span></p>
                        <p className="text-sm text-gray-500">di semua outlet</p>
                    </div>
                     <div className="p-6 bg-white dark:bg-gray-900/50 rounded-lg border">
                        <h2 className="font-semibold mb-4">Aksi Cepat</h2>
                        <div className="space-y-3">
                            <button onClick={() => handleOpenModal('adjustment')} className="w-full inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"><PlusCircle className="h-5 w-5 mr-2" /> Pemasukan / Penyesuaian</button>
                            <button onClick={() => handleOpenModal('transfer')} className="w-full inline-flex items-center justify-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"><Move className="h-5 w-5 mr-2" /> Transfer Stok</button>
                        </div>
                    </div>
                     <div className="p-6 bg-white dark:bg-gray-900/50 rounded-lg border">
                        <h2 className="font-semibold mb-4">Stok per Outlet</h2>
                        <ul className="space-y-2">
                           {initialStockLevels.map(level => (
                               <li key={level.outlet.id} className="flex justify-between items-center text-sm"><span>{level.outlet.name}</span><span className="font-semibold">{level.quantity_on_hand} unit</span></li>
                           ))}
                           {initialStockLevels.length === 0 && <p className="text-sm text-gray-500">Belum ada stok.</p>}
                        </ul>
                    </div>
                </div>

                <div className="lg:col-span-2 p-6 bg-white dark:bg-gray-900/50 rounded-lg border">
                    <h2 className="font-semibold mb-4 flex items-center gap-2"><History size={18} /> Riwayat Pergerakan Stok</h2>
                    <div className="overflow-x-auto"><table className="min-w-full text-sm"><thead className="text-left text-gray-500"><tr><th className="p-2">Tanggal</th><th className="p-2">Tipe</th><th className="p-2">Outlet</th><th className="p-2 text-right">Jumlah</th></tr></thead><tbody>
                        {stockMovements.map((move, i) => (<tr key={i} className="border-t"><td className="p-2">{new Date(move.created_at).toLocaleString('id-ID')}</td><td className="p-2">{move.movement_type}</td><td className="p-2">{move.outlet.name}</td><td className={`p-2 text-right font-medium ${move.quantity_change > 0 ? 'text-green-600' : 'text-red-600'}`}>{move.quantity_change > 0 ? '+' : ''}{move.quantity_change}</td></tr>))}
                        {stockMovements.length === 0 && <tr><td colSpan={4} className="p-4 text-center text-gray-500">Belum ada riwayat.</td></tr>}
                    </tbody></table></div>
                </div>
            </div>

            <StockAdjustmentModal key={`adj-${modalKey}`} isOpen={modal === 'adjustment'} onClose={handleCloseModal} productVariant={productVariant} outlets={outlets} />
            <StockTransferModal key={`trans-${modalKey}`} isOpen={modal === 'transfer'} onClose={handleCloseModal} productVariant={productVariant} stockLevels={initialStockLevels} outlets={outlets} />
        </>
    );
}
