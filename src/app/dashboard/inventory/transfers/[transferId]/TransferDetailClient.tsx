"use client";

import { useState, useTransition, useEffect } from 'react'; // Impor useEffect
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Printer, Truck, XCircle, Loader2, CheckCircle } from 'lucide-react';
import { StockTransferDetails, sendStockTransfer, cancelStockTransfer, receiveStockTransfer } from './actions';

// ... (Komponen InfoItem dan StatusBadge tidak berubah)
const InfoItem = ({ label, value }: { label: string; value: React.ReactNode }) => (
    <div>
        <p className="text-sm text-gray-500">{label}</p>
        <p className="font-semibold">{value}</p>
    </div>
);

const StatusBadge = ({ status }: { status: string }) => {
    const baseClasses = "px-3 py-1 text-sm font-semibold rounded-full inline-block";
    const statusMap: { [key: string]: string } = {
        draft: "bg-gray-100 text-gray-800",
        sent: "bg-blue-100 text-blue-800",
        received: "bg-green-100 text-green-800",
        cancelled: "bg-red-100 text-red-800",
    };
    return <span className={`${baseClasses} ${statusMap[status] || 'bg-gray-100'}`}>{status}</span>;
};


// Komponen Utama
export function TransferDetailClient({ initialDetails }: { initialDetails: StockTransferDetails }) {
    const [details, setDetails] = useState(initialDetails);
    const [isPending, startTransition] = useTransition();
    const router = useRouter();

    // PERBAIKAN KUNCI: Sinkronkan state internal dengan prop yang masuk
    useEffect(() => {
        setDetails(initialDetails);
    }, [initialDetails]);

    const handleAction = (action: (id: string) => Promise<{success: boolean, message?: string}>) => {
        startTransition(async () => {
            const result = await action(details!.id);
            if (result.success) {
                // router.refresh() akan memicu perubahan pada `initialDetails`
                // yang kemudian akan ditangkap oleh useEffect di atas.
                router.refresh(); 
            } else {
                alert(`Error: ${result.message}`);
            }
        });
    };
    
    const handleCancel = () => {
        if (confirm("Anda yakin ingin membatalkan draf transfer ini?")) {
            startTransition(() => cancelStockTransfer(details!.id));
        }
    };

    const formatDate = (dateString: string | null) => dateString ? new Date(dateString).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }) : '-';

    if (!details) return null;

    const canBeSent = details.status === 'draft';
    const canBeCancelled = details.status === 'draft';
    const canBeReceived = details.status === 'sent';

    return (
        <div className="w-full">
            {/* Header */}
            <div className="flex flex-wrap items-center justify-between mb-6 gap-4">
                <div>
                    <Link href="/dashboard/inventory/transfers" className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-2">
                        <ArrowLeft size={18} /> Kembali ke Daftar Transfer
                    </Link>
                    <h1 className="text-2xl font-bold">Detail Surat Jalan #{details.transfer_number}</h1>
                </div>
                <div className="flex items-center gap-2">
                    {canBeCancelled && (
                        <button onClick={handleCancel} disabled={isPending} className="bg-red-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 disabled:bg-gray-400">
                            {isPending ? <Loader2 className="animate-spin" /> : <XCircle size={18} />} Batal
                        </button>
                    )}
                    {canBeSent && (
                        <button onClick={() => handleAction(sendStockTransfer)} disabled={isPending} className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 disabled:bg-gray-400">
                             {isPending ? <Loader2 className="animate-spin" /> : <Truck size={18} />} Kirim Stok
                        </button>
                    )}
                    {canBeReceived && (
                         <button onClick={() => handleAction(receiveStockTransfer)} disabled={isPending} className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 disabled:bg-gray-400">
                             {isPending ? <Loader2 className="animate-spin" /> : <CheckCircle size={18} />} Terima Stok
                        </button>
                    )}
                    <button disabled={isPending} className="bg-gray-200 px-4 py-2 rounded-lg flex items-center gap-2">
                        <Printer size={18} /> Cetak
                    </button>
                </div>
            </div>

            {/* Detail Info */}
            <div className="p-6 bg-white dark:bg-gray-800/50 rounded-lg border mb-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    <InfoItem label="Status" value={<StatusBadge status={details.status} />} />
                    <InfoItem label="Outlet Asal" value={details.outlet_from.name} />
                    <InfoItem label="Outlet Tujuan" value={details.outlet_to.name} />
                    <InfoItem label="Dibuat Oleh" value={details.created_by || 'Sistem'} />
                    <InfoItem label="Tgl. Dibuat" value={formatDate(details.created_at)} />
                    <InfoItem label="Tgl. Kirim" value={formatDate(details.sent_at)} />
                    <InfoItem label="Tgl. Terima" value={formatDate(details.received_at)} />
                </div>
                {details.notes && <div className="mt-4"><InfoItem label="Catatan" value={details.notes} /></div>}
            </div>
            
            {/* Daftar Item */}
             <div className="border rounded-lg w-full bg-white dark:bg-gray-800/50">
                <table className="w-full text-sm">
                    <thead><tr className="border-b"><th className="p-4 text-left font-medium">Produk</th><th className="p-4 text-left font-medium">SKU</th><th className="p-4 text-right font-medium">Jumlah</th></tr></thead>
                    <tbody>
                        {details.items.map(item => (
                            <tr key={item.id} className="border-b">
                                <td className="p-4 font-semibold">{item.name}</td>
                                <td className="p-4 text-gray-500">{item.sku}</td>
                                <td className="p-4 text-right font-mono font-semibold">{item.quantity}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
