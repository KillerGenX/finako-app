"use server";

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';

export async function rejectPayment(invoiceId: string): Promise<void> {
    const cookieStore = await cookies();
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { cookies: { get: (name) => cookieStore.get(name)?.value } }
    );
    
    const { data: invoice, error: invoiceError } = await supabase
        .from('invoices')
        .select('user_id')
        .eq('id', invoiceId)
        .single();
        
    if (invoiceError || !invoice) {
        console.error('Invoice not found during rejection.');
        return;
    }

    await supabase
        .from('invoices')
        .update({ status: 'failed' })
        .eq('id', invoiceId);
    
    // ▼▼▼ LOGIKA BARU: BUAT NOTIFIKASI UNTUK PENGGUNA ▼▼▼
    await supabase.from('user_notifications').insert({
        user_id: invoice.user_id,
        message: `Pembayaran Anda untuk invoice #${invoiceId.substring(0, 8)} ditolak. Silakan hubungi dukungan jika Anda merasa ini adalah kesalahan.`,
        link: '/dashboard/billing'
    });

    revalidatePath('/dashboard', 'layout'); // Revalidasi layout dashboard untuk notifikasi
    revalidatePath('/admin/billing');
}
