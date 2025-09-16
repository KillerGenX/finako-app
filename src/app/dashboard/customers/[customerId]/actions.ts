"use server";

import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

// Tipe data harus cocok dengan output JSON dari RPC
export type CustomerDetailResult = {
    profile: {
        id: string;
        name: string;
        phone_number: string | null;
        email: string | null;
        address: string | null;
        created_at: string;
    };
    stats: {
        total_spend: number;
        total_transactions: number;
        last_visit: string | null;
    };
    transactions: {
        total_count: number;
        data: {
            id: string;
            transaction_date: string;
            transaction_number: string;
            grand_total: number;
            cashier_name: string;
        }[];
    };
} | null;

export async function getCustomerDetails(
    customerId: string, 
    searchQuery: string = '', 
    page: number = 1
): Promise<CustomerDetailResult> {
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
        const { data, error } = await supabase.rpc('get_customer_details', {
            p_customer_id: customerId,
            p_organization_id: member.organization_id,
            p_search_query: searchQuery,
            p_page_number: page,
            p_page_size: 10 // Ukuran halaman lebih kecil untuk detail
        });

        if (error) {
            console.error("RPC get_customer_details Error:", error);
            throw new Error(`Database error: ${error.message}`);
        }
        
        return data;

    } catch (e: any) {
        console.error("Server Action getCustomerDetails Error:", e);
        return null;
    }
}
