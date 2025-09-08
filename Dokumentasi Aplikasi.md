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

#### **Pengembangan Tahap 1-3 - Selesai**

Fondasi aplikasi, modul produk, dan modul kategori telah berhasil dibangun.

**1. Alur Autentikasi & Langganan (SaaS Core):**
- Fitur lengkap untuk registrasi, login, keamanan rute, dan manajemen langganan.
- Alur checkout dan notifikasi pembayaran.

**2. Panel Admin Terintegrasi (`/admin`):**
- Dasbor admin dengan statistik nyata.
- Fungsionalitas penuh untuk verifikasi dan histori pembayaran.

**3. Modul Produk & Inventaris (Terintegrasi):**
- **CRUD Penuh:** Fungsionalitas lengkap untuk membuat, membaca, memperbarui, dan menghapus produk.
- **Validasi Data (Zod):** Memastikan integritas data untuk semua operasi.
- **Generate SKU Otomatis:** Membuat SKU unik secara otomatis.
- **Integrasi Kategori:** Produk kini dapat dihubungkan dengan kategori melalui dropdown di form.

**4. Modul Kategori Produk (Hierarkis):**
- **CRUD Penuh:** Manajemen kategori melalui antarmuka modal yang efisien di halaman `/dashboard/categories`.
- **Struktur Induk-Anak:** Mendukung pembuatan sub-kategori.
- **Navigasi:** Dapat diakses dengan mudah melalui sidebar utama dan *shortcut* dari form produk.

**5. Arsitektur & Desain:**
- **Server Actions & RSC:** Menggunakan arsitektur modern Next.js untuk semua operasi data dan rendering.
- **Database Triggers & RPC:** Otomatisasi dan query yang efisien di level database.
- **Desain Konsisten:** Layout, sidebar, dan tema terang/gelap yang seragam di seluruh aplikasi.

---

### **Panduan untuk AI (Sesi Berikutnya)**

Untuk menjaga konsistensi dan melanjutkan pengembangan, harap ikuti panduan berikut:

**1. Prioritas Utama Berikutnya: Membangun Modul Pelanggan (CRM)**
- **Tujuan:** Memungkinkan pengguna untuk menyimpan dan mengelola data pelanggan mereka. Ini adalah langkah pertama menuju fungsionalitas Point of Sale (POS) yang lebih lengkap.
- **Tabel Database:** `customers` (sudah ada).
- **Fitur yang Dibutuhkan:**
    - Halaman baru di `/dashboard/customers` untuk mengelola pelanggan (CRUD).
    - Form untuk menambah/mengedit data pelanggan (Nama, Telepon, Email, Alamat).
    - **Integrasi Masa Depan:** Field pelanggan ini nantinya akan bisa dihubungkan ke transaksi penjualan.

**2. Pola Arsitektur yang Harus Diikuti:**
- **Pengambilan Data (Read):** Gunakan **React Server Components (RSC)**.
- **Mutasi Data (Create, Update, Delete):** Gunakan **Server Actions** dengan validasi **Zod**.
- **Interaktivitas UI:** Pisahkan komponen interaktif menjadi **Client Component** (`"use client"`), gunakan pendekatan modal jika sesuai.

**3. Catatan Penting tentang Manajemen State (Zustand & SWR):**
- **SWR & Zustand:** Keduanya **belum diimplementasikan**. Tetap prioritaskan RSC dan React Hooks bawaan. Adopsi hanya jika ada kebutuhan spesifik untuk data *real-time* (SWR) atau state klien yang sangat kompleks (Zustand).

Dengan mengikuti panduan ini, kita dapat memastikan bahwa pengembangan aplikasi Finako berjalan lancar dan konsisten.
