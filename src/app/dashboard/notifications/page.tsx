// src/app/dashboard/notifications/page.tsx
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { Bell, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

async function getAllNotifications() {
    const cookieStore = await cookies();
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { cookies: { get: (name) => cookieStore.get(name)?.value } }
    );
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
        .from('user_notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
    
    if (error) {
        console.error('Error fetching all notifications:', error);
        return [];
    }
    return data;
}

export default async function NotificationsPage() {
    const notifications = await getAllNotifications();

    return (
        <div className="w-full">
            <div className="mb-6">
                <Link href="/dashboard" className="inline-flex items-center text-sm font-medium text-gray-600 hover:text-gray-900">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Kembali ke Dashboard
                </Link>
                <h1 className="text-2xl font-bold mt-2 flex items-center gap-2">
                    <Bell /> Semua Notifikasi
                </h1>
            </div>

            <div className="border rounded-lg bg-white dark:bg-gray-900/50">
                <ul className="divide-y dark:divide-gray-700">
                    {notifications.length > 0 ? (
                        notifications.map(notif => (
                            <li key={notif.id}>
                                <Link href={notif.link || '#'} className={`block p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 ${!notif.is_read ? 'bg-teal-50 dark:bg-teal-900/20' : ''}`}>
                                    <p className={`font-medium ${!notif.is_read ? 'text-gray-800 dark:text-gray-100' : 'text-gray-600 dark:text-gray-300'}`}>{notif.message}</p>
                                    <p className="text-xs text-gray-400 mt-1">
                                        {new Date(notif.created_at).toLocaleString('id-ID', {
                                            day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
                                        })}
                                    </p>
                                </Link>
                            </li>
                        ))
                    ) : (
                        <li className="p-6 text-center text-gray-500">
                            Tidak ada notifikasi untuk ditampilkan.
                        </li>
                    )}
                </ul>
            </div>
        </div>
    );
}
