"use client";

import { useState, useTransition, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Printer, Send, XCircle, Loader2, CheckCircle, PackagePlus } from 'lucide-react';
import { PurchaseOrderDetails, cancelPurchaseOrder, orderPurchaseOrder, receivePurchaseOrderItems, ReceivedItem } from './actions';

// --- Komponen Modal Penerimaan Barang ---
function ReceiveItemsModal({ details, onClose, onReceive, isReceiving }: {
    details: PurchaseOrderDetails;
    onClose: () => void;
    onReceive: (items: ReceivedItem[]) => void;
    isReceiving: boolean;
}) {
    const [receivedItems, setReceivedItems] = useState<Map<string, number>>(new Map());

    const handleQuantityChange = (itemId: string, value: string, max: number) => {
        const numValue = parseInt(value, 10);
        const newQty = isNaN(numValue) ? 0 : Math.min(Math.max(0, numValue), max);
        setReceivedItems(prev => new Map(prev).set(itemId, newQty));
    };

    const handleSubmit = () => {
        const itemsToSubmit: ReceivedItem[] = [];
        receivedItems.forEach((qty, id) => {
            if (qty > 0) {
                itemsToSubmit.push({ po_item_id: id, quantity_received: qty });
            }
        });
        onReceive(itemsToSubmit);
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex justify-center items-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl">
                <div className="p-6">
                    <h3 className="text-lg font-semibold mb-4">Terima Barang Masuk</h3>
                    <div className="max-h-96 overflow-y-auto pr-2">
                        <table className="w-full text-sm">
                            <thead><tr>
                                <th className="p-2 text-left">Produk</th>
                                <th className="p-2 text-center">Dipesan</th>
                                <th className="p-2 text-center">Sudah Diterima</th>
                                <th className="p-2 text-center">Diterima Sekarang</th>
                            </tr></thead>
                            <tbody>
                                {details?.items.map(item => {
                                    const remaining = item.quantity - item.received_quantity;
                                    if (remaining <= 0) return null; // Sembunyikan jika sudah diterima penuh
                                    return (
                                        <tr key={item.id} className="border-t">
                                            <td className="p-2">{item.name}</td>
                                            <td className="p-2 text-center">{item.quantity}</td>
                                            <td className="p-2 text-center">{item.received_quantity}</td>
                                            <td className="p-2 text-center">
                                                <input 
                                                    type="number" 
                                                    className="w-24 p-1 border rounded text-center" 
                                                    max={remaining}
                                                    min="0"
                                                    placeholder="0"
                                                    onChange={e => handleQuantityChange(item.id, e.target.value, remaining)}
                                                />
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
                <div className="p-4 bg-gray-50 flex justify-end gap-2 rounded-b-lg">
                    <button onClick={onClose} className="px-4 py-2 rounded bg-gray-200">Batal</button>
                    <button onClick={handleSubmit} disabled={isReceiving} className="px-4 py-2 rounded bg-green-600 text-white disabled:bg-gray-400">
                        {isReceiving ? 'Memproses...' : 'Proses Penerimaan'}
                    </button>
                </div>
            </div>
        </div>
    );
}


// ... (Komponen InfoItem dan StatusBadge tidak berubah)
const InfoItem = ({ label, value }: { label: string; value: React.ReactNode }) => (
    <div><p className="text-sm text-gray-500">{label}</p><p className="font-semibold">{value}</p></div>
);
const StatusBadge = ({ status }: { status: string }) => {
    const baseClasses = "px-3 py-1 text-sm font-semibold rounded-full inline-block";
    const statusMap: { [key: string]: string } = {
        draft: "bg-gray-100 text-gray-800",
        ordered: "bg-blue-100 text-blue-800",
        partially_received: "bg-yellow-100 text-yellow-800",
        completed: "bg-green-100 text-green-800",
        cancelled: "bg-red-100 text-red-800",
    };
    return <span className={`${baseClasses} ${statusMap[status] || 'bg-gray-100'}`}>{status}</span>;
};


// Komponen Utama
export function PODetailClient({ initialDetails }: { initialDetails: PurchaseOrderDetails }) {
    const [details, setDetails] = useState(initialDetails);
    const [isPending, startTransition] = useTransition();
    const router = useRouter();
    const [confirmCancel, setConfirmCancel] = useState(false);
    const [isReceiving, setIsReceiving] = useState(false);

    useEffect(() => { setDetails(initialDetails); }, [initialDetails]);

    const handleAction = (action: (id: string) => Promise<{success: boolean, message?: string}>) => {
        startTransition(async () => {
            const result = await action(details!.id);
            if (result.success) router.refresh(); 
            else alert(`Error: ${result.message}`);
        });
    };
    
    const handleCancel = () => {
        startTransition(async () => {
            await cancelPurchaseOrder(details!.id);
            setConfirmCancel(false);
        });
    };
    
    const handleReceiveItems = (items: ReceivedItem[]) => {
        if (items.length === 0) {
            setIsReceiving(false);
            return;
        }
        startTransition(async () => {
            const result = await receivePurchaseOrderItems(details!.id, items);
            if (result.success) {
                setIsReceiving(false);
                router.refresh();
            } else {
                alert(`Error: ${result.message}`);
                setIsReceiving(false);
            }
        });
    }

    const formatDate = (dateString: string | null) => dateString ? new Date(dateString).toLocaleDateString('id-ID', {day: '2-digit', month: 'long', year: 'numeric'}) : '-';
    const formatCurrency = (amount: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(amount);

    if (!details) return null;

    const canBeCancelled = ['draft', 'ordered'].includes(details.status);
    const canBeOrdered = details.status === 'draft';
    const canBeReceived = ['ordered', 'partially_received'].includes(details.status);
    
    const totalCost = details.items.reduce((acc, item) => acc + (item.quantity * item.unit_cost), 0);

    return (
        <div className="w-full">
            {confirmCancel && (
                <div className="fixed inset-0 bg-black/50 z-50 flex justify-center items-center p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-sm shadow-xl">
                        <h3 className="font-bold text-lg">Konfirmasi Pembatalan</h3>
                        <p className="py-4">Anda yakin ingin membatalkan PO ini?</p>
                        <div className="flex justify-end gap-2"><button onClick={() => setConfirmCancel(false)} className="px-4 py-2 rounded bg-gray-200">Tidak</button><button onClick={handleCancel} disabled={isPending} className="px-4 py-2 rounded bg-red-600 text-white">{isPending ? <Loader2 className="animate-spin" /> : 'Ya, Batalkan'}</button></div>
                    </div>
                </div>
            )}
            {isReceiving && <ReceiveItemsModal details={details} onClose={() => setIsReceiving(false)} onReceive={handleReceiveItems} isReceiving={isPending} />}

            {/* Header */}
            <div className="flex flex-wrap items-center justify-between mb-6 gap-4">
                <div>
                    <Link href="/dashboard/inventory/purchase-orders" className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-2"><ArrowLeft size={18} /> Kembali ke Daftar PO</Link>
                    <h1 className="text-2xl font-bold">Detail Pesanan Pembelian #{details.po_number}</h1>
                </div>
                <div className="flex items-center gap-2">
                    {canBeCancelled && <button onClick={() => setConfirmCancel(true)} disabled={isPending} className="bg-red-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 disabled:opacity-50">{isPending ? <Loader2 className="animate-spin" /> : <XCircle size={18} />} Batal</button>}
                    {canBeOrdered && <button onClick={() => handleAction(orderPurchaseOrder)} disabled={isPending} className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 disabled:opacity-50">{isPending ? <Loader2 className="animate-spin" /> : <Send size={18} />} Tandai Dipesan</button>}
                    {canBeReceived && <button onClick={() => setIsReceiving(true)} disabled={isPending} className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 disabled:opacity-50">{isPending ? <Loader2 className="animate-spin" /> : <PackagePlus size={18} />} Terima Barang</button>}
                    <button className="bg-gray-200 px-4 py-2 rounded-lg flex items-center gap-2"><Printer size={18} /> Cetak</button>
                </div>
            </div>

            {/* Detail Info & Daftar Item */}
            <div className="p-6 bg-white dark:bg-gray-800/50 rounded-lg border mb-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    <InfoItem label="Status" value={<StatusBadge status={details.status} />} /><InfoItem label="Pemasok" value={details.supplier.name} /><InfoItem label="Tujuan" value={details.outlet.name} /><InfoItem label="Dibuat Oleh" value={details.created_by || 'Sistem'} /><InfoItem label="Tgl. Pesan" value={formatDate(details.order_date)} /><InfoItem label="Perkiraan Tiba" value={formatDate(details.expected_delivery_date)} />
                </div>
                {details.notes && <div className="mt-4"><InfoItem label="Catatan" value={details.notes} /></div>}
            </div>
            <div className="border rounded-lg w-full bg-white dark:bg-gray-800/50">
                <table className="w-full text-sm">
                    <thead><tr className="border-b"><th className="p-4 text-left font-medium">Produk</th><th className="p-4 text-right font-medium">Dipesan</th><th className="p-4 text-right font-medium">Diterima</th><th className="p-4 text-right font-medium">Harga Beli/Unit</th><th className="p-4 text-right font-medium">Subtotal</th></tr></thead>
                    <tbody>
                        {details.items.map(item => (
                            <tr key={item.id} className="border-b">
                                <td className="p-4 font-semibold">{item.name}<p className="text-xs text-gray-500">{item.sku}</p></td>
                                <td className="p-4 text-right font-mono">{item.quantity}</td>
                                <td className="p-4 text-right font-mono">{item.received_quantity}</td>
                                <td className="p-4 text-right font-mono">{formatCurrency(item.unit_cost)}</td>
                                <td className="p-4 text-right font-mono font-semibold">{formatCurrency(item.quantity * item.unit_cost)}</td>
                            </tr>
                        ))}
                    </tbody>
                    <tfoot className="font-bold"><tr><td colSpan={4} className="p-4 text-right">Total Biaya Keseluruhan</td><td className="p-4 text-right text-base">{formatCurrency(totalCost)}</td></tr></tfoot>
                </table>
            </div>
        </div>
    );
}
