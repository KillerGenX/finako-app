import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { Info } from 'lucide-react';
import Link from 'next/link';
import DashboardProvider from './DashboardProvider'; // Import the new client wrapper

// This is the server-side banner component.
const TrialBanner = ({ daysLeft }: { daysLeft: number }) => {
    if (daysLeft < 0) return null;

    const message = daysLeft > 1 
        ? `Sisa masa percobaan Anda ${daysLeft} hari lagi.`
        : (daysLeft === 1 ? 'Ini hari terakhir masa percobaan Anda.' : 'Masa percobaan Anda telah berakhir.');

    return (
        <div className="bg-teal-50 dark:bg-teal-900/30 border border-teal-200 dark:border-teal-700 text-teal-800 dark:text-teal-200 text-sm rounded-lg p-4 flex items-center">
            <Info className="h-5 w-5 mr-3 flex-shrink-0" />
            <div className="flex-grow">
                <span>{message}</span>
                <Link href="#" className="ml-2 font-bold underline hover:text-teal-600 dark:hover:text-teal-100">
                    Upgrade Sekarang
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

        // Fetch subscription data
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
        return Math.ceil((end - now) / (1000 * 60 * 60 * 24));
    };

    const trialDaysLeft = subscription?.status === 'trialing' ? calculateDaysLeft(subscription.trial_ends_at) : -1;
    
    return (
        <DashboardProvider userInitials={userInitials.toUpperCase()}>
            <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6 bg-gray-50/50 dark:bg-gray-900/50 overflow-auto">
                {trialDaysLeft >= 0 && <TrialBanner daysLeft={trialDaysLeft} />}
                {children}
            </main>
        </DashboardProvider>
    )
}
