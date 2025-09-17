"use server";

import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';

// ... (Skema dan tipe data lainnya tidak berubah)
type TransferItem = {
    variant_id: string;
    quantity: number;
};
const CreateTransferSchema = z.object({
    outlet_from_id: z.string().uuid("Outlet asal harus dipilih."),
    outlet_to_id: z.string().uuid("Outlet tujuan harus dipilih."),
    notes: z.string().optional(),
    items: z.array(z.object({
        variant_id: z.string().uuid(),
        quantity: z.coerce.number().positive("Jumlah harus lebih dari 0.")
    })).min(1, "Minimal harus ada satu produk untuk ditransfer."),
}).refine(data => data.outlet_from_id !== data.outlet_to_id, {
    message: "Outlet asal dan tujuan tidak boleh sama.",
    path: ["outlet_to_id"],
});
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


// Server Action untuk mencari produk varian - DIPERBAIKI DENGAN RPC DEDIKASI
export async function searchProductVariants(query: string, outletId: string | null) {
    if (query.length < 2 || !outletId) return [];
    
    try {
        const { supabase, organization_id } = await getSupabaseAndUser();

        // Panggil RPC baru yang dirancang khusus untuk tugas ini
        const { data, error } = await supabase.rpc('search_variants_for_transfer', {
            p_organization_id: organization_id,
            p_outlet_id: outletId,
            p_search_query: query
        });

        if (error) {
            console.error("RPC search_variants_for_transfer Error:", error);
            return [];
        }
    
        return data;

    } catch (e: any) {
        console.error("Server Action Error (searchProductVariants):", e.message);
        return [];
    }
}


// Server Action utama untuk membuat draft transfer
export async function createTransferAction(formData: FormData) {
    // ... (kode tidak berubah)
    const itemsJSON = formData.get('items') as string;
    const items = JSON.parse(itemsJSON);

    const validatedFields = CreateTransferSchema.safeParse({
        outlet_from_id: formData.get('outlet_from_id'),
        outlet_to_id: formData.get('outlet_to_id'),
        notes: formData.get('notes'),
        items: items,
    });
    
    if (!validatedFields.success) {
        console.error('Validation Errors:', validatedFields.error.flatten().fieldErrors);
        return { success: false, message: "Validasi gagal.", errors: validatedFields.error.flatten().fieldErrors };
    }
    
    let newTransferId: string | null = null;
    try {
        const { supabase, user, organization_id } = await getSupabaseAndUser();
        const { outlet_from_id, outlet_to_id, notes, items } = validatedFields.data;

        const { data, error } = await supabase.rpc('create_stock_transfer_draft', {
            p_organization_id: organization_id,
            p_outlet_from_id: outlet_from_id,
            p_outlet_to_id: outlet_to_id,
            p_created_by: user.id,
            p_notes: notes,
            p_items: items.map(item => ({
                variant_id: item.variant_id,
                quantity: item.quantity
            }))
        });
        
        if (error) throw new Error(error.message);
        newTransferId = data;

    } catch (e: any) {
        return { success: false, message: e.message, errors: null };
    }

    revalidatePath('/dashboard/inventory/transfers');
    if (newTransferId) {
        redirect(`/dashboard/inventory/transfers/${newTransferId}`);
    }
    return { success: true };
}
