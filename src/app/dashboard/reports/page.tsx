// src/app/dashboard/reports/page.tsx
import Link from 'next/link';
import { AreaChart, ShoppingBag, Landmark, Archive } from 'lucide-react';

export default function ReportsDashboardPage() {
    return (
        <div className="flex flex-col w-full h-full">
            <h1 className="text-2xl font-bold mb-2">Dashboard Laporan</h1>
            <p className="text-gray-500 mb-8">Pusat untuk menganalisis data dan mendapatkan wawasan bisnis.</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                
                {/* --- Laporan Aktif --- */}
                <Link href="/dashboard/reports/sales" className="block p-6 bg-white dark:bg-gray-800 rounded-lg border hover:shadow-lg transition-shadow">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-green-100 dark:bg-green-900 rounded-lg">
                            <AreaChart className="h-6 w-6 text-green-600" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold">Laporan Penjualan</h2>
                            <p className="text-sm text-gray-500">Analisis pendapatan, laba, produk, dan pelanggan.</p>
                        </div>
                    </div>
                </Link>

                {/* --- Laporan Pajak (Prioritas Selanjutnya) --- */}
                <div className="block p-6 bg-gray-50 dark:bg-gray-800/50 rounded-lg border cursor-not-allowed opacity-60">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-indigo-100 dark:bg-indigo-900 rounded-lg">
                            <Landmark className="h-6 w-6 text-indigo-600" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold">Laporan Pajak</h2>
                            <p className="text-sm text-gray-500">Rincian pajak penjualan untuk pelaporan. (Segera Hadir)</p>
                        </div>
                    </div>
                </div>

                {/* --- Laporan Inventaris --- */}
                <div className="block p-6 bg-gray-50 dark:bg-gray-800/50 rounded-lg border cursor-not-allowed opacity-60">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-sky-100 dark:bg-sky-900 rounded-lg">
                            <Archive className="h-6 w-6 text-sky-600" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold">Laporan Inventaris</h2>
                            <p className="text-sm text-gray-500">Analisis stok, transfer, dan opname. (Segera Hadir)</p>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
