import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import HistoryTable from './HistoryTable';

export default async function AdminHistoryPage() {
    const cookieStore = await cookies();
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { cookies: { get: (name) => cookieStore.get(name)?.value } }
    );

    // ▼▼▼ QUERY DIPERBAIKI: Menghapus join 'profiles' ▼▼▼
    const { data: invoices, error } = await supabase
        .from('invoices')
        .select(`
            id,
            amount,
            created_at,
            status,
            user_id, 
            organizations ( name ),
            subscription_plans ( name )
        `)
        .order('created_at', { ascending: false });

    if (error) {
        return <p className="text-red-500">Error fetching invoices: {error.message}</p>;
    }

    return (
        <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Histori Pembayaran</h1>
            <p className="mt-2 text-lg text-gray-600 dark:text-gray-400">
                Lihat semua riwayat transaksi pembayaran langganan di platform.
            </p>

            <div className="mt-8">
                <HistoryTable invoices={invoices || []} />
            </div>
        </div>
    );
}
