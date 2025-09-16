// src/app/dashboard/customers/[customerId]/page.tsx
import { notFound } from 'next/navigation';
import { getCustomerDetails } from './actions';
import { CustomerDetailClient } from './CustomerDetailClient';

type PageProps = {
    params: { customerId: string };
};

export default async function CustomerDetailPage({ params }: PageProps) {
    const initialData = await getCustomerDetails(params.customerId);

    if (!initialData) {
        notFound();
    }

    return (
        <CustomerDetailClient initialData={initialData} />
    );
}
