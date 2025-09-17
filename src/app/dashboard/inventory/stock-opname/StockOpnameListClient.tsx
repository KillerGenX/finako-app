"use client";

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { StockOpnameListItem, startNewStockOpname } from './actions';
import { PlusCircle, Loader2, X } from 'lucide-react';

type Outlet = { id: string; name: string };

// --- Komponen Modal ---
function StartOpnameModal({ outlets, onClose }: {
    outlets: Outlet[],
    onClose: () => void,
}) {
    const [selectedOutlet, setSelectedOutlet] = useState<string>(outlets[0]?.id || '');
    // PERBAIKAN: Gunakan useTransition di dalam komponen modal
    const [isStarting, startTransition] = useTransition();

    const handleStart = () => {
        startTransition(async () => {
            await startNewStockOpname(selectedOutlet);
        });
    };
    
    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex justify-center items-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-sm">
                <div className="p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold">Mulai Stok Opname Baru</h3>
                        <button onClick={onClose}><X size={20} /></button>
                    </div>
                    <div className="space-y-4">
                        <p className="text-sm text-gray-600">Pilih outlet yang akan dilakukan perhitungan stok fisik.</p>
                        <select 
                            value={selectedOutlet} 
                            onChange={e => setSelectedOutlet(e.target.value)}
                            className="w-full p-2 border rounded bg-white dark:bg-gray-800"
                        >
                            {outlets.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                        </select>
                    </div>
                </div>
                <div className="p-4 bg-gray-50 dark:bg-gray-700/50 flex justify-end gap-2 rounded-b-lg">
                    <button onClick={onClose} className="px-4 py-2 rounded bg-gray-200 dark:bg-gray-600">Batal</button>
                    <button onClick={handleStart} disabled={isStarting || !selectedOutlet} className="px-4 py-2 rounded bg-teal-600 text-white disabled:bg-gray-400 flex items-center min-w-[80px] justify-center">
                        {isStarting ? <Loader2 className="animate-spin" /> : 'Mulai'}
                    </button>
                </div>
            </div>
        </div>
    );
}


// --- Komponen Utama ---
export function StockOpnameListClient({ opnames, outlets }: {
    opnames: StockOpnameListItem[],
    outlets: Outlet[]
}) {
    const [isModalOpen, setIsModalOpen] = useState(false);

    const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });

    return (
        <>
            {isModalOpen && <StartOpnameModal outlets={outlets} onClose={() => setIsModalOpen(false)} />}

            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold">Stok Opname</h1>
                    <p className="text-gray-500">Buat dan lacak sesi perhitungan stok fisik.</p>
                </div>
                <button onClick={() => setIsModalOpen(true)} className="bg-teal-600 text-white px-4 py-2 rounded-lg flex items-center gap-2">
                    <PlusCircle size={18} /> Mulai Opname Baru
                </button>
            </div>
            
            <div className="border rounded-lg w-full bg-white dark:bg-gray-800/50">
                 <table className="w-full text-sm">
                    <thead><tr className="border-b"><th className="p-4 text-left font-medium">No. Dokumen</th><th className="p-4 text-left font-medium">Outlet</th><th className="p-4 text-left font-medium">Tanggal</th><th className="p-4 text-left font-medium">Status</th><th className="p-4 text-right font-medium">Jumlah Item</th></tr></thead>
                    <tbody>
                        {opnames.map(op => (
                            <tr key={op.id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800">
                                <td className="p-4 font-mono">
                                    <Link href={`/dashboard/inventory/stock-opname/${op.id}`} className="text-teal-600 hover:underline">
                                        {op.opname_number}
                                    </Link>
                                </td>
                                <td className="p-4">{op.outlet_name}</td>
                                <td className="p-4">{formatDate(op.created_at)}</td>
                                <td className="p-4">{op.status}</td>
                                <td className="p-4 text-right">{op.item_count}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </>
    );
}
