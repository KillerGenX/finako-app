// src/app/dashboard/reports/inventory/actions.ts
"use server";

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { SupabaseClient } from '@supabase/supabase-js';

// --- Tipe Data untuk Laporan Inventaris ---
export type InventoryReportData = {
  summary: {
    total_inventory_value: number;
    active_sku_count: number;
    potential_loss: number;
    low_stock_item_count: number;
  };
  valuation_by_category: {
    category_name: string;
    total_value: number;
  }[];
  transfers: {
    id: string;
    sent_at: string;
    transfer_number: string;
    outlet_from: string;
    outlet_to: string;
    status: string;
  }[];
  opnames: {
    id: string;
    completed_at: string;
    opname_number: string;
    outlet_name: string;
    status: string;
  }[];
  write_offs: {
    id: string;
    created_at: string;
    write_off_number: string;
    outlet_name: string;
    notes: string;
  }[];
} | null;

// Tipe data baru yang sesuai dengan output RPC v2
export type InventoryLedgerData = {
    outlet_id: string;
    outlet_name: string;
    quantity_on_hand: number;
    total_value: number;
    movements: {
        created_at: string;
        movement_type: string;
        reference_number: string;
        quantity_change: number;
        balance: number;
        notes: string;
    }[];
}[] | null; // Ini sekarang adalah sebuah array


export type VariantSearchResult = {
  id: string;
  name: string;
  sku: string;
};

// --- Helper Koneksi Supabase ---
async function getSupabaseAndOrgId() {
    const cookieStore = cookies();
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

// --- Server Actions ---

export async function getInventoryReport(
    startDate: Date, 
    endDate: Date,
    outletId: string | null = null
): Promise<InventoryReportData> {
    try {
        const { supabase, organization_id } = await getSupabaseAndOrgId();
        const { data, error } = await supabase.rpc('get_inventory_report_data', {
            p_organization_id: organization_id,
            p_start_date: startDate.toISOString(),
            p_end_date: endDate.toISOString(),
            p_outlet_id: outletId
        });

        if (error) throw new Error(`Database error: ${error.message}`);
        return data;
    } catch (e: any) {
        console.error("Error fetching inventory report:", e.message);
        return null;
    }
}

export async function searchVariantsForLedger(searchTerm: string): Promise<VariantSearchResult[]> {
    if (!searchTerm || searchTerm.length < 2) return [];
    try {
        const { supabase, organization_id } = await getSupabaseAndOrgId();
        const { data, error } = await supabase.rpc('search_variants_for_report', {
            p_organization_id: organization_id,
            p_search_term: searchTerm
        });
        
        if (error) throw new Error(`Database error: ${error.message}`);
        return data.map(v => ({ ...v, sku: v.sku || 'N/A' }));
    } catch (e: any) {
        console.error("Error searching variants:", e.message);
        return [];
    }
}

export async function getInventoryLedger(variantId: string): Promise<InventoryLedgerData> {
    try {
        const { supabase, organization_id } = await getSupabaseAndOrgId();
        const { data, error } = await supabase.rpc('get_report_inventory_ledger', {
            p_organization_id: organization_id,
            p_variant_id: variantId
        });
        if (error) throw new Error(`Database error: ${error.message}`);
        return data;
    } catch (e: any) {
        console.error("Error fetching ledger details for report:", e);
        return null;
    }
}
