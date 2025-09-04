"use server";

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';

export async function confirmManualPayment(invoiceId: string) {
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
        return { error: 'Invoice not found.' };
    }

    // Ambil langganan yang ada untuk mendapatkan tanggal akhir saat ini
    const { data: currentSubscription, error: subSelectError } = await supabase
        .from('subscriptions')
        .select('current_period_end, status')
        .eq('organization_id', invoice.organization_id)
        .single();

    if (subSelectError || !currentSubscription) {
        return { error: 'Could not find existing subscription to update.' };
    }

    // ▼▼▼ LOGIKA UTAMA "TAMBAH PULSA" ▼▼▼
    let newPeriodEnd: Date;
    // Tentukan tanggal mulai untuk perhitungan: akhir periode saat ini, atau hari ini jika sudah kedaluwarsa
    const startDate = new Date(currentSubscription.current_period_end) > new Date()
        ? new Date(currentSubscription.current_period_end)
        : new Date();

    // Tambahkan durasi dari invoice ke tanggal mulai
    newPeriodEnd = new Date(startDate);
    newPeriodEnd.setMonth(newPeriodEnd.getMonth() + invoice.billing_duration_months);
    // ▲▲▲ AKHIR DARI LOGIKA UTAMA ▲▲▲

    const { error: subError } = await supabase
        .from('subscriptions')
        .update({
            plan_id: invoice.plan_id,
            status: 'active',
            // Jika status sebelumnya 'trialing', set tanggal mulai baru. Jika tidak, pertahankan yang lama.
            current_period_start: currentSubscription.status === 'trialing' ? new Date().toISOString() : undefined,
            current_period_end: newPeriodEnd.toISOString(),
            trial_ends_at: null,
        })
        .eq('organization_id', invoice.organization_id);

    if (subError) {
        console.error("Subscription update error:", subError);
        return { error: 'Failed to update subscription.' };
    }

    const { error: invoiceUpdateError } = await supabase
        .from('invoices')
        .update({ status: 'paid' })
        .eq('id', invoiceId);
        
    if (invoiceUpdateError) {
        console.error("Failed to update invoice status:", invoiceUpdateError);
    }
    
    revalidatePath('/dashboard/billing');
    revalidatePath('/dashboard');
    return { success: true };
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
