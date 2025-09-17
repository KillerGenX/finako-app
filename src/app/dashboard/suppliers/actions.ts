"use server";

import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

// Skema validasi untuk Pemasok
const SupplierSchema = z.object({
    id: z.string().uuid().optional(),
    name: z.string().min(3, "Nama pemasok minimal 3 karakter."),
    contact_person: z.string().optional(),
    email: z.string().email("Format email tidak valid.").optional().or(z.literal('')),
    phone_number: z.string().optional(),
    address: z.string().optional(),
    notes: z.string().optional(),
});

// Helper
async function getSupabaseAndOrgId() {
    const cookieStore = await cookies();
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { cookies: { get: (name) => cookieStore.get(name)?.value } }
    );
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");
    const { data: member } = await supabase.from('organization_members').select('organization_id').eq('user_id', user.id).single();
    if (!member) throw new Error("Organization not found");
    return { supabase, organization_id: member.organization_id };
}


// Server Actions
export async function getSuppliers(searchQuery: string) {
    const { supabase, organization_id } = await getSupabaseAndOrgId();
    let query = supabase
        .from('suppliers')
        .select('*')
        .eq('organization_id', organization_id);

    if (searchQuery) {
        query = query.or(`name.ilike.%${searchQuery}%,contact_person.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`);
    }
    
    const { data, error } = await query.order('name');
    if (error) throw new Error(error.message);
    return data;
}

export async function saveSupplier(formData: FormData) {
    const validatedFields = SupplierSchema.safeParse(Object.fromEntries(formData.entries()));
    if (!validatedFields.success) {
        return { success: false, message: "Validasi gagal.", errors: validatedFields.error.flatten().fieldErrors };
    }
    
    try {
        const { supabase, organization_id } = await getSupabaseAndOrgId();
        const { id, ...supplierData } = validatedFields.data;

        if (id) { // Update
            const { error } = await supabase.from('suppliers').update({...supplierData, updated_at: new Date()}).eq('id', id);
            if (error) throw error;
        } else { // Create
            const { error } = await supabase.from('suppliers').insert({ ...supplierData, organization_id });
            if (error) throw error;
        }
    } catch (e: any) {
        return { success: false, message: e.message };
    }

    revalidatePath('/dashboard/suppliers');
    return { success: true };
}

export async function deleteSupplier(supplierId: string) {
    try {
        const { supabase } = await getSupabaseAndOrgId();
        const { error } = await supabase.from('suppliers').delete().eq('id', supplierId);
        if (error) throw error;
    } catch (e: any) {
        return { success: false, message: e.message };
    }
    revalidatePath('/dashboard/suppliers');
    return { success: true };
}
