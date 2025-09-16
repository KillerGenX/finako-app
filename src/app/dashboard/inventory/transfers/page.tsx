// src/app/dashboard/inventory/transfers/page.tsx
import Link from 'next/link';
import { PlusCircle } from 'lucide-react';
import { getStockTransfers } from './actions';
import { TransfersListClient } from './TransfersListClient';

export default async function StockTransfersPage() {
    const transfers = await getStockTransfers();

    return (
        <div className="flex flex-col w-full h-full">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold">Transfer Stok</h1>
                    <p className="text-gray-500">Buat dan lacak surat jalan untuk perpindahan stok antar lokasi.</p>
                </div>
                <Link href="/dashboard/inventory/transfers/new" className="bg-teal-600 text-white px-4 py-2 rounded-lg flex items-center gap-2">
                    <PlusCircle size={18} /> Buat Transfer Baru
                </Link>
            </div>
            <TransfersListClient transfers={transfers} />
        </div>
    );
}
