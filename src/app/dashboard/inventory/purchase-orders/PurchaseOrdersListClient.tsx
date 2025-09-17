"use client";

import Link from 'next/link';
import { PurchaseOrderListItem } from './actions';

const StatusBadge = ({ status }: { status: string }) => {
    const baseClasses = "px-2 py-1 text-xs font-medium rounded-full";
    const statusMap: { [key: string]: string } = {
        draft: "bg-gray-100 text-gray-800",
        ordered: "bg-blue-100 text-blue-800",
        partially_received: "bg-yellow-100 text-yellow-800",
        completed: "bg-green-100 text-green-800",
        cancelled: "bg-red-100 text-red-800",
    };
    return <span className={`${baseClasses} ${statusMap[status] || 'bg-gray-100'}`}>{status}</span>;
};

export function PurchaseOrdersListClient({ purchaseOrders }: { purchaseOrders: PurchaseOrderListItem[] }) {
    
    const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
    const formatCurrency = (amount: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(amount);

    return (
        <div className="border rounded-lg w-full bg-white dark:bg-gray-800/50">
            <div className="relative w-full overflow-auto">
                <table className="w-full caption-bottom text-sm">
                    <thead className="[&_tr]:border-b">
                        <tr className="border-b">
                            <th className="h-12 px-4 text-left font-medium">No. PO</th>
                            <th className="h-12 px-4 text-left font-medium">Pemasok</th>
                            <th className="h-12 px-4 text-left font-medium">Outlet Tujuan</th>
                            <th className="h-12 px-4 text-left font-medium">Tgl. Pesan</th>
                            <th className="h-12 px-4 text-left font-medium">Status</th>
                            <th className="h-12 px-4 text-right font-medium">Total Biaya</th>
                        </tr>
                    </thead>
                    <tbody className="[&_tr:last-child]:border-0">
                        {purchaseOrders.length > 0 ? purchaseOrders.map((po) => (
                            <tr key={po.id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800">
                                <td className="p-4 font-mono">
                                    <Link href={`/dashboard/inventory/purchase-orders/${po.id}`} className="text-teal-600 hover:underline">
                                        {po.po_number}
                                    </Link>
                                </td>
                                <td className="p-4">{po.supplier_name}</td>
                                <td className="p-4">{po.outlet_name}</td>
                                <td className="p-4">{formatDate(po.order_date)}</td>
                                <td className="p-4"><StatusBadge status={po.status} /></td>
                                <td className="p-4 text-right font-semibold">{formatCurrency(po.total_cost)}</td>
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan={6} className="p-8 text-center text-gray-500">
                                    Belum ada pesanan pembelian yang dibuat.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
