"use server";

import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';

// Skema Zod untuk validasi form
const CreateWriteOffSchema = z.object({
    outlet_id: z.string().uuid("Outlet harus dipilih."),
    notes: z.string().optional(),
    items: z.array(z.object({
        variant_id: z.string().uuid(),
        quantity: z.coerce.number().positive("Jumlah harus lebih dari 0."),
        reason: z.string().min(3, "Alasan harus diisi.").optional(),
    })).min(1, "Minimal harus ada satu produk."),
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

// Server Action utama untuk membuat "Berita Acara"
export async function createWriteOffAction(formData: FormData) {
    const itemsJSON = formData.get('items') as string;
    const items = JSON.parse(itemsJSON);

    const validatedFields = CreateWriteOffSchema.safeParse({
        outlet_id: formData.get('outlet_id'),
        notes: formData.get('notes'),
        items: items,
    });
    
    if (!validatedFields.success) {
        return { success: false, errors: validatedFields.error.flatten().fieldErrors };
    }
    
    let newWriteOffId: string | null = null;
    try {
        const { supabase, user, organization_id } = await getSupabaseAndUser();
        const { outlet_id, notes, items } = validatedFields.data;

        const { data, error } = await supabase.rpc('create_stock_write_off', {
            p_organization_id: organization_id,
            p_outlet_id: outlet_id,
            p_created_by: user.id,
            p_notes: notes,
            p_items: items.map(item => ({
                variant_id: item.variant_id,
                quantity: item.quantity,
                reason: item.reason || ''
            }))
        });
        
        if (error) throw new Error(error.message);
        newWriteOffId = data;

    } catch (e: any) {
        return { success: false, message: e.message };
    }

    revalidatePath('/dashboard/inventory/write-offs');
    revalidatePath('/dashboard/inventory/stock-report');
    if (newWriteOffId) {
        redirect(`/dashboard/inventory/write-offs/${newWriteOffId}`);
    }
}
