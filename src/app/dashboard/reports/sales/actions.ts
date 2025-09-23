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
        hour: string; // Diubah menjadi string untuk konsistensi
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


// --- Server Action untuk Ekspor Excel yang Diperbarui dan Diperbaiki ---
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
        const subHeaderFill: ExcelJS.Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0E0E0' } }; // Light Gray
        const borderStyle: Partial<ExcelJS.Borders> = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
        const currencyFormat = '"Rp "#,##0;[Red]-"Rp "#,##0';
        const numberFormat = '0';

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
            const lastColumn = String.fromCharCode(65 + columns.length - 1);
            sheet.autoFilter = `A1:${lastColumn}1`;
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
        summarySheet.addRow([]); // Spacer
        const summaryData = [
            { label: 'Pendapatan Bersih', value: reportData.summary.net_revenue, format: currencyFormat },
            { label: 'Laba Kotor', value: reportData.summary.gross_profit, format: currencyFormat },
            { label: 'Total Pajak Terkumpul', value: reportData.summary.total_tax_collected, format: currencyFormat },
            { label: 'Jumlah Transaksi', value: reportData.summary.transaction_count, format: numberFormat }
        ];
        summaryData.forEach(item => {
            const row = summarySheet.addRow([item.label, item.value]);
            row.getCell(1).font = { bold: true };
            row.getCell(2).numFmt = item.format;
        });
        summarySheet.getColumn('A').width = 25;
        summarySheet.getColumn('B').width = 20;
        
        // --- Sheet 2: Riwayat Transaksi (Diperbarui) ---
        const txSheet = workbook.addWorksheet('Detail Riwayat Transaksi');
        txSheet.columns = [
            { header: 'Item', key: 'colA', width: 30 }, { header: 'Varian', key: 'colB', width: 20 }, { header: 'Qty', key: 'colC', width: 10 },
            { header: 'Harga Satuan', key: 'colD', width: 20, style: { numFmt: currencyFormat } }, { header: 'Diskon', key: 'colE', width: 20, style: { numFmt: currencyFormat } },
            { header: 'Pajak', key: 'colF', width: 20, style: { numFmt: currencyFormat } }, { header: 'Subtotal', key: 'colG', width: 20, style: { numFmt: currencyFormat } }
        ];
        txSheet.getRow(1).eachCell(cell => { cell.fill = subHeaderFill }); // Sub-header style
        
        reportData.transaction_history.forEach(tx => {
            txSheet.addRow([]); // Spacer row
            const mainRow = txSheet.addRow([tx.transaction_number, format(new Date(tx.transaction_date), 'd MMM yyyy, HH:mm'), tx.cashier_name, tx.customer_name || 'Umum', '', '', tx.grand_total]);
            mainRow.font = { bold: true };
            txSheet.mergeCells(mainRow.number, 1, mainRow.number, 2);
            txSheet.mergeCells(mainRow.number, 3, mainRow.number, 4);
            
            tx.items.forEach(item => {
                txSheet.addRow([item.product_name, item.variant_name, item.quantity, item.unit_price, item.discount_amount, item.tax_amount, item.line_total]);
            });
        });
        
        // --- Sheet 3: Top Produk ---
        createSheet('Produk Terlaris', [
            { header: 'Produk', key: 'template_name', width: 30 }, { header: 'Varian', key: 'product_name', width: 30 },
            { header: 'Unit Terjual', key: 'total_quantity_sold', width: 15 }, { header: 'Pendapatan Bersih', key: 'net_revenue', width: 20, style: { numFmt: currencyFormat } },
            { header: 'Laba Kotor', key: 'gross_profit', width: 20, style: { numFmt: currencyFormat } },
        ], reportData.top_products);

        // --- Sheet 4: Kinerja & Lainnya (Diperbaiki) ---
        const analysisSheet = workbook.addWorksheet('Analisis Lainnya');
        
        // Kinerja Kasir
        analysisSheet.addRow(['Kinerja Kasir']).font = { bold: true, size: 14 };
        analysisSheet.addRow(['Nama Kasir', 'Jumlah Transaksi', 'Total Penjualan', 'Rata-rata/Transaksi']).font = { bold: true };
        reportData.cashier_performance.forEach(c => {
            const row = analysisSheet.addRow([c.cashier_name, c.transaction_count, c.net_revenue, c.avg_transaction_value]);
            row.getCell(3).numFmt = currencyFormat;
            row.getCell(4).numFmt = currencyFormat;
        });
        
        analysisSheet.addRow([]); // Spacer
        
        // Pelanggan Teratas
        analysisSheet.addRow(['Pelanggan Teratas']).font = { bold: true, size: 14 };
        analysisSheet.addRow(['Nama Pelanggan', 'Jumlah Transaksi', 'Total Belanja']).font = { bold: true };
        reportData.top_customers.forEach(c => {
            const row = analysisSheet.addRow([c.customer_name, c.transaction_count, c.total_spent]);
            row.getCell(3).numFmt = currencyFormat;
        });
        
        analysisSheet.addRow([]); // Spacer

        // Kategori
        analysisSheet.addRow(['Performa Kategori']).font = { bold: true, size: 14 };
        analysisSheet.addRow(['Nama Kategori', 'Total Pendapatan']).font = { bold: true };
        reportData.category_performance.forEach(c => {
            const row = analysisSheet.addRow([c.category_name, c.net_revenue]);
            row.getCell(2).numFmt = currencyFormat;
        });
        
        // Atur lebar kolom
        analysisSheet.columns.forEach(column => { column.width = 30; });


        const buffer = await workbook.xlsx.writeBuffer();
        const base64 = Buffer.from(buffer).toString('base64');

        return { success: true, data: base64 };

    } catch (e: any) {
        console.error("Excel Export Error:", e.message);
        return { success: false, message: e.message };
    }
}
