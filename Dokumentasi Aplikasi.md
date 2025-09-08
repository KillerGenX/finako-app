# Dokumentasi Aplikasi Finako

**Nama Aplikasi**: Finako App
**Brand Color**: Green Teal
**Bahasa Pemrograman**: TypeScript
**Framework Frontend**: Next.js (dengan App Router)
**Backend**: Supabase (REST API, Edge Functions, Database Functions/RPC)
**Styling & UI**: Tailwind CSS + Komponen bergaya Shadcn/UI
**Validasi Data**: Zod
**Manajemen State**: (Lihat catatan di bawah)
**Pendekatan**: Mobile-First dan PWA

---

### Status Pengembangan

#### **Pengembangan Tahap 1 & 2 - Selesai**

Fondasi aplikasi dan modul produk inti telah berhasil dibangun, mencakup fitur-fitur berikut:

**1. Alur Autentikasi & Langganan (SaaS Core):**
- Alur lengkap untuk registrasi, login, verifikasi email, dan middleware keamanan.
- Sistem langganan "isi ulang" dengan logika penumpukan durasi.
- Alur checkout lengkap: pemilihan durasi, pembuatan invoice, dan pembayaran transfer manual.
- Sistem notifikasi pengguna di dasbor untuk status pembayaran.

**2. Panel Admin Terintegrasi (`/admin`):**
- Keamanan berbasis peran (`app_admin`) yang melindungi rute.
- Dasbor admin dengan statistik nyata (total pengguna, pendapatan, dll.).
- Fungsionalitas penuh untuk menyetujui dan menolak pembayaran.
- Halaman histori pembayaran dengan pencarian, filter, dan pagination.

**3. Modul Produk & Inventaris (CRUD Lengkap):**
- **Create:** Membuat produk baru dengan form tervalidasi (`/dashboard/products/new`).
- **Read:** Menampilkan daftar semua produk dalam tabel (`/dashboard/products`).
- **Update:** Mengedit produk yang ada melalui halaman form dinamis (`/dashboard/products/[id]/edit`).
- **Delete:** Menghapus produk langsung dari tabel daftar produk.
- **Fitur Tambahan:**
    - **Validasi Data (Zod):** Memastikan integritas data untuk operasi Create dan Update.
    - **Generate SKU Otomatis:** Membuat SKU unik secara otomatis jika kolom SKU dibiarkan kosong.

**4. Otomatisasi & Arsitektur Backend:**
- **Database Functions (RPC)** untuk query yang kompleks.
- **Database Triggers** untuk otomatisasi (misalnya, pembuatan profil saat registrasi).
- **Server Actions** sebagai metode utama dan aman untuk semua mutasi data.

**5. Struktur dan Desain Aplikasi:**
- Layout terpisah antara dasbor pengguna dan panel admin.
- Sidebar interaktif yang dapat diciutkan (`collapsible`).
- Arsitektur modern **Server & Client Component**, dengan UI yang mendukung mode terang/gelap.

---

### **Panduan untuk AI (Sesi Berikutnya)**

Untuk menjaga konsistensi dan melanjutkan pengembangan, harap ikuti panduan berikut:

**1. Prioritas Utama Berikutnya: Membangun Modul Kategori Produk**
- **Tujuan:** Memungkinkan pengguna untuk mengelompokkan produk mereka ke dalam kategori. Ini akan menjadi fondasi untuk pelaporan dan penyaringan di masa depan.
- **Tabel Database:** `product_categories` (sudah ada).
- **Fitur yang Dibutuhkan:**
    - Halaman baru di `/dashboard/categories` untuk mengelola kategori (CRUD).
    - Kemampuan untuk membuat kategori induk dan anak (struktur hierarkis).
    - **Integrasi:** Modifikasi form "Tambah/Edit Produk" untuk menyertakan dropdown pilihan kategori.

**2. Pola Arsitektur yang Harus Diikuti:**
- **Pengambilan Data (Read):** Prioritaskan penggunaan **React Server Components (RSC)**.
- **Mutasi Data (Create, Update, Delete):** **Selalu gunakan Server Actions** dengan validasi **Zod**.
- **Interaktivitas UI:** Pisahkan komponen interaktif (modal, dropdown, form) menjadi **Client Component** (`"use client"`).

**3. Catatan Penting tentang Manajemen State (Zustand & SWR):**
- **SWR (Server State):**
    - **Status:** **Belum Diimplementasikan.**
    - **Alasan:** Arsitektur RSC menangani kebutuhan pengambilan data awal kita.
    - **Kapan Menggunakannya:** Hanya untuk kebutuhan data *real-time* atau *infinite scrolling* di sisi klien.
- **Zustand (Client State):**
    - **Status:** **Belum Diimplementasikan.**
    - **Alasan:** State klien saat ini masih sederhana.
    - **Kapan Menggunakannya:** Hanya jika state klien menjadi sangat kompleks atau perlu dibagikan ke banyak komponen yang tidak berhubungan.

Dengan mengikuti panduan ini, kita dapat memastikan bahwa pengembangan aplikasi Finako berjalan lancar, aman, dan konsisten.
