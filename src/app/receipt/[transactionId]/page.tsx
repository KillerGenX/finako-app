// src/app/receipt/[transactionId]/page.tsx

import { createClient } from '@supabase/supabase-js';
import { InvoiceView } from '@/components/shared/InvoiceView';
import { TransactionReceipt } from '@/components/shared/TransactionReceipt'; // Impor TransactionReceipt
import { notFound } from 'next/navigation';

// Tipe untuk parameter halaman diperbarui untuk menyertakan searchParams
type PageProps = {
    params: {
        transactionId: string;
    };
    searchParams: {
        view?: 'receipt' | 'invoice'; // ? membuat parameter ini opsional
    };
};

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function getTransactionData(transactionId: string) {
    if (!transactionId) return null;
    
    const { data, error } = await supabaseAdmin.rpc('get_transaction_details', { 
        p_transaction_id: transactionId 
    });

    if (error) {
        console.error('Error fetching transaction details for public receipt:', error);
        return null;
    }

    return data;
}

export default async function PublicReceiptPage({ params, searchParams }: PageProps) {
    const transactionDetails = await getTransactionData(params.transactionId);

    if (!transactionDetails) {
        notFound();
    }
    
    // Tentukan tampilan mana yang akan dirender berdasarkan query parameter 'view'
    // Defaultnya adalah 'invoice' jika parameter tidak ada atau tidak valid.
    const viewMode = searchParams.view === 'receipt' ? 'receipt' : 'invoice';
    
    const organizationName = process.env.NEXT_PUBLIC_APP_NAME || 'Finako Store';

    return (
        <div className="bg-gray-100 min-h-screen flex flex-col items-center justify-center p-4">
            <main className="w-full max-w-3xl mx-auto">
                {/* 
                  Gunakan logika kondisional untuk merender komponen yang tepat
                  berdasarkan viewMode.
                */}
                {viewMode === 'receipt' ? (
                    <TransactionReceipt details={transactionDetails} />
                ) : (
                    <InvoiceView details={transactionDetails} organizationName={organizationName} />
                )}
            </main>
            <footer className="text-center mt-4 text-gray-500 text-sm">
                <p>Struk ini dibuat secara otomatis oleh {organizationName}.</p>
            </footer>
        </div>
    );
}

export const dynamic = 'force-dynamic';
