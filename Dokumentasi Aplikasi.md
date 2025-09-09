# Dokumentasi Aplikasi Finako

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

### Status Pengembangan

#### **Fase 1 & 2: Fondasi & Produk Tunggal yang Lengkap - Selesai**

Tahap ini membangun fondasi aplikasi yang kokoh dan fungsionalitas penuh untuk produk tunggal dan manajemen inventaris dasarnya.

**1. Modul Inti yang Fungsional:**
- **Autentikasi & Langganan:** Alur lengkap untuk registrasi, login, keamanan, dan manajemen langganan.
- **Panel Admin:** Dasbor fungsional untuk verifikasi dan histori pembayaran.
- **Manajemen Kategori:** CRUD penuh untuk kategori produk (hierarkis).
- **Manajemen Outlet/Lokasi:** CRUD penuh untuk mengelola semua lokasi fisik bisnis.
- **Manajemen Merek & Pajak:** CRUD penuh untuk merek dan tarif pajak, diakses secara kontekstual dari form produk.

**2. Modul Produk & Inventaris (Produk `SINGLE` Lengkap):**
- **CRUD Entitas Produk:** Fungsionalitas penuh untuk membuat, membaca, memperbarui, dan menghapus **definisi produk** (tipe `SINGLE`).
- **Atribut Lengkap:** Produk kini mendukung:
    - **Harga Modal (`cost_price`)**
    - **Foto Produk** (dengan unggahan ke Supabase Storage)
    - **Integrasi Merek & Kategori**
    - **Integrasi Pajak** (mendukung beberapa pajak per produk)
- **Manajemen Pergerakan Stok:** Fungsionalitas penuh untuk Pemasukan Stok, Penyesuaian, dan Transfer Antar Outlet. Total stok divisualisasikan dengan benar di tabel utama.

**3. Arsitektur & Desain:**
- **Server Actions & RSC:** Menggunakan arsitektur modern Next.js yang siap untuk masa depan (Next.js 15).
- **Desain Konsisten:** UI/UX yang seragam di semua modul, termasuk *feedback* loading dan penanganan error.

---

### **Peta Jalan & Panduan untuk AI (Sesi Berikutnya)**

Pengembangan selanjutnya akan berfokus pada pengenalan tipe produk yang lebih kompleks.

#### **Fase 3: Produk dengan Varian (Prioritas Utama Berikutnya)**
- **Tujuan:** Memungkinkan pengguna menjual produk yang memiliki beberapa variasi, seperti "Laptop HP 14s" yang dijual dalam varian Core i3 dan Core i5.
- **Tabel Database Utama:** `products` (sebagai template induk) dan `product_variants` (untuk setiap varian spesifik).
- **Rencana Implementasi:**
    1.  **Merombak Alur Tambah/Edit Produk:**
        - Halaman `/dashboard/products` akan tetap menampilkan daftar semua **varian** yang bisa dijual (SKU).
        - Tombol "Tambah Produk" akan mengarahkan ke form baru untuk membuat **template produk** (`products`), yang hanya berisi info umum (nama, deskripsi, kategori, merek, foto).
        - Setelah template dibuat, pengguna akan diarahkan ke halaman detail produk tersebut.
    2.  **Halaman Detail Produk:**
        - Membuat halaman baru di `/dashboard/products/[id]` yang menampilkan detail produk induk.
        - Di halaman ini, pengguna dapat mengelola (menambah/mengedit/menghapus) semua **varian** (`product_variants`) yang terkait dengan produk tersebut. Setiap varian akan memiliki SKU, harga modal, harga jual, dan stoknya sendiri.
- **Pola Arsitektur:** Tetap gunakan **Server Components** untuk fetching data dan **Server Actions + Zod** untuk mutasi data. Pisahkan form interaktif menjadi **Client Components**.

#### **Fase 4 & Seterusnya (Rencana Masa Depan)**
- **Produk Komposit/Rakitan:** Implementasikan produk "resep" (misal: PC Rakitan).
- **Pelacakan Nomor Seri:** Tambahkan pelacakan per unit untuk barang-barang seperti elektronik.
- **Modul Pelanggan & Transaksi:** Setelah modul produk & inventaris matang, lanjutkan ke manajemen pelanggan dan Point of Sale (POS).
---
**Catatan Tambahan:**
- **State Management (SWR & Zustand):** Tetap belum diimplementasikan. Prioritaskan arsitektur RSC + Server Actions.
