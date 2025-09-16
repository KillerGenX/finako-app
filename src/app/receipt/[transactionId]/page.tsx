// src/app/receipt/[transactionId]/page.tsx

import { createClient } from '@supabase/supabase-js';
import { InvoiceView } from '@/components/shared/InvoiceView'; // Menggunakan kembali komponen InvoiceView
import { notFound } from 'next/navigation';

// Tipe untuk parameter halaman
type PageProps = {
    params: {
        transactionId: string;
    };
};

// Buat Supabase client KHUSUS untuk route ini menggunakan service_role key
// Ini aman karena kode ini HANYA berjalan di server.
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY! // Kunci ini harus ada di environment variables Anda
);

// Fungsi untuk mengambil data transaksi dari server
async function getTransactionData(transactionId: string) {
    if (!transactionId) {
        return null;
    }
    
    // Memanggil RPC yang sudah ada
    const { data, error } = await supabaseAdmin.rpc('get_transaction_details', { 
        p_transaction_id: transactionId 
    });

    if (error) {
        console.error('Error fetching transaction details for public receipt:', error);
        return null;
    }

    return data;
}


// Komponen Halaman Publik
export default async function PublicReceiptPage({ params }: PageProps) {
    const transactionDetails = await getTransactionData(params.transactionId);

    // Jika transaksi tidak ditemukan, tampilkan halaman 404
    if (!transactionDetails) {
        notFound();
    }
    
    // Ambil nama organisasi dari environment variable atau default
    const organizationName = process.env.NEXT_PUBLIC_APP_NAME || 'Finako Store';

    return (
        <div className="bg-gray-100 min-h-screen flex flex-col items-center justify-center p-4">
            <main className="w-full max-w-3xl mx-auto">
                {/* 
                  Kita menggunakan kembali komponen InvoiceView yang sudah kita buat.
                  Ini menunjukkan kekuatan dari arsitektur komponen kita.
                */}
                <InvoiceView details={transactionDetails} organizationName={organizationName} />
            </main>
            <footer className="text-center mt-4 text-gray-500 text-sm">
                <p>Struk ini dibuat secara otomatis oleh {organizationName}.</p>
            </footer>
        </div>
    );
}

// Opsi tambahan untuk memaksa route ini menjadi dinamis dan tidak di-cache secara statis
export const dynamic = 'force-dynamic';
