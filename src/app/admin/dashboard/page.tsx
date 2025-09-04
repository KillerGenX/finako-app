import { Users, CreditCard, Activity } from 'lucide-react';

const StatCard = ({ title, value, icon: Icon }: { title: string, value: string, icon: any }) => (
    // ▼▼▼ STYLING DIUBAH AGAR SESUAI TEMA ▼▼▼
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between">
            <p className="text-gray-500 dark:text-gray-400 text-sm">{title}</p>
            <Icon className="h-6 w-6 text-gray-400 dark:text-gray-500" />
        </div>
        <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-2">{value}</p>
    </div>
);

export default function AdminDashboardPage() {
    return (
        <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                Admin Dashboard
            </h1>
            <p className="mt-2 text-lg text-gray-600 dark:text-gray-400">
                Ringkasan aktivitas di platform Finako.
            </p>

            <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                <StatCard title="Total Pengguna" value="1,204" icon={Users} />
                <StatCard title="Pendapatan (Bulan Ini)" value="Rp 15.750.000" icon={CreditCard} />
                <StatCard title="Langganan Aktif" value="89" icon={Activity} />
            </div>

            {/* Di sini nanti bisa ditambahkan grafik atau tabel lain */}
        </div>
    );
}
