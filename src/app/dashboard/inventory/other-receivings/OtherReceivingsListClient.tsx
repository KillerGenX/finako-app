"use client";

import Link from 'next/link';
import { OtherReceivingListItem } from './actions';

export function OtherReceivingsListClient({ receivings }: { receivings: OtherReceivingListItem[] }) {
    
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
                        {receivings.length > 0 ? receivings.map((r) => (
                            <tr key={r.id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800">
                                <td className="p-4 font-mono">
                                    <Link href={`/dashboard/inventory/other-receivings/${r.id}`} className="text-teal-600 hover:underline">
                                        {r.receiving_number}
                                    </Link>
                                </td>
                                <td className="p-4">{r.outlet_name}</td>
                                <td className="p-4">{formatDate(r.created_at)}</td>
                                <td className="p-4 truncate max-w-xs">{r.notes || '-'}</td>
                                <td className="p-4 text-right">{r.item_count}</td>
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan={5} className="p-8 text-center text-gray-500">
                                    Belum ada catatan penerimaan lainnya.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
