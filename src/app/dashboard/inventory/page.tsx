// src/app/dashboard/inventory/page.tsx

import Link from 'next/link';
import { Move, BarChart3, FileText, ClipboardCheck, ArchiveX, PackagePlus } from 'lucide-react';

export default function InventoryDashboardPage() {
    return (
        <div className="flex flex-col w-full h-full">
            <h1 className="text-2xl font-bold mb-2">Dashboard Inventaris</h1>
            <p className="text-gray-500 mb-8">Pusat untuk mengelola semua pergerakan stok dan inventaris Anda.</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                
                {/* --- ALUR KERJA UTAMA --- */}
                <Link href="/dashboard/inventory/transfers" className="block p-6 bg-white dark:bg-gray-800 rounded-lg border hover:shadow-lg transition-shadow">
                    <div className="flex items-center gap-4"><div className="p-3 bg-teal-100 dark:bg-teal-900 rounded-lg"><Move className="h-6 w-6 text-teal-600" /></div>
                        <div><h2 className="text-lg font-semibold">Transfer Stok</h2><p className="text-sm text-gray-500">Pindahkan stok antar outlet (Surat Jalan).</p></div>
                    </div>
                </Link>
                <Link href="/dashboard/inventory/purchase-orders" className="block p-6 bg-white dark:bg-gray-800 rounded-lg border hover:shadow-lg transition-shadow">
                    <div className="flex items-center gap-4"><div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-lg"><FileText className="h-6 w-6 text-purple-600" /></div>
                        <div><h2 className="text-lg font-semibold">Pesanan Pembelian</h2><p className="text-sm text-gray-500">Buat Purchase Order (PO) ke pemasok.</p></div>
                    </div>
                </Link>
                <Link href="/dashboard/inventory/stock-report" className="block p-6 bg-white dark:bg-gray-800 rounded-lg border hover:shadow-lg transition-shadow">
                    <div className="flex items-center gap-4"><div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg"><BarChart3 className="h-6 w-6 text-blue-600" /></div>
                        <div><h2 className="text-lg font-semibold">Laporan Stok</h2><p className="text-sm text-gray-500">Lihat kartu stok di semua lokasi.</p></div>
                    </div>
                </Link>

                {/* --- PENYESUAIAN MANUAL (FITUR BARU) --- */}
                <Link href="/dashboard/inventory/stock-opname" className="block p-6 bg-white dark:bg-gray-800 rounded-lg border hover:shadow-lg transition-shadow">
                     <div className="flex items-center gap-4"><div className="p-3 bg-yellow-100 dark:bg-yellow-900 rounded-lg"><ClipboardCheck className="h-6 w-6 text-yellow-600" /></div>
                        <div><h2 className="text-lg font-semibold">Stok Opname</h2><p className="text-sm text-gray-500">Lakukan perhitungan & penyesuaian stok fisik.</p></div>
                    </div>
                </Link>
                <div className="p-6 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-dashed">
                     <div className="flex items-center gap-4 opacity-50"><div className="p-3 bg-gray-200 dark:bg-gray-700 rounded-lg"><ArchiveX className="h-6 w-6 text-gray-500" /></div>
                        <div><h2 className="text-lg font-semibold">Barang Rusak/Hilang</h2><p className="text-sm text-gray-500">(Segera Hadir)</p></div>
                    </div>
                </div>
                <div className="p-6 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-dashed">
                     <div className="flex items-center gap-4 opacity-50"><div className="p-3 bg-gray-200 dark:bg-gray-700 rounded-lg"><PackagePlus className="h-6 w-6 text-gray-500" /></div>
                        <div><h2 className="text-lg font-semibold">Penerimaan Lainnya</h2><p className="text-sm text-gray-500">(Segera Hadir)</p></div>
                    </div>
                </div>

            </div>
        </div>
    );
}
