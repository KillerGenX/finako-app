"use server";

import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

// Tipe data untuk daftar transfer, harus cocok dengan query
export type StockTransferListItem = {
    id: string;
    transfer_number: string;
    outlet_from_name: string;
    outlet_to_name: string;
    status: string;
    sent_at: string | null;
    item_count: number;
};

export async function getStockTransfers(): Promise<StockTransferListItem[]> {
    const cookieStore = await cookies();
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { cookies: { get: (name) => cookieStore.get(name)?.value } }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data: member } = await supabase
        .from('organization_members')
        .select('organization_id')
        .eq('user_id', user.id)
        .single();

    if (!member) return [];

    // PERBAIKAN: Menambahkan alias ke relasi untuk menghindari ambiguitas
    const { data, error } = await supabase
        .from('stock_transfers')
        .select(`
            id,
            transfer_number,
            outlet_from:outlet_from_id(name),
            outlet_to:outlet_to_id(name),
            status,
            sent_at,
            items:stock_transfer_items(count)
        `)
        .eq('organization_id', member.organization_id)
        .order('created_at', { ascending: false });

    if (error) {
        console.error("Error fetching stock transfers:", error);
        return [];
    }

    // Ubah format data agar sesuai dengan tipe StockTransferListItem
    return data.map(item => ({
        id: item.id,
        transfer_number: item.transfer_number,
        outlet_from_name: item.outlet_from.name,
        outlet_to_name: item.outlet_to.name,
        status: item.status,
        sent_at: item.sent_at,
        item_count: item.items[0]?.count || 0,
    }));
}
