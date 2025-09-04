"use client";

import { useState } from 'react';
import { Eye, X, Check, AlertTriangle, Loader2 } from 'lucide-react';
import { confirmManualPayment } from '@/app/dashboard/billing/payment/[invoice_id]/actions';
import { rejectPayment } from './actions';

// Helper functions
const formatPrice = (price: number | null) => {
    if (price === null) return 'N/A';
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(price);
};
const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

// ▼▼▼ MODAL KONFIRMASI YANG BARU DAN LEBIH BAIK ▼▼▼
const ConfirmationModal = ({ action, onClose, onConfirm, isPending }: {
    action: { type: 'approve' | 'reject', invoice: any };
    onClose: () => void;
    onConfirm: () => void;
    isPending: boolean;
}) => {
    const isApprove = action.type === 'approve';
    const title = isApprove ? 'Setujui Pembayaran?' : 'Tolak Pembayaran?';
    const description = `Anda akan ${isApprove ? 'menyetujui' : 'menolak'} pembayaran untuk ${action.invoice.organizations?.name || 'N/A'}. Aksi ini tidak dapat dibatalkan.`;
    const Icon = isApprove ? Check : X;
    const buttonClass = isApprove ? 'bg-teal-600 hover:bg-teal-700' : 'bg-red-600 hover:bg-red-700';
    const iconBgClass = isApprove ? 'bg-teal-100 dark:bg-teal-900/50' : 'bg-red-100 dark:bg-red-900/50';
    const iconTextClass = isApprove ? 'text-teal-600 dark:text-teal-400' : 'text-red-600 dark:text-red-400';

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/80 p-4 transition-opacity duration-300 animate-in fade-in-0" onClick={onClose}>
            <div 
                className="relative w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-6 text-center transform transition-all duration-300 animate-in fade-in-0 zoom-in-95" 
                onClick={(e) => e.stopPropagation()}
            >
                <div className={`mx-auto flex h-12 w-12 items-center justify-center rounded-full ${iconBgClass}`}>
                    <Icon className={`h-6 w-6 ${iconTextClass}`} />
                </div>
                <h3 className="mt-4 text-xl font-semibold text-gray-900 dark:text-gray-100">{title}</h3>
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">{description}</p>
                <div className="mt-6 flex justify-center gap-3">
                    <button onClick={onClose} className="px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 font-semibold">
                        Batal
                    </button>
                    <button onClick={onConfirm} disabled={isPending} className={`flex items-center justify-center px-4 py-2 rounded-lg text-white font-semibold ${buttonClass} disabled:opacity-50`}>
                        {isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : `Ya, ${isApprove ? 'Setujui' : 'Tolak'}`}
                    </button>
                </div>
            </div>
        </div>
    );
};


const ProofModal = ({ imageUrl, onClose }: { imageUrl: string; onClose: () => void; }) => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/80 p-4" onClick={onClose}><div className="relative w-full max-w-3xl bg-white dark:bg-gray-900 rounded-lg shadow-xl flex flex-col" onClick={(e) => e.stopPropagation()}><div className="p-2 flex justify-end border-b dark:border-gray-700"><button onClick={onClose} className="p-1 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"><X className="h-6 w-6" /></button></div><div className="max-h-[80vh] overflow-auto p-4"><img src={imageUrl} alt="Payment Proof" className="w-full h-auto object-contain" /></div></div></div>
);

export default function InvoicesTable({ invoices }: { invoices: any[] }) {
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [modalAction, setModalAction] = useState<{ type: 'approve' | 'reject', invoice: any } | null>(null);
    const [isPending, startTransition] = useState(false); // Menggunakan useState untuk loading

    const handleConfirm = () => {
        if (!modalAction) return;
        
        startTransition(true);
        
        const actionToRun = modalAction.type === 'approve' 
            ? confirmManualPayment(modalAction.invoice.id)
            : rejectPayment(modalAction.invoice.id);

        actionToRun.finally(() => {
            startTransition(false);
            setModalAction(null);
        });
    };

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
                            {invoices.length === 0 && (<tr><td colSpan={5} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">Tidak ada pembayaran yang menunggu verifikasi.</td></tr>)}
                            {invoices.map((invoice: any) => (
                                <tr key={invoice.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">{invoice.organizations?.name || 'N/A'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">{invoice.subscription_plans?.name || 'N/A'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">{formatPrice(invoice.amount)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">{formatDate(invoice.created_at)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                                        <div className="flex items-center justify-center gap-2">
                                            <button onClick={() => setSelectedImage(invoice.payment_proof_url)} title="Lihat Bukti" className="p-2 rounded-md text-blue-600 hover:bg-gray-200 dark:text-blue-400 dark:hover:bg-gray-700 disabled:opacity-50" disabled={!invoice.payment_proof_url}><Eye className="h-4 w-4" /></button>
                                            <button onClick={() => setModalAction({ type: 'approve', invoice: invoice })} className="p-2 rounded-md bg-teal-600/30 text-teal-300 hover:bg-teal-600/50"><Check className="h-4 w-4" /></button>
                                            <button onClick={() => setModalAction({ type: 'reject', invoice: invoice })} className="p-2 rounded-md bg-red-600/20 text-red-300 hover:bg-red-600/40"><X className="h-4 w-4" /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
            {selectedImage && <ProofModal imageUrl={selectedImage} onClose={() => setSelectedImage(null)} />}
            {modalAction && <ConfirmationModal action={modalAction} onClose={() => setModalAction(null)} onConfirm={handleConfirm} isPending={isPending} />}
        </>
    );
}
