"use server";

import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';

// Skema Zod untuk validasi form
const CreatePOSchema = z.object({
    supplier_id: z.string().uuid("Pemasok harus dipilih."),
    outlet_id: z.string().uuid("Outlet tujuan harus dipilih."),
    notes: z.string().optional(),
    items: z.array(z.object({
        variant_id: z.string().uuid(),
        quantity: z.coerce.number().positive("Jumlah harus lebih dari 0."),
        unit_cost: z.coerce.number().min(0, "Harga beli tidak boleh negatif.")
    })).min(1, "Minimal harus ada satu produk untuk dipesan."),
});

// Helper
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


// Server Action untuk mengambil data awal (pemasok & outlet)
export async function getFormData() {
    const { supabase, organization_id } = await getSupabaseAndUser();
    
    const suppliersPromise = supabase.from('suppliers').select('id, name').eq('organization_id', organization_id).order('name');
    const outletsPromise = supabase.from('outlets').select('id, name').eq('organization_id', organization_id).order('name');

    const [suppliersResult, outletsResult] = await Promise.all([suppliersPromise, outletsPromise]);

    if (suppliersResult.error) throw new Error(suppliersResult.error.message);
    if (outletsResult.error) throw new Error(outletsResult.error.message);

    return { suppliers: suppliersResult.data, outlets: outletsResult.data };
}

// Server Action untuk mencari produk varian
export async function searchProductVariants(query: string) {
    if (query.length < 2) return [];
    const { supabase, organization_id } = await getSupabaseAndUser();

    const { data, error } = await supabase.rpc('search_variants_for_transfer', {
        p_organization_id: organization_id,
        p_outlet_id: null, // Kita tidak perlu filter outlet di sini
        p_search_query: query
    });

    if (error) {
        console.error("RPC search_variants_for_transfer Error:", error);
        return [];
    }
    return data.map((v: any) => ({ ...v, unit_cost: 0 })); // Tambahkan harga beli default
}


// Server Action utama untuk membuat draft PO
export async function createPOAction(formData: FormData) {
    const itemsJSON = formData.get('items') as string;
    const items = JSON.parse(itemsJSON);

    const validatedFields = CreatePOSchema.safeParse({
        supplier_id: formData.get('supplier_id'),
        outlet_id: formData.get('outlet_id'),
        notes: formData.get('notes'),
        items: items,
    });
    
    if (!validatedFields.success) {
        return { success: false, message: "Validasi gagal.", errors: validatedFields.error.flatten().fieldErrors };
    }
    
    let newPOId: string | null = null;
    try {
        const { supabase, user, organization_id } = await getSupabaseAndUser();
        const { supplier_id, outlet_id, notes, items } = validatedFields.data;

        const { data, error } = await supabase.rpc('create_purchase_order_draft', {
            p_organization_id: organization_id,
            p_supplier_id: supplier_id,
            p_outlet_id: outlet_id,
            p_created_by: user.id,
            p_notes: notes,
            p_items: items
        });
        
        if (error) throw new Error(error.message);
        newPOId = data;

    } catch (e: any) {
        return { success: false, message: e.message, errors: null };
    }

    revalidatePath('/dashboard/inventory/purchase-orders');
    if (newPOId) {
        redirect(`/dashboard/inventory/purchase-orders/${newPOId}`);
    }
}
