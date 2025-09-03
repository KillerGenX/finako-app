import Link from 'next/link';

// Using the same placeholder component style for consistency
const Card = ({ children, className }: { children: React.ReactNode, className?: string }) => (
    <div className={`bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-lg ${className}`}>
      {children}
    </div>
);
  
const CardContent = ({ children, className }: { children: React.ReactNode, className?: string }) => (
    <div className={`p-6 text-center ${className}`}>{children}</div>
);

const CardTitle = ({ children, className }: { children: React.ReactNode, className?: string }) => (
    <h2 className={`text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100 ${className}`}>
      {children}
    </h2>
);
  
const CardDescription = ({ children, className }: { children: React.ReactNode, className?: string }) => (
    <p className={`text-sm text-gray-500 dark:text-gray-400 mt-2 ${className}`}>
      {children}
    </p>
);

const Button = (props: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
    <button
      {...props}
      className={`inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900 disabled:opacity-50 disabled:pointer-events-none bg-teal-600 text-white hover:bg-teal-700 h-10 py-2 px-4 mt-6 ${props.className}`}
    />
);

export default function RegistrationSuccessPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-950 p-4">
      <Card className="w-full max-w-md">
        <CardContent>
          <svg className="mx-auto h-12 w-12 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          <CardTitle className="mt-4">Pendaftaran Berhasil!</CardTitle>
          <CardDescription>
            Kami telah mengirimkan tautan konfirmasi ke alamat email Anda.
            <br />
            Silakan periksa kotak masuk Anda untuk mengaktifkan akun.
          </CardDescription>
          <Link href="/">
            <Button>
                Kembali ke Halaman Login
            </Button>
          </Link>
        </CardContent>
      </Card>
    </main>
  );
}
