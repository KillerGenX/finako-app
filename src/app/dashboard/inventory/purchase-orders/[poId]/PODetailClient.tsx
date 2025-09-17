"use client";

import { useState, useTransition, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Printer, Send, XCircle, Loader2, CheckCircle } from 'lucide-react'; // Tambahkan CheckCircle
import { PurchaseOrderDetails, cancelPurchaseOrder, orderPurchaseOrder } from './actions';

// Komponen-komponen kecil
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
    
    // PERBAIKAN: State untuk modal konfirmasi
    const [confirmCancel, setConfirmCancel] = useState(false);

    useEffect(() => { setDetails(initialDetails); }, [initialDetails]);

    const handleAction = (action: (id: string) => Promise<{success: boolean, message?: string}>) => {
        startTransition(async () => {
            const result = await action(details!.id);
            if (result.success) {
                router.refresh(); 
            } else {
                alert(`Error: ${result.message}`);
            }
        });
    };
    
    const handleCancel = () => {
        startTransition(async () => {
            await cancelPurchaseOrder(details!.id);
            setConfirmCancel(false);
            // Redirect akan ditangani oleh server action
        });
    };

    const formatDate = (dateString: string | null) => dateString ? new Date(dateString).toLocaleDateString('id-ID', {day: '2-digit', month: 'long', year: 'numeric'}) : '-';
    const formatCurrency = (amount: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(amount);

    if (!details) return null;

    const canBeCancelled = ['draft', 'ordered'].includes(details.status);
    const canBeOrdered = details.status === 'draft';
    
    const totalCost = details.items.reduce((acc, item) => acc + (item.quantity * item.unit_cost), 0);

    return (
        <div className="w-full">
             {/* PERBAIKAN: Modal konfirmasi kustom */}
            {confirmCancel && (
                <div className="fixed inset-0 bg-black/50 z-50 flex justify-center items-center p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-sm shadow-xl">
                        <h3 className="font-bold text-lg">Konfirmasi Pembatalan</h3>
                        <p className="py-4">Anda yakin ingin membatalkan Pesanan Pembelian ini? Stok yang sudah diterima (jika ada) tidak akan terpengaruh.</p>
                        <div className="flex justify-end gap-2">
                            <button onClick={() => setConfirmCancel(false)} className="px-4 py-2 rounded bg-gray-200 dark:bg-gray-600">Tidak</button>
                            <button onClick={handleCancel} disabled={isPending} className="px-4 py-2 rounded bg-red-600 text-white disabled:bg-gray-400">
                                {isPending ? <Loader2 className="animate-spin" /> : 'Ya, Batalkan'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Header */}
            <div className="flex flex-wrap items-center justify-between mb-6 gap-4">
                <div>
                    <Link href="/dashboard/inventory/purchase-orders" className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-2">
                        <ArrowLeft size={18} /> Kembali ke Daftar PO
                    </Link>
                    <h1 className="text-2xl font-bold">Detail Pesanan Pembelian #{details.po_number}</h1>
                </div>
                <div className="flex items-center gap-2">
                    {canBeCancelled && <button onClick={() => setConfirmCancel(true)} disabled={isPending} className="bg-red-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 disabled:opacity-50">{isPending ? <Loader2 className="animate-spin" /> : <XCircle size={18} />} Batal</button>}
                    {canBeOrdered && <button onClick={() => handleAction(orderPurchaseOrder)} disabled={isPending} className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 disabled:opacity-50">{isPending ? <Loader2 className="animate-spin" /> : <Send size={18} />} Tandai Dipesan</button>}
                    <button className="bg-gray-200 px-4 py-2 rounded-lg flex items-center gap-2"><Printer size={18} /> Cetak</button>
                </div>
            </div>

            {/* ... sisa komponen (Detail Info & Daftar Item) tidak berubah ... */}
             <div className="p-6 bg-white dark:bg-gray-800/50 rounded-lg border mb-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    <InfoItem label="Status" value={<StatusBadge status={details.status} />} />
                    <InfoItem label="Pemasok" value={details.supplier.name} />
                    <InfoItem label="Tujuan" value={details.outlet.name} />
                    <InfoItem label="Dibuat Oleh" value={details.created_by || 'Sistem'} />
                    <InfoItem label="Tgl. Pesan" value={formatDate(details.order_date)} />
                    <InfoItem label="Perkiraan Tiba" value={formatDate(details.expected_delivery_date)} />
                </div>
                {details.notes && <div className="mt-4"><InfoItem label="Catatan" value={details.notes} /></div>}
            </div>
            
            <div className="border rounded-lg w-full bg-white dark:bg-gray-800/50">
                <table className="w-full text-sm">
                    <thead><tr className="border-b">
                        <th className="p-4 text-left font-medium">Produk</th>
                        <th className="p-4 text-left font-medium">SKU</th>
                        <th className="p-4 text-right font-medium">Jumlah</th>
                        <th className="p-4 text-right font-medium">Harga Beli/Unit</th>
                        <th className="p-4 text-right font-medium">Subtotal</th>
                    </tr></thead>
                    <tbody>
                        {details.items.map(item => (
                            <tr key={item.id} className="border-b">
                                <td className="p-4 font-semibold">{item.name}</td>
                                <td className="p-4 text-gray-500">{item.sku}</td>
                                <td className="p-4 text-right font-mono">{item.quantity}</td>
                                <td className="p-4 text-right font-mono">{formatCurrency(item.unit_cost)}</td>
                                <td className="p-4 text-right font-mono font-semibold">{formatCurrency(item.quantity * item.unit_cost)}</td>
                            </tr>
                        ))}
                    </tbody>
                    <tfoot className="font-bold">
                        <tr>
                            <td colSpan={4} className="p-4 text-right">Total Biaya Keseluruhan</td>
                            <td className="p-4 text-right text-base">{formatCurrency(totalCost)}</td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        </div>
    );
}
