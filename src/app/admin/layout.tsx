import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import AdminProvider from './AdminProvider';
import { ThemeProvider } from '@/components/ThemeProvider';

export default async function AdminLayout({
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
    let pendingPaymentsCount = 0;

    if (user) {
        // Ambil inisial
        const { data: profile } = await supabase.from('profiles').select('full_name').eq('id', user.id).single();
        if (profile?.full_name) {
            const nameParts = profile.full_name.trim().split(' ');
            userInitials = nameParts.length > 1 ? `${nameParts[0][0]}${nameParts[nameParts.length - 1][0]}` : nameParts[0].substring(0, 2);
        }

        // ▼▼▼ AMBIL DATA NOTIFIKASI BARU ▼▼▼
        const { count } = await supabase
            .from('invoices')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'awaiting_confirmation');
        pendingPaymentsCount = count || 0;
    }
    
    return (
        <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
        >
            <AdminProvider userInitials={userInitials.toUpperCase()} notificationCount={pendingPaymentsCount}>
                <main className="flex-1 bg-gray-50/50 dark:bg-gray-900/50 overflow-auto">
                    <div className="w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
                        {children}
                    </div>
                </main>
            </AdminProvider>
        </ThemeProvider>
    )
}
