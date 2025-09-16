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

interface InvoiceViewProps {
    details: TransactionDetail | null;
    organizationName?: string;
}

export function InvoiceView({ details, organizationName = "Finako Store" }: InvoiceViewProps) {

    const formatDate = (dateString: string) => {
        return new Intl.DateTimeFormat('id-ID', {
            dateStyle: 'long',
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
        return <p className="text-center text-gray-500 p-8">Data invoice tidak tersedia.</p>;
    }

    return (
        <div className="bg-white text-black p-8 font-sans border border-gray-300">
            {/* Header */}
            <div className="flex justify-between items-start mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">{organizationName}</h1>
                    <p className="text-gray-600">{details.outlet_name}</p>
                </div>
                <h2 className="text-3xl font-semibold text-teal-600">INVOICE</h2>
            </div>

            {/* Info Invoice & Pelanggan */}
            <div className="grid grid-cols-2 gap-4 mb-8">
                <div>
                    <h3 className="font-semibold text-gray-500 mb-1">Ditagihkan Kepada:</h3>
                    <p className="font-bold">{details.customer_name || 'Pelanggan Umum'}</p>
                </div>
                <div className="text-right">
                    <p><span className="font-semibold">No. Invoice:</span> {details.transaction_number}</p>
                    <p><span className="font-semibold">Tanggal:</span> {formatDate(details.transaction_date)}</p>
                </div>
            </div>

            {/* Tabel Item */}
            <table className="w-full mb-8">
                <thead className="bg-teal-50">
                    <tr>
                        <th className="text-left p-2 font-semibold text-teal-700">Deskripsi</th>
                        <th className="p-2 font-semibold text-teal-700">Jumlah</th>
                        <th className="text-right p-2 font-semibold text-teal-700">Harga Satuan</th>
                        <th className="text-right p-2 font-semibold text-teal-700">Total</th>
                    </tr>
                </thead>
                <tbody>
                    {details.items?.map((item, index) => (
                        <tr key={index} className="border-b">
                            <td className="p-2">{item.product_name}</td>
                            <td className="text-center p-2">{item.quantity}</td>
                            <td className="text-right p-2">{formatCurrency(item.unit_price)}</td>
                            <td className="text-right p-2">{formatCurrency(item.line_total)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {/* Kalkulasi Total */}
            <div className="flex justify-end mb-8">
                <div className="w-full max-w-xs space-y-2">
                    <div className="flex justify-between"><span className="text-gray-600">Subtotal:</span><span>{formatCurrency(details.subtotal)}</span></div>
                    <div className="flex justify-between"><span className="text-gray-600">Diskon:</span><span>-{formatCurrency(details.total_discount)}</span></div>
                    <div className="flex justify-between"><span className="text-gray-600">Pajak:</span><span>{formatCurrency(details.total_tax)}</span></div>
                    <div className="border-t my-2"></div>
                    <div className="flex justify-between font-bold text-lg"><span >TOTAL:</span><span className="text-teal-600">{formatCurrency(details.grand_total)}</span></div>
                </div>
            </div>

            {/* Catatan */}
            <div className="text-xs text-gray-500">
                <h4 className="font-semibold mb-1">Catatan:</h4>
                <p>{details.notes || 'Tidak ada catatan.'}</p>
            </div>
        </div>
    );
}
