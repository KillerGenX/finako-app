import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { Info, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import DashboardProvider from './DashboardProvider'; 

const SubscriptionBanner = ({ message, variant, actionText, actionLink }: {
    message: string;
    variant: 'teal' | 'yellow';
    actionText: string;
    actionLink: string;
}) => {
    const isWarning = variant === 'yellow';
    const bgColor = isWarning ? 'bg-yellow-50 dark:bg-yellow-900/30' : 'bg-teal-50 dark:bg-teal-900/30';
    const borderColor = isWarning ? 'border-yellow-200 dark:border-yellow-700' : 'border-teal-200 dark:border-teal-700';
    const textColor = isWarning ? 'text-yellow-800 dark:text-yellow-200' : 'text-teal-800 dark:text-teal-200';
    const Icon = isWarning ? AlertTriangle : Info;

    return (
        <div className={`${bgColor} ${borderColor} ${textColor} border text-sm rounded-lg p-4 flex items-center`}>
            <Icon className="h-5 w-5 mr-3 flex-shrink-0" />
            <div className="flex-grow">
                <span>{message}</span>
                <Link href={actionLink} className="ml-2 font-bold underline hover:opacity-80">
                    {actionText}
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
    let notificationCount = 0;

    if (user) {
        const { data: profile } = await supabase.from('profiles').select('full_name').eq('id', user.id).single();
        if (profile?.full_name) {
            const nameParts = profile.full_name.trim().split(' ');
            userInitials = nameParts.length > 1 ? `${nameParts[0][0]}${nameParts[nameParts.length - 1][0]}` : nameParts[0].substring(0, 2);
        }

        const { data: member } = await supabase.from('organization_members').select('organization_id').eq('user_id', user.id).single();
        if (member) {
            const { data: subData } = await supabase.from('subscriptions').select('status, trial_ends_at, current_period_end').eq('organization_id', member.organization_id).single();
            subscription = subData;
        }

        const { count } = await supabase
            .from('user_notifications')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id)
            .eq('is_read', false);
        notificationCount = count || 0;
    }

    const calculateDaysLeft = (endDate: string | null) => {
        if (!endDate) return -1;
        const end = new Date(endDate).getTime();
        const now = new Date().getTime();
        return Math.ceil((end - now) / (1000 * 60 * 60 * 24));
    };

    let notification = null;
    if (subscription) {
        if (subscription.status === 'trialing') {
            const daysLeft = calculateDaysLeft(subscription.trial_ends_at);
            if (daysLeft >= 0) {
                const isUrgent = daysLeft <= 7;
                notification = { message: `Masa percobaan Anda ${isUrgent ? 'akan berakhir dalam' : 'tersisa'} ${daysLeft} hari lagi.`, variant: isUrgent ? 'yellow' : 'teal', actionText: 'Upgrade Sekarang', actionLink: '/dashboard/billing' };
            }
        } else if (subscription.status === 'active') {
            const daysLeft = calculateDaysLeft(subscription.current_period_end);
            if (daysLeft >= 0 && daysLeft <= 7) {
                 notification = { message: `Langganan Anda akan berakhir dalam ${daysLeft} hari.`, variant: 'yellow', actionText: 'Perpanjang Sekarang', actionLink: '/dashboard/billing' };
            }
        }
    }
    
    return (
        <DashboardProvider userInitials={userInitials.toUpperCase()} notificationCount={notificationCount}>
            <main className="flex flex-col flex-1 gap-4 p-4 lg:gap-6 lg:p-6 bg-gray-50/50 dark:bg-gray-900/50 overflow-auto">
                {notification && <SubscriptionBanner message={notification.message} variant={notification.variant as 'teal' | 'yellow'} actionText={notification.actionText} actionLink={notification.actionLink} />}
                {children}
            </main>
        </DashboardProvider>
    )
}
