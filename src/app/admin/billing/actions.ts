"use server";

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';

// ▼▼▼ FUNGSI DIPERBARUI AGAR TIDAK MENGEMBALIKAN NILAI (RETURN VOID) ▼▼▼
export async function rejectPayment(invoiceId: string): Promise<void> {
    const cookieStore = await cookies();
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { cookies: { get: (name) => cookieStore.get(name)?.value } }
    );
    
    const { error } = await supabase
        .from('invoices')
        .update({ status: 'failed' })
        .eq('id', invoiceId);

    if (error) {
        console.error('Reject Payment Error:', error);
        // Di sini kita bisa throw error jika ingin, tapi untuk sekarang cukup log.
        return;
    }
    
    revalidatePath('/admin/billing');
}
