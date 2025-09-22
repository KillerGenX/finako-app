// src/app/dashboard/history/page.tsx
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { HistoryClient } from './HistoryClient';
import { getClosingReportData } from './actions';

async function getFilterData(orgId: string) {
    const cookieStore = await cookies();
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { cookies: { get: (name: string) => cookieStore.get(name)?.value } }
    );

    // --- PERBAIKAN: Logika Pengambilan Data yang Benar ---

    // 1. Ambil data outlet (ini sudah benar)
    const outletsPromise = supabase.from('outlets').select('id, name').eq('organization_id', orgId).order('name');

    // 2. Ambil semua anggota (kasir/admin) dan user_id mereka
    const membersPromise = supabase
        .from('organization_members')
        .select('id, user_id') // Hanya ambil ID anggota dan ID pengguna
        .eq('organization_id', orgId)
        .in('role', ['admin', 'cashier']);
        
    const [outletsResult, membersResult] = await Promise.all([outletsPromise, membersPromise]);

    if (outletsResult.error) throw new Error("Gagal mengambil data outlet.");
    if (membersResult.error) throw new Error("Gagal mengambil data anggota.");
    
    const memberUserIds = membersResult.data.map(m => m.user_id);

    // 3. Ambil profil untuk semua user_id yang ditemukan
    const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name') // `id` di sini adalah user_id
        .in('id', memberUserIds);

    if (profilesError) throw new Error("Gagal mengambil data profil kasir.");

    // 4. Gabungkan hasilnya
    const cashiers = membersResult.data.map(member => {
        const profile = profiles.find(p => p.id === member.user_id);
        return {
            id: member.id, // Ini adalah organization_members.id
            name: profile?.full_name || 'Tanpa Nama'
        };
    });
    
    return { outlets: outletsResult.data, cashiers };
}


export default async function HistoryPage({ searchParams }: {
    // Tipe searchParams sekarang adalah Promise
    searchParams: Promise<{ date?: string, outletId?: string, cashierId?: string }>
}) {
    // Gunakan await untuk mengakses properti searchParams secara asinkron
    const { date, outletId, cashierId } = await searchParams;
    const targetDate = date ? new Date(date) : new Date();

    const cookieStore = await cookies();
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { cookies: { get: (name: string) => cookieStore.get(name)?.value } }
    );
    const { data: { user } } = await supabase.auth.getUser();
    const { data: member } = await supabase.from('organization_members').select('organization_id, role').eq('user_id', user!.id).single();

    if (!member) {
        return <div>Anda bukan bagian dari organisasi manapun.</div>;
    }

    const [reportData, { outlets, cashiers }] = await Promise.all([
        getClosingReportData(targetDate, outletId, cashierId),
        getFilterData(member.organization_id)
    ]);
    
    return (
        <HistoryClient 
            initialReportData={reportData}
            outlets={outlets}
            cashiers={cashiers}
            userRole={member.role as 'admin' | 'cashier'}
        />
    );
}
