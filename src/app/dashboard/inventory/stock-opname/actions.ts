"use server";

import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

// --- Tipe Data ---
export type StockOpnameListItem = {
    id: string;
    opname_number: string;
    outlet_name: string;
    status: string;
    created_at: string;
    item_count: number;
};

// --- Helper ---
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


// --- Server Actions ---

export async function getStockOpnames(): Promise<StockOpnameListItem[]> {
    const { supabase, organization_id } = await getSupabaseAndUser();
    
    const { data, error } = await supabase
        .from('stock_opnames')
        .select(`
            id,
            opname_number,
            outlet:outlets(name),
            status,
            created_at,
            items:stock_opname_items(count)
        `)
        .eq('organization_id', organization_id)
        .order('created_at', { ascending: false });

    if (error) {
        console.error("Error fetching stock opnames:", error);
        return [];
    }

    return data.map(op => ({
        id: op.id,
        opname_number: op.opname_number,
        outlet_name: Array.isArray(op.outlet) ? op.outlet[0]?.name : op.outlet?.name || 'N/A',
        status: op.status,
        created_at: op.created_at,
        item_count: op.items[0]?.count || 0,
    }));
}

export async function startNewStockOpname(outletId: string): Promise<{ success: boolean; opnameId?: string; message?: string }> {
    if (!outletId) return { success: false, message: "Outlet harus dipilih." };

    let newOpnameId: string | null = null;
    try {
        const { supabase, user, organization_id } = await getSupabaseAndUser();

        // Di sini kita akan memanggil RPC untuk membuat opname baru
        // Untuk saat ini, kita akan buat manual
        const opnameNumber = `SO-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;

        const { data: newOpname, error: createError } = await supabase
            .from('stock_opnames')
            .insert({
                organization_id,
                outlet_id: outletId,
                opname_number: opnameNumber,
                created_by: user.id,
                status: 'counting'
            })
            .select('id')
            .single();

        if (createError) throw createError;
        if (!newOpname) throw new Error("Gagal membuat record opname.");
        
        newOpnameId = newOpname.id;
        
        // Ambil semua stok di outlet tersebut dan masukkan ke opname_items
        const { data: stockLevels, error: stockError } = await supabase
            .from('inventory_stock_levels')
            .select('product_variant_id, quantity_on_hand')
            .eq('outlet_id', outletId);
            
        if (stockError) throw stockError;

        if (stockLevels.length > 0) {
            const itemsToInsert = stockLevels.map(sl => ({
                stock_opname_id: newOpnameId,
                product_variant_id: sl.product_variant_id,
                system_quantity: sl.quantity_on_hand
            }));
            const { error: itemsError } = await supabase.from('stock_opname_items').insert(itemsToInsert);
            if (itemsError) throw itemsError;
        }

    } catch (e: any) {
        return { success: false, message: e.message };
    }

    revalidatePath('/dashboard/inventory/stock-opname');
    if (newOpnameId) {
        redirect(`/dashboard/inventory/stock-opname/${newOpnameId}`);
    }
    
    return { success: true };
}
