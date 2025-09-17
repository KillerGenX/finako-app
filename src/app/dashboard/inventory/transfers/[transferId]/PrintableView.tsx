"use client";

import { StockTransferDetails } from './actions';

// --- Tipe Data ---
type PrintableViewProps = {
    details: StockTransferDetails;
};

// --- Komponen Tampilan Cetak ---
export function PrintableView({ details }: PrintableViewProps) {
    if (!details) return null;

    const formatDate = (dateString: string | null) => dateString ? new Date(dateString).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }) : '-';

    // Logika untuk menentukan judul dokumen berdasarkan status
    const getDocumentTitle = () => {
        switch (details.status) {
            case 'draft': return 'DRAFT SURAT JALAN';
            case 'sent': return 'SURAT JALAN / DELIVERY ORDER';
            case 'received': return 'BUKTI TERIMA BARANG';
            case 'cancelled': return 'SURAT JALAN (DIBATALKAN)';
            default: return 'DOKUMEN TRANSFER';
        }
    };

    return (
        <div className="bg-white text-black p-8 font-sans">
            {/* Header */}
            <div className="flex justify-between items-start pb-4 border-b">
                <div>
                    <h1 className="text-xl font-bold">Finako App</h1>
                    <p className="text-sm">{details.outlet_from.name} (Outlet Asal)</p>
                </div>
                <div className="text-right">
                    <h2 className="text-2xl font-bold">{getDocumentTitle()}</h2>
                    <p className="text-sm font-mono">{details.transfer_number}</p>
                </div>
            </div>

            {/* Info */}
            <div className="grid grid-cols-2 gap-4 my-4">
                <div>
                    <p className="text-sm text-gray-600">Tujuan Pengiriman:</p>
                    <p className="font-semibold">{details.outlet_to.name}</p>
                </div>
                <div className="text-right">
                    <p className="text-sm text-gray-600">Tanggal Dibuat:</p>
                    <p className="font-semibold">{formatDate(details.created_at)}</p>
                </div>
            </div>

            {/* Tabel Item */}
            <table className="w-full text-sm my-8">
                <thead className="bg-gray-100">
                    <tr>
                        <th className="p-2 text-left font-semibold">No.</th>
                        <th className="p-2 text-left font-semibold">SKU</th>
                        <th className="p-2 text-left font-semibold">Nama Produk</th>
                        <th className="p-2 text-right font-semibold">Jumlah</th>
                    </tr>
                </thead>
                <tbody>
                    {details.items.map((item, index) => (
                        <tr key={item.id} className="border-b">
                            <td className="p-2">{index + 1}</td>
                            <td className="p-2">{item.sku || '-'}</td>
                            <td className="p-2">{item.name}</td>
                            <td className="p-2 text-right font-semibold">{item.quantity}</td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {/* Catatan */}
            {details.notes && (
                <div className="text-sm">
                    <p className="font-semibold">Catatan:</p>
                    <p className="p-2 border bg-gray-50 rounded">{details.notes}</p>
                </div>
            )}

            {/* Tanda Tangan */}
            <div className="grid grid-cols-3 gap-8 mt-16 text-center text-sm">
                <div>
                    <p>Dibuat Oleh,</p>
                    <div className="mt-16 border-t pt-1">{details.created_by || 'Sistem'}</div>
                </div>
                <div>
                    <p>Dikirim Oleh,</p>
                    <div className="mt-16 border-t pt-1">(____________________)</div>
                </div>
                 <div>
                    <p>Diterima Oleh,</p>
                    <div className="mt-16 border-t pt-1">(____________________)</div>
                </div>
            </div>
        </div>
    );
}
