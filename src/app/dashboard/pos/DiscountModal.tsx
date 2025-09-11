"use client";

import { useState, useEffect } from 'react';
import { X, Percent, Tag } from 'lucide-react';

type DiscountModalProps = {
    isOpen: boolean;
    onClose: () => void;
    onApply: (discount: { type: 'percentage' | 'fixed'; value: number }) => void;
    itemName?: string; // Optional: for item-specific discount title
    basePrice: number;  // The price the discount is applied to
};

// Utility to format numbers as Rupiah currency string
const formatRupiah = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount);
};

export function DiscountModal({ isOpen, onClose, onApply, itemName, basePrice }: DiscountModalProps) {
    const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('percentage');
    const [discountValue, setDiscountValue] = useState('');

    useEffect(() => {
        if (isOpen) {
            setDiscountValue('');
            setDiscountType('percentage');
        }
    }, [isOpen]);

    const handleApply = () => {
        const value = parseFloat(discountValue);
        if (!isNaN(value) && value >= 0) {
            // Prevent fixed discount from being larger than the base price
            if (discountType === 'fixed' && value > basePrice) {
                alert(`Diskon tidak boleh lebih besar dari harga dasar (${formatRupiah(basePrice)}).`);
                return;
            }
             // Prevent percentage discount from being larger than 100
            if (discountType === 'percentage' && value > 100) {
                alert('Diskon persentase tidak boleh lebih dari 100%.');
                return;
            }
            onApply({ type: discountType, value });
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex justify-center items-center font-sans">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-sm m-4">
                {/* --- HEADER --- */}
                <div className="flex items-center justify-between p-4 border-b dark:border-gray-700">
                    <h2 className="text-lg font-bold">{itemName ? `Diskon untuk ${itemName}` : 'Diskon Transaksi'}</h2>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* --- BODY --- */}
                <div className="p-6 space-y-4">
                    <div className="flex rounded-md shadow-sm">
                        <button
                            onClick={() => setDiscountType('percentage')}
                            className={`flex-1 inline-flex items-center justify-center px-4 py-2 rounded-l-md border text-sm font-medium focus:z-10 focus:outline-none focus:ring-2 focus:ring-teal-500 ${discountType === 'percentage' ? 'bg-teal-600 text-white' : 'bg-white dark:bg-gray-700 hover:bg-gray-50'}`}
                        >
                            <Percent className="h-4 w-4 mr-2"/>
                            Persen (%)
                        </button>
                        <button
                            onClick={() => setDiscountType('fixed')}
                            className={`-ml-px flex-1 inline-flex items-center justify-center px-4 py-2 rounded-r-md border text-sm font-medium focus:z-10 focus:outline-none focus:ring-2 focus:ring-teal-500 ${discountType === 'fixed' ? 'bg-teal-600 text-white' : 'bg-white dark:bg-gray-700 hover:bg-gray-50'}`}
                        >
                            <Tag className="h-4 w-4 mr-2"/>
                            Nominal (Rp)
                        </button>
                    </div>

                    <div>
                        <label htmlFor="discountValue" className="sr-only">Nilai Diskon</label>
                        <input
                            id="discountValue"
                            type="number"
                            value={discountValue}
                            onChange={(e) => setDiscountValue(e.target.value)}
                            placeholder={discountType === 'percentage' ? 'Contoh: 10' : 'Contoh: 5000'}
                            className="w-full text-lg p-2 border-2 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                            autoFocus
                        />
                    </div>
                </div>

                {/* --- FOOTER --- */}
                <div className="p-4 bg-gray-50 dark:bg-gray-800/50 border-t dark:border-gray-700">
                    <button
                        onClick={handleApply}
                        className="w-full bg-teal-600 text-white font-bold py-3 rounded-lg hover:bg-teal-700 transition-colors"
                    >
                        Terapkan Diskon
                    </button>
                </div>
            </div>
        </div>
    );
}
