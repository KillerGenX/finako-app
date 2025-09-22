"use client";

import { useState, useMemo, useEffect, useCallback } from 'react';
import { X, CreditCard, DollarSign, QrCode, PlusCircle, Trash2 } from 'lucide-react';

// --- TIPE & KONSTANTA ---
// Tipe data ini MEREPRESENTASIKAN nilai ENUM di database Supabase
type PaymentMethodEnum = 'cash' | 'qris' | 'card_debit' | 'card_credit' | 'other';

type Payment = {
    id: number;
    method: PaymentMethodEnum;
    amount: number;
};

type PaymentModalProps = {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (payments: { payment_method: PaymentMethodEnum; amount: number }[]) => void;
    grandTotal: number;
};

// Objek ini memetakan nilai ENUM ke teks yang ramah pengguna dan ikon
const PAYMENT_METHODS_MAP: { [key in PaymentMethodEnum]: { name: string; icon: React.ReactNode } } = {
    'cash': { name: 'Tunai', icon: <DollarSign className="h-5 w-5 mr-2" /> },
    'qris': { name: 'QRIS', icon: <QrCode className="h-5 w-5 mr-2" /> },
    'card_debit': { name: 'Kartu Debit', icon: <CreditCard className="h-5 w-5 mr-2" /> },
    'card_credit': { name: 'Kartu Kredit', icon: <CreditCard className="h-5 w-5 mr-2" /> },
    'other': { name: 'Lainnya', icon: <CreditCard className="h-5 w-5 mr-2" /> },
};

// --- UTILITIES ---
const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(Math.round(amount));
};

const parseFormattedNumber = (formattedValue: string): number => {
    return Number(formattedValue.replace(/[^0-9]/g, ''));
};


// --- KOMPONEN UTAMA ---
export function PaymentModal({ isOpen, onClose, onSubmit, grandTotal }: PaymentModalProps) {
    const [payments, setPayments] = useState<Payment[]>([]);

    // --- MEMOIZED CALCULATIONS ---
    const roundedGrandTotal = useMemo(() => Math.round(grandTotal), [grandTotal]);
    const totalPaid = useMemo(() => payments.reduce((acc, p) => acc + p.amount, 0), [payments]);
    const remainingAmount = useMemo(() => roundedGrandTotal - totalPaid, [roundedGrandTotal, totalPaid]);
    const change = useMemo(() => totalPaid > roundedGrandTotal ? totalPaid - roundedGrandTotal : 0, [totalPaid, roundedGrandTotal]);
    const canSubmit = useMemo(() => totalPaid >= roundedGrandTotal, [totalPaid, roundedGrandTotal]);

    // --- SIDE EFFECTS ---
    useEffect(() => {
        if (isOpen) {
            setPayments([{ 
                id: Date.now(), 
                method: 'cash', 
                amount: roundedGrandTotal > 0 ? roundedGrandTotal : 0 
            }]);
        }
    }, [isOpen, roundedGrandTotal]);

    // --- HANDLERS ---
    const handleAddPaymentMethod = () => {
        setPayments(prev => [...prev, {
            id: Date.now(),
            method: 'cash',
            amount: remainingAmount > 0 ? remainingAmount : 0
        }]);
    };

    const handleRemovePaymentMethod = (id: number) => {
        setPayments(prev => prev.filter(p => p.id !== id));
    };

    const handleUpdatePayment = (id: number, updatedValues: Partial<Payment>) => {
        setPayments(prev => prev.map(p => p.id === id ? { ...p, ...updatedValues } : p));
    };
    
    const handleSubmit = useCallback(() => {
        if (!canSubmit) return;
        
        const formattedPayments = payments
            .filter(p => p.amount > 0)
            .map(({ method, amount }) => ({
                payment_method: method,
                amount: amount,
            }));
        
        onSubmit(formattedPayments);
    }, [canSubmit, payments, onSubmit]);


    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex justify-center items-center font-sans">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-lg m-4">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b dark:border-gray-700">
                    <h2 className="text-xl font-bold">Pembayaran</h2>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"><X className="h-5 w-5" /></button>
                </div>

                {/* Body */}
                <div className="p-6 max-h-[70vh] overflow-y-auto">
                    <div className="text-center mb-6">
                        <p className="text-sm text-gray-500">Total Tagihan</p>
                        <p className="text-4xl font-bold tracking-tight">{formatCurrency(roundedGrandTotal)}</p>
                    </div>

                    <div className="space-y-4">
                        {payments.map((payment) => (
                            <PaymentInputRow 
                                key={payment.id}
                                payment={payment}
                                onUpdate={handleUpdatePayment}
                                onRemove={handleRemovePaymentMethod}
                                canBeRemoved={payments.length > 1}
                            />
                        ))}
                    </div>

                    <button onClick={handleAddPaymentMethod} className="mt-4 flex items-center text-teal-600 hover:text-teal-700 text-sm font-semibold">
                        <PlusCircle className="h-4 w-4 mr-2" /> Tambah Metode Pembayaran
                    </button>

                    <div className="mt-6 space-y-2 text-lg">
                         <div className="flex justify-between p-3 rounded-md bg-gray-50 dark:bg-gray-700/50">
                            <span className="font-medium">Total Dibayar</span>
                            <span className="font-bold">{formatCurrency(totalPaid)}</span>
                        </div>
                        <div className={`flex justify-between p-3 rounded-md ${remainingAmount > 0 ? 'bg-red-50 dark:bg-red-900/50 text-red-600' : 'bg-blue-50 dark:bg-blue-900/50'}`}>
                            <span className="font-medium">{remainingAmount > 0 ? 'Sisa Tagihan' : 'Kembalian'}</span>
                            <span className="font-bold">{formatCurrency(remainingAmount > 0 ? remainingAmount : change)}</span>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 bg-gray-50 dark:bg-gray-800/50 border-t dark:border-gray-700">
                     <button 
                        onClick={handleSubmit} 
                        disabled={!canSubmit}
                        className="w-full flex items-center justify-center bg-teal-600 text-white font-bold py-3 rounded-lg hover:bg-teal-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed">
                        <CreditCard className="mr-2"/>
                        Selesaikan Transaksi
                    </button>
                </div>
            </div>
        </div>
    );
}


// --- KOMPONEN BANTUAN: PaymentInputRow ---
function PaymentInputRow({ payment, onUpdate, onRemove, canBeRemoved }: { payment: Payment, onUpdate: (id: number, values: Partial<Payment>) => void, onRemove: (id: number) => void, canBeRemoved: boolean }) {
    
    const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const parsedAmount = parseFormattedNumber(e.target.value);
        onUpdate(payment.id, { amount: parsedAmount });
    };

    const handleMethodChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        onUpdate(payment.id, { method: e.target.value as PaymentMethodEnum });
    };

    return (
        <div className="flex items-center gap-2 p-2 rounded-lg border bg-gray-50 dark:bg-gray-900/50 dark:border-gray-700">
            <select 
                value={payment.method}
                onChange={handleMethodChange}
                className="p-2 border rounded-md bg-transparent text-sm"
            >
                {/* Ubah iterasi untuk menggunakan Object.entries pada map */}
                {Object.entries(PAYMENT_METHODS_MAP).map(([enumValue, { name }]) => (
                    <option key={enumValue} value={enumValue}>{name}</option>
                ))}
            </select>
            
            <input
                type="text"
                inputMode="numeric"
                value={new Intl.NumberFormat('id-ID').format(payment.amount)}
                onChange={handleAmountChange}
                placeholder="0"
                className="w-full text-right p-2 border-2 rounded-md bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
            {canBeRemoved && (
                 <button onClick={() => onRemove(payment.id)} title="Hapus metode" className="p-2 text-gray-400 hover:text-red-500">
                    <Trash2 className="h-5 w-5"/>
                </button>
            )}
        </div>
    );
}
