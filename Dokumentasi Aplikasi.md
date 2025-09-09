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

#### **Fase 1 & 2: Fondasi & Produk Tunggal - Selesai**
Fondasi aplikasi dan fungsionalitas penuh untuk produk tunggal telah selesai, termasuk manajemen inventaris dasar.

---

#### **Fase 3: Produk dengan Varian - Selesai**
Tahap ini merombak modul produk untuk mendukung produk yang memiliki beberapa variasi (misalnya, Kaos dengan varian ukuran S, M, L).

**1. Alur Kerja Template-Varian:**
- **Pembuatan Produk Terpisah:** Alur kerja diubah total. Pengguna kini membuat **Template Produk** terlebih dahulu (berisi info umum: nama, deskripsi, gambar, kategori, merek, dan pajak).
- **Halaman Detail Produk:** Setelah template dibuat, pengguna diarahkan ke halaman detail produk (`/dashboard/products/templates/[templateId]`) yang berfungsi sebagai pusat manajemen.
- **Manajemen Varian (CRUD Penuh):** Dari halaman detail, pengguna dapat menambah, mengedit, dan menghapus **varian** (SKU spesifik yang bisa dijual) yang terikat pada produk induk. Setiap varian memiliki harga, SKU, dan manajemen stoknya sendiri.

**2. Peningkatan Pengalaman Pengguna (UX):**
- **Navigasi Intuitif:** Daftar produk utama (`/dashboard/products`) kini menampilkan semua varian yang dapat dijual. Nama dan gambar setiap varian berfungsi sebagai tautan langsung ke halaman detail produk induknya untuk kemudahan manajemen.
- **Tampilan Kontekstual:** Nama produk di tabel utama kini ditampilkan dalam format "Nama Produk Induk - Nama Varian" untuk kejelasan maksimal.
- **Fungsionalitas Lengkap:** Semua fitur dari alur produk tunggal (seperti manajemen pajak dan stok) telah diintegrasikan sepenuhnya ke dalam alur kerja template-varian yang baru.

**3. Manajemen Inventaris yang Solid:**
- **Pemulihan Modul:** Modul manajemen inventaris (`/dashboard/inventory/[variantId]`) telah dibangun kembali sepenuhnya setelah terhapus secara tidak sengaja, memastikan tidak ada fungsionalitas yang hilang.
- **Konsistensi Data:** Tampilan jumlah stok kini konsisten di semua halaman, baik di daftar produk utama maupun di halaman detail produk.

---

### **Peta Jalan & Panduan untuk AI (Sesi Berikutnya)**

Pengembangan selanjutnya akan berfokus pada pengenalan tipe produk yang lebih kompleks.

#### **Fase 4: Produk Komposit/Rakitan (Prioritas Utama Berikutnya)**
- **Tujuan:** Memungkinkan pengguna membuat produk "paket" atau "resep". Contoh: "Paket Hampers Lebaran" yang terdiri dari 1 Sirup, 2 Kue Kering, dan 1 Kartu Ucapan. Saat "Paket Hampers" dijual, stok dari masing-masing komponen akan berkurang secara otomatis.
- **Tabel Database Utama:** `product_composites` (untuk menyimpan resep) akan digunakan secara ekstensif, menghubungkan satu `product_variant` (sebagai produk jadi) ke beberapa `product_variant` lain (sebagai komponen).
- **Rencana Implementasi:**
    1.  **Perbarui Form Varian:** Di modal "Tambah/Edit Varian", tambahkan opsi `product_type` baru, yaitu `COMPOSITE`.
    2.  **Buat UI Manajemen Resep:** Jika sebuah varian ditandai sebagai `COMPOSITE`, tampilkan UI baru di halaman detail produk. UI ini memungkinkan pengguna untuk mencari dan menambahkan produk varian lain sebagai komponen, beserta kuantitas yang dibutuhkan untuk "merakit" produk komposit tersebut.
    3.  **Buat RPC untuk Manajemen Stok:** Kembangkan fungsi RPC baru di Supabase (misalnya, `sell_composite_product`) yang, ketika dipanggil, akan secara otomatis mengurangi stok dari semua varian komponen sesuai dengan resep yang telah ditentukan.

#### **Fase 5 & Seterusnya (Rencana Masa Depan)**
- **Pelacakan Nomor Seri:** Tambahkan pelacakan per unit untuk barang-barang seperti elektronik.
- **Modul Pelanggan & Transaksi:** Setelah modul produk & inventaris matang, lanjutkan ke manajemen pelanggan dan Point of Sale (POS).

---
**Catatan Tambahan:**
- **State Management (SWR & Zustand):** Tetap belum diimplementasikan. Prioritaskan arsitektur RSC + Server Actions.
