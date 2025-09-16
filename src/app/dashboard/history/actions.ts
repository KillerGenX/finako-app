"use server";

import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

// Tipe data untuk item riwayat, tidak berubah
export type TransactionHistoryItem = {
    id: string;
    transaction_date: string;
    transaction_number: string;
    customer_name: string;
    cashier_name: string;
    grand_total: number;
};

// Tipe data untuk hasil yang dikembalikan RPC, sekarang termasuk total_count
export type HistoryQueryResult = {
    total_count: number;
    data: TransactionHistoryItem[];
};

// Tipe data baru untuk parameter filter
export type HistoryFilters = {
    search?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    pageSize?: number;
};

// Fungsi diperbarui untuk menerima filter
export async function getTransactionHistory(filters: HistoryFilters = {}): Promise<HistoryQueryResult> {
    const cookieStore = await cookies();
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { cookies: { get(name: string) { return cookieStore.get(name)?.value } } }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        console.error("User not authenticated.");
        return { total_count: 0, data: [] };
    }

    const { data: member, error: memberError } = await supabase
        .from('organization_members')
        .select('organization_id')
        .eq('user_id', user.id)
        .single();

    if (memberError || !member) {
        console.error("User is not a member of any organization.", memberError);
        return { total_count: 0, data: [] };
    }

    try {
        const { data, error } = await supabase.rpc('get_transaction_history', {
            p_organization_id: member.organization_id,
            p_search_query: filters.search || null,
            p_start_date: filters.startDate || null,
            p_end_date: filters.endDate || null,
            p_page_number: filters.page || 1,
            p_page_size: filters.pageSize || 25,
        });

        if (error) {
            console.error("RPC get_transaction_history Error:", error);
            throw new Error(`Database error: ${error.message}`);
        }
        
        // RPC sekarang mengembalikan objek JSON, bukan array langsung
        return data || { total_count: 0, data: [] };

    } catch (e: any) {
        console.error("Server Action getTransactionHistory Error:", e);
        return { total_count: 0, data: [] };
    }
}
