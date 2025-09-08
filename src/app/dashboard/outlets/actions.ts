"use server";

import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';

// ============== SCHEMA ==============
const OutletSchema = z.object({
    name: z.string().min(3, { message: "Nama outlet harus diisi (minimal 3 karakter)." }),
    address: z.string().optional(),
    phone_number: z.string().optional(),
    // For now, we'll handle location_types as a simple text array, can be enhanced later
    location_types: z.array(z.string()).min(1, { message: "Pilih setidaknya satu tipe lokasi." }),
});

export type OutletFormState = {
    message: string;
    errors?: {
        name?: string[];
        address?: string[];
        phone_number?: string[];
        location_types?: string[];
    };
};

// ============== HELPER ==============
async function getSupabaseAndOrgId() {
    const cookieStore = cookies();
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

// ============== ACTIONS ==============

export async function createOutlet(prevState: OutletFormState, formData: FormData): Promise<OutletFormState> {
    try {
        const { supabase, organization_id } = await getSupabaseAndOrgId();

        const validatedFields = OutletSchema.safeParse({
            name: formData.get('name'),
            address: formData.get('address'),
            phone_number: formData.get('phone_number'),
            location_types: formData.getAll('location_types'),
        });

        if (!validatedFields.success) {
            return { message: "Validasi gagal.", errors: validatedFields.error.flatten().fieldErrors };
        }
        
        const { name, address, phone_number, location_types } = validatedFields.data;

        const { error } = await supabase.from('outlets').insert({
            organization_id,
            name,
            address,
            phone_number,
            location_types,
        });

        if (error) throw new Error(`Gagal membuat outlet: ${error.message}`);

    } catch (e: any) {
        return { message: e.message, errors: {} };
    }
    
    revalidatePath('/dashboard/outlets');
    return { message: "success" }; // Return success to close modal
}

export async function updateOutlet(prevState: OutletFormState, formData: FormData): Promise<OutletFormState> {
    const outletId = formData.get('outlet_id') as string;
    if (!outletId) return { message: "Error: ID Outlet tidak ditemukan.", errors: {} };

    try {
        const { supabase, organization_id } = await getSupabaseAndOrgId();
        
        const validatedFields = OutletSchema.safeParse({
            name: formData.get('name'),
            address: formData.get('address'),
            phone_number: formData.get('phone_number'),
            location_types: formData.getAll('location_types'),
        });

        if (!validatedFields.success) {
            return { message: "Validasi gagal.", errors: validatedFields.error.flatten().fieldErrors };
        }

        const { name, address, phone_number, location_types } = validatedFields.data;

        const { error } = await supabase.from('outlets')
            .update({ name, address, phone_number, location_types })
            .eq('id', outletId)
            .eq('organization_id', organization_id);

        if (error) throw new Error(`Gagal memperbarui outlet: ${error.message}`);

    } catch (e: any) {
        return { message: e.message, errors: {} };
    }

    revalidatePath('/dashboard/outlets');
    return { message: "success" };
}

export async function deleteOutlet(formData: FormData): Promise<{ message: string }> {
    const outletId = formData.get('outlet_id') as string;
    if (!outletId) return { message: "ID Outlet tidak ditemukan." };

    try {
        const { supabase, organization_id } = await getSupabaseAndOrgId();
        
        const { error } = await supabase.from('outlets')
            .delete()
            .eq('id', outletId)
            .eq('organization_id', organization_id);

        if (error) throw new Error(`Gagal menghapus outlet: ${error.message}`);

    } catch (e: any) {
        return { message: e.message };
    }

    revalidatePath('/dashboard/outlets');
    return { message: "Outlet berhasil dihapus." };
}
