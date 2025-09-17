"use server";

import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';

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

// Tipe untuk item yang akan diterima, digunakan oleh client & server action
export type ReceivedItem = {
    po_item_id: string;
    quantity_received: number;
};


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
    // ... (kode tidak berubah)
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
    // ... (kode tidak berubah)
    try {
        const { supabase, organization_id } = await getSupabaseAndOrgId();
        const { error } = await supabase
            .from('purchase_orders')
            .update({ status: 'cancelled' })
            .eq('id', poId)
            .in('status', ['draft', 'ordered'])
            .eq('organization_id', organization_id);
        if (error) throw new Error(error.message);
    } catch (e: any) {
        return { success: false, message: e.message };
    }
    revalidatePath(`/dashboard/inventory/purchase-orders`);
    redirect('/dashboard/inventory/purchase-orders');
}

export async function orderPurchaseOrder(poId: string) {
     // ... (kode tidak berubah)
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

// Server Action BARU untuk memproses penerimaan barang
export async function receivePurchaseOrderItems(poId: string, receivedItems: ReceivedItem[]): Promise<{ success: boolean; message?: string }> {
    if (receivedItems.length === 0) {
        return { success: false, message: "Tidak ada item yang diterima." };
    }
    try {
        const { supabase, organization_id } = await getSupabaseAndOrgId();
        const { error } = await supabase.rpc('process_purchase_order_reception', {
            p_po_id: poId,
            p_organization_id: organization_id,
            p_received_items: receivedItems
        });
        if (error) throw new Error(error.message);

    } catch (e: any) {
        return { success: false, message: e.message };
    }

    revalidatePath(`/dashboard/inventory/purchase-orders/${poId}`);
    revalidatePath(`/dashboard/inventory/stock-report`); // Revalidasi laporan stok juga
    return { success: true };
}
