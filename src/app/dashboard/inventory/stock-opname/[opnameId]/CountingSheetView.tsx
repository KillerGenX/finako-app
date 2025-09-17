"use client";

import { StockOpnameDetails } from './actions';

type CountingSheetViewProps = {
    details: StockOpnameDetails;
};

export function CountingSheetView({ details }: CountingSheetViewProps) {
    if (!details) return null;

    const formatDate = (dateString: string | null) => dateString ? new Date(dateString).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }) : '-';

    return (
        <div className="bg-white text-black p-8 font-sans">
            {/* Header */}
            <div className="flex justify-between items-start pb-4 border-b">
                <div>
                    <h1 className="text-xl font-bold">Finako App</h1>
                    <p className="text-sm">Outlet: {details.outlet.name}</p>
                </div>
                <div className="text-right">
                    <h2 className="text-2xl font-bold">LEMBAR HITUNG STOK OPNAME</h2>
                    <p className="text-sm font-mono">{details.opname_number}</p>
                    <p className="text-sm">Tanggal: {formatDate(details.created_at)}</p>
                </div>
            </div>

            {/* Tabel Item */}
            <table className="w-full text-sm my-8">
                <thead className="bg-gray-100">
                    <tr>
                        <th className="p-2 text-left font-semibold border">No.</th>
                        <th className="p-2 text-left font-semibold border">SKU</th>
                        <th className="p-2 text-left font-semibold border">Nama Produk</th>
                        <th className="p-2 text-right font-semibold border" style={{ width: '150px' }}>Jumlah Fisik</th>
                    </tr>
                </thead>
                <tbody>
                    {details.items.map((item, index) => (
                        <tr key={item.id} className="border-b">
                            <td className="p-2 border">{index + 1}</td>
                            <td className="p-2 border">{item.sku || '-'}</td>
                            <td className="p-2 border">{item.name}</td>
                            <td className="p-2 border h-10"></td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {/* Tanda Tangan */}
            <div className="grid grid-cols-2 gap-8 mt-16 text-center text-sm">
                <div>
                    <p>Dihitung Oleh,</p>
                    <div className="mt-16 border-t pt-1">(____________________)</div>
                </div>
                <div>
                    <p>Diperiksa Oleh,</p>
                    <div className="mt-16 border-t pt-1">(____________________)</div>
                </div>
            </div>
        </div>
    );
}
