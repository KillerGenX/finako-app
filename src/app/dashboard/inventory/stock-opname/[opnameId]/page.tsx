// src/app/dashboard/inventory/stock-opname/[opnameId]/page.tsx
import { notFound } from 'next/navigation';
import { getStockOpnameDetails } from './actions';
import { StockOpnameDetailClient } from './StockOpnameDetailClient';

type PageProps = {
    params: { opnameId: string };
};

export default async function StockOpnameDetailPage({ params }: PageProps) {
    const details = await getStockOpnameDetails(params.opnameId);

    if (!details) {
        notFound();
    }

    return (
        <StockOpnameDetailClient initialDetails={details} />
    );
}
