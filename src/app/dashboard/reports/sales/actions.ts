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
        hour: string;
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
        if (error) throw new Error(error.message);
        return data;
    } catch (e: any) {
        console.error("Error fetching comprehensive sales report:", e.message);
        return null;
    }
}


export async function getOutletsForFilter() {
    try {
        const { supabase, organization_id } = await getSupabaseAndOrgId();
        const { data, error } = await supabase.from('outlets').select('id, name').eq('organization_id', organization_id).order('name');
        if (error) throw new Error(error.message);
        return [];
    } catch (e: any) {
        console.error("Error fetching outlets:", e.message);
        return [];
    }
}

// --- Server Action untuk Ekspor Excel (Versi Lengkap dan Final) ---
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

        const currencyFormat = '"Rp "#,##0;[Red]-"Rp "#,##0';
        const numberFormat = '#,##0';

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

        // --- Sheet 2: Detail Riwayat Transaksi ---
        const txSheet = workbook.addWorksheet('Detail Riwayat Transaksi');
        txSheet.columns = [ { width: 30 }, { width: 10 }, { width: 20 }, { width: 15 }, { width: 15 }, { width: 20 }, { width: 20 } ];
        reportData.transaction_history.forEach(tx => {
            txSheet.addRow([]);
            const mainRow = txSheet.addRow([ `${tx.transaction_number} (${tx.cashier_name})`, null, null, format(new Date(tx.transaction_date), 'd MMM yyyy, HH:mm'), null, `Pelanggan: ${tx.customer_name || 'Umum'}`, tx.grand_total ]);
            mainRow.font = { bold: true };
            mainRow.getCell(7).numFmt = currencyFormat;
            txSheet.mergeCells(`A${mainRow.number}:C${mainRow.number}`);
            txSheet.mergeCells(`D${mainRow.number}:E${mainRow.number}`);
            const subHeaderRow = txSheet.addRow([ 'Nama Item', 'Qty', 'Harga Satuan', 'Diskon', 'Pajak', 'Subtotal' ]);
            subHeaderRow.font = { italic: true, color: { argb: 'FF6c757d'} };
            
            let totalDiscount = 0;
            let totalTax = 0;
            tx.items.forEach(item => {
                totalDiscount += item.discount_amount;
                totalTax += item.tax_amount;
                const itemRow = txSheet.addRow([ item.variant_name, item.quantity, item.unit_price, item.discount_amount, item.tax_amount, item.line_total ]);
                itemRow.getCell(3).numFmt = currencyFormat;
                itemRow.getCell(4).numFmt = currencyFormat;
                itemRow.getCell(5).numFmt = currencyFormat;
                itemRow.getCell(6).numFmt = currencyFormat;
            });
            
            if (totalDiscount > 0) {
                const summaryRow = txSheet.addRow([ null, null, null, null, 'Total Diskon:', totalDiscount ]);
                summaryRow.getCell(6).numFmt = currencyFormat;
            }
            if (totalTax > 0) {
                const taxRow = txSheet.addRow([ null, null, null, null, 'Total Pajak:', totalTax ]);
                taxRow.getCell(6).numFmt = currencyFormat;
            }
        });
        
        // --- Sheet 3: Produk Terlaris (Dikembalikan) ---
        const productsSheet = workbook.addWorksheet('Produk Terlaris');
        productsSheet.columns = [
            { header: 'Produk', key: 'template_name', width: 30 }, { header: 'Varian', key: 'product_name', width: 30 },
            { header: 'Unit Terjual', key: 'total_quantity_sold', width: 15 }, { header: 'Pendapatan Bersih', key: 'net_revenue', width: 20, style: { numFmt: currencyFormat } },
            { header: 'Laba Kotor', key: 'gross_profit', width: 20, style: { numFmt: currencyFormat } },
        ];
        productsSheet.addRows(reportData.top_products);

        // --- Sheet 4: Analisis Lainnya ---
        const analysisSheet = workbook.addWorksheet('Analisis Lainnya');
        let currentRow = 1;
        
        const addSection = (title: string, headers: string[], data: (string | number)[][], formatters?: ((row: ExcelJS.Row) => void)) => {
            analysisSheet.getCell(currentRow, 1).value = title;
            analysisSheet.getCell(currentRow, 1).font = { bold: true, size: 14 };
            currentRow++;
            const headerRow = analysisSheet.getRow(currentRow);
            headers.forEach((h, i) => headerRow.getCell(i + 1).value = h);
            headerRow.font = { bold: true };
            currentRow++;
            data.forEach(item => {
                const dataRow = analysisSheet.addRow(item);
                if (formatters) formatters(dataRow);
                currentRow = dataRow.number + 1;
            });
            currentRow++;
        };

        addSection('Kinerja Kasir', ['Nama Kasir', 'Jumlah Transaksi', 'Total Penjualan'], 
            reportData.cashier_performance.map(c => [c.cashier_name, c.transaction_count, c.net_revenue]),
            (row) => { row.getCell(3).numFmt = currencyFormat; }
        );
        addSection('Pelanggan Teratas', ['Nama Pelanggan', 'Jumlah Transaksi', 'Total Belanja'], 
            reportData.top_customers.map(c => [c.customer_name, c.transaction_count, c.total_spent]),
            (row) => { row.getCell(3).numFmt = currencyFormat; }
        );
        // Perbaikan di sini: mapping data kategori secara eksplisit
        addSection('Performa Kategori', ['Nama Kategori', 'Total Pendapatan'], 
            reportData.category_performance.map(c => [c.category_name, c.net_revenue]),
            (row) => { row.getCell(2).numFmt = currencyFormat; }
        );
        
        analysisSheet.columns.forEach(column => { if(column) column.width = 30; });


        const buffer = await workbook.xlsx.writeBuffer();
        const base64 = Buffer.from(buffer).toString('base64');

        return { success: true, data: base64 };

    } catch (e: any) {
        console.error("Excel Export Error:", e.message);
        return { success: false, message: e.message };
    }
}
