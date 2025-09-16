"use client";

// Tipe data ini harus cocok dengan output dari RPC get_transaction_details
type TransactionDetail = {
    transaction_number: string;
    transaction_date: string;
    outlet_name: string;
    cashier_name: string | null;
    customer_name: string | null;
    subtotal: number;
    total_discount: number;
    total_tax: number;
    grand_total: number;
    notes: string | null;
    items: {
        product_name: string;
        quantity: number;
        unit_price: number;
        line_total: number;
        discount_amount: number;
    }[] | null;
    payments: {
        payment_method: string;
        amount: number;
    }[] | null;
};

interface TransactionReceiptProps {
    details: TransactionDetail | null;
}

// Komponen "Dumb" untuk menampilkan struk
export function TransactionReceipt({ details }: TransactionReceiptProps) {

    const formatDate = (dateString: string) => {
        return new Intl.DateTimeFormat('id-ID', {
            dateStyle: 'long',
            timeStyle: 'short',
        }).format(new Date(dateString));
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
        }).format(amount);
    };

    if (!details) {
        return <p className="text-center text-gray-500">Data transaksi tidak tersedia.</p>;
    }

    return (
        <div className="space-y-4 text-sm font-mono bg-white text-black p-4">
            <div className="text-center">
                <h3 className="font-bold text-lg">Finako POS</h3>
                <p>{details.outlet_name}</p>
            </div>
            <div className="border-t border-dashed my-2 border-gray-400"></div>
            <div className="flex justify-between"><span>No. Struk:</span><span>{details.transaction_number}</span></div>
            <div className="flex justify-between"><span>Tanggal:</span><span>{formatDate(details.transaction_date)}</span></div>
            <div className="flex justify-between"><span>Kasir:</span><span>{details.cashier_name || 'N/A'}</span></div>
            {details.customer_name && <div className="flex justify-between"><span>Pelanggan:</span><span>{details.customer_name}</span></div>}
            <div className="border-t border-dashed my-2 border-gray-400"></div>

            {/* Items */}
            <div>
                {details.items?.map((item, index) => (
                    <div key={index} className="mb-1">
                        <p className="font-semibold">{item.product_name}</p>
                        <div className="flex justify-between">
                            <span>{item.quantity} x {formatCurrency(item.unit_price)}</span>
                            <span>{formatCurrency(item.line_total)}</span>
                        </div>
                        {item.discount_amount > 0 && <p className="text-xs text-red-500">Diskon: -{formatCurrency(item.discount_amount)}</p>}
                    </div>
                ))}
            </div>

            <div className="border-t border-dashed my-2 border-gray-400"></div>

            {/* Summary */}
            <div className="space-y-1">
                <div className="flex justify-between"><span>Subtotal:</span><span>{formatCurrency(details.subtotal)}</span></div>
                <div className="flex justify-between"><span>Diskon:</span><span>-{formatCurrency(details.total_discount)}</span></div>
                <div className="flex justify-between"><span>Pajak:</span><span>{formatCurrency(details.total_tax)}</span></div>
                <div className="border-t my-1 border-gray-400"></div>
                <div className="flex justify-between font-bold text-base"><span>TOTAL:</span><span>{formatCurrency(details.grand_total)}</span></div>
            </div>
            
            <div className="border-t border-dashed my-2 border-gray-400"></div>

            {/* Payment */}
            <div>
                {details.payments?.map((p, i) => (
                    <div key={i} className="flex justify-between"><span>{p.payment_method.toUpperCase()}:</span><span>{formatCurrency(p.amount)}</span></div>
                ))}
            </div>

            {details.notes && (
                <>
                    <div className="border-t border-dashed my-2 border-gray-400"></div>
                    <p className="text-xs text-center">Catatan: {details.notes}</p>
                </>
            )}

            <div className="border-t border-dashed my-2 border-gray-400"></div>
            <p className="text-center text-xs mt-4">Terima kasih telah berbelanja!</p>
        </div>
    );
}
