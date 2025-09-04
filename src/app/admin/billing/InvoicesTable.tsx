"use client";

import { useState } from 'react';
import { Eye, X } from 'lucide-react';
import Link from 'next/link';
import ApproveButton from './ApproveButton';
import { confirmManualPayment } from '@/app/dashboard/billing/payment/[invoice_id]/actions';

// Helper functions for formatting
const formatPrice = (price: number | null) => {
    if (price === null) return 'N/A';
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(price);
};
const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

// Modal Component for viewing images
const ProofModal = ({ imageUrl, onClose }: { imageUrl: string; onClose: () => void; }) => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 transition-opacity" onClick={onClose}>
        <div className="relative max-w-4xl max-h-[90vh] p-4" onClick={(e) => e.stopPropagation()}>
            <button
                onClick={onClose}
                className="absolute -top-2 -right-2 z-10 bg-white rounded-full p-1 text-gray-800 hover:bg-gray-200"
            >
                <X className="h-6 w-6" />
            </button>
            <img src={imageUrl} alt="Payment Proof" className="w-full h-full object-contain rounded-lg" />
        </div>
    </div>
);

export default function InvoicesTable({ invoices }: { invoices: any[] }) {
    const [selectedImage, setSelectedImage] = useState<string | null>(null);

    return (
        <>
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-sm">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-800">
                           <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Organisasi</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Paket</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Jumlah</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Tanggal</th>
                                <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                            {invoices.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                                        Tidak ada pembayaran yang menunggu verifikasi.
                                    </td>
                                </tr>
                            )}
                            {invoices.map((invoice: any) => (
                                <tr key={invoice.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">{invoice.organizations?.name || 'N/A'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">{invoice.subscription_plans?.name || 'N/A'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">{formatPrice(invoice.amount)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">{formatDate(invoice.created_at)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                                        <div className="flex items-center justify-center gap-2">
                                            {/* ▼▼▼ TOMBOL DIUBAH UNTUK MEMBUKA MODAL ▼▼▼ */}
                                            <button onClick={() => setSelectedImage(invoice.payment_proof_url)} title="Lihat Bukti" className="p-2 rounded-md text-blue-600 hover:bg-gray-200 dark:text-blue-400 dark:hover:bg-gray-700 disabled:opacity-50" disabled={!invoice.payment_proof_url}>
                                                <Eye className="h-4 w-4" />
                                            </button>
                                            <form action={confirmManualPayment.bind(null, invoice.id)}>
                                                <ApproveButton invoiceId={invoice.id} />
                                            </form>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Render Modal jika ada gambar yang dipilih */}
            {selectedImage && <ProofModal imageUrl={selectedImage} onClose={() => setSelectedImage(null)} />}
        </>
    );
}
