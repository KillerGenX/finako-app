"use server";

import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

// Tipe data untuk item riwayat transaksi, harus cocok dengan output RPC
export type TransactionHistoryItem = {
    id: string;
    transaction_date: string;
    transaction_number: string;
    customer_name: string;
    cashier_name: string;
    grand_total: number;
};

export async function getTransactionHistory(): Promise<TransactionHistoryItem[]> {
    const cookieStore = await cookies();
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { cookies: { get(name: string) { return cookieStore.get(name)?.value } } }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        console.error("User not authenticated.");
        return [];
    }

    const { data: member, error: memberError } = await supabase
        .from('organization_members')
        .select('organization_id')
        .eq('user_id', user.id)
        .single();

    if (memberError || !member) {
        console.error("User is not a member of any organization.", memberError);
        return [];
    }

    try {
        const { data, error } = await supabase.rpc('get_transaction_history', {
            p_organization_id: member.organization_id,
        });

        if (error) {
            console.error("RPC get_transaction_history Error:", error);
            throw new Error(`Database error: ${error.message}`);
        }
        
        return data || [];

    } catch (e: any) {
        console.error("Server Action getTransactionHistory Error:", e);
        return [];
    }
}
