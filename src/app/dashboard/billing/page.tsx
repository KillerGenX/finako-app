import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { CheckCircle2, Sparkles } from 'lucide-react';
import Link from 'next/link';

const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
    }).format(price);
};

const calculateDaysLeft = (endDate: string | null) => {
    if (!endDate) return 0;
    const end = new Date(endDate).getTime();
    const now = new Date().getTime();
    const difference = end - now;
    return Math.max(0, Math.ceil(difference / (1000 * 60 * 60 * 24)));
};


export default async function BillingPage() {
    const cookieStore = await cookies();
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { cookies: { get: (name) => cookieStore.get(name)?.value } }
    );

    const { data: plans, error: plansError } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('is_active', true)
        .order('price', { ascending: true });

    const { data: { user } } = await supabase.auth.getUser();
    let currentSubscription = null;
    if (user) {
        const { data: member } = await supabase.from('organization_members').select('organization_id').eq('user_id', user.id).single();
        if (member) {
            const { data: subData } = await supabase.from('subscriptions').select('*, subscription_plans(*)').eq('organization_id', member.organization_id).single();
            currentSubscription = subData;
        }
    }

    if (plansError) {
        return <div className="text-red-500">Error loading subscription plans.</div>;
    }

    const trialDaysLeft = currentSubscription?.status === 'trialing' ? calculateDaysLeft(currentSubscription.trial_ends_at) : 0;
    
    return (
        <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
                Pilih Paket Terbaik Untuk Anda
            </h1>
            <p className="mt-2 text-lg text-gray-600 dark:text-gray-400">
                Mulai dengan masa percobaan gratis, dan upgrade kapanpun Anda siap.
            </p>

            <div className="mt-8 grid gap-8 md:grid-cols-2 lg:grid-cols-3 items-stretch">
                {plans?.map((plan) => {
                    const isCurrentPlan = currentSubscription?.plan_id === plan.id;
                    const isComingSoon = plan.name.includes("AI");

                    return (
                        <div
                            key={plan.id}
                            className={`relative flex flex-col rounded-xl border ${isCurrentPlan ? 'border-teal-500 ring-2 ring-teal-500' : 'border-gray-200 dark:border-gray-800'} bg-white dark:bg-gray-900 shadow-sm p-8`}
                        >
                            {isComingSoon && (
                                <div className="absolute top-0 right-0 mr-4 -mt-3">
                                    <span className="inline-flex items-center px-3 py-1 text-sm font-semibold text-purple-600 bg-purple-100 dark:text-purple-200 dark:bg-purple-900/50 rounded-full">
                                        <Sparkles className="h-4 w-4 mr-1.5" />
                                        Coming Soon
                                    </span>
                                </div>
                            )}

                            <h3 className="text-2xl font-bold">{plan.name}</h3>
                            <p className="mt-2 text-gray-500 dark:text-gray-400 min-h-[40px]">{plan.description}</p>
                            
                            <div className="mt-6 flex flex-nowrap items-baseline gap-x-2">
                                {/* ▼▼▼ PERBAIKAN FINAL: UKURAN FONT DIKECILKAN ▼▼▼ */}
                                <span className="text-4xl font-extrabold">{formatPrice(plan.price)}</span>
                                <span className="text-lg font-medium text-gray-500 dark:text-gray-400">/{plan.billing_interval}</span>
                            </div>

                            <ul className="mt-6 space-y-3 text-gray-600 dark:text-gray-300 flex-grow">
                                <li className="flex items-center gap-2">
                                    <CheckCircle2 className="h-5 w-5 text-teal-500" />
                                    <span>Akses semua fitur inti</span>
                                </li>
                                {plan.name.includes("Pro") && (
                                    <li className="flex items-center gap-2">
                                        <CheckCircle2 className="h-5 w-5 text-teal-500" />
                                        <span>Dukungan prioritas</span>
                                    </li>
                                )}
                                {isComingSoon && (
                                    <li className="flex items-center gap-2">
                                        <CheckCircle2 className="h-5 w-5 text-teal-500" />
                                        <span>Fitur AI Otomatis</span>
                                    </li>
                                )}
                            </ul>
                            
                            <div className="mt-8">
                                {plan.name === 'Trial' ? (
                                    <div className="text-center">
                                        <p className="font-semibold text-teal-600 dark:text-teal-400">Paket Anda Saat Ini</p>
                                        <p className="text-sm text-gray-500 mt-1">{trialDaysLeft} hari tersisa</p>
                                    </div>
                                ) : (
                                    <button
                                        disabled={isComingSoon}
                                        className="w-full bg-teal-600 hover:bg-teal-700 text-white font-semibold py-3 rounded-lg transition-colors duration-300 disabled:bg-gray-300 disabled:dark:bg-gray-700 disabled:cursor-not-allowed"
                                    >
                                        {isComingSoon ? 'Segera Hadir' : 'Pilih Paket'}
                                    </button>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
