"use server";

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';

export async function confirmManualPayment(invoiceId: string): Promise<void> {
    const cookieStore = await cookies();
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { cookies: { get: (name) => cookieStore.get(name)?.value } }
    );
    
    const { data: invoice, error: invoiceError } = await supabase
        .from('invoices')
        .select('*')
        .eq('id', invoiceId)
        .single();
        
    if (invoiceError || !invoice) {
        console.error('Invoice not found during confirmation.');
        return;
    }

    const { data: currentSubscription, error: subSelectError } = await supabase
        .from('subscriptions')
        .select('current_period_end, status')
        .eq('organization_id', invoice.organization_id)
        .single();

    if (subSelectError || !currentSubscription) {
        console.error('Subscription not found during confirmation.');
        return;
    }

    const startDate = new Date(currentSubscription.current_period_end) > new Date()
        ? new Date(currentSubscription.current_period_end)
        : new Date();

    const newPeriodEnd = new Date(startDate);
    newPeriodEnd.setMonth(newPeriodEnd.getMonth() + invoice.billing_duration_months);

    const { error: subError } = await supabase
        .from('subscriptions')
        .update({
            plan_id: invoice.plan_id,
            status: 'active',
            current_period_start: currentSubscription.status === 'trialing' ? new Date().toISOString() : undefined,
            current_period_end: newPeriodEnd.toISOString(),
            trial_ends_at: null,
        })
        .eq('organization_id', invoice.organization_id);

    if (subError) {
        console.error("Failed to update subscription:", subError);
        return;
    }

    await supabase
        .from('invoices')
        .update({ status: 'paid' })
        .eq('id', invoiceId);
        
    // ▼▼▼ LOGIKA BARU: BUAT NOTIFIKASI UNTUK PENGGUNA ▼▼▼
    await supabase.from('user_notifications').insert({
        user_id: invoice.user_id,
        message: `Pembayaran Anda untuk invoice #${invoice.id.substring(0, 8)} telah disetujui. Langganan Anda sekarang aktif.`,
        link: '/dashboard/billing'
    });
    
    revalidatePath('/dashboard', 'layout'); // Revalidasi layout dashboard untuk notifikasi
    revalidatePath('/admin/billing');
}

// (Fungsi uploadProof tetap sama)
export async function uploadProof(formData: FormData) {
    const invoiceId = formData.get('invoiceId') as string;
    const proofFile = formData.get('proof') as File;
    if (!invoiceId || !proofFile) { return { error: 'Data tidak lengkap.' }; }

    const cookieStore = await cookies();
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { cookies: { get: (name) => cookieStore.get(name)?.value } }
    );
    
    const fileName = `${invoiceId}-${new Date().getTime()}-${proofFile.name}`;
    const { error: uploadError } = await supabase.storage.from('payment-proofs').upload(fileName, proofFile);
    if (uploadError) { return { error: 'Gagal mengunggah bukti pembayaran.' }; }

    const { data: { publicUrl } } = supabase.storage.from('payment-proofs').getPublicUrl(fileName);
    const { error: dbError } = await supabase.from('invoices').update({ payment_proof_url: publicUrl, status: 'awaiting_confirmation', payment_method: 'manual_transfer' }).eq('id', invoiceId);
    if (dbError) { return { error: 'Gagal memperbarui database.' }; }

    revalidatePath(`/dashboard/billing/payment/${invoiceId}`);
    return { success: true, message: 'Bukti pembayaran berhasil diunggah. Menunggu konfirmasi admin.' };
}
