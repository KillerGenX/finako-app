import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { Users, CreditCard, Activity } from 'lucide-react';

const StatCard = ({ title, value, icon: Icon }: { title: string, value: string | number, icon: any }) => (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between">
            <p className="text-gray-500 dark:text-gray-400 text-sm">{title}</p>
            <Icon className="h-6 w-6 text-gray-400 dark:text-gray-500" />
        </div>
        <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-2">{value}</p>
    </div>
);

const formatRevenue = (amount: number | null) => {
    if (amount === null) return 'Rp 0';
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
};

export default async function AdminDashboardPage() {
    const cookieStore = await cookies();
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { cookies: { get: (name) => cookieStore.get(name)?.value } }
    );

    // 1. Get Total Users
    const { count: totalUsers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

    // 2. Get Revenue This Month
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString();
    const { data: monthlyInvoices, error: revenueError } = await supabase
        .from('invoices')
        .select('amount')
        .eq('status', 'paid')
        .gte('created_at', firstDayOfMonth);

    const monthlyRevenue = monthlyInvoices?.reduce((sum, invoice) => sum + (invoice.amount || 0), 0);

    // 3. Get Active Subscriptions
    const { count: activeSubscriptions } = await supabase
        .from('subscriptions')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');

    return (
        <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                Admin Dashboard
            </h1>
            <p className="mt-2 text-lg text-gray-600 dark:text-gray-400">
                Ringkasan aktivitas di platform Finako.
            </p>

            <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                <StatCard title="Total Pengguna" value={totalUsers || 0} icon={Users} />
                <StatCard title="Pendapatan (Bulan Ini)" value={formatRevenue(monthlyRevenue || 0)} icon={CreditCard} />
                <StatCard title="Langganan Aktif" value={activeSubscriptions || 0} icon={Activity} />
            </div>
        </div>
    );
}
