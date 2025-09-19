// src/app/dashboard/reports/page.tsx
import Link from 'next/link';
import { AreaChart, ShoppingBag, Users, Landmark, ArchiveX, Truck, ClipboardCheck } from 'lucide-react';

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
                            <h2 className="text-lg font-semibold">Laporan Penjualan & Laba</h2>
                            <p className="text-sm text-gray-500">Analisis pendapatan, HPP, dan profitabilitas.</p>
                        </div>
                    </div>
                </Link>

                {/* --- Placeholder untuk Laporan Masa Depan --- */}
                <div className="block p-6 bg-gray-50 dark:bg-gray-800/50 rounded-lg border cursor-not-allowed opacity-60">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
                            <ShoppingBag className="h-6 w-6 text-blue-600" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold">Laporan Produk</h2>
                            <p className="text-sm text-gray-500">Analisis produk terlaris. (Segera Hadir)</p>
                        </div>
                    </div>
                </div>

                <div className="block p-6 bg-gray-50 dark:bg-gray-800/50 rounded-lg border cursor-not-allowed opacity-60">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
                            <Users className="h-6 w-6 text-yellow-600" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold">Laporan Pelanggan</h2>
                            <p className="text-sm text-gray-500">Analisis pelanggan setia. (Segera Hadir)</p>
                        </div>
                    </div>
                </div>

                <div className="block p-6 bg-gray-50 dark:bg-gray-800/50 rounded-lg border cursor-not-allowed opacity-60">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-indigo-100 dark:bg-indigo-900 rounded-lg">
                            <Landmark className="h-6 w-6 text-indigo-600" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold">Laporan Pajak</h2>
                            <p className="text-sm text-gray-500">Ringkasan pajak penjualan. (Segera Hadir)</p>
                        </div>
                    </div>
                </div>
                
                <div className="block p-6 bg-gray-50 dark:bg-gray-800/50 rounded-lg border cursor-not-allowed opacity-60">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-red-100 dark:bg-red-900 rounded-lg">
                            <ArchiveX className="h-6 w-6 text-red-600" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold">Laporan Barang Rusak</h2>
                            <p className="text-sm text-gray-500">Analisis kerugian stok. (Segera Hadir)</p>
                        </div>
                    </div>
                </div>

                <div className="block p-6 bg-gray-50 dark:bg-gray-800/50 rounded-lg border cursor-not-allowed opacity-60">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-sky-100 dark:bg-sky-900 rounded-lg">
                            <Truck className="h-6 w-6 text-sky-600" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold">Laporan Transfer Stok</h2>
                            <p className="text-sm text-gray-500">Riwayat pergerakan stok. (Segera Hadir)</p>
                        </div>
                    </div>
                </div>

                <div className="block p-6 bg-gray-50 dark:bg-gray-800/50 rounded-lg border cursor-not-allowed opacity-60">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-orange-100 dark:bg-orange-900 rounded-lg">
                            <ClipboardCheck className="h-6 w-6 text-orange-600" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold">Laporan Stok Opname</h2>
                            <p className="text-sm text-gray-500">Analisis selisih stok. (Segera Hadir)</p>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
