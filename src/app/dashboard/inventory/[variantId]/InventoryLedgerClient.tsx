"use client";

import { useState, useTransition, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, History, FileText, Move, ArchiveX, CheckCircle, Loader2 } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { getInventoryLedgerDetails, setInitialStock, InitialStockInput } from './actions';
import { ViewReceiptModal } from '../../history/ViewReceiptModal'; // Impor modal struk

// --- Tipe Data ---
type ProductVariant = { id: string; name: string; sku: string | null };
type Outlet = { id: string; name: string };
type LedgerDetails = NonNullable<Awaited<ReturnType<typeof getInventoryLedgerDetails>>>;

// --- Komponen-komponen Anak ---

// Modal Stok Awal (tidak berubah)
function InitialStockModal({ outlets, variantId, onClose, onSave }: {
    outlets: Outlet[],
    variantId: string,
    onClose: () => void,
    onSave: (variantId: string, stocks: InitialStockInput[]) => Promise<any>
}) {
    const [stocks, setStocks] = useState<Map<string, number>>(new Map());
    const [isSaving, startSavingTransition] = useTransition();
    const handleSave = () => {
        const stocksToSave: InitialStockInput[] = [];
        stocks.forEach((qty, id) => { if (qty > 0) stocksToSave.push({ outlet_id: id, quantity: qty }); });
        startSavingTransition(async () => {
            const result = await onSave(variantId, stocksToSave);
            if (result.success) onClose(); else alert(`Error: ${result.message}`);
        });
    };
    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex justify-center items-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-lg">
                <div className="p-6"><h3 className="text-lg font-semibold">Atur Saldo Stok Awal</h3><p className="text-sm text-gray-500">Masukkan jumlah stok fisik saat ini untuk setiap lokasi. Ini hanya bisa dilakukan sekali.</p></div>
                <div className="p-6 border-y max-h-80 overflow-y-auto">
                    {outlets.map(outlet => (<div key={outlet.id} className="flex items-center justify-between mb-2"><label>{outlet.name}</label><input type="number" min="0" className="w-24 p-1 border rounded text-center" onChange={e => setStocks(prev => new Map(prev).set(outlet.id, parseInt(e.target.value, 10)))} /></div>))}
                </div>
                <div className="p-4 bg-gray-50 flex justify-end gap-2"><button onClick={onClose} className="px-4 py-2 rounded bg-gray-200">Batal</button><button onClick={handleSave} disabled={isSaving} className="px-4 py-2 rounded bg-teal-600 text-white disabled:bg-gray-400">{isSaving ? 'Menyimpan...' : 'Simpan Stok Awal'}</button></div>
            </div>
        </div>
    );
}

// Komponen Buku Besar - DIPERBARUI
function StockLedgerTable({ ledger, onViewTransaction }: { 
    ledger: LedgerDetails['ledger'],
    onViewTransaction: (transactionId: string) => void 
}) {
    const formatDate = (date: string) => new Date(date).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' });

    // Fungsi untuk membuat link referensi yang benar
    const getReferenceLink = (move: LedgerDetails['ledger'][0]) => {
        if (!move.reference_id || !move.reference_number) return <span>-</span>;

        switch (move.movement_type) {
            case 'sale':
                return <button onClick={() => onViewTransaction(move.reference_id!)} className="text-teal-600 hover:underline font-mono">{move.reference_number}</button>;
            case 'transfer_in':
            case 'transfer_out':
                return <Link href={`/dashboard/inventory/transfers/${move.reference_id}`} className="text-teal-600 hover:underline font-mono">{move.reference_number}</Link>;
            case 'purchase_received':
                // Cek nomor referensi untuk membedakan PO dan Penerimaan Lainnya
                if (move.reference_number.startsWith('PO-')) {
                    return <Link href={`/dashboard/inventory/purchase-orders/${move.reference_id}`} className="text-teal-600 hover:underline font-mono">{move.reference_number}</Link>;
                } else if (move.reference_number.startsWith('OR-')) {
                    // Halaman detail untuk other-receivings belum dibuat, jadi non-aktifkan link
                    return <span className="font-mono">{move.reference_number}</span>;
                }
                return <span className="font-mono">{move.reference_number}</span>;
            case 'adjustment':
                 if (move.reference_number.startsWith('SO-')) {
                    return <Link href={`/dashboard/inventory/stock-opname/${move.reference_id}`} className="text-teal-600 hover:underline font-mono">{move.reference_number}</Link>;
                } else if (move.reference_number.startsWith('WO-')) {
                     // Halaman detail untuk write-offs belum dibuat, jadi non-aktifkan link
                    return <span className="font-mono">{move.reference_number}</span>;
                }
                return <span className="font-mono">{move.reference_number}</span>;
            default:
                return <span className="font-mono">{move.reference_number}</span>;
        }
    };

    return (
        <div className="overflow-x-auto max-h-[60vh]"><table className="min-w-full text-sm"><thead className="text-left text-gray-500"><tr><th className="p-2">Tanggal</th><th className="p-2">Tipe</th><th className="p-2">Outlet</th><th className="p-2">Referensi</th><th className="p-2 text-right">Perubahan</th></tr></thead><tbody>
            {ledger.map((move, i) => (<tr key={i} className="border-t"><td className="p-2">{formatDate(move.created_at)}</td><td className="p-2">{move.movement_type}</td><td className="p-2">{move.outlet_name}</td><td className="p-2">{getReferenceLink(move)}</td><td className={`p-2 text-right font-medium ${move.quantity_change > 0 ? 'text-green-600' : 'text-red-600'}`}>{move.quantity_change > 0 ? '+' : ''}{move.quantity_change}</td></tr>))}
        </tbody></table></div>
    );
}


// --- Komponen Utama ---
export function InventoryLedgerClient({ productVariant, outlets, initialDetails, hasInitialStock }: {
    productVariant: ProductVariant; outlets: Outlet[]; initialDetails: LedgerDetails; hasInitialStock: boolean;
}) {
    const [details, setDetails] = useState(initialDetails);
    const [showInitialStockModal, setShowInitialStockModal] = useState(false);
    // State baru untuk modal struk
    const [viewingTransactionId, setViewingTransactionId] = useState<string | null>(null);
    const router = useRouter();

    useEffect(() => { setDetails(initialDetails); }, [initialDetails]);

    const handleSaveInitialStock = async (variantId: string, stocks: InitialStockInput[]) => {
        const result = await setInitialStock(variantId, stocks);
        if (result.success) router.refresh();
        return result;
    };

    return (
        <>
            {showInitialStockModal && <InitialStockModal outlets={outlets} variantId={productVariant.id} onClose={() => setShowInitialStockModal(false)} onSave={handleSaveInitialStock} />}
            {viewingTransactionId && <ViewReceiptModal transactionId={viewingTransactionId} onClose={() => setViewingTransactionId(null)} />}
            
            <div className="mb-6"><Link href="/dashboard/products" className="inline-flex items-center text-sm font-medium text-gray-600 hover:text-gray-900"><ArrowLeft className="h-4 w-4 mr-2" />Kembali</Link><h1 className="text-3xl font-bold tracking-tight mt-2">Pusat Komando Stok</h1><p className="mt-1 text-md text-gray-600">{productVariant.name} <span className="text-xs bg-gray-200 p-1 rounded">{productVariant.sku || 'No SKU'}</span></p></div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1 space-y-6">
                    <div className="p-6 bg-white dark:bg-gray-900/50 rounded-lg border"><h2 className="font-semibold mb-1">Total Stok</h2><p className="text-4xl font-bold">{details.summary.total_stock} <span className="text-lg font-normal">unit</span></p></div>
                    <div className="p-6 bg-white dark:bg-gray-900/50 rounded-lg border"><h2 className="font-semibold mb-4">Stok per Outlet</h2><ul className="space-y-2">{details.summary.stock_by_outlet.map(level => (<li key={level.outlet_name} className="flex justify-between items-center text-sm"><span>{level.outlet_name}</span><span className="font-semibold">{level.quantity} unit</span></li>))}</ul></div>
                    {!hasInitialStock && (<div className="p-6 bg-yellow-50 border-yellow-200 rounded-lg border text-center"><h2 className="font-semibold mb-2">Produk Baru!</h2><p className="text-sm text-yellow-800 mb-4">Atur saldo stok awal untuk memulai.</p><button onClick={() => setShowInitialStockModal(true)} className="w-full inline-flex items-center justify-center px-4 py-2 bg-yellow-400 text-yellow-900 rounded-lg hover:bg-yellow-500 font-semibold"><CheckCircle className="h-5 w-5 mr-2" /> Atur Stok Awal</button></div>)}
                    <div className="p-6 bg-white dark:bg-gray-900/50 rounded-lg border"><h2 className="font-semibold mb-4">Aksi Cepat</h2><div className="space-y-3">
                        <Link href="/dashboard/inventory/purchase-orders/new" className="w-full inline-flex items-center justify-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"><FileText className="h-5 w-5 mr-2" /> Buat PO</Link>
                        <Link href="/dashboard/inventory/transfers/new" className="w-full inline-flex items-center justify-center px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"><Move className="h-5 w-5 mr-2" /> Buat Transfer</Link>
                        <Link href="/dashboard/inventory/write-offs/new" className="w-full inline-flex items-center justify-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"><ArchiveX className="h-5 w-5 mr-2" /> Catat Barang Rusak</Link>
                     </div></div>
                </div>
                <div className="lg:col-span-2 p-6 bg-white dark:bg-gray-900/50 rounded-lg border">
                    <h2 className="font-semibold mb-4">Tren Stok (30 Hari Terakhir)</h2>
                    <div style={{width: '100%', height: 200}}><ResponsiveContainer><LineChart data={details.chart_data}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="date" /><YAxis /><Tooltip /><Line type="monotone" dataKey="stock" stroke="#0d9488" strokeWidth={2} /></LineChart></ResponsiveContainer></div>
                    <h2 className="font-semibold my-4 flex items-center gap-2"><History size={18} /> Buku Besar Stok</h2>
                    <StockLedgerTable ledger={details.ledger} onViewTransaction={setViewingTransactionId} />
                </div>
            </div>
        </>
    );
}
