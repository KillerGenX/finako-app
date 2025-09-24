// src/app/dashboard/reports/tax/page.tsx
import { redirect } from 'next/navigation';
import { parseISO, startOfMonth, endOfMonth } from 'date-fns';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { TaxReportClient } from './TaxReportClient'; 
import { getTaxReport } from './actions';
import type { TaxReportData } from './actions';

// REVISI: getOutletsForFilter tidak lagi diperlukan di sini, bisa dipanggil di client jika dibutuhkan nanti
// atau tetap di server component seperti ini, yang mana sudah benar.
async function getOutletsForFilter(supabase: any, organization_id: string) {
    const { data, error } = await supabase
        .from('outlets')
        .select('id, name')
        .eq('organization_id', organization_id)
        .order('name');
    if (error) {
        console.error("Error fetching outlets:", error);
        return [];
    }
    return data;
}

export default async function TaxReportPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
    // REVISI: Pindahkan inisialisasi Supabase ke atas
    const cookieStore = cookies();
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { cookies: { get: (name) => cookieStore.get(name)?.value } }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        redirect('/login');
    }

    const { data: member } = await supabase.from('organization_members').select('organization_id').eq('user_id', user.id).single();
    if (!member) {
        return <div className="p-8">Anda tidak terhubung dengan organisasi manapun.</div>;
    }
    const organization_id = member.organization_id;

    // Tentukan rentang tanggal filter
    const now = new Date();
    const startDate = searchParams.from ? parseISO(searchParams.from as string) : startOfMonth(now);
    const endDate = searchParams.to ? parseISO(searchParams.to as string) : endOfMonth(now);
    const outletId = typeof searchParams.outletId === 'string' ? searchParams.outletId : null;

    // Ambil data laporan dan daftar outlet secara paralel
    // REVISI: Teruskan instance supabase dan organization_id ke getTaxReport
    const [initialData, outlets] = await Promise.all([
        getTaxReport(supabase, organization_id, startDate, endDate, outletId),
        getOutletsForFilter(supabase, organization_id)
    ]);

    return (
        <TaxReportClient 
            initialData={initialData as TaxReportData}
            outlets={outlets}
            defaultStartDate={startDate}
            defaultEndDate={endDate}
        />
    );
}
