"use server";

import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

// --- Tipe Data ---
export type StockTransferDetails = {
    id: string;
    transfer_number: string;
    status: 'draft' | 'sent' | 'received' | 'cancelled';
    notes: string | null;
    created_at: string;
    sent_at: string | null;
    received_at: string | null;
    outlet_from: { id: string; name: string; };
    outlet_to: { id: string; name: string; };
    created_by: string | null;
    items: {
        id: string;
        quantity: number;
        variant_id: string;
        name: string;
        sku: string | null;
    }[];
} | null;

// --- Helper ---
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


// --- Server Actions ---

export async function getTransferDetails(transferId: string): Promise<StockTransferDetails> {
    try {
        const { supabase, organization_id } = await getSupabaseAndOrgId();
        const { data, error } = await supabase.rpc('get_stock_transfer_details', {
            p_transfer_id: transferId,
            p_organization_id: organization_id,
        });
        if (error) throw new Error(error.message);
        return data;
    } catch (e: any) {
        console.error("Error fetching transfer details:", e);
        return null;
    }
}

export async function sendStockTransfer(transferId: string): Promise<{ success: boolean; message?: string }> {
    try {
        const { supabase, organization_id } = await getSupabaseAndOrgId();
        const { error } = await supabase.rpc('process_stock_transfer_sending', {
            p_transfer_id: transferId,
            p_organization_id: organization_id
        });
        if (error) throw new Error(error.message);
    } catch (e: any) {
        return { success: false, message: e.message };
    }
    revalidatePath(`/dashboard/inventory/transfers/${transferId}`);
    return { success: true };
}

export async function receiveStockTransfer(transferId: string): Promise<{ success: boolean; message?: string }> {
    try {
        const { supabase, organization_id } = await getSupabaseAndOrgId();
        const { error } = await supabase.rpc('process_stock_transfer_reception', {
            p_transfer_id: transferId,
            p_organization_id: organization_id
        });
        if (error) throw new Error(error.message);
    } catch (e: any) {
        return { success: false, message: e.message };
    }
    revalidatePath(`/dashboard/inventory/transfers/${transferId}`);
    return { success: true };
}


export async function cancelStockTransfer(transferId: string) {
    try {
        const { supabase, organization_id } = await getSupabaseAndOrgId();
        const { error } = await supabase
            .from('stock_transfers')
            .update({ status: 'cancelled' })
            .eq('id', transferId)
            .eq('status', 'draft')
            .eq('organization_id', organization_id);
        if (error) throw new Error(error.message);
    } catch (e: any) {
        return { success: false, message: e.message };
    }
    revalidatePath(`/dashboard/inventory/transfers`);
    redirect('/dashboard/inventory/transfers');
}
