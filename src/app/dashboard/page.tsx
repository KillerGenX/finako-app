import Link from 'next/link';
import {
    Package,
    ShoppingCart,
    Users,
    BookText,
    Briefcase,
    LineChart,
    ArrowRight
} from 'lucide-react';

// A reusable component for the module cards
const ModuleCard = ({ icon: Icon, title, description, href }: {
    icon: React.ElementType,
    title: string,
    description: string,
    href: string
}) => (
    <Link href={href}>
        <div className="group flex flex-col h-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 p-6">
            <div className="flex items-center gap-4">
                <div className="bg-teal-100 dark:bg-teal-900/50 p-3 rounded-full">
                    <Icon className="h-7 w-7 text-teal-600 dark:text-teal-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
                    {title}
                </h3>
            </div>
            <p className="mt-4 text-gray-600 dark:text-gray-400 flex-grow">
                {description}
            </p>
            <div className="mt-4 flex items-center justify-end text-sm font-medium text-teal-600 dark:text-teal-500">
                <span>Go to Module</span>
                <ArrowRight className="h-4 w-4 ml-1 transition-transform group-hover:translate-x-1" />
            </div>
        </div>
    </Link>
);

const modules = [
    {
        icon: Package,
        title: "Produk & Inventaris",
        description: "Kelola semua produk, varian, stok, dan pergerakan inventaris di semua outlet Anda.",
        href: "/dashboard/products"
    },
    {
        icon: ShoppingCart,
        title: "Transaksi & Penjualan",
        description: "Jalankan Point of Sale (POS), catat transaksi, dan kelola pembayaran dari pelanggan.",
        href: "/dashboard/pos"
    },
    {
        icon: Users,
        title: "Manajemen Pelanggan",
        description: "Bangun database pelanggan Anda, lacak riwayat pembelian, dan kelola hubungan.",
        href: "#"
    },
    {
        icon: BookText,
        title: "Akuntansi",
        description: "Atur bagan akun, catat jurnal akuntansi, dan pantau kesehatan keuangan bisnis.",
        href: "#"
    },
    {
        icon: Briefcase,
        title: "Manajemen SDM (HR)",
        description: "Kelola data karyawan, absensi, dan pinjaman dalam satu sistem terintegrasi.",
        href: "#"
    },
    {
        icon: LineChart,
        title: "Laporan & Analitik",
        description: "Dapatkan wawasan mendalam tentang kinerja bisnis Anda dengan laporan yang komprehensif.",
        href: "#"
    }
];

export default function DashboardPage() {
    return (
        <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
                Selamat Datang di Finako
            </h1>
            <p className="mt-2 text-lg text-gray-600 dark:text-gray-400">
                Pilih modul untuk memulai mengelola operasi bisnis Anda.
            </p>

            <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {modules.map((module) => (
                    <ModuleCard key={module.title} {...module} />
                ))}
            </div>
        </div>
    );
}
