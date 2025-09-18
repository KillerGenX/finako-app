"use server";

import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { revalidatePath } from 'next/cache';

// --- Tipe Data ---
export type InitialStockInput = {
    outlet_id: string;
    quantity: number;
};

// --- Helper ---
async function getSupabaseAndUser() {
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
    return { supabase, user, organization_id: member.organization_id };
}

// --- Server Actions ---
export async function getInventoryLedgerDetails(variantId: string) {
    try {
        const { supabase, organization_id } = await getSupabaseAndUser();
        const { data, error } = await supabase.rpc('get_inventory_ledger_details', {
            p_variant_id: variantId,
            p_organization_id: organization_id,
        });
        if (error) throw new Error(error.message);
        return data;
    } catch (e: any) {
        console.error("Error fetching ledger details:", e);
        return null;
    }
}

export async function setInitialStock(variantId: string, initialStocks: InitialStockInput[]): Promise<{ success: boolean; message?: string }> {
    try {
        const { supabase, organization_id } = await getSupabaseAndUser();
        const { error } = await supabase.rpc('set_initial_stock', {
            p_organization_id: organization_id,
            p_variant_id: variantId,
            p_initial_stocks: initialStocks
        });
        if (error) throw new Error(error.message);
    } catch (e: any) {
        return { success: false, message: e.message };
    }

    revalidatePath(`/dashboard/inventory/${variantId}`);
    return { success: true };
}
