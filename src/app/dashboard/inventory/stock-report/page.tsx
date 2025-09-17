// src/app/dashboard/inventory/stock-report/page.tsx
import { getStockReport } from './actions';
import { StockReportClient } from './StockReportClient';

export default async function StockReportPage() {
    const initialData = await getStockReport('');

    return (
        <div className="flex flex-col w-full h-full">
             <div className="mb-6">
                <h1 className="text-2xl font-bold">Laporan Stok</h1>
                <p className="text-gray-500">Lihat gambaran besar jumlah stok di semua produk dan outlet Anda.</p>
            </div>
            <StockReportClient initialData={initialData} />
        </div>
    );
}
