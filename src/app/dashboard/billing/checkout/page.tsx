"use client";

import { useState, useEffect, useMemo, useTransition } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabaseClient';
import { ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { createInvoice } from './actions'; 

const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
    }).format(price);
};

const durationOptions = [
    { months: 1, label: '1 Bulan', discount: 0 },
    { months: 3, label: '3 Bulan', discount: 0.05 }, // 5% discount
    { months: 6, label: '6 Bulan', discount: 0.10 }, // 10% discount
    { months: 12, label: '12 Bulan', discount: 0.15 }, // 15% discount
];

export default function CheckoutPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const planId = searchParams.get('planId');
    const [plan, setPlan] = useState<any>(null);
    const [selectedDuration, setSelectedDuration] = useState(durationOptions[0]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
    // State untuk Server Action
    const [isPending, startTransition] = useTransition();

    const supabase = createClient();

    useEffect(() => {
        if (!planId) {
            router.push('/dashboard/billing');
            return;
        }

        const fetchPlan = async () => {
            setIsLoading(true);
            const { data, error } = await supabase
                .from('subscription_plans')
                .select('*')
                .eq('id', planId)
                .single();
            
            if (error || !data) {
                setError('Paket tidak ditemukan.');
            } else {
                setPlan(data);
            }
            setIsLoading(false);
        };

        fetchPlan();
    }, [planId, router, supabase]);

    const totalPrice = useMemo(() => {
        if (!plan) return 0;
        const basePrice = plan.price * selectedDuration.months;
        return basePrice * (1 - selectedDuration.discount);
    }, [plan, selectedDuration]);

    const handleCreateInvoice = () => {
        setError(null);
        startTransition(async () => {
            const result = await createInvoice(plan.id, selectedDuration.months, totalPrice);
            if (result.error) {
                setError(result.error);
            } else if (result.invoiceId) {
                router.push(`/dashboard/billing/payment/${result.invoiceId}`);
            }
        });
    };
    

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    if (error && !plan) {
        return <div className="text-red-500 text-center p-8">{error}</div>;
    }

    return (
        <div>
            <Link href="/dashboard/billing" className="inline-flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 mb-4">
                <ArrowLeft className="h-4 w-4" />
                Kembali ke pilihan paket
            </Link>
            
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
                Checkout
            </h1>
            <p className="mt-2 text-lg text-gray-600 dark:text-gray-400">
                Selesaikan pesanan Anda untuk paket <span className="font-bold text-teal-600">{plan?.name}</span>.
            </p>

            <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="md:col-span-2 space-y-4">
                    <h2 className="text-xl font-semibold">Pilih Durasi Langganan</h2>
                    <div className="grid grid-cols-2 gap-4">
                        {durationOptions.map(option => (
                            <button
                                key={option.months}
                                onClick={() => setSelectedDuration(option)}
                                className={`p-4 rounded-lg border-2 text-left transition-colors ${selectedDuration.months === option.months ? 'border-teal-500 bg-teal-50 dark:bg-teal-900/30' : 'border-gray-200 dark:border-gray-700 hover:border-teal-400'}`}
                            >
                                <p className="font-bold text-lg">{option.label}</p>
                                {option.discount > 0 && (
                                    <span className="text-sm font-semibold text-red-500">Diskon {option.discount * 100}%</span>
                                )}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="md:col-span-1 bg-gray-50 dark:bg-gray-800/50 rounded-lg p-6 h-fit">
                    <h2 className="text-xl font-semibold border-b pb-4">Ringkasan Pesanan</h2>
                    <div className="space-y-4 mt-4">
                        <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">Paket</span>
                            <span className="font-medium">{plan?.name}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">Durasi</span>
                            <span className="font-medium">{selectedDuration.label}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">Harga per bulan</span>
                            <span className="font-medium">{formatPrice(plan?.price || 0)}</span>
                        </div>
                         {selectedDuration.discount > 0 && (
                            <div className="flex justify-between text-red-500">
                                <span className="text-red-600 dark:text-red-400">Diskon</span>
                                <span className="font-medium">-{formatPrice(plan.price * selectedDuration.months * selectedDuration.discount)}</span>
                            </div>
                        )}
                        <div className="border-t pt-4 mt-4 flex justify-between font-bold text-lg">
                            <span>Total</span>
                            <span>{formatPrice(totalPrice)}</span>
                        </div>
                    </div>
                    {error && <p className="text-red-500 text-sm mt-4">{error}</p>}
                    <button
                        onClick={handleCreateInvoice}
                        disabled={isPending}
                        className="w-full mt-6 bg-teal-600 hover:bg-teal-700 text-white font-semibold py-3 rounded-lg transition-colors duration-300 flex items-center justify-center disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                        {isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Lanjutkan ke Pembayaran'}
                    </button>
                </div>
            </div>
        </div>
    );
}
