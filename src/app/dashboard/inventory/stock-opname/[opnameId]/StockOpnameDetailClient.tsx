"use client";

import { useState, useTransition, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Printer, Save, CheckCircle, Loader2 } from 'lucide-react';
import { StockOpnameDetails, saveOpnameItems, completeStockOpname, OpnameItemUpdate } from './actions';
import { useDebounce } from '@/lib/hooks/useDebounce';

// --- Komponen-komponen Kecil ---
const InfoItem = ({ label, value }: { label: string; value: React.ReactNode }) => (
    <div><p className="text-sm text-gray-500">{label}</p><p className="font-semibold">{value}</p></div>
);
const StatusBadge = ({ status }: { status: string }) => {
    const baseClasses = "px-3 py-1 text-sm font-semibold rounded-full inline-block";
    const statusMap: { [key: string]: string } = { counting: "bg-yellow-100 text-yellow-800", completed: "bg-green-100 text-green-800", cancelled: "bg-red-100 text-red-800" };
    return <span className={`${baseClasses} ${statusMap[status] || 'bg-gray-100'}`}>{status}</span>;
};


// --- Komponen Utama ---
export function StockOpnameDetailClient({ initialDetails }: { initialDetails: StockOpnameDetails }) {
    const [details, setDetails] = useState(initialDetails);
    const [isSaving, startSaveTransition] = useTransition();
    const [isCompleting, startCompleteTransition] = useTransition();
    const router = useRouter();

    const [updatedItems, setUpdatedItems] = useState<Map<string, number>>(new Map());
    const debouncedItems = useDebounce(updatedItems, 1000); // Debounce
    
    useEffect(() => { setDetails(initialDetails); }, [initialDetails]);

    // Handler untuk mengubah kuantitas fisik
    const handleQuantityChange = (itemId: string, value: string) => {
        const newQty = parseInt(value, 10);
        setUpdatedItems(prev => new Map(prev).set(itemId, isNaN(newQty) ? 0 : newQty));
    };
    
    // Effect untuk menyimpan otomatis saat user berhenti mengetik
    useEffect(() => {
        if (debouncedItems.size > 0) {
            const itemsToSave: OpnameItemUpdate[] = Array.from(debouncedItems.entries()).map(([id, physical_quantity]) => ({ id, physical_quantity }));
            startSaveTransition(() => {
                saveOpnameItems(itemsToSave).then(() => {
                    setUpdatedItems(new Map()); // Reset setelah menyimpan
                    router.refresh();
                });
            });
        }
    }, [debouncedItems, router]);


    const handleComplete = () => {
        if (confirm("Anda yakin ingin menyelesaikan Stok Opname ini? Stok akan disesuaikan dan proses tidak dapat dibatalkan.")) {
            startCompleteTransition(async () => {
                await completeStockOpname(details!.id);
                router.refresh();
            });
        }
    };

    const formatDate = (dateString: string | null) => dateString ? new Date(dateString).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }) : '-';

    if (!details) return null;
    const isCompleted = details.status === 'completed';

    return (
        <div className="w-full">
             {/* Header */}
            <div className="flex flex-wrap items-center justify-between mb-6 gap-4">
                <div>
                    <Link href="/dashboard/inventory/stock-opname" className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-2">
                        <ArrowLeft size={18} /> Kembali ke Daftar Opname
                    </Link>
                    <h1 className="text-2xl font-bold">Detail Stok Opname #{details.opname_number}</h1>
                </div>
                <div className="flex items-center gap-2">
                    <button className="bg-gray-200 px-4 py-2 rounded-lg flex items-center gap-2"><Printer size={18} /> Cetak Lembar Hitung</button>
                    {!isCompleted && (
                        <button onClick={handleComplete} disabled={isCompleting || isSaving} className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 disabled:bg-gray-400">
                             {isCompleting ? <Loader2 className="animate-spin" /> : <CheckCircle size={18} />} Selesaikan Opname
                        </button>
                    )}
                </div>
            </div>
            {/* Detail Info */}
            <div className="p-6 bg-white dark:bg-gray-800/50 rounded-lg border mb-6">
                 <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    <InfoItem label="Status" value={<StatusBadge status={details.status} />} />
                    <InfoItem label="Outlet" value={details.outlet.name} />
                    <InfoItem label="Dibuat Oleh" value={details.created_by || 'Sistem'} />
                    <InfoItem label="Tgl. Selesai" value={formatDate(details.completed_at)} />
                </div>
            </div>

            {/* Daftar Item */}
             <div className="border rounded-lg w-full bg-white dark:bg-gray-800/50">
                <table className="w-full text-sm">
                    <thead><tr className="border-b">
                        <th className="p-4 text-left font-medium">Produk</th>
                        <th className="p-4 text-right font-medium">Jml. Sistem</th>
                        <th className="p-4 text-right font-medium">Jml. Fisik</th>
                        <th className="p-4 text-right font-medium">Selisih</th>
                    </tr></thead>
                    <tbody>
                        {details.items.map(item => (
                            <tr key={item.id} className="border-b">
                                <td className="p-4 font-semibold">{item.name}<p className="text-xs text-gray-500">{item.sku}</p></td>
                                <td className="p-4 text-right font-mono">{item.system_quantity}</td>
                                <td className="p-4 text-right">
                                    <input 
                                        type="number" 
                                        defaultValue={item.physical_quantity ?? ''}
                                        onChange={e => handleQuantityChange(item.id, e.target.value)}
                                        placeholder="-"
                                        disabled={isCompleted}
                                        className="w-24 p-1 border rounded text-center bg-transparent disabled:bg-gray-100"
                                    />
                                </td>
                                <td className={`p-4 text-right font-mono font-bold ${item.difference === 0 ? '' : item.difference && item.difference > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    {item.difference !== null ? (item.difference > 0 ? '+' : '') + item.difference : '-'}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
             </div>
             <div className="text-right text-xs mt-2 text-gray-500 italic">
                {isSaving && "Menyimpan perubahan..."}
             </div>
        </div>
    );
}
