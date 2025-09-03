import Link from 'next/link';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { Home, ShoppingCart, Package, Users, LineChart, Settings, Info } from 'lucide-react';
import Header from './Header'; // Importing the client component

// (Sidebar component remains the same)
const Sidebar = () => (
    <div className="hidden border-r bg-gray-100/40 dark:bg-gray-800/40 md:block">
        <div className="flex h-full max-h-screen flex-col gap-2">
            <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
                <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
                    <img src="/finako.svg" alt="Finako Logo" className="h-6 w-6" />
                    <span className="">Finako</span>
                </Link>
            </div>
            <div className="flex-1">
                <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
                    <Link
                        href="/dashboard"
                        className="flex items-center gap-3 rounded-lg bg-gray-100 dark:bg-gray-800 px-3 py-2 text-teal-600 dark:text-teal-400 transition-all hover:text-teal-700 dark:hover:text-teal-500"
                    >
                        <Home className="h-4 w-4" />
                        Dashboard
                    </Link>
                    <Link
                        href="#"
                        className="flex items-center gap-3 rounded-lg px-3 py-2 text-gray-500 dark:text-gray-400 transition-all hover:text-gray-900 dark:hover:text-gray-50"
                    >
                        <ShoppingCart className="h-4 w-4" />
                        Transaksi
                    </Link>
                    <Link
                        href="#"
                        className="flex items-center gap-3 rounded-lg px-3 py-2 text-gray-500 dark:text-gray-400 transition-all hover:text-gray-900 dark:hover:text-gray-50"
                    >
                        <Package className="h-4 w-4" />
                        Produk
                    </Link>
                    <Link
                        href="#"
                        className="flex items-center gap-3 rounded-lg px-3 py-2 text-gray-500 dark:text-gray-400 transition-all hover:text-gray-900 dark:hover:text-gray-50"
                    >
                        <Users className="h-4 w-4" />
                        Pelanggan
                    </Link>
                    <Link
                        href="#"
                        className="flex items-center gap-3 rounded-lg px-3 py-2 text-gray-500 dark:text-gray-400 transition-all hover:text-gray-900 dark:hover:text-gray-50"
                    >
                        <LineChart className="h-4 w-4" />
                        Laporan
                    </Link>
                </nav>
            </div>
            <div className="mt-auto p-4">
                <Link
                    href="#"
                    className="flex items-center gap-3 rounded-lg px-3 py-2 text-gray-500 dark:text-gray-400 transition-all hover:text-gray-900 dark:hover:text-gray-50"
                >
                    <Settings className="h-4 w-4" />
                    Pengaturan
                </Link>
            </div>
        </div>
    </div>
);


// ▼▼▼ KOMPONEN BARU UNTUK BANNER ▼▼▼
const TrialBanner = ({ daysLeft }: { daysLeft: number }) => {
    if (daysLeft < 0) return null;

    const message = daysLeft > 1 
        ? `You have ${daysLeft} days left in your trial.`
        : (daysLeft === 1 ? 'This is the last day of your trial.' : 'Your trial has ended.');

    return (
        <div className="bg-teal-50 dark:bg-teal-900/30 border border-teal-200 dark:border-teal-700 text-teal-800 dark:text-teal-200 text-sm rounded-lg p-4 flex items-center">
            <Info className="h-5 w-5 mr-3 flex-shrink-0" />
            <div className="flex-grow">
                <span>{message}</span>
                <Link href="#" className="ml-2 font-bold underline hover:text-teal-600 dark:hover:text-teal-100">
                    Upgrade Now
                </Link>
            </div>
        </div>
    );
};


export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
    const cookieStore = await cookies();
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { cookies: { get: (name) => cookieStore.get(name)?.value } }
    );

    const { data: { user } } = await supabase.auth.getUser();
    
    let userInitials = '??';
    let subscription = null;

    if (user) {
        // Fetch profile for initials
        const { data: profile } = await supabase.from('profiles').select('full_name').eq('id', user.id).single();
        if (profile?.full_name) {
            const nameParts = profile.full_name.trim().split(' ');
            userInitials = nameParts.length > 1 ? `${nameParts[0][0]}${nameParts[nameParts.length - 1][0]}` : nameParts[0].substring(0, 2);
        }

        // ▼▼▼ PENGAMBILAN DATA LANGGANAN ▼▼▼
        const { data: member } = await supabase.from('organization_members').select('organization_id').eq('user_id', user.id).single();
        if (member) {
            const { data: subData } = await supabase.from('subscriptions').select('status, trial_ends_at').eq('organization_id', member.organization_id).single();
            subscription = subData;
        }
    }

    const calculateDaysLeft = (endDate: string | null) => {
        if (!endDate) return -1;
        const end = new Date(endDate).getTime();
        const now = new Date().getTime();
        const difference = end - now;
        return Math.ceil(difference / (1000 * 60 * 60 * 24));
    };

    const trialDaysLeft = subscription?.status === 'trialing' ? calculateDaysLeft(subscription.trial_ends_at) : -1;
    
    return (
        <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
            <Sidebar />
            <div className="flex flex-col">
                <Header userInitials={userInitials.toUpperCase()} />
                <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6 bg-gray-50/50 dark:bg-gray-900/50">
                    {trialDaysLeft >= 0 && <TrialBanner daysLeft={trialDaysLeft} />}
                    {children}
                </main>
            </div>
        </div>
    )
}
