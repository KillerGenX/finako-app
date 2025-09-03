// Impor bawaan dari Next.js dan CSS
import type { Metadata } from "next";
import "./globals.css";

// ▼▼▼ PERBAIKAN UTAMA ADA DI SINI ▼▼▼
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";

// Impor untuk ThemeProvider
import { ThemeProvider } from "@/components/ThemeProvider";

// Konfigurasi Font (sama seperti kode Anda, hanya nama variabel yang disesuaikan)
// Kita tidak perlu lagi mendefinisikan subsets dan variable di sini,
// karena paket 'geist' sudah mengaturnya secara optimal.

// Metadata (bisa Anda ubah)
export const metadata: Metadata = {
  title: "Finako App",
  description: "Business Operating System for MSMEs",
  icons: {
    icon: "/finako.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        // Menggunakan className yang lebih modern dan direkomendasikan oleh 'geist'
        className={`${GeistSans.variable} ${GeistMono.variable} antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
