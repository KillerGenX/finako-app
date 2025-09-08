"use server";

import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

// ============== SCHEMA ==============
const TaxRateSchema = z.object({
    name: z.string().min(2, { message: "Nama pajak harus diisi." }),
    rate: z.coerce.number().min(0, { message: "Tarif harus angka positif." }).max(100, { message: "Tarif tidak boleh lebih dari 100." }),
    is_inclusive: z.boolean(),
});

export type TaxFormState = {
    message: string;
    errors?: {
        name?: string[];
        rate?: string[];
        is_inclusive?: string[];
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
export async function createTaxRate(prevState: TaxFormState, formData: FormData): Promise<TaxFormState> {
    try {
        const { supabase, organization_id } = await getSupabaseAndOrgId();
        const validatedFields = TaxRateSchema.safeParse({
            name: formData.get('name'),
            rate: formData.get('rate'),
            is_inclusive: formData.get('is_inclusive') === 'on',
        });

        if (!validatedFields.success) {
            return { message: "Validasi gagal.", errors: validatedFields.error.flatten().fieldErrors };
        }
        
        const { name, rate, is_inclusive } = validatedFields.data;

        const { error } = await supabase.from('tax_rates').insert({ organization_id, name, rate, is_inclusive });

        if (error) throw new Error(`Gagal membuat tarif pajak: ${error.message}`);

    } catch (e: any) {
        return { message: e.message, errors: {} };
    }
    
    revalidatePath('/dashboard/taxes');
    revalidatePath('/dashboard/products');
    return { message: "success" };
}

export async function updateTaxRate(prevState: TaxFormState, formData: FormData): Promise<TaxFormState> {
    const taxId = formData.get('tax_id') as string;
    if (!taxId) return { message: "Error: ID Pajak tidak ditemukan.", errors: {} };

    try {
        const { supabase, organization_id } = await getSupabaseAndOrgId();
        const validatedFields = TaxRateSchema.safeParse({
            name: formData.get('name'),
            rate: formData.get('rate'),
            is_inclusive: formData.get('is_inclusive') === 'on',
        });

        if (!validatedFields.success) {
            return { message: "Validasi gagal.", errors: validatedFields.error.flatten().fieldErrors };
        }
        
        const { name, rate, is_inclusive } = validatedFields.data;

        const { error } = await supabase.from('tax_rates')
            .update({ name, rate, is_inclusive })
            .eq('id', taxId)
            .eq('organization_id', organization_id);

        if (error) throw new Error(`Gagal memperbarui tarif pajak: ${error.message}`);
        
    } catch (e: any) {
        return { message: e.message, errors: {} };
    }

    revalidatePath('/dashboard/taxes');
    revalidatePath('/dashboard/products');
    return { message: "success" };
}

export async function deleteTaxRate(formData: FormData): Promise<{ message: string }> {
    const taxId = formData.get('tax_id') as string;
    if (!taxId) return { message: "ID Pajak tidak ditemukan." };

    try {
        const { supabase, organization_id } = await getSupabaseAndOrgId();
        const { error } = await supabase.from('tax_rates')
            .delete()
            .eq('id', taxId)
            .eq('organization_id', organization_id);
        if (error) throw new Error(`Gagal menghapus tarif pajak: ${error.message}`);
    } catch (e: any) {
        return { message: e.message };
    }

    revalidatePath('/dashboard/taxes');
     revalidatePath('/dashboard/products');
    return { message: "Tarif Pajak berhasil dihapus." };
}
