// src/app/dashboard/inventory/purchase-orders/page.tsx
import Link from 'next/link';
import { PlusCircle } from 'lucide-react';
import { getPurchaseOrders } from './actions';
import { PurchaseOrdersListClient } from './PurchaseOrdersListClient';

export default async function PurchaseOrdersPage() {
    const purchaseOrders = await getPurchaseOrders();

    return (
        <div className="flex flex-col w-full h-full">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold">Pesanan Pembelian (PO)</h1>
                    <p className="text-gray-500">Buat dan lacak pesanan pembelian ke pemasok Anda.</p>
                </div>
                <Link href="/dashboard/inventory/purchase-orders/new" className="bg-teal-600 text-white px-4 py-2 rounded-lg flex items-center gap-2">
                    <PlusCircle size={18} /> Buat PO Baru
                </Link>
            </div>
            <PurchaseOrdersListClient purchaseOrders={purchaseOrders} />
        </div>
    );
}
