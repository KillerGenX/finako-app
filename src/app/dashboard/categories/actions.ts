"use server";

import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';

// ============== SCHEMA ==============
const CategorySchema = z.object({
    name: z.string().min(2, { message: "Nama kategori harus diisi (minimal 2 karakter)." }),
    description: z.string().optional(),
    parent_id: z.string().nullable().optional(),
});

export type CategoryFormState = {
    message: string;
    errors?: {
        name?: string[];
        description?: string[];
        parent_id?: string[];
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
                get(name: string) {
                    return cookieStore.get(name)?.value
                },
                set(name: string, value: string, options) {
                    cookieStore.set({ name, value, ...options })
                },
                remove(name: string, options) {
                    cookieStore.set({ name, value: '', ...options })
                },
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

export async function createCategory(prevState: CategoryFormState, formData: FormData): Promise<CategoryFormState> {
    try {
        const { supabase, organization_id } = await getSupabaseAndOrgId();
        const validatedFields = CategorySchema.safeParse({
            name: formData.get('name'),
            description: formData.get('description'),
            parent_id: formData.get('parent_id'),
        });

        if (!validatedFields.success) {
            return { message: "Validasi gagal.", errors: validatedFields.error.flatten().fieldErrors };
        }
        
        const { name, description } = validatedFields.data;
        let parentId = validatedFields.data.parent_id;

        const { error } = await supabase.from('product_categories').insert({
            organization_id,
            name,
            description,
            parent_id: parentId === 'null' || parentId === '' ? null : parentId,
        });

        if (error) {
            if (error.code === '23505') {
                 return { message: `Error: Kategori dengan nama '${name}' sudah ada.`, errors: { name: ["Nama kategori ini sudah digunakan."]}};
            }
            throw new Error(`Gagal membuat kategori: ${error.message}`);
        }
    } catch (e: any) {
        return { message: e.message, errors: {} };
    }
    
    revalidatePath('/dashboard/categories');
    return { message: "success" };
}

export async function updateCategory(prevState: CategoryFormState, formData: FormData): Promise<CategoryFormState> {
    const categoryId = formData.get('category_id') as string;
    if (!categoryId) return { message: "Error: ID Kategori tidak ditemukan.", errors: {} };

    try {
        const { supabase, organization_id } = await getSupabaseAndOrgId();
        const validatedFields = CategorySchema.safeParse({
            name: formData.get('name'),
            description: formData.get('description'),
            parent_id: formData.get('parent_id'),
        });

        if (!validatedFields.success) {
            return { message: "Validasi gagal.", errors: validatedFields.error.flatten().fieldErrors };
        }
        
        const { name, description } = validatedFields.data;
        let parentId = validatedFields.data.parent_id;

        if (categoryId === parentId) {
            return { message: "Error: Sebuah kategori tidak bisa menjadi induknya sendiri.", errors: { parent_id: ["Pilihan tidak valid."]}};
        }

        const { error } = await supabase.from('product_categories')
            .update({
                name,
                description,
                parent_id: parentId === 'null' || parentId === '' ? null : parentId,
            })
            .eq('id', categoryId)
            .eq('organization_id', organization_id);

        if (error) {
             if (error.code === '23505') {
                 return { message: `Error: Kategori dengan nama '${name}' sudah ada.`, errors: { name: ["Nama kategori ini sudah digunakan."]}};
            }
            throw new Error(`Gagal memperbarui kategori: ${error.message}`);
        }
    } catch (e: any) {
        return { message: e.message, errors: {} };
    }

    revalidatePath('/dashboard/categories');
    return { message: "success" };
}

export async function deleteCategory(formData: FormData): Promise<{ message: string }> {
    const categoryId = formData.get('category_id') as string;
    if (!categoryId) return { message: "ID Kategori tidak ditemukan." };

    try {
        const { supabase, organization_id } = await getSupabaseAndOrgId();
        const { error } = await supabase.from('product_categories')
            .delete()
            .eq('id', categoryId)
            .eq('organization_id', organization_id);
        if (error) throw new Error(`Gagal menghapus kategori: ${error.message}`);
    } catch (e: any) {
        return { message: e.message };
    }

    revalidatePath('/dashboard/categories');
    return { message: "Kategori berhasil dihapus." };
}
