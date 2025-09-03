import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { notFound } from 'next/navigation';
import PaymentOptions from './PaymentOptions'; // Komponen interaktif yang akan kita buat

const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
    }).format(price);
};

export default async function PaymentPage({ params }: { params: { invoice_id: string } }) {
    const invoiceId = params.invoice_id;
    const cookieStore = await cookies();
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { cookies: { get: (name) => cookieStore.get(name)?.value } }
    );

    const { data: invoice, error } = await supabase
        .from('invoices')
        .select(`
            *,
            subscription_plans (name)
        `)
        .eq('id', invoiceId)
        .single();

    if (error || !invoice) {
        notFound();
    }

    // Jika invoice sudah dibayar atau selesai, arahkan ke dashboard
    if (invoice.status === 'paid' || invoice.status === 'awaiting_confirmation') {
        // Sebaiknya arahkan ke halaman status invoice, tapi untuk sekarang ke dashboard
        // redirect('/dashboard'); 
        // Untuk saat ini, kita tampilkan pesan saja agar tidak redirect loop saat testing
    }

    return (
        <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
                Selesaikan Pembayaran Anda
            </h1>
            <p className="mt-2 text-lg text-gray-600 dark:text-gray-400">
                Invoice ID: <span className="font-mono text-sm bg-gray-100 dark:bg-gray-800 p-1 rounded">{invoice.id}</span>
            </p>

            <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Kolom Ringkasan */}
                <div className="md:col-span-1 bg-gray-50 dark:bg-gray-800/50 rounded-lg p-6 h-fit order-last md:order-first">
                    <h2 className="text-xl font-semibold border-b pb-4">Ringkasan Invoice</h2>
                    <div className="space-y-4 mt-4">
                        <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">Paket</span>
                            <span className="font-medium">{invoice.subscription_plans?.name || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">Durasi</span>
                            <span className="font-medium">{invoice.billing_duration_months} Bulan</span>
                        </div>
                        <div className="border-t pt-4 mt-4 flex justify-between font-bold text-lg">
                            <span>Total Tagihan</span>
                            <span>{formatPrice(invoice.amount)}</span>
                        </div>
                    </div>
                </div>

                {/* Kolom Opsi Pembayaran */}
                <div className="md:col-span-2">
                    <PaymentOptions invoice={invoice} />
                </div>
            </div>
        </div>
    );
}
