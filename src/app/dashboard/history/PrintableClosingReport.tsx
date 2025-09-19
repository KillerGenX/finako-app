// src/app/dashboard/history/PrintableClosingReport.tsx
import { ClosingReportData } from './actions';
import { format } from 'date-fns';
import { id as indonesia } from 'date-fns/locale';

type PrintableProps = {
    reportData: ClosingReportData;
    orgName: string; // Tambahkan nama organisasi
};

export function PrintableClosingReport({ reportData, orgName }: PrintableProps) {
    if (!reportData) return null;

    const { report_details, summary, cashier_summary, transactions } = reportData;
    const formatCurrency = (value: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(value);
    const formatDate = (dateStr: string) => format(new Date(dateStr), 'd MMMM yyyy, HH:mm', { locale: indonesia });
    const formatDateShort = (dateStr: string) => format(new Date(dateStr), 'd MMM yyyy', { locale: indonesia });

    return (
        <div className="p-8 font-sans text-gray-800">
            {/* Header */}
            <div className="text-center border-b-2 border-black pb-4 mb-6">
                <h1 className="text-2xl font-bold">{orgName}</h1>
                <h2 className="text-xl font-semibold">Laporan Penutupan Kasir</h2>
                <p className="text-sm">Outlet: {report_details.outlet_name}</p>
                <p className="text-sm">Periode: {formatDateShort(report_details.period_start)}</p>
            </div>

            {/* Ringkasan */}
            <div className="mb-6">
                <h3 className="font-bold text-lg mb-2 border-b">Ringkasan Penjualan</h3>
                <div className="grid grid-cols-2 gap-x-8 gap-y-1 text-sm">
                    <span>Penjualan Bersih:</span> <span className="font-semibold text-right">{formatCurrency(summary.net_sales)}</span>
                    <span>Total Diskon:</span> <span className="text-right">{formatCurrency(summary.total_discounts)}</span>
                    <span>Pajak Terkumpul:</span> <span className="text-right">{formatCurrency(summary.total_tax_collected)}</span>
                    <span className="font-bold border-t mt-1 pt-1">Total Diterima:</span> <span className="font-bold text-right border-t mt-1 pt-1">{formatCurrency(summary.total_collected)}</span>
                </div>
            </div>

            {/* Rincian Pembayaran */}
            <div className="mb-6">
                <h3 className="font-bold text-lg mb-2 border-b">Rincian Metode Pembayaran</h3>
                <div className="grid grid-cols-2 gap-x-8 gap-y-1 text-sm">
                    {summary.payment_methods.map(pm => (
                        <>
                            <span>Total {pm.payment_method.toUpperCase()}:</span>
                            <span className="text-right">{formatCurrency(pm.total_amount)}</span>
                        </>
                    ))}
                </div>
            </div>

            {/* Ringkasan Kasir */}
            {cashier_summary.length > 0 && (
                <div className="mb-6">
                    <h3 className="font-bold text-lg mb-2 border-b">Ringkasan per Kasir</h3>
                     <table className="w-full text-sm text-left">
                        <thead><tr><th className="font-semibold pb-1">Nama Kasir</th><th className="font-semibold pb-1 text-right">Jumlah Transaksi</th><th className="font-semibold pb-1 text-right">Total Penjualan</th></tr></thead>
                        <tbody>
                            {cashier_summary.map(cs => (
                                <tr key={cs.member_id}><td className="pt-1">{cs.member_name}</td><td className="pt-1 text-right">{cs.transaction_count}</td><td className="pt-1 text-right">{formatCurrency(cs.net_sales)}</td></tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Daftar Transaksi */}
            <div className="mb-8">
                <h3 className="font-bold text-lg mb-2 border-b">Daftar Transaksi</h3>
                <table className="w-full text-sm text-left">
                    <thead><tr><th className="font-semibold pb-1">Waktu</th><th className="font-semibold pb-1">No. Struk</th><th className="font-semibold pb-1">Kasir</th><th className="font-semibold pb-1 text-right">Total</th></tr></thead>
                    <tbody>
                        {transactions.map(tx => (
                            <tr key={tx.id}>
                                <td className="pt-1">{format(new Date(tx.transaction_date), 'HH:mm')}</td>
                                <td>{tx.transaction_number}</td>
                                <td>{tx.member_name}</td>
                                <td className="text-right">{formatCurrency(tx.grand_total)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Tanda Tangan */}
            <div className="pt-12 grid grid-cols-2 gap-12 text-center text-sm">
                <div>
                    <p>Diserahkan oleh,</p>
                    <div className="mt-20 border-b"></div>
                    <p className="mt-1">(Kasir)</p>
                </div>
                <div>
                    <p>Diverifikasi oleh,</p>
                    <div className="mt-20 border-b"></div>
                    <p className="mt-1">(Manajer/Penyelia)</p>
                </div>
            </div>
             <div className="text-center text-xs text-gray-500 mt-12">
                Laporan ini dibuat secara otomatis oleh Finako pada {formatDate(report_details.generated_at)}.
            </div>
        </div>
    );
}
