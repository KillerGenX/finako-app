"use server";

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';

// ▼▼▼ FUNGSI DIPERBARUI AGAR TIDAK MENGEMBALIKAN NILAI (RETURN VOID) ▼▼▼
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
        return; // Keluar jika invoice tidak ditemukan
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
        // Di sini kita bisa throw error jika ingin form menangkapnya, tapi untuk sekarang cukup log.
        return;
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
    revalidatePath('/admin/billing'); // Revalidasi halaman admin juga
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
