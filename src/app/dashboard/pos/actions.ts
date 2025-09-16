"use server";

import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

// ========= TIPE DATA & SKEMA =========
type CartItemForDb = {
    variant_id: string;
    quantity: number;
    unit_price: number;
    tax_amount: number;
    discount_amount: number;
};

type Result = {
    success: boolean;
    message: string;
    transaction_id?: string;
};

// Skema validasi untuk pelanggan baru
const CustomerSchema = z.object({
    name: z.string().min(3, "Nama pelanggan minimal 3 karakter."),
    phone: z.string().min(10, "Nomor telepon minimal 10 digit.").refine(val => !isNaN(Number(val)), "Nomor telepon harus berupa angka."),
});


// ========= FUNGSI UNTUK MENGAMBIL DATA PRODUK POS =========
export async function getProductsForOutlet(outletId: string) {
    if (!outletId) return [];

    const cookieStore = await cookies();
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { cookies: { get(name: string) { return cookieStore.get(name)?.value } } }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Pengguna tidak terautentikasi.");

    const { data: member } = await supabase.from('organization_members').select('organization_id').eq('user_id', user.id).single();
    if (!member) throw new Error("Organisasi tidak ditemukan.");

    try {
        const { data, error } = await supabase.rpc('get_pos_data', { p_organization_id: member.organization_id, p_outlet_id: outletId });
        if (error) {
            console.error("RPC get_pos_data Error:", error);
            throw new Error(`Database error: ${error.message}`);
        }
        return data;
    } catch (e: any) {
        console.error("Server Action getProductsForOutlet Error:", e);
        return [];
    }
}


// ========= FUNGSI UNTUK MEMBUAT TRANSAKSI =========
export async function createTransaction(
    cartData: CartItemForDb[],
    outletId: string,
    totalDiscount: number,
    customerId: string | null
): Promise<Result> {
    const cookieStore = await cookies();
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { cookies: { get(name: string) { return cookieStore.get(name)?.value } } }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, message: "Pengguna tidak terautentikasi." };

    const { data: member } = await supabase.from('organization_members').select('id, organization_id').eq('user_id', user.id).single();
    if (!member) return { success: false, message: "Profil pengguna tidak ditemukan." };

    if (cartData.length === 0) return { success: false, message: "Keranjang tidak boleh kosong." };
    if (!outletId) return { success: false, message: "Outlet harus dipilih." };

    try {
        const { data, error } = await supabase.rpc('create_new_sale', {
            p_organization_id: member.organization_id,
            p_outlet_id: outletId,
            p_member_id: member.id,
            p_cart_items: cartData,
            p_total_discount: totalDiscount,
            p_customer_id: customerId
        });

        if (error) {
            console.error("RPC create_new_sale Error:", error);
            if (error.message.includes("Stok tidak mencukupi")) {
                return { success: false, message: "Transaksi gagal: Stok tidak mencukupi untuk salah satu item." };
            }
            return { success: false, message: `Database error: ${error.message}` };
        }

        const newTransactionId = data;
        revalidatePath('/dashboard/products');
        revalidatePath('/dashboard/pos');

        return { success: true, message: "Transaksi berhasil dibuat.", transaction_id: newTransactionId };

    } catch (e: any) {
        console.error("Server Action createTransaction Error:", e);
        return { success: false, message: `Terjadi kesalahan pada server: ${e.message}` };
    }
}


// ========= FUNGSI UNTUK MENGAMBIL DETAIL TRANSAKSI =========
export async function getTransactionDetails(transactionId: string) {
    if (!transactionId) return null;

    const cookieStore = await cookies();
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { cookies: { get(name: string) { return cookieStore.get(name)?.value } } }
    );
    
    try {
        const { data, error } = await supabase.rpc('get_transaction_details', { p_transaction_id: transactionId });

        if (error) {
            console.error("RPC get_transaction_details Error:", error);
            throw new Error(`Database error: ${error.message}`);
        }
        
        return data;

    } catch (e: any) {
        console.error("Server Action getTransactionDetails Error:", e);
        return null;
    }
}


// ========= FUNGSI-FUNGSI BARU UNTUK CRM =========

export async function searchCustomers(query: string) {
    if (!query) return [];
    
    const cookieStore = await cookies();
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { cookies: { get(name: string) { return cookieStore.get(name)?.value } } }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];
    
    const { data: member } = await supabase.from('organization_members').select('organization_id').eq('user_id', user.id).single();
    if (!member) return [];

    const { data, error } = await supabase
        .from('customers')
        .select('id, name, phone_number')
        .eq('organization_id', member.organization_id)
        .or(`name.ilike.%${query}%,phone_number.ilike.%${query}%`)
        .limit(10);
    
    if (error) {
        console.error("Error searching customers:", error);
        return [];
    }
    
    return data;
}

export async function createCustomer(formData: FormData) {
    const validatedFields = CustomerSchema.safeParse({
        name: formData.get('name'),
        phone: formData.get('phone'),
    });

    if (!validatedFields.success) {
        return { success: false, message: validatedFields.error.flatten().fieldErrors, customer: null };
    }

    const { name, phone } = validatedFields.data;

    const cookieStore = await cookies();
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { cookies: { get(name: string) { return cookieStore.get(name)?.value } } }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, message: "Pengguna tidak terautentikasi.", customer: null };

    const { data: member } = await supabase.from('organization_members').select('organization_id').eq('user_id', user.id).single();
    if (!member) return { success: false, message: "Organisasi tidak ditemukan.", customer: null };

    const { data: newCustomer, error } = await supabase
        .from('customers')
        .insert({
            organization_id: member.organization_id,
            name: name,
            phone_number: phone,
        })
        .select('id, name, phone_number')
        .single();
    
    if (error) {
        console.error("Error creating customer:", error);
        return { success: false, message: `Database Error: ${error.message}`, customer: null };
    }

    return { success: true, message: "Pelanggan berhasil ditambahkan.", customer: newCustomer };
}
