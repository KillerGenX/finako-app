// src/app/dashboard/inventory/write-offs/page.tsx
import Link from 'next/link';
import { PlusCircle } from 'lucide-react';
import { getWriteOffs } from './actions';
import { WriteOffsListClient } from './WriteOffsListClient';

export default async function WriteOffsPage() {
    const writeOffs = await getWriteOffs();

    return (
        <div className="flex flex-col w-full h-full">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold">Barang Rusak/Hilang</h1>
                    <p className="text-gray-500">Buat dan lacak Berita Acara untuk stok yang dihapus.</p>
                </div>
                <Link href="/dashboard/inventory/write-offs/new" className="bg-teal-600 text-white px-4 py-2 rounded-lg flex items-center gap-2">
                    <PlusCircle size={18} /> Buat Catatan Baru
                </Link>
            </div>
            <WriteOffsListClient writeOffs={writeOffs} />
        </div>
    );
}
