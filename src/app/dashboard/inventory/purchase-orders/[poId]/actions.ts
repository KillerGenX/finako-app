"use server";

import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

// --- Tipe Data ---
export type PurchaseOrderDetails = {
    id: string;
    po_number: string;
    status: 'draft' | 'ordered' | 'partially_received' | 'completed' | 'cancelled';
    notes: string | null;
    order_date: string;
    expected_delivery_date: string | null;
    created_at: string;
    supplier: { id: string; name: string; };
    outlet: { id: string; name: string; };
    created_by: string | null;
    items: {
        id: string;
        quantity: number;
        unit_cost: number;
        received_quantity: number;
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

export async function getPurchaseOrderDetails(poId: string): Promise<PurchaseOrderDetails> {
    try {
        const { supabase, organization_id } = await getSupabaseAndOrgId();
        const { data, error } = await supabase.rpc('get_purchase_order_details', {
            p_po_id: poId,
            p_organization_id: organization_id,
        });
        if (error) throw new Error(error.message);
        return data;
    } catch (e: any) {
        console.error("Error fetching PO details:", e);
        return null;
    }
}

export async function cancelPurchaseOrder(poId: string) {
    try {
        const { supabase, organization_id } = await getSupabaseAndOrgId();
        const { error } = await supabase
            .from('purchase_orders')
            .update({ status: 'cancelled' })
            .eq('id', poId)
            .in('status', ['draft', 'ordered']) // Hanya bisa membatalkan draft atau yang sudah dipesan
            .eq('organization_id', organization_id);
        if (error) throw new Error(error.message);
    } catch (e: any) {
        return { success: false, message: e.message };
    }
    revalidatePath(`/dashboard/inventory/purchase-orders`);
    redirect('/dashboard/inventory/purchase-orders');
}

// Placeholder untuk aksi berikutnya
export async function orderPurchaseOrder(poId: string) {
     try {
        const { supabase, organization_id } = await getSupabaseAndOrgId();
        const { error } = await supabase
            .from('purchase_orders')
            .update({ status: 'ordered', order_date: new Date().toISOString() })
            .eq('id', poId)
            .eq('status', 'draft')
            .eq('organization_id', organization_id);
        if (error) throw new Error(error.message);
    } catch (e: any) {
        return { success: false, message: e.message };
    }
    revalidatePath(`/dashboard/inventory/purchase-orders/${poId}`);
    return { success: true };
}
