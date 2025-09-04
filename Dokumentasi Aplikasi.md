Nama Aplikasi : Finako App
Brand Color : Green Teal
Bahasa Pemrograman : 	TypeScript
Framework Frontend : 	Next.js (dengan App Router)
Backend :REST API dari Supabase & (Logika Kustom)	Supabase Edge Functions
Styling & UI	: Tailwind CSS + Shadcn ui
Manajemen State : Zustand untuk Client State & SWR untuk Server State
Pendekatan Mobile-First dan PWA

### Pengembangan Tahap 1 - Selesai

Sejauh ini, kita telah berhasil membangun fondasi autentikasi, langganan, dan struktur dasar aplikasi yang kokoh. Berikut adalah rincian fitur dan alur yang sudah diimplementasikan:

**1. Alur Autentikasi Pengguna (End-to-End):**
- **Halaman Login (`/`):** Antarmuka untuk pengguna masuk, terhubung dengan Supabase Auth.
- **Halaman Registrasi (`/register`):** Form pendaftaran fungsional yang mengirimkan data ke Supabase.
- **Halaman Konfirmasi Registrasi (`/auth/confirm`):** Halaman yang memberi tahu pengguna untuk memeriksa email mereka setelah mendaftar.
- **Middleware Keamanan (`/src/middleware.ts`):**
    - Melindungi rute `/dashboard` dan semua sub-rutenya.
    - Mencegah pengguna yang belum login mengakses dashboard.
    - Mencegah pengguna yang sudah login mengakses kembali halaman login/registrasi.
    - Memblokir pengguna yang belum memverifikasi email mereka untuk masuk ke dashboard.

**2. Alur Langganan & Pembayaran (SaaS Core):**
- **Database:** Tabel `invoices` telah ditambahkan untuk melacak setiap transaksi pembayaran.
- **Halaman Billing (`/dashboard/billing`):** Menampilkan semua paket yang tersedia, termasuk paket "Trial" saat ini dan paket "Coming Soon". Secara cerdas mengarahkan pengguna yang memiliki invoice tertunda.
- **Halaman Checkout (`/dashboard/billing/checkout`):** Pengguna dapat memilih durasi langganan (dengan diskon) dan melihat ringkasan pesanan sebelum melanjutkan.
- **Halaman Pembayaran Dinamis (`/dashboard/billing/payment/[invoice_id]`):**
    - Menampilkan detail invoice yang harus dibayar.
    - Menyediakan opsi pembayaran "Transfer Manual".
    - Memiliki form fungsional untuk mengunggah bukti pembayaran ke Supabase Storage.
- **Backend Actions (Server-Side):**
    - Server Action untuk membuat invoice baru, mencegah duplikasi.
    - Server Action untuk mengunggah bukti transfer dan memperbarui status invoice menjadi `awaiting_confirmation`.
    - Server Action (simulasi admin) untuk menyetujui pembayaran, yang akan mengaktifkan langganan pengguna (`subscriptions`) dan menandai invoice sebagai `paid`.
- **Penguncian Aplikasi:** `Middleware` diperkuat untuk secara otomatis mengarahkan pengguna dengan langganan tidak aktif ke halaman billing.

**3. Otomatisasi Backend (Database Triggers):**
- **Trigger `handle_new_user`:**
    - Berjalan secara otomatis setiap kali pengguna baru mendaftar.
    - Membuat `organization`, `profile`, dan `organization_member`.
    - Secara otomatis membuat langganan percobaan (`trialing`) selama 14 hari.

**4. Struktur dan Layout Aplikasi:**
- **Dashboard Layout & Provider:** Tata letak utama yang kokoh menggunakan CSS Grid, dengan sidebar yang bisa diciutkan.
- **Komponen Header:** Menampilkan inisial nama pengguna dan fungsionalitas Logout yang aman.
- **Halaman Dashboard Awal:** Berfungsi sebagai "papan loncat" ke modul-modul utama aplikasi.

**5. Konfigurasi Proyek:**
- **Koneksi Supabase & Storage:** Telah dikonfigurasi, termasuk kebijakan keamanan untuk upload file.
- **Styling:** Menggunakan Tailwind CSS.
- **Favicon:** Logo aplikasi Finako telah ditetapkan.
