"use server";

import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { startOfDay, endOfDay } from 'date-fns';

// --- Tipe Data BARU untuk Laporan Penutupan ---
export type ClosingReportData = {
    report_details: {
        outlet_name: string;
        period_start: string;
        period_end: string;
        generated_at: string;
    };
    summary: {
        total_transactions: number;
        gross_sales: number;
        total_discounts: number;
        net_sales: number;
        total_tax_collected: number;
        total_collected: number;
        payment_methods: {
            payment_method: string;
            total_amount: number;
            transaction_count: number;
        }[];
    };
    cashier_summary: {
        member_id: string;
        member_name: string;
        net_sales: number;
        transaction_count: number;
    }[];
    transactions: {
        [x: string]: string;
        id: string; // <<-- TAMBAHKAN ID
        transaction_number: string;
        transaction_date: string;
        grand_total: number;
        member_name: string;
    }[];
} | null;

// Helper untuk mendapatkan Supabase client dan info user
async function getSupabaseAndUser() {
    const cookieStore = await cookies();
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { cookies: { get: (name: string) => cookieStore.get(name)?.value } }
    );
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Pengguna tidak terautentikasi.");
    
    const { data: member, error: memberError } = await supabase
        .from('organization_members')
        .select('id, organization_id, role')
        .eq('user_id', user.id)
        .single();
    
    if (memberError || !member) {
        console.error("Error fetching member data:", memberError);
        throw new Error("Organisasi tidak ditemukan.");
    }
    
    return { supabase, user, member };
}


// --- Server Action BARU untuk Laporan Penutupan ---
export async function getClosingReportData(
    date: Date,
    outletId?: string,
    cashierId?: string
): Promise<ClosingReportData> {
    try {
        const { supabase, member } = await getSupabaseAndUser();

        let targetOutletId = outletId;
        let targetCashierId: string | null = null;
        
        // Jika tidak ada outletId yang diberikan (misalnya saat load pertama kali),
        // kita harus cari outlet default untuk organisasi ini.
        if (!targetOutletId) {
            const { data: defaultOutlet } = await supabase
                .from('outlets')
                .select('id')
                .eq('organization_id', member.organization_id)
                .limit(1)
                .single();
            if (!defaultOutlet) throw new Error("Tidak ada outlet yang terdaftar di organisasi ini.");
            targetOutletId = defaultOutlet.id;
        }

        // Logika Berbasis Peran
        if (member.role === 'cashier') {
            targetCashierId = member.id;
        } else { // Admin atau Manajer
            targetCashierId = cashierId || null;
        }

        if (!targetOutletId) throw new Error("Outlet tidak dapat ditentukan.");

        const startDate = startOfDay(date);
        const endDate = endOfDay(date);

        const { data, error } = await supabase.rpc('get_daily_closing_report', {
            p_organization_id: member.organization_id,
            p_start_date: startDate.toISOString(),
            p_end_date: endDate.toISOString(),
            p_outlet_id: targetOutletId,
            p_member_id: targetCashierId
        });

        if (error) throw new Error(error.message);
        return data;

    } catch (e: any) {
        console.error("Error fetching closing report:", e.message);
        return null;
    }
}
