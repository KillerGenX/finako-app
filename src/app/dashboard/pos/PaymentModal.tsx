"use client";

import { useState, useMemo, useEffect } from 'react';
import { X, CreditCard } from 'lucide-react';

type PaymentModalProps = {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: () => void;
    grandTotal: number;
};

// --- UTILITIES ---

// Formats a raw number string (e.g., "10000") into a formatted string (e.g., "10.000") for input display.
const formatInputNumber = (amountStr: string): string => {
    if (!amountStr) return '';
    const number = parseInt(amountStr, 10);
    return isNaN(number) ? '' : new Intl.NumberFormat('id-ID').format(number);
};

// Formats a number into a full Rupiah currency string (e.g., 10000 -> "Rp 10.000").
// It also rounds the number, which is crucial for cash transactions.
const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(Math.round(amount));
};

export function PaymentModal({ isOpen, onClose, onSubmit, grandTotal }: PaymentModalProps) {
    const [amountReceived, setAmountReceived] = useState('');

    // --- MEMOIZED CALCULATIONS ---

    // Grand total is rounded once and used everywhere to ensure consistency.
    const roundedGrandTotal = useMemo(() => Math.round(grandTotal), [grandTotal]);
    
    const amountReceivedNumber = useMemo(() => parseInt(amountReceived, 10) || 0, [amountReceived]);

    const change = useMemo(() => {
        if (amountReceivedNumber < roundedGrandTotal) return 0;
        return amountReceivedNumber - roundedGrandTotal;
    }, [amountReceivedNumber, roundedGrandTotal]);
    
    const canSubmit = amountReceivedNumber >= roundedGrandTotal;
    const quickCashOptions = [roundedGrandTotal, 10000, 20000, 50000, 100000].filter(
        (val, index, self) => val > 0 && self.indexOf(val) === index
    ).sort((a,b) => a - b);


    // --- SIDE EFFECTS ---

    // Reset state when modal is opened.
    useEffect(() => {
        if (isOpen) {
            setAmountReceived('');
        }
    }, [isOpen]);

    // --- HANDLERS ---

    const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value.replace(/[^0-9]/g, '');
        setAmountReceived(value);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex justify-center items-center font-sans">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md m-4">
                {/* --- HEADER --- */}
                <div className="flex items-center justify-between p-4 border-b dark:border-gray-700">
                    <h2 className="text-xl font-bold">Pembayaran</h2>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* --- BODY --- */}
                <div className="p-6 space-y-4">
                    <div className="text-center mb-4">
                        <p className="text-sm text-gray-500">Total Tagihan</p>
                        <p className="text-4xl font-bold tracking-tight">{formatCurrency(roundedGrandTotal)}</p>
                    </div>

                    <h3 className="font-semibold text-lg border-b pb-2">Metode: Tunai</h3>

                    <div>
                        <label htmlFor="amountReceived" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Uang Diterima</label>
                        <input
                            id="amountReceived"
                            type="text"
                            inputMode="numeric"
                            value={formatInputNumber(amountReceived)}
                            onChange={handleAmountChange}
                            placeholder="0"
                            className="mt-1 w-full text-2xl text-right p-2 border-2 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                            autoFocus
                        />
                    </div>
                    
                    <div className="grid grid-cols-4 gap-2">
                        {quickCashOptions.map(amount => (
                             <button 
                                key={amount} 
                                onClick={() => setAmountReceived(String(amount))}
                                className="p-2 border rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                            >
                                {new Intl.NumberFormat('id-ID').format(amount)}
                            </button>
                        ))}
                    </div>

                    <div className="flex justify-between text-lg p-3 rounded-md bg-gray-50 dark:bg-gray-700/50">
                        <span className="font-medium">Kembalian</span>
                        <span className="font-bold">{formatCurrency(change)}</span>
                    </div>
                </div>

                {/* --- FOOTER --- */}
                <div className="p-4 bg-gray-50 dark:bg-gray-800/50 border-t dark:border-gray-700">
                     <button 
                        onClick={onSubmit} 
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
