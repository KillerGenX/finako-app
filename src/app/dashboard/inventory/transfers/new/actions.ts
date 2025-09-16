"use server";

import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';

// Tipe untuk item yang akan ditransfer
type TransferItem = {
    variant_id: string;
    quantity: number;
};

// Skema Zod untuk validasi form
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

// Helper untuk otentikasi dan org_id
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


// Server Action untuk mencari produk varian - MENIRU LOGIKA PRODUK KOMPOSIT
export async function searchProductVariants(query: string) {
    if (query.length < 2) return [];
    try {
        const { supabase, organization_id } = await getSupabaseAndUser();

        // 1. Panggil RPC yang sama dengan yang digunakan di Composite Manager
        const { data, error } = await supabase.rpc('get_products_with_stock', { 
            p_organization_id: organization_id 
        });

        if (error) throw new Error('Gagal mencari produk: ' + error.message);

        const lowercasedQuery = query.toLowerCase();

        // 2. Filter hasilnya menggunakan JavaScript, sama seperti di Composite Manager
        const results = data
            .filter((p: any) => 
                p.name.toLowerCase().includes(lowercasedQuery) || 
                (p.sku && p.sku.toLowerCase().includes(lowercasedQuery))
            )
            .slice(0, 10); // Batasi 10 hasil teratas

        // 3. Kembalikan data dalam format yang dibutuhkan UI
        return results.map((p: any) => ({ 
            id: p.id, 
            name: p.name, 
            sku: p.sku 
        }));

    } catch (e: any) {
        console.error("Server Action Error (searchProductVariants):", e.message);
        return [];
    }
}


// Server Action utama untuk membuat draft transfer
export async function createTransferAction(formData: FormData) {
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
