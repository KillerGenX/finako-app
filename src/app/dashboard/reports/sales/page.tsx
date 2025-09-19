// src/app/dashboard/reports/sales/page.tsx
import { SalesReportClient } from './SalesReportClient';
import { getSalesAndProfitReport, getOutletsForFilter } from './actions';
import { subDays, startOfDay, endOfDay } from 'date-fns';

export default async function SalesReportPage({ searchParams }: { 
    searchParams: { from?: string, to?: string, outletId?: string } 
}) {
    // Tentukan rentang tanggal default (7 hari terakhir)
    const toDate = searchParams.to ? new Date(searchParams.to) : new Date();
    const fromDate = searchParams.from ? new Date(searchParams.from) : subDays(toDate, 6);
    
    // Pastikan tanggal mencakup keseluruhan hari
    const startDate = startOfDay(fromDate);
    const endDate = endOfDay(toDate);

    // Ambil outletId dari URL
    const outletId = searchParams.outletId || null;

    // Panggil kedua server action secara bersamaan untuk efisiensi
    const [initialReportData, outlets] = await Promise.all([
        getSalesAndProfitReport(startDate, endDate, outletId),
        getOutletsForFilter()
    ]);

    return (
        <SalesReportClient 
            initialData={initialReportData} 
            outlets={outlets}
            defaultStartDate={startDate}
            defaultEndDate={endDate}
        />
    );
}
