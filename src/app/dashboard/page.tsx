// Placeholder components for layout consistency
const Card = ({ children, className }: { children: React.ReactNode, className?: string }) => (
    <div className={`bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-lg ${className}`}>
      {children}
    </div>
);

const CardHeader = ({ children, className }: { children: React.ReactNode, className?: string }) => (
    <div className={`p-6 ${className}`}>{children}</div>
);

const CardTitle = ({ children, className }: { children: React.ReactNode, className?: string }) => (
    <h2 className={`text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100 ${className}`}>
      {children}
    </h2>
);

const CardDescription = ({ children, className }: { children: React.ReactNode, className?: string }) => (
    <p className={`mt-2 text-gray-500 dark:text-gray-400 ${className}`}>
        {children}
    </p>
);

const CardContent = ({ children, className }: { children: React.ReactNode, className?: string }) => (
    <div className={`p-6 pt-0 ${className}`}>{children}</div>
);


export default function DashboardPage() {
    return (
        <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
                Dashboard
            </h1>
            <p className="mt-2 text-lg text-gray-600 dark:text-gray-400">
                Selamat datang di Finako App. Berikut adalah ringkasan bisnis Anda.
            </p>

            <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader>
                        <CardTitle>Penjualan Hari Ini</CardTitle>
                        <CardDescription>Total pendapatan dari semua transaksi hari ini.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-3xl font-bold text-teal-600">Rp 1.250.000</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Transaksi Baru</CardTitle>
                        <CardDescription>Jumlah transaksi yang terjadi hari ini.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-3xl font-bold text-teal-600">15</p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
