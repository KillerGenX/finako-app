Nama Aplikasi : Finako App
Brand Color : Green Teal
Bahasa Pemrograman : 	TypeScript
Framework Frontend : 	Next.js (dengan App Router)
Backend :REST API dari Supabase & (Logika Kustom)	Supabase Edge Functions & Database Functions (RPC)
Styling & UI	: Tailwind CSS + Placeholder komponen bergaya Shadcn/UI
Manajemen State : Zustand untuk Client State & SWR untuk Server State
Pendekatan Mobile-First dan PWA

### Pengembangan Tahap 1 - Selesai

Sejauh ini, kita telah berhasil membangun fondasi autentikasi, langganan, dan panel admin yang kokoh. Berikut adalah rincian fitur yang sudah diimplementasikan:

**1. Alur Autentikasi & Langganan (SaaS Core):**
- **Registrasi, Login, dan Middleware Keamanan:** Alur lengkap untuk pendaftaran pengguna, verifikasi email, dan perlindungan rute.
- **Sistem Langganan Berbasis "Isi Ulang":** Pengguna dapat memperpanjang langganan kapan saja. Logika backend secara cerdas "menumpuk" durasi baru.
- **Alur Checkout Lengkap:** Termasuk halaman pemilihan durasi, pembuatan invoice, dan halaman pembayaran dengan opsi transfer manual.
- **Sistem Notifikasi Pengguna:** Pengguna menerima notifikasi di dasbor mereka saat pembayaran disetujui atau ditolak.

**2. Panel Admin Terintegrasi (`/admin`):**
- **Keamanan Berbasis Peran:** Rute `/admin` dilindungi oleh `middleware` dan hanya dapat diakses oleh pengguna dengan peran `app_admin`.
- **Dasbor Admin Dinamis:** Menampilkan statistik nyata (total pengguna, pendapatan, langganan aktif) yang diambil langsung dari database.
- **Notifikasi Admin Fungsional:** Ikon lonceng di header secara proaktif memberitahu admin tentang pembayaran yang menunggu verifikasi.
- **Halaman Verifikasi Pembayaran:**
    - Menampilkan daftar invoice yang menunggu konfirmasi.
    - Admin dapat melihat bukti pembayaran dalam modal yang interaktif.
    - Terdapat aksi "Setujui" dan "Tolak" dengan modal konfirmasi untuk mencegah kesalahan.
- **Halaman Histori Pembayaran:**
    - Menampilkan semua riwayat invoice dengan pencarian, filter status, dan pagination.
    - Admin dapat melihat detail invoice, mencetaknya, dan mensimulasikan pengiriman email ke pelanggan.

**3. Otomatisasi & Arsitektur Backend:**
- **Database Functions (RPC):** Logika query yang kompleks (seperti di halaman histori) dipindahkan ke dalam database untuk performa dan keamanan maksimal.
- **Database Triggers:** Pendaftaran pengguna baru secara otomatis membuat `organization`, `profile`, `organization_member`, dan langganan percobaan.
- **Server Actions:** Semua mutasi data (login, logout, upload bukti, konfirmasi pembayaran, dll.) ditangani dengan aman di sisi server.

**4. Struktur dan Desain Aplikasi:**
- **Layout Terpisah:** Dasbor pengguna dan panel admin memiliki layout dan header yang terpisah namun tetap konsisten secara visual.
- **Sidebar Interaktif:** Sidebar dapat diciutkan untuk memberikan lebih banyak ruang kerja.
- **Komponen Modern:** Menggunakan arsitektur Server & Client Component, dengan UI yang mendukung mode terang/gelap.

---

### **Panduan untuk AI (Sesi Berikutnya)**

Untuk menjaga konsistensi dan melanjutkan pengembangan, harap ikuti panduan berikut:

**1. Prioritas Utama Berikutnya: Modul Produk**
- **Tujuan:** Membangun fungsionalitas CRUD (Create, Read, Update, Delete) penuh untuk produk.
- **Lokasi:** Semua halaman terkait produk harus berada di bawah `/dashboard/products`.
- **Langkah Pertama:** Buat halaman utama di `/dashboard/products/page.tsx` yang menampilkan tabel produk (awalnya kosong) dan tombol "Tambah Produk Baru".

**2. Pola Arsitektur yang Harus Diikuti:**
- **Pengambilan Data (Read):** Untuk halaman yang menampilkan daftar data (seperti tabel produk), gunakan **Server Components**. Lakukan pengambilan data langsung di dalam komponen `async function Page()`. Jika diperlukan fitur interaktif seperti filter atau pencarian, gunakan pendekatan **RPC (Database Function)** seperti yang telah kita implementasikan di halaman Histori Admin.
- **Mutasi Data (Create, Update, Delete):** Untuk semua aksi yang mengubah data, **selalu gunakan Server Actions**. Ini memastikan keamanan dan memungkinkan penggunaan `useFormStatus` atau `useTransition` di frontend untuk feedback UX yang baik.
- **Interaktivitas UI:** Untuk komponen yang memerlukan state atau event handlers (seperti modal, dropdown, atau form interaktif), buatlah sebagai **Client Component** (`"use client"`) dan pisahkan dari logika pengambilan data server.

**3. Konsistensi Desain:**
- **Komponen:** Terus gunakan placeholder komponen bergaya Shadcn/UI yang telah kita definisikan untuk konsistensi.
- **Warna:** Gunakan warna `Green Teal` (misalnya, `bg-teal-600`) untuk semua aksi primer (tombol simpan, konfirmasi, dll).
- **Layout:** Pertahankan struktur layout yang ada. Halaman baru harus pas di dalam `<main>` area yang sudah disediakan.

Dengan mengikuti panduan ini, kita dapat memastikan bahwa pengembangan aplikasi Finako berjalan lancar, aman, dan konsisten.
