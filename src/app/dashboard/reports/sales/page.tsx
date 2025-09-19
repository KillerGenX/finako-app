// src/app/dashboard/reports/sales/page.tsx
import { SalesReportClient } from './SalesReportClient';
import { getSalesAndProfitReport } from './actions';
import { subDays, startOfDay, endOfDay } from 'date-fns';

export default async function SalesReportPage({ searchParams }: { 
    searchParams: { from?: string, to?: string } 
}) {
    // Tentukan rentang tanggal default (7 hari terakhir)
    const toDate = searchParams.to ? new Date(searchParams.to) : new Date();
    const fromDate = searchParams.from ? new Date(searchParams.from) : subDays(toDate, 6);
    
    // Pastikan tanggal mencakup keseluruhan hari
    const startDate = startOfDay(fromDate);
    const endDate = endOfDay(toDate);

    const initialReportData = await getSalesAndProfitReport(startDate, endDate);

    return (
        <SalesReportClient 
            initialData={initialReportData} 
            defaultStartDate={startDate}
            defaultEndDate={endDate}
        />
    );
}
