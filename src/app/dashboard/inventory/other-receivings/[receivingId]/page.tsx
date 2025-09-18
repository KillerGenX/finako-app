// src/app/dashboard/inventory/other-receivings/[receivingId]/page.tsx
import { notFound } from 'next/navigation';
import { getOtherReceivingDetails } from './actions';
import { OtherReceivingDetailClient } from './OtherReceivingDetailClient';

type PageProps = {
    params: { receivingId: string };
};

export default async function OtherReceivingDetailPage({ params }: PageProps) {
    const details = await getOtherReceivingDetails(params.receivingId);

    if (!details) {
        notFound();
    }

    return (
        <OtherReceivingDetailClient details={details} />
    );
}
