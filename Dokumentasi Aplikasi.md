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

#### **Fase 1: Fondasi & Kerangka Inventaris - Selesai**

Tahap awal ini membangun fondasi aplikasi dan mekanisme pergerakan stok.

**1. Modul Inti yang Fungsional:**
- **Autentikasi & Langganan:** Alur lengkap untuk registrasi, login, keamanan, dan manajemen langganan.
- **Panel Admin:** Dasbor fungsional untuk verifikasi dan histori pembayaran.
- **Manajemen Kategori:** CRUD penuh untuk kategori produk, termasuk struktur hierarkis.
- **Manajemen Outlet/Lokasi:** CRUD penuh untuk mengelola semua lokasi fisik bisnis.

**2. Modul Produk & Inventaris (Kerangka Dasar):**
- **CRUD Entitas Produk:** Kemampuan untuk membuat, membaca, memperbarui, dan menghapus **definisi produk** (tipe `SINGLE`).
- **Manajemen Pergerakan Stok:** Fungsionalitas penuh untuk Pemasukan Stok, Penyesuaian, dan Transfer Antar Outlet. Total stok sudah divisualisasikan.
- **Keterbatasan Saat Ini:** Definisi produk `SINGLE` itu sendiri **belum lengkap**. Masih kekurangan atribut penting seperti Harga Modal, Foto, Merek, dan Pajak.

**3. Arsitektur & Desain:**
- **Server Actions & RSC:** Menggunakan arsitektur modern Next.js yang siap untuk masa depan (Next.js 15).
- **Desain Konsisten:** Layout, sidebar interaktif, dan tema terang/gelap yang seragam.

---

### **Peta Jalan & Panduan untuk AI (Sesi Berikutnya)**

Pengembangan selanjutnya akan berfokus untuk **melengkapi atribut produk tunggal** sebelum beralih ke tipe produk yang lebih kompleks.

#### **Fase 2: Melengkapi Atribut Produk `SINGLE` (Prioritas Utama Berikutnya)**
- **Tujuan:** Membuat definisi produk tunggal menjadi lengkap dan fungsional sepenuhnya, siap untuk analisis bisnis dasar.
- **Tabel Database Utama:** `product_variants` (untuk `cost_price`), `products` (untuk `image_url`, `brand_id`), `brands`, `tax_rates`.
- **Rencana Implementasi (berurutan):**
    1.  **Implementasi Harga Modal (`cost_price`):** (Selesai)
        - Menambahkan field "Harga Modal" ke form Tambah/Edit Produk.
    2.  **CRUD & Integrasi Merek (`brands`):**
        - Buat halaman manajemen baru di `/dashboard/brands` untuk CRUD Merek.
        - **Desain Akses:** Halaman ini tidak akan ditambahkan ke sidebar utama. Akses akan melalui *shortcut* kontekstual.
        - Tambahkan dropdown pilihan Merek di form Tambah/Edit Produk, lengkap dengan link "(Kelola Merek)".
    3.  **Implementasi Foto Produk (`image_url`):**
        - Integrasikan Supabase Storage ke dalam aplikasi.
        - Buat UI untuk unggah gambar (pilih file, pratinjau, progress bar) di form Tambah/Edit Produk.
        - Perbarui *Server Action* untuk menangani unggahan file, mendapatkan URL, dan menyimpannya ke tabel `products`.
    4.  **CRUD & Integrasi Pajak (`tax_rates`):**
        - Buat halaman manajemen baru di `/dashboard/taxes` untuk CRUD Tarif Pajak.
        - Akses juga akan melalui *shortcut* dari form produk.

- **Pola Arsitektur:** Tetap gunakan **Server Components** untuk fetching data dan **Server Actions + Zod** untuk mutasi data. Pisahkan komponen interaktif menjadi **Client Components**.

#### **Fase 3 & Seterusnya (Rencana Masa Depan)**
- **Produk dengan Varian:** Setelah produk `SINGLE` solid, kembangkan fungsionalitas untuk produk dengan beberapa varian.
- **Produk Komposit/Rakitan:** Implementasikan produk "resep".
- **Pelacakan Nomor Seri:** Tambahkan pelacakan per unit.
- **Modul Pelanggan & Transaksi:** Setelah modul produk & inventaris matang, lanjutkan ke manajemen pelanggan dan Point of Sale (POS).
---
**Catatan Tambahan:**
- **State Management (SWR & Zustand):** Tetap belum diimplementasikan. Prioritaskan arsitektur RSC + Server Actions.
