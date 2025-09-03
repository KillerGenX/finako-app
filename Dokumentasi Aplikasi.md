Nama Aplikasi : Finako App
Brand Color : Green Teal
Bahasa Pemrograman : 	TypeScript
Framework Frontend : 	Next.js (dengan App Router)
Backend :REST API dari Supabase & (Logika Kustom)	Supabase Edge Functions
Styling & UI	: Tailwind CSS + Shadcn ui
Manajemen State : Zustand untuk Client State & SWR untuk Server State
Pendekatan Mobile-First dan PWA

### Pengembangan Tahap 1 - DONE 3 September 2025

Sejauh ini, kita telah berhasil membangun fondasi autentikasi dan struktur dasar aplikasi yang kokoh. Berikut adalah rincian fitur dan alur yang sudah diimplementasikan:

**1. Alur Autentikasi Pengguna (End-to-End):**
- **Halaman Login (`/`):** Antarmuka untuk pengguna masuk, terhubung dengan Supabase Auth.
- **Halaman Registrasi (`/register`):** Form pendaftaran fungsional yang mengirimkan data ke Supabase.
- **Halaman Konfirmasi Registrasi (`/auth/confirm`):** Halaman yang memberi tahu pengguna untuk memeriksa email mereka setelah mendaftar.
- **Middleware Keamanan (`/src/middleware.ts`):**
    - Melindungi rute `/dashboard` dan semua sub-rutenya.
    - Mencegah pengguna yang belum login mengakses dashboard.
    - Mencegah pengguna yang sudah login mengakses kembali halaman login/registrasi.
    - Memblokir pengguna yang belum memverifikasi email mereka untuk masuk ke dashboard, dan mengarahkan mereka ke halaman konfirmasi.

**2. Otomatisasi Backend (Database Triggers):**
- **Trigger `handle_new_user`:**
    - Berjalan secara otomatis setiap kali pengguna baru mendaftar.
    - Membuat `organization` baru dan menjadikan pengguna sebagai `owner`.
    - Membuat `profile` publik untuk pengguna.
    - Menjadikan pengguna sebagai `admin` di `organization_members`.
- **Alur Pendaftaran Aman:** Sesi pengguna secara otomatis dihancurkan setelah registrasi untuk memaksa alur verifikasi email.

**3. Struktur dan Layout Aplikasi:**
- **Dashboard Layout (`/dashboard/layout.tsx`):**
    - Tata letak utama aplikasi dengan Sidebar navigasi dan Header.
    - Dibuat sebagai Server Component untuk efisiensi pengambilan data.
- **Komponen Header (`/dashboard/Header.tsx`):**
    - Menampilkan inisial nama pengguna yang sedang login secara dinamis.
    - Menyediakan fungsionalitas **Logout** yang aman menggunakan Server Action, lengkap dengan *loading state* untuk UX yang lebih baik.
- **Halaman Dashboard Awal (`/dashboard/page.tsx`):** Halaman selamat datang sederhana sebagai kerangka untuk konten dashboard.

**4. Konfigurasi Proyek:**
- **Koneksi Supabase:** Telah dikonfigurasi menggunakan environment variables.
- **Styling:** Menggunakan Tailwind CSS dengan pendekatan komponen yang terinspirasi dari Shadcn/UI.
- **Favicon:** Logo aplikasi Finako (`finako.svg`) telah ditetapkan sebagai ikon browser.
