"use client";

import { PurchaseOrderDetails } from './actions';

type PrintableViewProps = {
    details: PurchaseOrderDetails;
};

export function PrintableView({ details }: PrintableViewProps) {
    if (!details) return null;

    const formatDate = (dateString: string | null) => dateString ? new Date(dateString).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }) : '-';
    const formatCurrency = (amount: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(amount);
    
    const totalCost = details.items.reduce((acc, item) => acc + (item.quantity * item.unit_cost), 0);

    // PERBAIKAN: Menambahkan logika "pintar" untuk judul dokumen
    const getDocumentTitle = () => {
        switch (details.status) {
            case 'draft': return 'DRAFT PURCHASE ORDER';
            case 'ordered': return 'PURCHASE ORDER';
            case 'partially_received': return 'BUKTI PENERIMAAN BARANG';
            case 'completed': return 'BUKTI PENERIMAAN BARANG (LUNAS)';
            case 'cancelled': return 'PURCHASE ORDER (DIBATALKAN)';
            default: return 'DOKUMEN PEMBELIAN';
        }
    };

    return (
        <div className="bg-white text-black p-8 font-sans">
            {/* Header */}
            <div className="flex justify-between items-start pb-4 border-b">
                <div>
                    <h1 className="text-xl font-bold">Finako App</h1>
                    <p className="text-sm">Pesanan Pembelian</p>
                </div>
                <div className="text-right">
                    {/* PERBAIKAN: Menggunakan judul dinamis */}
                    <h2 className="text-2xl font-bold">{getDocumentTitle()}</h2>
                    <p className="text-sm font-mono">{details.po_number}</p>
                </div>
            </div>

            {/* Info */}
            <div className="grid grid-cols-2 gap-4 my-4">
                <div>
                    <p className="text-sm text-gray-600">Kepada Yth:</p>
                    <p className="font-semibold">{details.supplier.name}</p>
                </div>
                <div className="text-right">
                    <p className="text-sm text-gray-600">Tanggal Pesan:</p>
                    <p className="font-semibold">{formatDate(details.order_date)}</p>
                    <p className="text-sm text-gray-600 mt-2">Kirim Ke:</p>
                    <p className="font-semibold">{details.outlet.name}</p>
                </div>
            </div>

            {/* Tabel Item */}
            <table className="w-full text-sm my-8">
                <thead className="bg-gray-100">
                    <tr>
                        <th className="p-2 text-left font-semibold">No.</th>
                        <th className="p-2 text-left font-semibold">Deskripsi Barang</th>
                        <th className="p-2 text-right font-semibold">Jumlah</th>
                        <th className="p-2 text-right font-semibold">Harga Satuan</th>
                        <th className="p-2 text-right font-semibold">Subtotal</th>
                    </tr>
                </thead>
                <tbody>
                    {details.items.map((item, index) => (
                        <tr key={item.id} className="border-b">
                            <td className="p-2">{index + 1}</td>
                            <td className="p-2">{item.name} ({item.sku || 'N/A'})</td>
                            <td className="p-2 text-right">{item.quantity}</td>
                            <td className="p-2 text-right">{formatCurrency(item.unit_cost)}</td>
                            <td className="p-2 text-right">{formatCurrency(item.quantity * item.unit_cost)}</td>
                        </tr>
                    ))}
                </tbody>
                <tfoot>
                    <tr className="font-bold">
                        <td colSpan={4} className="p-2 text-right">TOTAL</td>
                        <td className="p-2 text-right">{formatCurrency(totalCost)}</td>
                    </tr>
                </tfoot>
            </table>
            
            {/* Tanda Tangan */}
            <div className="grid grid-cols-2 gap-8 mt-16 text-center text-sm">
                <div>
                    <p>Dipesan Oleh,</p>
                    <div className="mt-16 border-t pt-1">{details.created_by || 'Sistem'}</div>
                </div>
                <div>
                    <p>Disetujui Oleh,</p>
                    <div className="mt-16 border-t pt-1">(____________________)</div>
                </div>
            </div>
        </div>
    );
}
