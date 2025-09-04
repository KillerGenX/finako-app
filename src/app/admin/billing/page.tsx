import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import InvoicesTable from './InvoicesTable'; // Import komponen client yang baru

export default async function AdminBillingPage() {
    const cookieStore = await cookies();
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { cookies: { get: (name) => cookieStore.get(name)?.value } }
    );

    const { data: invoices, error } = await supabase
        .from('invoices')
        .select(`
            id,
            amount,
            created_at,
            payment_proof_url,
            organizations ( name ),
            subscription_plans ( name )
        `)
        .eq('status', 'awaiting_confirmation')
        .order('created_at', { ascending: true });

    if (error) {
        return <p className="text-red-500">Error fetching invoices: {error.message}</p>;
    }

    return (
        <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Verifikasi Pembayaran</h1>
            <p className="mt-2 text-lg text-gray-600 dark:text-gray-400">
                Tinjau dan setujui pembayaran manual yang dikirim oleh pengguna.
            </p>

            <div className="mt-8">
                {/* Render komponen client dengan data dari server */}
                <InvoicesTable invoices={invoices || []} />
            </div>
        </div>
    );
}
