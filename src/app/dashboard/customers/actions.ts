"use server";

import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

// Skema validasi LENGKAP untuk pelanggan baru dari halaman manajemen
const FullCustomerSchema = z.object({
    name: z.string().min(3, "Nama pelanggan minimal 3 karakter."),
    phone: z.string().min(10, "Nomor telepon minimal 10 digit.").refine(val => !isNaN(Number(val)), "Nomor telepon harus berupa angka."),
    email: z.string().email("Format email tidak valid.").optional().or(z.literal('')),
    address: z.string().optional(),
});

// Skema validasi untuk update pelanggan
const UpdateCustomerSchema = z.object({
    id: z.string().uuid(),
    name: z.string().min(3, "Nama pelanggan minimal 3 karakter."),
    phone: z.string().min(10, "Nomor telepon minimal 10 digit.").refine(val => !isNaN(Number(val)), "Nomor telepon harus berupa angka."),
    email: z.string().email("Format email tidak valid.").optional().or(z.literal('')),
    address: z.string().optional(),
});


// Membuat pelanggan baru (Versi Lengkap)
export async function createCustomer(formData: FormData) {
    const validatedFields = FullCustomerSchema.safeParse({
        name: formData.get('name'),
        phone: formData.get('phone'),
        email: formData.get('email'),
        address: formData.get('address'),
    });

    if (!validatedFields.success) {
        return { success: false, message: validatedFields.error.flatten().fieldErrors };
    }
    
    const { name, phone, email, address } = validatedFields.data;

    const cookieStore = await cookies();
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { cookies: { get: (name) => cookieStore.get(name)?.value } }
    );
     const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, message: "Unauthorized" };

    const { data: member } = await supabase.from('organization_members').select('organization_id').eq('user_id', user.id).single();
    if (!member) return { success: false, message: "Organization not found" };

    const { error } = await supabase
        .from('customers')
        .insert({
            organization_id: member.organization_id,
            name,
            phone_number: phone,
            email,
            address,
        });

    if (error) {
        return { success: false, message: error.message };
    }

    revalidatePath('/dashboard/customers');
    return { success: true, message: "Pelanggan berhasil ditambahkan." };
}


// Mengambil semua pelanggan dengan paginasi dan pencarian
export async function getCustomers(searchQuery: string) {
    // ... (kode tidak berubah)
    const cookieStore = await cookies();
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { cookies: { get: (name) => cookieStore.get(name)?.value } }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Unauthorized" };

    const { data: member } = await supabase.from('organization_members').select('organization_id').eq('user_id', user.id).single();
    if (!member) return { error: "Organization not found" };

    let query = supabase
        .from('customers')
        .select('*')
        .eq('organization_id', member.organization_id);

    if (searchQuery) {
        query = query.or(`name.ilike.%${searchQuery}%,phone_number.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`);
    }
    
    query = query.order('created_at', { ascending: false });

    const { data, error } = await query;
    
    if (error) {
        console.error("Error fetching customers:", error);
        return { error: error.message };
    }
    return { data };
}


// Memperbarui data pelanggan
export async function updateCustomer(formData: FormData) {
    // ... (kode tidak berubah)
    const validatedFields = UpdateCustomerSchema.safeParse({
        id: formData.get('id'),
        name: formData.get('name'),
        phone: formData.get('phone'),
        email: formData.get('email'),
        address: formData.get('address'),
    });

    if (!validatedFields.success) {
        return { success: false, message: validatedFields.error.flatten().fieldErrors };
    }
    
    const { id, ...customerData } = validatedFields.data;

    const cookieStore = await cookies();
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { cookies: { get: (name) => cookieStore.get(name)?.value } }
    );

    const { error } = await supabase
        .from('customers')
        .update({
            name: customerData.name,
            phone_number: customerData.phone,
            email: customerData.email,
            address: customerData.address,
        })
        .eq('id', id);

    if (error) {
        return { success: false, message: error.message };
    }

    revalidatePath('/dashboard/customers');
    return { success: true, message: "Pelanggan berhasil diperbarui." };
}

// Menghapus pelanggan
export async function deleteCustomer(customerId: string) {
     // ... (kode tidak berubah)
     const cookieStore = await cookies();
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { cookies: { get: (name) => cookieStore.get(name)?.value } }
    );

    const { error } = await supabase
        .from('customers')
        .delete()
        .eq('id', customerId);

    if (error) {
        return { success: false, message: error.message };
    }

    revalidatePath('/dashboard/customers');
    return { success: true, message: "Pelanggan berhasil dihapus." };
}
