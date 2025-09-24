// src/app/dashboard/reports/tax/actions.ts
"use server";

import ExcelJS from 'exceljs';
import { format } from 'date-fns';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { SupabaseClient } from '@supabase/supabase-js';

// --- Tipe Data untuk Laporan Pajak ---
export type TaxReportData = {
  summary: {
    total_dpp: number;
    total_tax: number;
    transaction_count: number;
  };
  composition: {
    name: string;
    amount: number;
  }[];
  details: {
    transaction_date: string;
    transaction_number: string;
    outlet_name: string;
    variant_name: string;
    unit_price: number;
    quantity: number;
    dpp: number;
    tax_rate_name: string;
    tax_amount: number;
  }[];
} | null;

// --- Server Action untuk mengambil data laporan ---
// REVISI: Menerima Supabase client dan organization_id sebagai argumen
export async function getTaxReport(
    supabase: SupabaseClient,
    organization_id: string,
    startDate: Date, 
    endDate: Date,
    outletId: string | null = null
): Promise<TaxReportData> {
    try {
        // Panggil fungsi RPC yang telah dibuat di database
        const { data, error } = await supabase.rpc('get_tax_report_data', {
            p_organization_id: organization_id,
            p_start_date: startDate.toISOString(),
            p_end_date: endDate.toISOString(),
            p_outlet_id: outletId
        });

        if (error) throw new Error(`Database error: ${error.message}`);
        
        return data;

    } catch (e: any) {
        console.error("Error fetching tax report:", e.message);
        return null;
    }
}

// --- Server Action untuk Ekspor ke Excel ---
// REVISI: Tidak lagi memanggil getTaxReport, tapi menerima data langsung
export async function exportTaxReportToExcel(
    reportData: TaxReportData,
    startDate: Date,
    endDate: Date,
    outletName: string
): Promise<{ success: boolean; data?: string; message?: string }> {
    if (!reportData) {
        return { success: false, message: "Tidak ada data untuk diekspor." };
    }

    try {
        const workbook = new ExcelJS.Workbook();
        workbook.creator = 'Finako App';
        workbook.created = new Date();
        
        const currencyFormat = '"Rp "#,##0;[Red]-"Rp "#,##0';

        // --- Sheet 1: Rincian Pajak ---
        const sheet = workbook.addWorksheet('Rincian Pajak');

        // Header Laporan
        sheet.mergeCells('A1:E1');
        sheet.getCell('A1').value = 'Laporan Rincian Pajak';
        sheet.getCell('A1').font = { size: 16, bold: true };
        sheet.getCell('A2').value = 'Periode:';
        sheet.getCell('B2').value = `${format(startDate, 'd MMM yyyy')} - ${format(endDate, 'd MMM yyyy')}`;
        sheet.getCell('A3').value = 'Outlet:';
        sheet.getCell('B3').value = outletName;
        sheet.addRow([]); // Spasi

        // Ringkasan
        sheet.getCell('A5').value = 'Dasar Pengenaan Pajak (DPP)';
        sheet.getCell('A5').font = { bold: true };
        sheet.getCell('B5').value = reportData.summary.total_dpp;
        sheet.getCell('B5').numFmt = currencyFormat;
        
        sheet.getCell('A6').value = 'Total Pajak Terkumpul';
        sheet.getCell('A6').font = { bold: true };
        sheet.getCell('B6').value = reportData.summary.total_tax;
        sheet.getCell('B6').numFmt = currencyFormat;
        sheet.addRow([]); // Spasi

        // Header Tabel
        const headerRow = sheet.addRow([
            'Tanggal Transaksi',
            'No. Transaksi',
            'Outlet',
            'Nama Item',
            'Harga Satuan',
            'Qty',
            'DPP',
            'Tarif Pajak',
            'Jumlah Pajak'
        ]);
        headerRow.font = { bold: true };
        headerRow.eachCell(cell => {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD3D3D3' } };
            cell.border = { top: { style: 'thin' }, bottom: { style: 'thin' } };
        });

        // Isi Tabel
        reportData.details.forEach(item => {
            const row = sheet.addRow([
                format(new Date(item.transaction_date), 'yyyy-MM-dd HH:mm'),
                item.transaction_number,
                item.outlet_name,
                item.variant_name,
                item.unit_price,
                item.quantity,
                item.dpp,
                item.tax_rate_name,
                item.tax_amount
            ]);
            row.getCell(5).numFmt = currencyFormat;
            row.getCell(7).numFmt = currencyFormat;
            row.getCell(9).numFmt = currencyFormat;
        });

        // Atur lebar kolom
        sheet.columns = [
            { key: 'date', width: 20 },
            { key: 'tx_number', width: 25 },
            { key: 'outlet', width: 20 },
            { key: 'item', width: 35 },
            { key: 'price', width: 15 },
            { key: 'qty', width: 10 },
            { key: 'dpp', width: 15 },
            { key: 'tax_rate', width: 15 },
            { key: 'tax_amount', width: 15 },
        ];

        const buffer = await workbook.xlsx.writeBuffer();
        const base64 = Buffer.from(buffer).toString('base64');

        return { success: true, data: base64 };

    } catch (e: any) {
        console.error("Excel Export Error:", e.message);
        return { success: false, message: e.message };
    }
}
