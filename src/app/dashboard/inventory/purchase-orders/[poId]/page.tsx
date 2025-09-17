// src/app/dashboard/inventory/purchase-orders/[poId]/page.tsx
import { notFound } from 'next/navigation';
import { getPurchaseOrderDetails } from './actions';
import { PODetailClient } from './PODetailClient';

type PageProps = {
    params: { poId: string };
};

export default async function PurchaseOrderDetailPage({ params }: PageProps) {
    const details = await getPurchaseOrderDetails(params.poId);

    if (!details) {
        notFound();
    }

    return (
        <PODetailClient initialDetails={details} />
    );
}
