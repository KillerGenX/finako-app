// src/app/dashboard/outlets/[outletId]/page.tsx
import { notFound } from 'next/navigation';
import { getOutletDetails } from './actions';
import { OutletDetailClient } from './OutletDetailClient';

type PageProps = {
    params: { outletId: string };
};

export default async function OutletDetailPage({ params }: PageProps) {
    const initialData = await getOutletDetails(params.outletId);

    if (!initialData) {
        notFound();
    }

    return (
        <OutletDetailClient initialData={initialData} />
    );
}
