# Dokumentasi Aplikasi Finako

Versi: 1.9
Tanggal Pembaruan: [Tanggal Hari Ini]

---

### **Visi & Tujuan Proyek**

Finako adalah aplikasi Point of Sale (POS) berbasis SaaS (Software as a Service) yang dirancang untuk UMKM. Visi utamanya adalah menyediakan solusi manajemen bisnis yang terintegrasi, mulai dari manajemen produk dan inventaris, transaksi penjualan, hingga akuntansi dan SDM, dalam satu platform yang mudah digunakan.

**Nama Aplikasi**: Finako App
**VISI Finako** Aplikasi Super App,Menggabungkan Majoo/Moka Pos,Accurate/Zahir dan Mekari Talenta untuk UMKM Indonesia dengan Harga yang murah
**Brand Color**: Green Teal
**Bahasa Pemrograman**: TypeScript
**Framework Frontend**: Next.js (dengan App Router)
**Backend**: Supabase (REST API, Edge Functions, Database Functions/RPC)
**Styling & UI**: Tailwind CSS Terbaru + Komponen bergaya Shadcn/UI
**Validasi Data**: Zod
**Pendekatan**: Mobile-First dan PWA

---

### **Fase Pengembangan**

#### **Fase 1-10: Fondasi, POS, & Arsitektur Modular - Selesai**
Fase-fase awal berfokus pada penyiapan proyek, otentikasi, modul produk yang komprehensif, fungsionalitas inti manajemen stok, dan penyempurnaan modul POS. Puncaknya adalah refactor arsitektur struk/invoice menjadi komponen modular yang dapat digunakan kembali.

---

#### **Fase 11: Pendalaman Modul CRM - Selesai**
Fase ini memperdalam modul CRM untuk memberikan wawasan bisnis yang nyata.
**Pencapaian Utama:**
- **Manajemen Pelanggan Penuh:** Mengimplementasikan fungsionalitas CRUD (Create, Read, Update, Delete) yang lengkap di halaman manajemen pelanggan.
- **Halaman Detail Pelanggan:** Membuat halaman dinamis (`/customers/[customerId]`) yang menampilkan:
    - Profil lengkap pelanggan.
    - Statistik kunci (Total Belanja, Kunjungan Terakhir, dll.).
    - Riwayat transaksi pelanggan dengan fitur pencarian dan paginasi.
- **Interaksi Digital:** Mengimplementasikan fitur kirim struk/invoice ke WhatsApp melalui halaman web publik yang unik.

---

### **Peta Jalan & Rencana Pengembangan**

#### **Fase 12: Pendalaman Modul Outlet & Inventaris - Selanjutnya**
Setelah modul CRM menjadi matang, fokus selanjutnya adalah mengubah modul Outlet dari sekadar daftar alamat menjadi *dashboard operasional* untuk setiap lokasi bisnis, yang menjadi dasar untuk manajemen inventaris multi-lokasi.
**Rencana Aksi:**
- **Halaman Detail Outlet:**
    - Membuat halaman dinamis baru (`/dashboard/outlets/[outletId]`).
    - Menampilkan informasi lengkap outlet, termasuk peta interaktif.
    - **Fitur Kunci:** Menampilkan daftar **inventaris dan jumlah stok** untuk semua produk yang ada di outlet tersebut.
    - Menampilkan riwayat transaksi yang terjadi spesifik di outlet tersebut.
- **RPC & Server Actions:** Membangun backend yang diperlukan untuk mengambil data komprehensif ini secara efisien.

---

#### **Ide untuk Masa Depan**

1.  **Manajemen Stok Lanjutan:** Mengimplementasikan fitur **Transfer Stok** antar-outlet.
2.  **Segmentasi Pelanggan:** Menambahkan fitur grup dan label (misal: VIP, Reseller) untuk keperluan marketing.
3.  **Impor/Ekspor Data:** Memungkinkan pengguna untuk mengimpor/ekspor daftar pelanggan.
4.  **Fitur Inventaris Cerdas:** Alur Kerja Stok Opname Terpandu & Laporan Inventaris Lanjutan.
5.  **Modul Skala Lebih Besar:** Manajemen Pemasok & Pesanan Pembelian, Laporan Penjualan Lanjutan.
