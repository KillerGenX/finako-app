"use server";

import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

export type StockReportItem = {
    variant_id: string;
    product_name: string;
    sku: string | null;
    outlet_name: string;
    quantity_on_hand: number;
};

export async function getStockReport(searchQuery: string = ''): Promise<StockReportItem[]> {
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

    const { data, error } = await supabase.rpc('get_stock_report', {
        p_organization_id: member.organization_id,
        p_search_query: searchQuery,
    });

    if (error) {
        console.error("Error fetching stock report:", error);
        return [];
    }
    
    return data;
}
