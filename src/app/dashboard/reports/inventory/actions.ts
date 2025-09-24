// src/app/dashboard/reports/inventory/actions.ts
"use server";

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { SupabaseClient } from '@supabase/supabase-js';
import ExcelJS from 'exceljs';
import { format } from 'date-fns';

// --- Tipe Data ---
export type InventoryReportData = {
  summary: { total_inventory_value: number; active_sku_count: number; potential_loss: number; low_stock_item_count: number; };
  valuation_by_category: { category_name: string; total_value: number; }[];
  transfers: { id: string; sent_at: string; transfer_number: string; outlet_from: string; outlet_to: string; status: string; }[];
  opnames: { id: string; completed_at: string; opname_number: string; outlet_name: string; status: string; }[];
  write_offs: { id: string; created_at: string; write_off_number: string; outlet_name: string; notes: string; }[];
} | null;

export type InventoryLedgerData = {
    outlet_id: string; outlet_name: string; quantity_on_hand: number; total_value: number;
    movements: { created_at: string; movement_type: string; reference_number: string; quantity_change: number; balance: number; notes: string; }[];
}[] | null;

export type VariantSearchResult = { id: string; name: string; sku: string; };

// --- Helper ---
async function getSupabaseAndOrgId() {
    // FIX 1: Added 'await' before cookies()
    const cookieStore = await cookies();
    const supabase = createServerClient( process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, { cookies: { get: (name) => cookieStore.get(name)?.value } });
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Pengguna tidak terautentikasi.");
    const { data: member } = await supabase.from('organization_members').select('organization_id').eq('user_id', user.id).single();
    if (!member) throw new Error("Organisasi tidak ditemukan.");
    return { supabase, organization_id: member.organization_id };
}

// --- Server Actions (Existing) ---
export async function getInventoryReport(startDate: Date, endDate: Date, outletId: string | null = null): Promise<InventoryReportData> {
    const { supabase, organization_id } = await getSupabaseAndOrgId();
    const { data, error } = await supabase.rpc('get_inventory_report_data', { p_organization_id: organization_id, p_start_date: startDate.toISOString(), p_end_date: endDate.toISOString(), p_outlet_id: outletId });
    if (error) { console.error("Error fetching inventory report:", error.message); return null; }
    return data;
}
export async function searchVariantsForLedger(searchTerm: string): Promise<VariantSearchResult[]> {
    if (!searchTerm || searchTerm.length < 2) return [];
    const { supabase, organization_id } = await getSupabaseAndOrgId();
    const { data, error } = await supabase.rpc('search_variants_for_report', { p_organization_id: organization_id, p_search_term: searchTerm });
    if (error) { console.error("Error searching variants:", error.message); return []; }
    // FIX 2: Added explicit type for parameter 'v'
    return data.map((v: { id: string; name: string; sku: string | null; }) => ({ ...v, sku: v.sku || 'N/A' }));
}
export async function getInventoryLedger(variantId: string): Promise<InventoryLedgerData> {
    const { supabase, organization_id } = await getSupabaseAndOrgId();
    const { data, error } = await supabase.rpc('get_report_inventory_ledger', { p_organization_id: organization_id, p_variant_id: variantId });
    if (error) { console.error("Error fetching ledger details for report:", error.message); return null; }
    return data;
}

// --- FUNGSI EXCEL ---

const currencyFormat = '"Rp "#,##0;[Red]-"Rp "#,##0';
const numberFormat = '#,##0';

const addHeader = (sheet: ExcelJS.Worksheet, title: string, period: string, outlet: string) => {
    sheet.mergeCells('A1:E1');
    sheet.getCell('A1').value = title;
    sheet.getCell('A1').font = { size: 16, bold: true };
    sheet.getCell('A2').value = 'Periode:';
    sheet.getCell('B2').value = period;
    sheet.getCell('A3').value = 'Outlet:';
    sheet.getCell('B3').value = outlet;
    sheet.addRow([]);
};

export async function exportInventoryReportToExcel(
    reportData: InventoryReportData,
    period: string,
    outletName: string
): Promise<{ success: boolean; data?: string; message?: string }> {
    if (!reportData) return { success: false, message: "Tidak ada data untuk diekspor." };

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Finako App';

    // Sheet 1: Ringkasan
    const summarySheet = workbook.addWorksheet('Ringkasan');
    addHeader(summarySheet, 'Laporan Ringkasan Inventaris', period, outletName);
    const summaryData = [
        { label: 'Total Nilai Inventaris (HPP)', value: reportData.summary.total_inventory_value, format: currencyFormat },
        { label: 'Jumlah SKU Aktif', value: reportData.summary.active_sku_count, format: numberFormat },
        { label: 'Potensi Kerugian (Barang Rusak)', value: reportData.summary.potential_loss, format: currencyFormat },
        { label: 'Item Stok Menipis', value: reportData.summary.low_stock_item_count, format: numberFormat }
    ];
    summaryData.forEach(item => { const row = summarySheet.addRow([item.label, item.value]); row.getCell(2).numFmt = item.format; });
    summarySheet.addRow([]);
    summarySheet.addRow(['Valuasi per Kategori']).font = { bold: true };
    reportData.valuation_by_category.forEach(item => { const row = summarySheet.addRow([item.category_name, item.total_value]); row.getCell(2).numFmt = currencyFormat; });
    summarySheet.columns = [{ width: 30 }, { width: 20 }];

    // Sheet 2: Transfer Stok
    const transferSheet = workbook.addWorksheet('Transfer Stok');
    transferSheet.addRows([['No. Surat Jalan', 'Tgl Kirim', 'Outlet Asal', 'Outlet Tujuan', 'Status'], ...reportData.transfers.map(t => [t.transfer_number, t.sent_at ? format(new Date(t.sent_at), 'yyyy-MM-dd') : '', t.outlet_from, t.outlet_to, t.status])]);
    transferSheet.columns = [{ width: 25 }, { width: 15 }, { width: 20 }, { width: 20 }, { width: 15 }];

    // Sheet 3 & 4 (Opname & Writeoff)
    const opnameSheet = workbook.addWorksheet('Stok Opname');
    opnameSheet.addRows([['No. Opname', 'Tgl Selesai', 'Outlet', 'Status'], ...reportData.opnames.map(o => [o.opname_number, o.completed_at ? format(new Date(o.completed_at), 'yyyy-MM-dd') : '', o.outlet_name, o.status])]);
    opnameSheet.columns = [{ width: 25 }, { width: 15 }, { width: 20 }, { width: 15 }];

    const writeOffSheet = workbook.addWorksheet('Barang Rusak');
    writeOffSheet.addRows([['No. Dokumen', 'Tanggal', 'Outlet', 'Catatan'], ...reportData.write_offs.map(w => [w.write_off_number, format(new Date(w.created_at), 'yyyy-MM-dd'), w.outlet_name, w.notes])]);
    writeOffSheet.columns = [{ width: 25 }, { width: 15 }, { width: 20 }, { width: 30 }];


    const buffer = await workbook.xlsx.writeBuffer();
    return { success: true, data: Buffer.from(buffer).toString('base64') };
}

export async function exportLedgerToExcel(
    ledgerData: InventoryLedgerData,
    variantName: string,
    variantSku: string
): Promise<{ success: boolean; data?: string; message?: string }> {
    if (!ledgerData) return { success: false, message: "Tidak ada data untuk diekspor." };
    
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Finako App';
    const sheet = workbook.addWorksheet('Kartu Stok');

    const summary = ledgerData.reduce((acc, curr) => ({ totalStock: acc.totalStock + curr.quantity_on_hand, totalValue: acc.totalValue + curr.total_value }), { totalStock: 0, totalValue: 0 });

    addHeader(sheet, `Kartu Stok: ${variantName}`, `SKU: ${variantSku}`, `Stok Gabungan: ${summary.totalStock}`);
    sheet.getCell('D3').numFmt = currencyFormat; // Format cell nilai

    ledgerData.forEach(outlet => {
        sheet.addRow([]);
        const titleRow = sheet.addRow([`Lokasi: ${outlet.outlet_name}`, `Stok Saat Ini: ${outlet.quantity_on_hand}`, `Nilai: ${outlet.total_value}`]);
        titleRow.font = { bold: true };
        titleRow.getCell(3).numFmt = currencyFormat;

        const headerRow = sheet.addRow(['Tanggal', 'Jenis Gerakan', 'Referensi', 'Masuk/Keluar', 'Saldo Akhir']);
        headerRow.font = { italic: true };
        
        outlet.movements.forEach(m => {
            const dataRow = sheet.addRow([format(new Date(m.created_at), 'yyyy-MM-dd HH:mm'), m.movement_type, m.reference_number, m.quantity_change, m.balance]);
            dataRow.getCell(4).numFmt = numberFormat;
            dataRow.getCell(5).numFmt = numberFormat;
        });
    });

    sheet.columns = [{ width: 20 }, { width: 25 }, { width: 25 }, { width: 15 }, { width: 15 }];

    const buffer = await workbook.xlsx.writeBuffer();
    return { success: true, data: Buffer.from(buffer).toString('base64') };
}
