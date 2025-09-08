# Dokumentasi Aplikasi Finako

**Nama Aplikasi**: Finako App
**Brand Color**: Green Teal
**Bahasa Pemrograman**: TypeScript
**Framework Frontend**: Next.js (dengan App Router)
**Backend**: Supabase (REST API, Edge Functions, Database Functions/RPC)
**Styling & UI**: Tailwind CSS Terbaru + Komponen bergaya Shadcn/UI
**Validasi Data**: Zod
**Manajemen State**: (Lihat catatan di bawah)
**Pendekatan**: Mobile-First dan PWA

---

### Status Pengembangan

#### **Fase 1: Fondasi & Kerangka Produk - Selesai**

Tahap awal ini membangun fondasi aplikasi dan kerangka kerja untuk manajemen produk, namun **belum mencakup manajemen inventaris/stok**.

**1. Modul Inti yang Fungsional:**
- **Autentikasi & Langganan:** Alur lengkap untuk registrasi, login, keamanan, dan manajemen langganan.
- **Panel Admin:** Dasbor fungsional untuk verifikasi dan histori pembayaran.
- **Manajemen Kategori:** CRUD penuh untuk kategori produk, termasuk struktur hierarkis.

**2. Modul Produk & Inventaris (Kerangka Dasar):**
- **CRUD Entitas Produk:** Kemampuan untuk membuat, membaca, memperbarui, dan menghapus **definisi produk** (tipe `SINGLE`). Pengguna dapat mendefinisikan "apa" yang mereka jual.
- **Fitur Pendukung:** Validasi Zod, generate SKU otomatis, dan integrasi pemilihan kategori.
- **Keterbatasan Saat Ini:** Fungsionalitas `track_stock` baru sebatas checkbox. Belum ada cara untuk memasukkan, mengelola, atau melihat **kuantitas stok**.

**3. Arsitektur & Desain:**
- **Server Actions & RSC:** Menggunakan arsitektur modern Next.js.
- **Desain Konsisten:** Layout, sidebar interaktif, dan tema terang/gelap yang seragam.

---

### **Peta Jalan & Panduan untuk AI (Sesi Berikutnya)**

Pengembangan selanjutnya akan berfokus untuk membangun fungsionalitas **manajemen inventaris** yang sebenarnya, yang merupakan inti dari aplikasi ini.

#### **Fase 2: Manajemen Lokasi & Stok Dasar (Prioritas Utama Berikutnya)**
- **Tujuan:** Menghidupkan fungsionalitas pelacakan stok. Pengguna harus bisa menjawab, "Berapa banyak stok produk X yang saya miliki, dan di mana lokasinya?"
- **Tabel Database Utama:** `outlets`, `inventory_stock_levels`, `inventory_stock_movements`.
- **Rencana Implementasi:**
    1.  **CRUD Manajemen Outlet:**
        - Buat halaman baru di `/dashboard/outlets` untuk mengelola lokasi bisnis (misal: Gudang Pusat, Toko A, Toko B).
        - Tambahkan link "Outlet" di sidebar navigasi.
    2.  **Antarmuka Manajemen Stok:**
        - Buat halaman detail produk baru di `/dashboard/products/[id]/inventory` yang akan menjadi pusat kontrol stok untuk produk tersebut.
        - Di halaman ini, tampilkan daftar stok produk di setiap outlet yang ada.
    3.  **Implementasi Aksi Stok:**
        - Buat *Server Actions* untuk mencatat pergerakan stok di `inventory_stock_movements`, yang kemudian akan memperbarui `inventory_stock_levels`.
        - **Fitur Awal:** "Pemasukan Stok" (untuk stok awal/pembelian) dan "Penyesuaian Stok" (untuk barang rusak/hilang).
    4.  **Visualisasi Kuantitas Stok:**
        - Perbarui tabel utama di `/dashboard/products` untuk menampilkan **total kuantitas stok** (jumlah dari semua outlet) untuk setiap produk, bukan hanya teks "Dilacak".
- **Pola Arsitektur:** Tetap gunakan **Server Components** untuk fetching data dan **Server Actions + Zod** untuk mutasi data. Pisahkan form interaktif (misal: form penyesuaian stok) menjadi **Client Components**.

#### **Fase 3 & Seterusnya (Rencana Masa Depan)**
- **Produk dengan Varian:** Setelah stok dasar solid, kembangkan fungsionalitas untuk produk dengan beberapa varian (misal: Baju berdasarkan ukuran/warna).
- **Produk Komposit/Rakitan:** Implementasikan produk "resep" (misal: PC Rakitan).
- **Pelacakan Nomor Seri:** Tambahkan pelacakan per unit untuk barang-barang seperti elektronik.
- **Modul Pelanggan & Transaksi:** Setelah modul produk & inventaris matang, lanjutkan ke manajemen pelanggan dan Point of Sale (POS).
---
**Catatan Tambahan:**
- **State Management (SWR & Zustand):** Tetap belum diimplementasikan. Prioritaskan arsitektur RSC + Server Actions.
