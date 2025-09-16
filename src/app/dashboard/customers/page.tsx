// src/app/dashboard/customers/page.tsx
import { CustomersClient } from './CustomersClient';
import { getCustomers } from './actions';
import { createCustomer } from '../pos/actions'; // Kita gunakan ulang createCustomer dari POS

export default async function CustomersPage() {
    const { data: customers, error } = await getCustomers('');
    
    if (error) {
        return <p className="p-4 text-red-500">Error: {error}</p>;
    }

    return (
        <div className="flex flex-col w-full h-full">
            <h1 className="text-2xl font-bold mb-6">Manajemen Pelanggan</h1>
            <CustomersClient 
                initialCustomers={customers || []}
                serverActions={{ createCustomer, getCustomers }}
            />
        </div>
    );
}
