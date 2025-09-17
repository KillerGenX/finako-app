// src/app/dashboard/suppliers/page.tsx
import { getSuppliers } from './actions';
import { SuppliersClient } from './SuppliersClient';

export default async function SuppliersPage() {
    const suppliers = await getSuppliers('');

    return (
        <div className="flex flex-col w-full h-full">
            <div className="mb-6">
                <h1 className="text-2xl font-bold">Pemasok (Supplier)</h1>
                <p className="text-gray-500">Kelola semua pemasok barang dan jasa untuk bisnis Anda.</p>
            </div>
            <SuppliersClient initialSuppliers={suppliers} />
        </div>
    );
}
