"use client";

import Link from 'next/link';
import { WriteOffListItem } from './actions';

export function WriteOffsListClient({ writeOffs }: { writeOffs: WriteOffListItem[] }) {
    
    const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });

    return (
        <div className="border rounded-lg w-full bg-white dark:bg-gray-800/50">
            <div className="relative w-full overflow-auto">
                <table className="w-full caption-bottom text-sm">
                    <thead className="[&_tr]:border-b">
                        <tr className="border-b">
                            <th className="h-12 px-4 text-left font-medium">No. Dokumen</th>
                            <th className="h-12 px-4 text-left font-medium">Outlet</th>
                            <th className="h-12 px-4 text-left font-medium">Tanggal</th>
                            <th className="h-12 px-4 text-left font-medium">Catatan</th>
                            <th className="h-12 px-4 text-right font-medium">Jumlah Item</th>
                        </tr>
                    </thead>
                    <tbody className="[&_tr:last-child]:border-0">
                        {writeOffs.length > 0 ? writeOffs.map((wo) => (
                            <tr key={wo.id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800">
                                <td className="p-4 font-mono">
                                    <Link href={`/dashboard/inventory/write-offs/${wo.id}`} className="text-teal-600 hover:underline">
                                        {wo.write_off_number}
                                    </Link>
                                </td>
                                <td className="p-4">{wo.outlet_name}</td>
                                <td className="p-4">{formatDate(wo.created_at)}</td>
                                <td className="p-4 truncate max-w-xs">{wo.notes || '-'}</td>
                                <td className="p-4 text-right">{wo.item_count}</td>
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan={5} className="p-8 text-center text-gray-500">
                                    Belum ada catatan barang rusak/hilang.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
