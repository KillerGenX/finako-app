"use server";
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

// --- Tipe Data untuk Laporan ---
export type SalesReportData = {
    summary: {
        gross_revenue: number;
        total_discounts: number;
        net_revenue: number;
        total_cogs: number;
        gross_profit: number;
        gross_margin: number;
        total_tax_collected: number;
    };
    top_products: {
        product_name: string;
        sku: string | null;
        total_quantity_sold: number;
        net_revenue: number;
        gross_profit: number;
    }[];
} | null;

async function getSupabaseAndOrgId() {
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

    return { supabase, organization_id: member.organization_id };
}

export async function getSalesAndProfitReport(
    startDate: Date, 
    endDate: Date,
    outletId: string | null = null
): Promise<SalesReportData> {
    try {
        const { supabase, organization_id } = await getSupabaseAndOrgId();
        
        const { data, error } = await supabase.rpc('get_advanced_sales_and_profit_report', {
            p_organization_id: organization_id,
            p_start_date: startDate.toISOString(),
            p_end_date: endDate.toISOString(),
            p_outlet_id: outletId
        });

        if (error) throw new Error(error.message);
        
        return data;

    } catch (e: any) {
        console.error("Error fetching sales report:", e.message);
        return null;
    }
}

export async function getOutletsForFilter() {
    try {
        const { supabase, organization_id } = await getSupabaseAndOrgId();
        const { data, error } = await supabase
            .from('outlets')
            .select('id, name')
            .eq('organization_id', organization_id)
            .order('name');
        
        if (error) throw new Error(error.message);
        return data;
    } catch (e: any) {
        console.error("Error fetching outlets:", e.message);
        return [];
    }
}
