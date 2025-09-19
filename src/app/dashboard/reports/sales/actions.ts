"use server";
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import ExcelJS from 'exceljs';
import { format } from 'date-fns';

// --- Tipe Data untuk Laporan ---
export type SalesReportData = {
    summary: {
        gross_revenue: number;
        total_discounts: number;
        net_revenue: number;
        total_cogs: number;
        gross_profit: number;
        gross_margin: number;
        total_tax_collected: number;
    };
    top_products: {
        product_name: string;
        sku: string | null;
        total_quantity_sold: number;
        net_revenue: number;
        gross_profit: number;
    }[];
    daily_trend: {
        date: string;
        net_revenue: number;
        gross_profit: number;
    }[];
} | null;

// (Helper tidak berubah)
async function getSupabaseAndOrgId() {
    const cookieStore = await cookies();
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { cookies: { get: (name) => cookieStore.get(name)?.value } }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Pengguna tidak terautentikasi.");

    const { data: member } = await supabase.from('organization_members').select('organization_id').eq('user_id', user.id).single();
    if (!member) throw new Error("Organisasi tidak ditemukan.");

    return { supabase, organization_id: member.organization_id };
}


export async function getSalesAndProfitReport(
    startDate: Date, 
    endDate: Date,
    outletId: string | null = null
): Promise<SalesReportData> {
    try {
        const { supabase, organization_id } = await getSupabaseAndOrgId();
        
        const { data, error } = await supabase.rpc('get_advanced_sales_and_profit_report', {
            p_organization_id: organization_id,
            p_start_date: startDate.toISOString(),
            p_end_date: endDate.toISOString(),
            p_outlet_id: outletId
        });

        if (error) throw new Error(error.message);
        
        return data;

    } catch (e: any) {
        console.error("Error fetching sales report:", e.message);
        return null;
    }
}


export async function getOutletsForFilter() {
    try {
        const { supabase, organization_id } = await getSupabaseAndOrgId();
        const { data, error } = await supabase
            .from('outlets')
            .select('id, name')
            .eq('organization_id', organization_id)
            .order('name');
        
        if (error) throw new Error(error.message);
        return data;
    } catch (e: any) {
        console.error("Error fetching outlets:", e.message);
        return [];
    }
}


// --- Server Action untuk Ekspor Excel dengan STYLING ---
export async function exportSalesReportToExcel(
    startDate: Date, 
    endDate: Date,
    outletId: string | null = null,
    outletName: string = 'Semua Outlet'
): Promise<{ success: boolean; data?: string; message?: string }> {
    try {
        const reportData = await getSalesAndProfitReport(startDate, endDate, outletId);
        if (!reportData) {
            throw new Error("Tidak ada data untuk diekspor.");
        }

        const workbook = new ExcelJS.Workbook();
        workbook.creator = 'Finako App';
        workbook.created = new Date();

        // --- Style Definitions ---
        const headerFill: ExcelJS.Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2D3748' } }; // Dark Gray
        const headerFont: Partial<ExcelJS.Font> = { color: { argb: 'FFFFFFFF' }, bold: true };
        const borderStyle: Partial<ExcelJS.Borders> = {
            top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' }
        };

        // --- Sheet 1: Ringkasan Laporan ---
        const summarySheet = workbook.addWorksheet('Ringkasan Laporan');
        summarySheet.mergeCells('A1:B1');
        summarySheet.getCell('A1').value = 'Laporan Penjualan & Laba';
        summarySheet.getCell('A1').font = { size: 16, bold: true };
        
        summarySheet.getCell('A2').value = 'Periode:';
        summarySheet.getCell('B2').value = `${format(startDate, 'd MMM yyyy')} - ${format(endDate, 'd MMM yyyy')}`;
        summarySheet.getCell('A3').value = 'Outlet:';
        summarySheet.getCell('B3').value = outletName;
        
        summarySheet.getCell('A5').value = 'Ringkasan Keuangan';
        summarySheet.getCell('A5').font = { bold: true };

        const summaryData = [
            ['Pendapatan Bersih (Setelah Diskon)', reportData.summary.net_revenue],
            ['Total HPP (Modal)', reportData.summary.total_cogs],
            ['Laba Kotor', reportData.summary.gross_profit],
            ['Margin Laba', reportData.summary.gross_margin / 100],
            ['Pajak Terkumpul (Untuk Disetor)', reportData.summary.total_tax_collected]
        ];
        const addedRows = summarySheet.addRows(summaryData);
        addedRows.forEach(row => {
            row.getCell(1).border = borderStyle;
            row.getCell(2).border = borderStyle;
        });
        
        summarySheet.getCell('A8').font = { bold: true }; // Laba kotor
        summarySheet.getColumn('A').width = 35;
        summarySheet.getColumn('B').width = 20;
        summarySheet.getColumn('B').alignment = { horizontal: 'right' };
        summarySheet.getColumn('B').numFmt = '"Rp "#,##0;[Red]-"Rp "#,##0';
        summarySheet.getCell('B9').numFmt = '0.00%';

        // --- Sheet 2: Produk Paling Menguntungkan ---
        const productsSheet = workbook.addWorksheet('Produk Paling Menguntungkan');
        productsSheet.columns = [
            { header: 'Produk', key: 'product_name', width: 40 },
            { header: 'SKU', key: 'sku', width: 20 },
            { header: 'Unit Terjual', key: 'total_quantity_sold', width: 15 },
            { header: 'Pendapatan Bersih', key: 'net_revenue', width: 25 },
            { header: 'Laba Kotor', key: 'gross_profit', width: 25 },
        ];
        
        productsSheet.getRow(1).eachCell(cell => {
            cell.fill = headerFill;
            cell.font = headerFont;
            cell.border = borderStyle;
        });
        
        productsSheet.addRows(reportData.top_products);
        productsSheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
            if (rowNumber > 1) { // Skip header
                row.eachCell(cell => { cell.border = borderStyle; });
            }
        });
        
        productsSheet.getColumn('C').alignment = { horizontal: 'right' };
        productsSheet.getColumn('D').numFmt = '"Rp "#,##0';
        productsSheet.getColumn('D').alignment = { horizontal: 'right' };
        productsSheet.getColumn('E').numFmt = '"Rp "#,##0';
        productsSheet.getColumn('E').alignment = { horizontal: 'right' };
        productsSheet.views = [{ state: 'frozen', ySplit: 1 }];
        productsSheet.autoFilter = 'A1:E1';

        // --- Sheet 3: Data Tren Harian ---
        const trendSheet = workbook.addWorksheet('Data Tren Harian');
        trendSheet.columns = [
            { header: 'Tanggal', key: 'date', width: 20 },
            { header: 'Pendapatan Bersih', key: 'net_revenue', width: 25 },
            { header: 'Laba Kotor', key: 'gross_profit', width: 25 },
        ];
        
        trendSheet.getRow(1).eachCell(cell => {
            cell.fill = headerFill;
            cell.font = headerFont;
            cell.border = borderStyle;
        });

        const trendData = reportData.daily_trend.map(d => ({ ...d, date: new Date(d.date) }));
        trendSheet.addRows(trendData);
        trendSheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
            if (rowNumber > 1) { // Skip header
                row.eachCell(cell => { cell.border = borderStyle; });
            }
        });

        trendSheet.getColumn('A').numFmt = 'd mmmm yyyy';
        trendSheet.getColumn('B').numFmt = '"Rp "#,##0';
        trendSheet.getColumn('B').alignment = { horizontal: 'right' };
        trendSheet.getColumn('C').numFmt = '"Rp "#,##0';
        trendSheet.getColumn('C').alignment = { horizontal: 'right' };
        trendSheet.views = [{ state: 'frozen', ySplit: 1 }];
        trendSheet.autoFilter = 'A1:C1';

        const buffer = await workbook.xlsx.writeBuffer();
        const base64 = Buffer.from(buffer).toString('base64');

        return { success: true, data: base64 };

    } catch (e: any) {
        console.error("Excel Export Error:", e.message);
        return { success: false, message: e.message };
    }
}
