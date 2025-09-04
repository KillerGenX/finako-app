"use server";

import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js'; // Import the standard client

// ▼▼▼ ACTION DIPERBARUI DENGAN SERVICE ROLE KEY ▼▼▼
export async function sendInvoiceByEmail(invoiceId: string) {
    // 1. Ambil user_id dari invoice menggunakan client standar
    const cookieStore = await cookies();
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { cookies: { get: (name: string) => cookieStore.get(name)?.value } }
    );
    
    const { data: invoiceData, error: invoiceError } = await supabase
        .from('invoices')
        .select('user_id')
        .eq('id', invoiceId)
        .single();
        
    if (invoiceError || !invoiceData) {
        return { error: 'Invoice tidak ditemukan.' };
    }
    
    // 2. Buat client KHUSUS dengan SERVICE_ROLE_KEY untuk aksi admin
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 3. Gunakan client admin untuk mendapatkan email user secara aman
    const { data: { user }, error: userError } = await supabaseAdmin.auth.admin.getUserById(invoiceData.user_id);
    
    if (userError || !user) {
        return { error: 'Pengguna yang terkait dengan invoice ini tidak ditemukan.' };
    }
    
    const recipientEmail = user.email;

    if (!recipientEmail) {
        return { error: 'Alamat email pengguna tidak ditemukan.' };
    }

    console.log(`-- SIMULASI PENGIRIMAN EMAIL --`);
    console.log(`Kepada: ${recipientEmail}`);
    console.log(`Subjek: Invoice #${invoiceId.substring(0, 8).toUpperCase()} dari Finako App`);
    console.log(`Isi: [Di sini akan ada template email HTML yang berisi detail invoice]`);
    console.log(`-- AKHIR SIMULASI --`);
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    return { success: `Simulasi: Email berhasil dikirim ke ${recipientEmail}` };
}
