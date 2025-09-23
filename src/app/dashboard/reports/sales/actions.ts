"use server";
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import ExcelJS from 'exceljs';
import { format } from 'date-fns';

// --- Tipe Data Baru yang Komprehensif ---
export type ComprehensiveReportData = {
    summary: {
        net_revenue: number;
        gross_profit: number;
        total_tax_collected: number;
        transaction_count: number;
    };
    daily_trend: {
        date: string;
        net_revenue: number;
        gross_profit: number;
    }[];
    top_products: {
        product_name: string;
        template_name: string;
        total_quantity_sold: number;
        net_revenue: number;
        gross_profit: number;
    }[];
    category_performance: {
        category_name: string;
        net_revenue: number;
    }[];
    cashier_performance: {
        cashier_name: string;
        transaction_count: number;
        net_revenue: number;
        avg_transaction_value: number;
    }[];
    payment_method_summary: {
        payment_method: string;
        total_amount: number;
    }[];
    top_customers: {
        customer_name: string;
        transaction_count: number;
        total_spent: number;
    }[];
    hourly_sales_trend: {
        hour: number;
        transaction_count: number;
    }[];
    transaction_history: {
        id: string;
        transaction_number: string;
        transaction_date: string;
        cashier_name: string;
        customer_name: string | null;
        grand_total: number;
        status: string;
        items: {
            product_name: string;
            variant_name: string;
            quantity: number;
            unit_price: number;
            discount_amount: number;
            tax_amount: number;
            line_total: number;
        }[];
    }[];
} | null;


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

// --- Server Action Baru untuk Laporan Komprehensif ---
export async function getComprehensiveSalesAnalysis(
    startDate: Date, 
    endDate: Date,
    outletId: string | null = null
): Promise<ComprehensiveReportData> {
    try {
        const { supabase, organization_id } = await getSupabaseAndOrgId();
        
        const { data, error } = await supabase.rpc('get_comprehensive_sales_analysis', {
            p_organization_id: organization_id,
            p_start_date: startDate.toISOString(),
            p_end_date: endDate.toISOString(),
            p_outlet_id: outletId
        });

        if (error) {
            console.error("Supabase RPC Error:", error);
            throw new Error(error.message);
        }
        
        return data;

    } catch (e: any) {
        console.error("Error fetching comprehensive sales report:", e.message);
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


// --- Server Action untuk Ekspor Excel yang Diperbarui ---
export async function exportComprehensiveReportToExcel(
    startDate: Date, 
    endDate: Date,
    outletId: string | null = null,
    outletName: string = 'Semua Outlet'
): Promise<{ success: boolean; data?: string; message?: string }> {
    try {
        const reportData = await getComprehensiveSalesAnalysis(startDate, endDate, outletId);
        if (!reportData) {
            throw new Error("Tidak ada data untuk diekspor.");
        }

        const workbook = new ExcelJS.Workbook();
        workbook.creator = 'Finako App';
        workbook.created = new Date();

        // --- Style Definitions ---
        const headerFill: ExcelJS.Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0D9488' } }; // Teal
        const headerFont: Partial<ExcelJS.Font> = { color: { argb: 'FFFFFFFF' }, bold: true };
        const borderStyle: Partial<ExcelJS.Borders> = {
            top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' }
        };
        const currencyFormat = '"Rp "#,##0;[Red]-"Rp "#,##0';

        // --- Helper Function for Sheets ---
        const createSheet = (name: string, columns: Partial<ExcelJS.Column>[], data: any[]) => {
            const sheet = workbook.addWorksheet(name);
            sheet.columns = columns;
            sheet.getRow(1).eachCell(cell => {
                cell.fill = headerFill;
                cell.font = headerFont;
                cell.border = borderStyle;
            });
            sheet.addRows(data);
             sheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
                if (rowNumber > 1) { 
                    row.eachCell(cell => { cell.border = borderStyle; });
                }
            });
            sheet.views = [{ state: 'frozen', ySplit: 1 }];
            sheet.autoFilter = {
                from: { row: 1, column: 1 },
                to: { row: 1, column: columns.length }
            };
            return sheet;
        };

        // --- Sheet 1: Ringkasan ---
        const summarySheet = workbook.addWorksheet('Ringkasan');
        summarySheet.mergeCells('A1:B1');
        summarySheet.getCell('A1').value = 'Ringkasan Laporan Penjualan';
        summarySheet.getCell('A1').font = { size: 16, bold: true };
        summarySheet.getCell('A2').value = 'Periode:';
        summarySheet.getCell('B2').value = `${format(startDate, 'd MMM yyyy')} - ${format(endDate, 'd MMM yyyy')}`;
        summarySheet.getCell('A3').value = 'Outlet:';
        summarySheet.getCell('B3').value = outletName;
        const summaryData = [
            ['Pendapatan Bersih', reportData.summary.net_revenue],
            ['Laba Kotor', reportData.summary.gross_profit],
            ['Total Pajak Terkumpul', reportData.summary.total_tax_collected],
            ['Jumlah Transaksi', reportData.summary.transaction_count]
        ];
        summarySheet.addRows(summaryData);
        summarySheet.getColumn('A').width = 25;
        summarySheet.getColumn('B').width = 20;
        summarySheet.getColumn('B').numFmt = currencyFormat;

        // --- Sheet 2: Riwayat Transaksi ---
        createSheet('Riwayat Transaksi', [
            { header: 'No. Transaksi', key: 'transaction_number', width: 25 },
            { header: 'Tanggal', key: 'transaction_date', width: 25 },
            { header: 'Kasir', key: 'cashier_name', width: 25 },
            { header: 'Pelanggan', key: 'customer_name', width: 25 },
            { header: 'Total', key: 'grand_total', width: 20, style: { numFmt: currencyFormat } },
        ], reportData.transaction_history.map(t => ({...t, transaction_date: new Date(t.transaction_date)})) );

        // --- Sheet 3: Top Produk ---
        createSheet('Produk Terlaris', [
            { header: 'Produk', key: 'template_name', width: 30 },
            { header: 'Varian', key: 'product_name', width: 30 },
            { header: 'Unit Terjual', key: 'total_quantity_sold', width: 15 },
            { header: 'Pendapatan Bersih', key: 'net_revenue', width: 20, style: { numFmt: currencyFormat } },
            { header: 'Laba Kotor', key: 'gross_profit', width: 20, style: { numFmt: currencyFormat } },
        ], reportData.top_products);

        // --- Sheet 4: Kinerja Kasir ---
         createSheet('Kinerja Kasir', [
            { header: 'Nama Kasir', key: 'cashier_name', width: 30 },
            { header: 'Jumlah Transaksi', key: 'transaction_count', width: 20 },
            { header: 'Total Penjualan', key: 'net_revenue', width: 25, style: { numFmt: currencyFormat } },
            { header: 'Rata-rata/Transaksi', key: 'avg_transaction_value', width: 25, style: { numFmt: currencyFormat } },
        ], reportData.cashier_performance);

        // --- Sheet 5: Kategori & Pelanggan ---
        const catCustSheet = workbook.addWorksheet('Kategori & Pelanggan');
        catCustSheet.addRows([{col1: 'Performa Kategori'}]);
        catCustSheet.getRow(1).font = { bold: true };
        catCustSheet.addRows(reportData.category_performance.map(c => ({col1: c.category_name, col2: c.net_revenue})));
        catCustSheet.getColumn('A').width = 30;
        catCustSheet.getColumn('B').width = 20;
        catCustSheet.getColumn('B').numFmt = currencyFormat;
        catCustSheet.addRows([{col1: ''}]); // Spacer
        catCustSheet.addRows([{col1: 'Pelanggan Teratas'}]);
        catCustSheet.getRow(reportData.category_performance.length + 3).font = { bold: true };
        catCustSheet.addRows(reportData.top_customers.map(c => ({col1: c.customer_name, col2: c.total_spent})));

        const buffer = await workbook.xlsx.writeBuffer();
        const base64 = Buffer.from(buffer).toString('base64');

        return { success: true, data: base64 };

    } catch (e: any) {
        console.error("Excel Export Error:", e.message);
        return { success: false, message: e.message };
    }
}
