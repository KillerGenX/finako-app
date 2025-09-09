"use server";

import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

// ============== SCHEMAS ==============
const StockAdjustmentSchema = z.object({
    product_variant_id: z.string().uuid({ message: "ID Varian Produk tidak valid." }),
    outlet_id: z.string().uuid({ message: "Anda harus memilih outlet." }),
    quantity_change: z.coerce.number().refine(val => val !== 0, { message: "Perubahan kuantitas tidak boleh nol." }),
    notes: z.string().optional(),
});

const StockTransferSchema = z.object({
    product_variant_id: z.string().uuid(),
    outlet_from_id: z.string().uuid({ message: "Outlet asal harus dipilih." }),
    outlet_to_id: z.string().uuid({ message: "Outlet tujuan harus dipilih." }),
    quantity: z.coerce.number().positive({ message: "Jumlah transfer harus lebih dari nol." }),
}).refine(data => data.outlet_from_id !== data.outlet_to_id, {
    message: "Outlet asal dan tujuan tidak boleh sama.",
    path: ["outlet_to_id"],
});


export type StockFormState = {
    message: string;
    errors?: Record<string, string[] | undefined>;
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
export async function adjustStock(prevState: StockFormState, formData: FormData): Promise<StockFormState> {
    const variantId = formData.get('product_variant_id') as string;
    try {
        const { supabase, organization_id } = await getSupabaseAndOrgId();
        const validatedFields = StockAdjustmentSchema.safeParse(Object.fromEntries(formData.entries()));

        if (!validatedFields.success) {
            return { message: "Validasi gagal.", errors: validatedFields.error.flatten().fieldErrors };
        }
        
        const { product_variant_id, outlet_id, quantity_change } = validatedFields.data;
        const movement_type = quantity_change > 0 ? 'purchase_received' : 'adjustment';

        const { error } = await supabase.rpc('record_stock_movement', {
            p_organization_id: organization_id, p_product_variant_id: product_variant_id,
            p_outlet_id: outlet_id, p_quantity_change: quantity_change, p_movement_type: movement_type
        });

        if (error) throw new Error(`Gagal menyesuaikan stok: ${error.message}`);
    } catch (e: any) {
        return { message: e.message, errors: {} };
    }
    
    revalidatePath(`/dashboard/inventory/${variantId}`);
    return { message: "success" };
}

export async function transferStock(prevState: StockFormState, formData: FormData): Promise<StockFormState> {
    const variantId = formData.get('product_variant_id') as string;
    try {
        const { supabase, organization_id } = await getSupabaseAndOrgId();
        const validatedFields = StockTransferSchema.safeParse(Object.fromEntries(formData.entries()));

        if (!validatedFields.success) {
            return { message: "Validasi gagal.", errors: validatedFields.error.flatten().fieldErrors };
        }
        
        const { product_variant_id, outlet_from_id, outlet_to_id, quantity } = validatedFields.data;

        const { error } = await supabase.rpc('transfer_stock', {
            p_organization_id: organization_id,
            p_product_variant_id: product_variant_id,
            p_outlet_from_id: outlet_from_id,
            p_outlet_to_id: outlet_to_id,
            p_quantity: quantity
        });

        if (error) {
            if (error.message.includes('Stok di outlet asal tidak mencukupi')) {
                return { message: "Stok di outlet asal tidak mencukupi untuk transfer.", errors: { quantity: ["Jumlah melebihi stok yang ada."]}};
            }
             throw new Error(`Gagal mentransfer stok: ${error.message}`);
        }

    } catch (e: any) {
        return { message: e.message, errors: {} };
    }
    
    revalidatePath(`/dashboard/inventory/${variantId}`);
    return { message: "success" };
}
