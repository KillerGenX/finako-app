// src/app/dashboard/reports/sales/page.tsx
import { SalesReportClient } from './SalesReportClient';
import { getSalesAndProfitReport, getOutletsForFilter } from './actions';
import { subDays, startOfDay, endOfDay } from 'date-fns';

export default async function SalesReportPage({ 
    searchParams
}: { 
    searchParams: { from?: string; to?: string; outletId?: string } 
}) {
    // PERBAIKAN FINAL DAN BENAR: Await searchParams untuk mendapatkan nilainya
    const { from, to, outletId } = await searchParams;

    // Tentukan rentang tanggal default (7 hari terakhir)
    const toDate = to ? new Date(to) : new Date();
    const fromDate = from ? new Date(from) : subDays(toDate, 6);
    
    // Pastikan tanggal mencakup keseluruhan hari
    const startDate = startOfDay(fromDate);
    const endDate = endOfDay(toDate);

    // Ambil outletId dari URL 
    const finalOutletId = outletId || null;

    // Panggil kedua server action secara bersamaan untuk efisiensi
    const [initialReportData, outlets] = await Promise.all([
        getSalesAndProfitReport(startDate, endDate, finalOutletId),
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
