"use client";

import Link from 'next/link';
import { ArrowLeft, Printer } from 'lucide-react';
import { WriteOffDetails } from './actions';

// --- Komponen Tampilan Cetak ---
function PrintableView({ details }: { details: WriteOffDetails }) {
    if (!details) return null;
    const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });

    return (
        <div className="bg-white text-black p-8 font-sans">
            <div className="flex justify-between items-start pb-4 border-b">
                <div><h1 className="text-xl font-bold">Finako App</h1><p className="text-sm">Outlet: {details.outlet.name}</p></div>
                <div className="text-right"><h2 className="text-2xl font-bold">BERITA ACARA BARANG RUSAK/HILANG</h2><p className="text-sm font-mono">{details.write_off_number}</p></div>
            </div>
            <div className="my-4"><p className="text-sm"><span className="font-semibold">Tanggal:</span> {formatDate(details.created_at)}</p></div>
            <table className="w-full text-sm my-8">
                <thead className="bg-gray-100"><tr>
                    <th className="p-2 text-left font-semibold border">No.</th>
                    <th className="p-2 text-left font-semibold border">Nama Produk</th>
                    <th className="p-2 text-right font-semibold border">Jumlah</th>
                    <th className="p-2 text-left font-semibold border">Alasan</th>
                </tr></thead>
                <tbody>
                    {details.items.map((item, index) => (
                        <tr key={item.id} className="border-b">
                            <td className="p-2 border">{index + 1}</td>
                            <td className="p-2 border">{item.name}</td>
                            <td className="p-2 border text-right">{item.quantity}</td>
                            <td className="p-2 border">{item.reason || '-'}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
            {details.notes && <div className="text-sm mt-8"><p className="font-semibold">Catatan Umum:</p><p className="p-2 border bg-gray-50 rounded whitespace-pre-wrap">{details.notes}</p></div>}
            <div className="grid grid-cols-2 gap-8 mt-16 text-center text-sm">
                <div><p>Dibuat Oleh,</p><div className="mt-16 border-t pt-1">{details.created_by || 'Sistem'}</div></div>
                <div><p>Disetujui Oleh,</p><div className="mt-16 border-t pt-1">(____________________)</div></div>
            </div>
        </div>
    );
}

// --- Komponen Utama Halaman Detail ---
export function WriteOffDetailClient({ details }: { details: WriteOffDetails }) {
    if (!details) return null;
    const formatDate = (dateString: string) => new Date(dateString).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' });

    return (
        <div className="w-full">
            <div className="printable-area"><PrintableView details={details} /></div>
            <div className="no-print">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <Link href="/dashboard/inventory/write-offs" className="flex items-center gap-2 text-gray-600 mb-2"><ArrowLeft size={18} /> Kembali ke Daftar</Link>
                        <h1 className="text-2xl font-bold">Detail Berita Acara #{details.write_off_number}</h1>
                    </div>
                    <button onClick={() => window.print()} className="bg-gray-200 px-4 py-2 rounded-lg flex items-center gap-2"><Printer size={18} /> Cetak</button>
                </div>
                <div className="p-6 bg-white dark:bg-gray-800/50 rounded-lg border mb-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        <div><p className="text-sm text-gray-500">Outlet</p><p className="font-semibold">{details.outlet.name}</p></div>
                        <div><p className="text-sm text-gray-500">Tanggal Dibuat</p><p className="font-semibold">{formatDate(details.created_at)}</p></div>
                        <div><p className="text-sm text-gray-500">Dibuat Oleh</p><p className="font-semibold">{details.created_by || 'Sistem'}</p></div>
                    </div>
                    {details.notes && <div className="mt-4"><p className="text-sm text-gray-500">Catatan</p><p className="font-semibold whitespace-pre-wrap">{details.notes}</p></div>}
                </div>
                <div className="border rounded-lg w-full bg-white dark:bg-gray-800/50">
                    <table className="w-full text-sm">
                        <thead><tr className="border-b"><th className="p-4 text-left">Produk</th><th className="p-4 text-left">SKU</th><th className="p-4 text-left">Alasan</th><th className="p-4 text-right">Jumlah</th></tr></thead>
                        <tbody>
                            {details.items.map(item => (<tr key={item.id} className="border-b"><td className="p-4 font-semibold">{item.name}</td><td className="p-4 text-gray-500">{item.sku}</td><td className="p-4">{item.reason}</td><td className="p-4 text-right font-mono font-semibold">{item.quantity}</td></tr>))}
                        </tbody>
                    </table>
                </div>
            </div>
            <style jsx global>{` @media print { body * { visibility: hidden; } .printable-area, .printable-area * { visibility: visible; } .printable-area { position: absolute; left: 0; top: 0; width: 100%; } .no-print { display: none !important; } } `}</style>
        </div>
    );
}
