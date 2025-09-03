"use server";

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export async function createInvoice(planId: string, durationInMonths: number, totalAmount: number) {
    const cookieStore = await cookies();
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { cookies: { get: (name) => cookieStore.get(name)?.value } }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return { error: 'User not authenticated.', invoiceId: null };
    }

    const { data: member, error: memberError } = await supabase
        .from('organization_members')
        .select('organization_id')
        .eq('user_id', user.id)
        .single();

    if (memberError || !member) {
        return { error: 'Could not find organization for the user.', invoiceId: null };
    }
    const organizationId = member.organization_id;

    // ▼▼▼ LOGIKA PENCEGAHAN DUPLIKASI ▼▼▼
    const { data: existingInvoice } = await supabase
        .from('invoices')
        .select('id')
        .eq('organization_id', organizationId)
        .in('status', ['pending', 'awaiting_confirmation'])
        .maybeSingle();

    if (existingInvoice) {
        // Jika sudah ada, kembalikan ID yang ada, jangan buat baru
        return { error: null, invoiceId: existingInvoice.id };
    }
    // ▲▲▲ AKHIR DARI LOGIKA PENCEGAHAN DUPLIKASI ▲▲▲

    const { data: invoiceData, error: insertError } = await supabase
        .from('invoices')
        .insert({
            organization_id: organizationId,
            plan_id: planId,
            user_id: user.id,
            status: 'pending',
            amount: totalAmount,
            billing_duration_months: durationInMonths,
        })
        .select('id')
        .single();
    
    if (insertError) {
        console.error("Invoice creation error:", insertError);
        return { error: 'Failed to create invoice.', invoiceId: null };
    }

    if (!invoiceData) {
        return { error: 'Failed to get new invoice ID.', invoiceId: null };
    }

    return { error: null, invoiceId: invoiceData.id };
}
