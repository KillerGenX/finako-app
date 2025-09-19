"use server";

import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

// Tipe data untuk daftar "Penerimaan Lainnya"
export type OtherReceivingListItem = {
    id: string;
    receiving_number: string;
    outlet_name: string;
    created_at: string;
    notes: string | null;
    item_count: number;
};

export async function getOtherReceivings(): Promise<OtherReceivingListItem[]> {
    const cookieStore = await cookies();
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { cookies: { get: (name) => cookieStore.get(name)?.value } }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data: member } = await supabase.from('organization_members').select('organization_id').eq('user_id', user.id).single();
    if (!member) return [];

    const { data, error } = await supabase
        .from('other_receivings')
        .select(`
            id,
            receiving_number,
            outlet:outlets(name),
            created_at,
            notes,
            items:other_receiving_items(count)
        `)
        .eq('organization_id', member.organization_id)
        .order('created_at', { ascending: false });

    if (error) {
        console.error("Error fetching other receivings:", error);
        return [];
    }
    
    // PERBAIKAN: Logika pemetaan yang lebih aman
    return data.map(item => {
        let outletName = 'N/A';
        if (item.outlet) {
            // Supabase bisa mengembalikan objek atau array, tangani keduanya
            outletName = Array.isArray(item.outlet) 
                ? item.outlet[0]?.name 
                : (item.outlet as { name: string })?.name;
        }

        return {
            id: item.id,
            receiving_number: item.receiving_number,
            outlet_name: outletName || 'N/A', // Pastikan tidak pernah null
            created_at: item.created_at,
            notes: item.notes,
            // Ambil item_count dengan lebih aman
            item_count: (item.items && item.items[0]?.count) || 0,
        };
    });
}
