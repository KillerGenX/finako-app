import Link from 'next/link';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { Home, ShoppingCart, Package, Users, LineChart, Settings } from 'lucide-react';
import Header from './Header'; // Importing the client component

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


export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
    // ▼▼▼ PERBAIKAN UTAMA ADA DI SINI ▼▼▼
    // Menambahkan 'await' sesuai dengan pesan error dari TypeScript.
    const cookieStore = await cookies();
    
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            get(name: string) {
              return cookieStore.get(name)?.value
            },
          },
        }
    );

    const { data: { user } } = await supabase.auth.getUser();
    
    let userInitials = '??';

    if (user) {
        const { data: profile } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', user.id)
            .single();

        if (profile?.full_name) {
            const nameParts = profile.full_name.trim().split(' ');
            if (nameParts.length > 1) {
                userInitials = `${nameParts[0][0]}${nameParts[nameParts.length - 1][0]}`;
            } else if (nameParts[0]) {
                userInitials = nameParts[0].substring(0, 2);
            }
        }
    }
    
  return (
    <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
        <Sidebar />
        <div className="flex flex-col">
            <Header userInitials={userInitials.toUpperCase()} />
            <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6 bg-gray-50/50 dark:bg-gray-900/50">
                {children}
            </main>
        </div>
    </div>
  )
}
