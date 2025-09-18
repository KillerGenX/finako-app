"use server";

import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

// --- Tipe Data ---
export type WriteOffDetails = {
    id: string;
    write_off_number: string;
    notes: string | null;
    created_at: string;
    outlet: { id: string; name: string; };
    created_by: string | null;
    items: {
        id: string;
        quantity: number;
        reason: string | null;
        variant_id: string;
        name: string;
        sku: string | null;
    }[];
} | null;

// --- Helper ---
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

// --- Server Action ---
export async function getWriteOffDetails(writeOffId: string): Promise<WriteOffDetails> {
    try {
        const { supabase, organization_id } = await getSupabaseAndOrgId();
        const { data, error } = await supabase.rpc('get_write_off_details', {
            p_write_off_id: writeOffId,
            p_organization_id: organization_id,
        });
        if (error) throw new Error(error.message);
        return data;
    } catch (e: any) {
        console.error("Error fetching write-off details:", e);
        return null;
    }
}
