// src/app/dashboard/inventory/write-offs/[writeOffId]/page.tsx
import { notFound } from 'next/navigation';
import { getWriteOffDetails } from './actions';
import { WriteOffDetailClient } from './WriteOffDetailClient';

type PageProps = {
    params: { writeOffId: string };
};

export default async function WriteOffDetailPage({ params }: PageProps) {
    const details = await getWriteOffDetails(params.writeOffId);

    if (!details) {
        notFound();
    }

    return (
        <WriteOffDetailClient details={details} />
    );
}
