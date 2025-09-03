"use server";

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';

// Fungsi untuk mengonfirmasi pembayaran manual (simulasi)
export async function confirmManualPayment(invoiceId: string) {
    // Di dunia nyata, ini akan dipanggil oleh admin setelah verifikasi
    // Untuk simulasi, kita panggil langsung
    const cookieStore = await cookies();
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { cookies: { get: (name) => cookieStore.get(name)?.value } }
    );
    
    // Ambil detail invoice untuk mendapatkan organization_id, plan_id, dll.
    const { data: invoice, error: invoiceError } = await supabase
        .from('invoices')
        .select('*')
        .eq('id', invoiceId)
        .single();
        
    if (invoiceError || !invoice) {
        return { error: 'Invoice not found.' };
    }

    // Hitung tanggal akhir periode baru
    const newPeriodEnd = new Date();
    newPeriodEnd.setMonth(newPeriodEnd.getMonth() + invoice.billing_duration_months);

    // 1. Update tabel langganan
    const { error: subError } = await supabase
        .from('subscriptions')
        .update({
            plan_id: invoice.plan_id,
            status: 'active',
            current_period_start: new Date().toISOString(),
            current_period_end: newPeriodEnd.toISOString(),
            trial_ends_at: null,
        })
        .eq('organization_id', invoice.organization_id);

    if (subError) {
        return { error: 'Failed to update subscription.' };
    }

    // 2. Update status invoice
    const { error: invoiceUpdateError } = await supabase
        .from('invoices')
        .update({ status: 'paid' })
        .eq('id', invoiceId);
        
    if (invoiceUpdateError) {
        // Meskipun langganan berhasil, laporkan error ini
        console.error("Failed to update invoice status:", invoiceUpdateError);
    }
    
    revalidatePath('/dashboard/billing');
    revalidatePath('/dashboard');
    return { success: true };
}


// Fungsi untuk upload bukti transfer
export async function uploadProof(formData: FormData) {
    const invoiceId = formData.get('invoiceId') as string;
    const proofFile = formData.get('proof') as File;

    if (!invoiceId || !proofFile) {
        return { error: 'Data tidak lengkap.' };
    }

    const cookieStore = await cookies();
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { cookies: { get: (name) => cookieStore.get(name)?.value } }
    );
    
    // Generate nama file yang unik
    const fileName = `${invoiceId}-${new Date().getTime()}-${proofFile.name}`;
    
    // Upload file ke Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase
        .storage
        .from('payment-proofs') // Pastikan bucket ini ada dan memiliki policy yang benar
        .upload(fileName, proofFile);

    if (uploadError) {
        console.error('Storage Upload Error:', uploadError);
        return { error: 'Gagal mengunggah bukti pembayaran.' };
    }

    // Dapatkan URL publik dari file yang diunggah
    const { data: { publicUrl } } = supabase.storage.from('payment-proofs').getPublicUrl(fileName);

    // Update tabel invoice dengan URL bukti dan status baru
    const { error: dbError } = await supabase
        .from('invoices')
        .update({
            payment_proof_url: publicUrl,
            status: 'awaiting_confirmation',
            payment_method: 'manual_transfer'
        })
        .eq('id', invoiceId);

    if (dbError) {
        return { error: 'Gagal memperbarui database.' };
    }

    revalidatePath(`/dashboard/billing/payment/${invoiceId}`);
    return { success: true, message: 'Bukti pembayaran berhasil diunggah. Menunggu konfirmasi admin.' };
}
