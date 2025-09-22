"use client";

import { useState, useMemo, useEffect, useCallback } from 'react';
import { X, CreditCard, DollarSign, QrCode, PlusCircle, Trash2 } from 'lucide-react';

// --- TIPE & KONSTANTA ---
type PaymentMethodEnum = 'cash' | 'qris' | 'card_debit' | 'card_credit' | 'other';
// Tipe state lokal. 'received' adalah uang yang diterima dari pelanggan.
type Payment = { id: number; method: PaymentMethodEnum; amount: number; received: number; };
// Tipe data yang dikirim ke server, sesuai dengan RPC.
type PaymentPayload = { payment_method: PaymentMethodEnum; amount: number; tendered_amount: number };
type PaymentModalProps = { isOpen: boolean; onClose: () => void; onSubmit: (payments: PaymentPayload[]) => void; grandTotal: number; };

const PAYMENT_METHODS_MAP: { [key in PaymentMethodEnum]: { name: string } } = {
    'cash': { name: 'Tunai' }, 'qris': { name: 'QRIS' }, 'card_debit': { name: 'Kartu Debit' },
    'card_credit': { name: 'Kartu Kredit' }, 'other': { name: 'Lainnya' },
};

const formatCurrency = (amount: number): string => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(Math.round(amount));
const parseFormattedNumber = (value: string): number => Number(value.replace(/[^0-9]/g, ''));

// --- KOMPONEN UTAMA ---
export function PaymentModal({ isOpen, onClose, onSubmit, grandTotal }: PaymentModalProps) {
    const [payments, setPayments] = useState<Payment[]>([]);
    const roundedGrandTotal = useMemo(() => Math.round(grandTotal), [grandTotal]);

    const totalPaid = useMemo(() => payments.reduce((acc, p) => acc + p.amount, 0), [payments]);
    const totalReceived = useMemo(() => payments.reduce((acc, p) => acc + p.received, 0), [payments]);
    const remainingAmount = useMemo(() => roundedGrandTotal - totalPaid, [roundedGrandTotal, totalPaid]);
    const totalChange = useMemo(() => (totalReceived > roundedGrandTotal) ? totalReceived - roundedGrandTotal : 0, [totalReceived, roundedGrandTotal]);
    const canSubmit = useMemo(() => totalPaid >= roundedGrandTotal, [totalPaid, roundedGrandTotal]);

    useEffect(() => {
        if (isOpen) {
            const initialAmount = roundedGrandTotal > 0 ? roundedGrandTotal : 0;
            setPayments([{ id: Date.now(), method: 'cash', amount: initialAmount, received: initialAmount }]);
        }
    }, [isOpen, roundedGrandTotal]);
    
    const handleUpdatePayment = (id: number, updatedValues: Partial<Payment>) => {
        setPayments(prev => prev.map(p => p.id === id ? { ...p, ...updatedValues } : p));
    };

    const handleAddPaymentMethod = () => {
        const newAmount = remainingAmount > 0 ? remainingAmount : 0;
        setPayments(prev => [...prev, { id: Date.now(), method: 'qris', amount: newAmount, received: newAmount }]);
    };
    
    const handleRemovePaymentMethod = (id: number) => {
        setPayments(prev => prev.filter(p => p.id !== id));
    };

    const handleSubmit = useCallback(() => {
        if (!canSubmit) return;
        
        let finalPayments = [...payments];
        const totalPaymentsSum = finalPayments.reduce((sum, p) => sum + p.amount, 0);
        const difference = roundedGrandTotal - totalPaymentsSum;

        if (Math.abs(difference) < 1 && difference !== 0 && finalPayments.length > 0) {
            finalPayments[0].amount += difference;
        }
        
        // Kirim data yang bersih dengan nama properti yang benar
        onSubmit(finalPayments.filter(p => p.amount > 0).map(({ method, amount, received }) => ({ 
            payment_method: method, 
            amount, 
            tendered_amount: received // Mengirim 'received' sebagai 'tendered_amount'
        })));
    }, [canSubmit, payments, onSubmit, roundedGrandTotal]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex justify-center items-center font-sans">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md m-4">
                <div className="p-4 border-b flex justify-between items-center"><h2 className="text-xl font-bold">Pembayaran</h2><button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"><X className="h-5 w-5" /></button></div>
                <div className="p-6 max-h-[70vh] overflow-y-auto">
                    <div className="text-center mb-6"><p className="text-sm text-gray-500">Total Tagihan</p><p className="text-4xl font-bold tracking-tight">{formatCurrency(roundedGrandTotal)}</p></div>
                    <div className="space-y-4">
                        {payments.map(p => <PaymentInputRow key={p.id} payment={p} onUpdate={handleUpdatePayment} onRemove={handleRemovePaymentMethod} canBeRemoved={payments.length > 1} remainingAmount={roundedGrandTotal - totalPaid + p.amount}/>)}
                    </div>
                    {remainingAmount > 0.01 && <button onClick={handleAddPaymentMethod} className="mt-4 flex items-center text-teal-600 hover:text-teal-700 text-sm font-semibold"><PlusCircle className="h-4 w-4 mr-2" /> Bayar Sebagian</button>}
                    <div className="mt-6 space-y-2 text-lg">
                        <div className="flex justify-between p-3 rounded-md bg-gray-50 dark:bg-gray-700/50"><span className="font-medium">Total Dibayar</span><span className="font-bold">{formatCurrency(totalPaid)}</span></div>
                        {totalChange > 0 && <div className="flex justify-between p-3 rounded-md bg-blue-50 dark:bg-blue-900/50"><span className="font-medium">Kembalian</span><span className="font-bold">{formatCurrency(totalChange)}</span></div>}
                        {remainingAmount > 0 && <div className="flex justify-between p-3 rounded-md bg-red-50 dark:bg-red-900/50 text-red-600"><span className="font-medium">Sisa Tagihan</span><span className="font-bold">{formatCurrency(remainingAmount)}</span></div>}
                    </div>
                </div>
                <div className="p-4 bg-gray-50 dark:bg-gray-800/50 border-t"><button onClick={handleSubmit} disabled={!canSubmit} className="w-full flex items-center justify-center bg-teal-600 text-white font-bold py-3 rounded-lg hover:bg-teal-700 disabled:bg-gray-400"><CreditCard className="mr-2"/>Selesaikan Transaksi</button></div>
            </div>
        </div>
    );
}

function PaymentInputRow({ payment, onUpdate, onRemove, canBeRemoved, remainingAmount }: { payment: Payment; onUpdate: (id: number, v: Partial<Payment>) => void; onRemove: (id: number) => void; canBeRemoved: boolean; remainingAmount: number; }) {
    const quickCashOptions = useMemo(() => {
        const options = new Set([remainingAmount, 10000, 20000, 50000, 100000]);
        return Array.from(options).filter(val => val > 0).sort((a, b) => a - b);
    }, [remainingAmount]);
    
    const handleCashReceivedChange = (value: number) => {
        onUpdate(payment.id, { received: value, amount: Math.min(value, remainingAmount) });
    };

    return (
        <div className="p-3 border rounded-lg bg-gray-50/50 dark:bg-gray-900/50">
            <div className="flex items-center gap-2">
                <select value={payment.method} onChange={(e) => { const newMethod = e.target.value as PaymentMethodEnum; onUpdate(payment.id, { method: newMethod, received: newMethod === 'cash' ? payment.received : payment.amount }); }} className="p-2 border rounded-md bg-transparent text-sm w-40">
                    {Object.entries(PAYMENT_METHODS_MAP).map(([val, { name }]) => <option key={val} value={val}>{name}</option>)}
                </select>
                {payment.method !== 'cash' &&
                    <input type="text" inputMode="numeric" value={new Intl.NumberFormat('id-ID').format(payment.amount)} onChange={(e) => { const val = parseFormattedNumber(e.target.value); onUpdate(payment.id, { amount: val, received: val }); }} className="w-full text-right p-2 border-2 rounded-md" />
                }
                {canBeRemoved && <button onClick={() => onRemove(payment.id)} className="p-2 text-gray-400 hover:text-red-500"><Trash2 className="h-5 w-5"/></button>}
            </div>
            {payment.method === 'cash' && (
                <div className="mt-3">
                    <label className="block text-sm font-medium">Uang Diterima</label>
                    <input type="text" inputMode="numeric" value={new Intl.NumberFormat('id-ID').format(payment.received)} onChange={(e) => handleCashReceivedChange(parseFormattedNumber(e.target.value))} className="mt-1 w-full text-lg text-right p-2 border-2 rounded-md" autoFocus/>
                    <div className="grid grid-cols-5 gap-2 mt-2">
                        {quickCashOptions.map(amount => (<button key={amount} onClick={() => handleCashReceivedChange(amount)} className="p-1 border rounded-md hover:bg-gray-100 text-xs">{new Intl.NumberFormat('id-ID').format(amount)}</button>))}
                    </div>
                </div>
            )}
        </div>
    );
}
