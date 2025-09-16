// src/app/dashboard/inventory/transfers/[transferId]/page.tsx
import { notFound } from 'next/navigation';
import { getTransferDetails } from './actions';
import { TransferDetailClient } from './TransferDetailClient';

type PageProps = {
    params: { transferId: string };
};

export default async function TransferDetailPage({ params }: PageProps) {
    const transferDetails = await getTransferDetails(params.transferId);

    if (!transferDetails) {
        notFound();
    }

    return (
        <TransferDetailClient initialDetails={transferDetails} />
    );
}
