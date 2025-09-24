// src/app/dashboard/reports/inventory/page.tsx
import { redirect } from 'next/navigation';
import { parseISO, startOfMonth, endOfMonth } from 'date-fns';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { InventoryReportClient } from './InventoryReportClient';
import { getInventoryReport } from './actions';
import type { InventoryReportData } from './actions';

async function getOutletsForFilter() {
    const cookieStore = cookies();
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { cookies: { get: (name) => cookieStore.get(name)?.value } }
    );
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data: member } = await supabase.from('organization_members').select('organization_id').eq('user_id', user.id).single();
    if (!member) return [];

    const { data, error } = await supabase
        .from('outlets')
        .select('id, name')
        .eq('organization_id', member.organization_id)
        .order('name');
        
    if (error) {
        console.error("Error fetching outlets:", error);
        return [];
    }
    return data;
}

export default async function InventoryReportPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
    // Cek otentikasi
    const cookieStore = cookies();
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { cookies: { get: (name) => cookieStore.get(name)?.value } }
    );
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
        redirect('/login');
    }

    // Tentukan rentang tanggal filter
    const now = new Date();
    const startDate = searchParams.from ? parseISO(searchParams.from as string) : startOfMonth(now);
    const endDate = searchParams.to ? parseISO(searchParams.to as string) : endOfMonth(now);
    const outletId = typeof searchParams.outletId === 'string' ? searchParams.outletId : null;

    // Ambil data laporan dan daftar outlet secara paralel
    const [initialData, outlets] = await Promise.all([
        getInventoryReport(startDate, endDate, outletId),
        getOutletsForFilter()
    ]);

    return (
        <InventoryReportClient 
            initialData={initialData as InventoryReportData}
            outlets={outlets}
            defaultStartDate={startDate}
            defaultEndDate={endDate}
        />
    );
}
