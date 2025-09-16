// src/app/dashboard/history/page.tsx
import { HistoryClient } from './HistoryClient';
import { getTransactionHistory } from './actions';

export default async function HistoryPage() {
    // Memanggil tanpa filter untuk memuat data awal halaman pertama
    const initialTransactions = await getTransactionHistory({ page: 1, pageSize: 25 });

    return (
        <div className="flex flex-col w-full h-full">
            <h1 className="text-2xl font-bold mb-6">Riwayat Transaksi</h1>
            <HistoryClient initialData={initialTransactions} />
        </div>
    );
}
