import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { CheckCircle2, Sparkles, PlusCircle } from 'lucide-react';
import Link from 'next/link';
import { redirect } from 'next/navigation';

const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(price);
};

const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
};

// ▼▼▼ PANEL STATUS YANG DIPERBARUI DENGAN TOMBOL AKSI ▼▼▼
const CurrentPlanPanel = ({ subscription }: { subscription: any }) => {
    const planName = subscription.subscription_plans?.name || 'N/A';
    const renewalDate = formatDate(subscription.current_period_end);

    return (
        <div className="mb-8 p-6 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-sm">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Langganan Anda Saat Ini</h2>
                    <div className="mt-2 flex items-center gap-4 text-sm">
                        <span className="inline-flex items-center px-3 py-1 font-semibold text-green-700 bg-green-100 dark:text-green-200 dark:bg-green-900/50 rounded-full">
                            Aktif
                        </span>
                        <span className="text-gray-500 dark:text-gray-400">
                            Paket <strong className="text-teal-600 dark:text-teal-400">{planName}</strong> akan berakhir pada <strong className="text-gray-800 dark:text-gray-200">{renewalDate}</strong>
                        </span>
                    </div>
                </div>
                <Link
                    href={`/dashboard/billing/checkout?planId=${subscription.plan_id}`}
                    className="flex items-center justify-center gap-2 w-full md:w-auto px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-lg transition-colors duration-300"
                >
                    <PlusCircle className="h-5 w-5" />
                    Perpanjang / Tambah Durasi
                </Link>
            </div>
        </div>
    );
};


export default async function BillingPage() {
    const cookieStore = await cookies();
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { cookies: { get: (name) => cookieStore.get(name)?.value } }
    );

    const { data: { user } } = await supabase.auth.getUser();
    let currentSubscription = null;
    let organizationId = null;

    if (user) {
        const { data: member } = await supabase.from('organization_members').select('organization_id').eq('user_id', user.id).single();
        if (member) {
            organizationId = member.organization_id;
            const { data: subData } = await supabase.from('subscriptions').select('*, subscription_plans(*)').eq('organization_id', organizationId).single();
            currentSubscription = subData;
        }
    }

    if (organizationId) {
        const { data: pendingInvoice } = await supabase.from('invoices').select('id').eq('organization_id', organizationId).in('status', ['pending', 'awaiting_confirmation']).maybeSingle();
        if (pendingInvoice) {
            redirect(`/dashboard/billing/payment/${pendingInvoice.id}`);
        }
    }

    const { data: plans, error: plansError } = await supabase.from('subscription_plans').select('*').eq('is_active', true).neq('name', 'Trial').order('price', { ascending: true });

    if (plansError) {
        return <div className="text-red-500">Error loading subscription plans.</div>;
    }
    
    return (
        <div>
            {currentSubscription && currentSubscription.status === 'active' && (
                <CurrentPlanPanel subscription={currentSubscription} />
            )}

            <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
                {currentSubscription && currentSubscription.status === 'active' ? 'Ubah Paket Anda' : 'Pilih Paket Terbaik Untuk Anda'}
            </h1>
            <p className="mt-2 text-lg text-gray-600 dark:text-gray-400">
                {currentSubscription && currentSubscription.status === 'active' ? 'Pilih paket lain untuk mengubah langganan Anda.' : 'Mulai dengan masa percobaan gratis, dan upgrade kapanpun Anda siap.'}
            </p>

            <div className="mt-8 grid gap-8 md:grid-cols-2 lg:grid-cols-3 items-stretch">
                {plans?.map((plan) => {
                    const isCurrentPlan = currentSubscription?.plan_id === plan.id;
                    const isComingSoon = plan.name.includes("AI");

                    return (
                        <div key={plan.id} className={`relative flex flex-col rounded-xl border ${isCurrentPlan ? 'border-teal-500 ring-2 ring-teal-500' : 'border-gray-200 dark:border-gray-800'} bg-white dark:bg-gray-900 shadow-sm p-8`}>
                            {isComingSoon && (<div className="absolute top-0 right-0 mr-4 -mt-3"><span className="inline-flex items-center px-3 py-1 text-sm font-semibold text-purple-600 bg-purple-100 dark:text-purple-200 dark:bg-purple-900/50 rounded-full"><Sparkles className="h-4 w-4 mr-1.5" />Coming Soon</span></div>)}
                            <h3 className="text-2xl font-bold">{plan.name}</h3>
                            <p className="mt-2 text-gray-500 dark:text-gray-400 min-h-[40px]">{plan.description}</p>
                            <div className="mt-6 flex flex-nowrap items-baseline gap-x-2"><span className="text-4xl font-extrabold">{formatPrice(plan.price)}</span><span className="text-lg font-medium text-gray-500 dark:text-gray-400">/{plan.billing_interval}</span></div>
                            <ul className="mt-6 space-y-3 text-gray-600 dark:text-gray-300 flex-grow">
                                <li className="flex items-center gap-2"><CheckCircle2 className="h-5 w-5 text-teal-500" /><span>Akses semua fitur inti</span></li>
                                {plan.name.includes("Pro") && (<li className="flex items-center gap-2"><CheckCircle2 className="h-5 w-5 text-teal-500" /><span>Dukungan prioritas</span></li>)}
                                {isComingSoon && (<li className="flex items-center gap-2"><CheckCircle2 className="h-5 w-5 text-teal-500" /><span>Fitur AI Otomatis</span></li>)}
                            </ul>
                            <div className="mt-8">
                                {isCurrentPlan ? (
                                    <span className="block w-full text-center px-4 py-3 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 font-semibold">Paket Anda Saat Ini</span>
                                ) : isComingSoon ? (
                                    <span className="block w-full text-center px-4 py-3 rounded-lg bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed font-semibold">Segera Hadir</span>
                                ) : (
                                    <Link href={`/dashboard/billing/checkout?planId=${plan.id}`} className="block w-full text-center px-4 py-3 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-semibold transition-colors duration-300">
                                        {currentSubscription?.subscription_plans?.price > plan.price ? 'Downgrade' : 'Upgrade'}
                                    </Link>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
