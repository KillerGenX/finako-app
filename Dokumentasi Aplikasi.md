# Dokumentasi Aplikasi Finako

Versi: 1.4
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
**Manajemen State**: (Lihat catatan di bawah)
**Pendekatan**: Mobile-First dan PWA



---

### **Fase Pengembangan**

#### **Fase 1-6: Fondasi & Modul Produk Komprehensif - Selesai**
Fase awal berfokus pada penyiapan proyek, otentikasi, dan implementasi modul produk yang lengkap, mencakup tipe `SINGLE`, `VARIANT`, dan `COMPOSITE`, beserta penyempurnaan UI/UX di halaman detail.

---

#### **Fase 7: Fondasi Manajemen Inventaris - Selesai**
Tahap ini mengimplementasikan fungsionalitas inti untuk manajemen stok yang memungkinkan kontrol penuh atas pergerakan barang di berbagai lokasi.
**Pencapaian Utama:**
- **Manajemen Stok per Varian:** Kemampuan untuk melihat riwayat dan level stok untuk setiap varian produk secara individual.
- **Penyesuaian Stok (Stock Adjustment):** Fungsionalitas penuh untuk menambah atau mengurangi stok secara manual dengan alasan (misal: rusak, hilang, stok opname).
- **Transfer Stok Antar-Outlet:** Alur kerja yang jelas untuk memindahkan stok dari satu outlet ke outlet lainnya.

---

#### **Fase 8: Fitur Lanjutan & Penguatan Sistem - Selesai**
Fase ini menambahkan kecerdasan bisnis, mengimplementasikan tipe produk jasa, dan memperkuat keamanan serta ketahanan sistem secara keseluruhan.
**Pencapaian Utama:**
- **Implementasi HPP Ototmatis:** Produk komposit kini secara otomatis menghitung HPP dan Laba Kotor.
- **Implementasi Tipe Produk "Jasa":** Tipe produk `SERVICE` telah diaktifkan sepenuhnya.
- **Penguatan Multi-Tenancy:**
    - Berhasil melakukan verifikasi keamanan data produk, kategori, merek, dll., antar organisasi.
    - Memperbaiki bug kritis di mana notifikasi bisa dilihat oleh pengguna dari organisasi lain.
- **Perbaikan Bug & UX:** Mengatasi masalah `NEXT_REDIRECT`, memperbaiki logika penamaan ganda, dan menyempurnakan form.
- **Otomatisasi Sistem:** Membuat trigger database untuk data default (`units_of_measure`) bagi pengguna baru, mencegah bug di masa depan.

---

### **Peta Jalan & Rencana Pengembangan**

#### **Fase 9: Fondasi Point of Sale (POS) - Sedang Berlangsung**
Setelah memiliki modul produk dan inventaris yang solid, prioritas utama saat ini adalah membangun fungsionalitas inti dari aplikasi: **mesin kasir (POS)**. Fase ini akan menghubungkan semua modul yang ada dan memungkinkan alur kerja penjualan yang sebenarnya.
**Rencana Aksi:**
- **UI Kasir:** Membangun antarmuka utama untuk kasir dengan pencarian produk dan manajemen keranjang belanja.
- **Proses Checkout:** Membuat *server action* `createTransaction` untuk mencatat penjualan, pembayaran, dan yang terpenting, **mengurangi stok secara otomatis**.
- **Logika Pengurangan Stok:** Membuat atau memanggil fungsi database yang andal untuk memastikan stok berkurang secara akurat setelah setiap transaksi.

---

#### **Ide untuk Masa Depan (Setelah POS Selesai)**

1.  **Fitur Inventaris Cerdas:**
    - **Alur Kerja Stok Opname Terpandu:** Membuat UI khusus untuk menyederhanakan proses stok opname.
    - **Laporan Inventaris Lanjutan:** Peringatan Stok Menipis, Nilai Total Inventaris, dan Produk Lambat Terjual.

2.  **Modul Skala Lebih Besar:**
    - **Manajemen Pemasok (Supplier)** & **Pesanan Pembelian (Purchase Order)**.
    - **Laporan Penjualan Dasar:** Laporan harian, mingguan, dan bulanan.
    - **Manajemen Pelanggan (CRM):** Menyimpan data pelanggan dan riwayat transaksi mereka.
