"use client";

import { useState } from 'react';
import Link from 'next/link';
import { StockTransferListItem } from './actions';

const StatusBadge = ({ status }: { status: string }) => {
    const baseClasses = "px-2 py-1 text-xs font-medium rounded-full";
    const statusMap: { [key: string]: string } = {
        draft: "bg-gray-100 text-gray-800",
        sent: "bg-blue-100 text-blue-800",
        received: "bg-green-100 text-green-800",
        cancelled: "bg-red-100 text-red-800",
    };
    return <span className={`${baseClasses} ${statusMap[status] || 'bg-gray-100'}`}>{status}</span>;
};

export function TransfersListClient({ transfers }: { transfers: StockTransferListItem[] }) {
    
    const formatDate = (dateString: string | null) => {
        if (!dateString) return '-';
        return new Intl.DateTimeFormat('id-ID', {
            dateStyle: 'medium',
            timeStyle: 'short',
        }).format(new Date(dateString));
    };

    return (
        <div className="border rounded-lg w-full bg-white dark:bg-gray-800/50">
            <div className="relative w-full overflow-auto">
                <table className="w-full caption-bottom text-sm">
                    <thead className="[&_tr]:border-b">
                        <tr className="border-b transition-colors hover:bg-muted/50">
                            <th className="h-12 px-4 text-left align-middle font-medium">No. Surat Jalan</th>
                            <th className="h-12 px-4 text-left align-middle font-medium">Dari</th>
                            <th className="h-12 px-4 text-left align-middle font-medium">Ke</th>
                            <th className="h-12 px-4 text-left align-middle font-medium">Status</th>
                            <th className="h-12 px-4 text-left align-middle font-medium">Tgl. Kirim</th>
                            <th className="h-12 px-4 text-right align-middle font-medium">Jumlah Item</th>
                        </tr>
                    </thead>
                    <tbody className="[&_tr:last-child]:border-0">
                        {transfers.length > 0 ? transfers.map((tr) => (
                            <tr key={tr.id} className="border-b transition-colors hover:bg-gray-50 dark:hover:bg-gray-800">
                                <td className="p-4 align-middle font-mono">
                                    <Link href={`/dashboard/inventory/transfers/${tr.id}`} className="text-teal-600 hover:underline">
                                        {tr.transfer_number}
                                    </Link>
                                </td>
                                <td className="p-4 align-middle">{tr.outlet_from_name}</td>
                                <td className="p-4 align-middle">{tr.outlet_to_name}</td>
                                <td className="p-4 align-middle"><StatusBadge status={tr.status} /></td>
                                <td className="p-4 align-middle">{formatDate(tr.sent_at)}</td>
                                <td className="p-4 align-middle text-right">{tr.item_count}</td>
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan={6} className="p-8 text-center text-gray-500">
                                    Belum ada transfer stok yang dibuat.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
