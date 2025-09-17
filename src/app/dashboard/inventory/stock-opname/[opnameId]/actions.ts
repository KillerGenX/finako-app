"use server";

import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { revalidatePath } from 'next/cache';

// --- Tipe Data ---
export type StockOpnameDetails = {
    id: string;
    opname_number: string;
    status: 'counting' | 'completed' | 'cancelled';
    notes: string | null;
    created_at: string;
    completed_at: string | null;
    outlet: { id: string; name: string; };
    created_by: string | null;
    items: {
        id: string;
        system_quantity: number;
        physical_quantity: number | null;
        difference: number | null;
        variant_id: string;
        name: string;
        sku: string | null;
    }[];
} | null;

export type OpnameItemUpdate = {
    id: string;
    physical_quantity: number;
};

// --- Helper ---
async function getSupabaseAndOrgId() {
    // ... (kode helper sama)
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

// --- Server Actions ---

export async function getStockOpnameDetails(opnameId: string): Promise<StockOpnameDetails> {
    try {
        const { supabase, organization_id } = await getSupabaseAndOrgId();
        const { data, error } = await supabase.rpc('get_stock_opname_details', {
            p_opname_id: opnameId,
            p_organization_id: organization_id,
        });
        if (error) throw new Error(error.message);
        return data;
    } catch (e: any) {
        console.error("Error fetching opname details:", e);
        return null;
    }
}

export async function saveOpnameItems(items: OpnameItemUpdate[]): Promise<{ success: boolean; message?: string }> {
    try {
        const { supabase } = await getSupabaseAndOrgId();
        const updates = items.map(item => 
            supabase
                .from('stock_opname_items')
                .update({ physical_quantity: item.physical_quantity })
                .eq('id', item.id)
        );
        const results = await Promise.all(updates);
        const error = results.find(res => res.error);
        if (error) throw new Error(error.error?.message);

    } catch (e: any) {
        return { success: false, message: e.message };
    }
    revalidatePath('/dashboard/inventory/stock-opname/.*', 'page');
    return { success: true };
}

export async function completeStockOpname(opnameId: string): Promise<{ success: boolean; message?: string }> {
    // Di sini kita akan membutuhkan RPC lain untuk memproses penyesuaian stok
    // Untuk saat ini, kita hanya update status
    try {
        const { supabase } = await getSupabaseAndOrgId();
        const { error } = await supabase
            .from('stock_opnames')
            .update({ status: 'completed', completed_at: new Date().toISOString() })
            .eq('id', opnameId);
        if (error) throw error;
    } catch (e: any) {
        return { success: false, message: e.message };
    }
    revalidatePath(`/dashboard/inventory/stock-opname/${opnameId}`);
    return { success: true };
}
