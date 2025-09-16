"use server";

import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

// Tipe data harus cocok dengan output JSON dari RPC
export type OutletDetailResult = {
    profile: {
        id: string;
        name: string;
        address: string | null;
        phone_number: string | null;
        location_types: string[];
    };
    inventory: {
        variant_id: string;
        product_name: string;
        sku: string | null;
        quantity_on_hand: number;
    }[];
    transactions: {
        total_count: number;
        data: {
            id: string;
            transaction_date: string;
            transaction_number: string;
            grand_total: number;
            customer_name: string;
        }[];
    };
} | null;

export async function getOutletDetails(
    outletId: string, 
    txPage: number = 1
): Promise<OutletDetailResult> {
    const cookieStore = await cookies();
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { cookies: { get: (name) => cookieStore.get(name)?.value } }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        console.error("User not authenticated.");
        return null;
    }

    const { data: member } = await supabase
        .from('organization_members')
        .select('organization_id')
        .eq('user_id', user.id)
        .single();

    if (!member) {
        console.error("User is not a member of any organization.");
        return null;
    }

    try {
        const { data, error } = await supabase.rpc('get_outlet_details', {
            p_outlet_id: outletId,
            p_organization_id: member.organization_id,
            p_tx_page_number: txPage,
            p_tx_page_size: 10
        });

        if (error) {
            console.error("RPC get_outlet_details Error:", error);
            throw new Error(`Database error: ${error.message}`);
        }
        
        return data;

    } catch (e: any) {
        console.error("Server Action getOutletDetails Error:", e);
        return null;
    }
}
