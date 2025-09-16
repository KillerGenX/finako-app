// src/app/dashboard/inventory/page.tsx

import Link from 'next/link';
import { Move, FileText } from 'lucide-react';

export default function InventoryDashboardPage() {
    return (
        <div className="flex flex-col w-full h-full">
            <h1 className="text-2xl font-bold mb-2">Dashboard Inventaris</h1>
            <p className="text-gray-500 mb-8">Pusat untuk mengelola semua pergerakan stok dan inventaris Anda.</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                
                {/* Kartu untuk Transfer Stok (Fitur yang akan kita bangun) */}
                <Link href="/dashboard/inventory/transfers" className="block p-6 bg-white dark:bg-gray-800 rounded-lg border hover:shadow-lg transition-shadow">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-teal-100 dark:bg-teal-900 rounded-lg">
                            <Move className="h-6 w-6 text-teal-600" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold">Transfer Stok</h2>
                            <p className="text-sm text-gray-500">Pindahkan stok antar outlet atau gudang.</p>
                        </div>
                    </div>
                </Link>

                {/* Kartu untuk fitur masa depan, contohnya Purchase Order */}
                <div className="p-6 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-dashed">
                     <div className="flex items-center gap-4 opacity-50">
                        <div className="p-3 bg-gray-200 dark:bg-gray-700 rounded-lg">
                            <FileText className="h-6 w-6 text-gray-500" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold">Pesanan Pembelian</h2>
                            <p className="text-sm text-gray-500">(Segera Hadir)</p>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
