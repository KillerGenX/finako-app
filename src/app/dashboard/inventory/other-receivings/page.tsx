// src/app/dashboard/inventory/other-receivings/page.tsx
import Link from 'next/link';
import { PlusCircle } from 'lucide-react';
import { getOtherReceivings } from './actions';
import { OtherReceivingsListClient } from './OtherReceivingsListClient';

export default async function OtherReceivingsPage() {
    const receivings = await getOtherReceivings();

    return (
        <div className="flex flex-col w-full h-full">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold">Penerimaan Lainnya</h1>
                    <p className="text-gray-500">Catat dan lacak stok masuk yang tidak berasal dari Purchase Order.</p>
                </div>
                <Link href="/dashboard/inventory/other-receivings/new" className="bg-teal-600 text-white px-4 py-2 rounded-lg flex items-center gap-2">
                    <PlusCircle size={18} /> Catat Penerimaan Baru
                </Link>
            </div>
            <OtherReceivingsListClient receivings={receivings} />
        </div>
    );
}
