"use server";

import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

// ============== SCHEMA ==============
const BrandSchema = z.object({
    name: z.string().min(2, { message: "Nama merek harus diisi (minimal 2 karakter)." }),
});

export type BrandFormState = {
    message: string;
    errors?: {
        name?: string[];
    };
};

// ============== HELPER ==============
async function getSupabaseAndOrgId() {
    const cookieStore = await cookies();
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get(name: string) { return cookieStore.get(name)?.value },
                set(name: string, value: string, options) { cookieStore.set({ name, value, ...options }) },
                remove(name: string, options) { cookieStore.set({ name, value: '', ...options }) },
            },
        }
    );
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Pengguna tidak terautentikasi.");
    const { data: member } = await supabase.from('organization_members').select('organization_id').eq('user_id', user.id).single();
    if (!member) throw new Error("Organisasi tidak ditemukan.");
    return { supabase, organization_id: member.organization_id };
}

// ============== ACTIONS ==============
export async function createBrand(prevState: BrandFormState, formData: FormData): Promise<BrandFormState> {
    try {
        const { supabase, organization_id } = await getSupabaseAndOrgId();
        const validatedFields = BrandSchema.safeParse({ name: formData.get('name') });

        if (!validatedFields.success) {
            return { message: "Validasi gagal.", errors: validatedFields.error.flatten().fieldErrors };
        }
        
        const { name } = validatedFields.data;

        const { error } = await supabase.from('brands').insert({ organization_id, name });

        if (error) {
            if (error.code === '23505') {
                 return { message: `Error: Merek '${name}' sudah ada.`, errors: { name: ["Nama merek ini sudah digunakan."]}};
            }
            throw new Error(`Gagal membuat merek: ${error.message}`);
        }
    } catch (e: any) {
        return { message: e.message, errors: {} };
    }
    
    revalidatePath('/dashboard/brands');
    revalidatePath('/dashboard/products'); // Revalidate product forms too
    return { message: "success" };
}

export async function updateBrand(prevState: BrandFormState, formData: FormData): Promise<BrandFormState> {
    const brandId = formData.get('brand_id') as string;
    if (!brandId) return { message: "Error: ID Merek tidak ditemukan.", errors: {} };

    try {
        const { supabase, organization_id } = await getSupabaseAndOrgId();
        const validatedFields = BrandSchema.safeParse({ name: formData.get('name') });

        if (!validatedFields.success) {
            return { message: "Validasi gagal.", errors: validatedFields.error.flatten().fieldErrors };
        }
        
        const { name } = validatedFields.data;

        const { error } = await supabase.from('brands')
            .update({ name })
            .eq('id', brandId)
            .eq('organization_id', organization_id);

        if (error) {
            if (error.code === '23505') {
                 return { message: `Error: Merek '${name}' sudah ada.`, errors: { name: ["Nama merek ini sudah digunakan."]}};
            }
            throw new Error(`Gagal memperbarui merek: ${error.message}`);
        }
    } catch (e: any) {
        return { message: e.message, errors: {} };
    }

    revalidatePath('/dashboard/brands');
    revalidatePath('/dashboard/products');
    return { message: "success" };
}

export async function deleteBrand(formData: FormData): Promise<{ message: string }> {
    const brandId = formData.get('brand_id') as string;
    if (!brandId) return { message: "ID Merek tidak ditemukan." };

    try {
        const { supabase, organization_id } = await getSupabaseAndOrgId();
        const { error } = await supabase.from('brands')
            .delete()
            .eq('id', brandId)
            .eq('organization_id', organization_id);
        if (error) throw new Error(`Gagal menghapus merek: ${error.message}`);
    } catch (e: any) {
        return { message: e.message };
    }

    revalidatePath('/dashboard/brands');
    revalidatePath('/dashboard/products');
    return { message: "Merek berhasil dihapus." };
}
