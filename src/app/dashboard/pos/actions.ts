"use server";

import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { revalidatePath } from 'next/cache';

// ========= TIPE DATA UNTUK TRANSAKSI (DIPERBARUI) =========
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


// ========= FUNGSI UNTUK MEMBUAT TRANSAKSI (DIPERBARUI) =========
export async function createTransaction(
    cartData: CartItemForDb[],
    outletId: string,
    totalDiscount: number,
    customerId: string | null // Parameter baru untuk customer
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
            p_customer_id: customerId // Mengirim customer_id ke RPC
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

// ========= FUNGSI BARU UNTUK MENGAMBIL DETAIL TRANSAKSI =========
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
