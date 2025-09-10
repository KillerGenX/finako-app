# Dokumentasi Aplikasi Finako

Dokumen ini berfungsi sebagai panduan pusat untuk pengembangan aplikasi Finako, mencatat arsitektur, keputusan desain, dan peta jalan (roadmap) proyek. Tujuannya adalah untuk memastikan konsistensi dan memberikan panduan yang jelas bagi AI Agent (seperti Gemini) atau pengembang manusia yang akan melanjutkan proyek ini.

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

### **Visi & Tujuan Proyek**

Finako adalah aplikasi Point of Sale (POS) berbasis SaaS (Software as a Service) yang dirancang untuk UMKM. Visi utamanya adalah menyediakan solusi manajemen bisnis yang terintegrasi, mulai dari manajemen produk dan inventaris, transaksi penjualan, hingga akuntansi dan SDM, dalam satu platform yang mudah digunakan.

---

### **Fase Pengembangan Terkini**

#### **Fase 1 & 2: Fondasi Awal - Selesai**
Fase awal pengembangan mencakup penyiapan proyek Next.js, implementasi modul otentikasi pengguna, manajemen organisasi (multi-tenant), dan dasar-dasar langganan (subscription).

---

#### **Fase 3: Produk dengan Varian - Selesai**
Tahap ini merombak modul produk untuk mendukung produk yang memiliki beberapa variasi (misalnya, Kaos dengan varian ukuran S, M, L). Fitur ini telah diselesaikan dan dipoles untuk memastikan kelengkapan fungsional.

**Pencapaian Utama:**
**1. Struktur Data yang Fleksibel:**
   - Tabel `products` berfungsi sebagai *template* yang menyimpan informasi umum.
   - Tabel `product_variants` menyimpan unit yang dapat dijual (SKU), masing-masing dengan harga, stok, dan atribut uniknya.

**2. Peningkatan Pengalaman Pengguna (UX):**
   - **Pencarian & Filter:** Halaman daftar produk utama kini dilengkapi dengan fungsionalitas pencarian (berdasarkan nama/SKU) dan filter per kategori di sisi klien untuk performa yang instan.
   - **Navigasi Intuitif:** Daftar produk utama (`/dashboard/products`) kini menampilkan semua varian yang dapat dijual. Nama dan gambar setiap varian berfungsi sebagai tautan langsung ke halaman detail produk induknya.
   - **Tampilan Kontekstual:** Nama produk di tabel utama kini ditampilkan secara cerdas. Logika ini telah dipindahkan ke fungsi RPC `get_products_with_stock` di database untuk memastikan konsistensi:
     - Untuk produk `SINGLE`, hanya nama produk yang ditampilkan (misal: "Kopi Susu").
     - Untuk produk `VARIANT`, nama ditampilkan dalam format "Produk - Varian" (misal: "Kaos Polos - Merah").

**3. Manajemen Inventaris yang Solid:**
   - **Pemulihan & Restrukturisasi Modul:** Modul manajemen inventaris telah dibangun kembali di lokasi yang lebih logis (`/dashboard/inventory/[variantId]`) dan berfungsi penuh.
   - **Konsistensi Data:** Tampilan jumlah stok kini konsisten di semua halaman.

---

#### **Fase 4: Produk Tunggal - Selesai**
Tahap ini memperkenalkan dukungan untuk produk tipe `SINGLE` (produk tunggal tanpa varian), menyederhanakan proses pembuatan produk bagi pengguna.

**Pencapaian Utama:**
**1. Alur Pembuatan Produk yang Dinamis:**
   - **Pemilihan Tipe Produk:** Formulir "Buat Produk Baru" kini dilengkapi dengan pilihan tipe produk (`SINGLE` dan `VARIANT` aktif; `COMPOSITE` dan `SERVICE` dinonaktifkan untuk pengembangan di masa depan).
   - **UI Kondisional:** Antarmuka formulir berubah secara dinamis. Untuk produk `SINGLE`, kolom harga, SKU, dan lacak stok ditampilkan langsung di langkah pertama, memungkinkan pembuatan produk dalam satu langkah.
   - **Logika Backend Cerdas:** *Server action* `createProductTemplate` telah dimodifikasi untuk menangani kedua tipe produk, membuat *template* dan *variant* sekaligus untuk produk `SINGLE`, dan mengarahkan pengguna ke alur yang sesuai.

---

### **Peta Jalan & Panduan untuk AI (Sesi Berikutnya)**

Berdasarkan keputusan strategis, pengembangan akan dilanjutkan sesuai roadmap awal untuk menyelesaikan semua tipe produk sebelum memperkaya modul lainnya.

**1. Langkah Selanjutnya: Implementasi Produk `COMPOSITE`**
   - **Tujuan:** Memungkinkan pengguna untuk membuat produk yang terdiri dari beberapa produk lain (resep atau *Bill of Materials*). Contoh: "Paket Hemat A" terdiri dari 1 Roti dan 1 Kopi Susu.
   - **Tugas:**
     - Aktifkan pilihan `COMPOSITE` di formulir pembuatan produk.
     - Rancang dan implementasikan antarmuka (UI) di halaman detail produk untuk menambahkan/mengelola komponen dari produk komposit.
     - Buat *server action* untuk menyimpan dan mengelola hubungan antara produk induk komposit dan komponen-komponennya di tabel `product_composites`.
     - Sesuaikan logika manajemen inventaris: saat produk komposit terjual, stok komponennya harus berkurang secara otomatis.

**2. Tugas Penting Berikutnya: Halaman Detail Produk yang Dinamis**
   - **Masalah Saat Ini:** Halaman detail produk (`/dashboard/products/templates/[templateId]`) saat ini memiliki desain yang kaku dan hanya cocok untuk produk `VARIANT`. Saat melihat produk `SINGLE`, halaman tersebut menampilkan tombol "Tambah Varian" yang tidak relevan dan membingungkan.
   - **Solusi yang Diinginkan:**
     - Modifikasi halaman detail produk agar dapat beradaptasi berdasarkan `product_type` dari produk yang sedang dilihat.
     - **Jika `product_type` adalah `SINGLE`:** Halaman harus menampilkan detail dari satu-satunya varian yang ada dalam mode "baca" atau "edit" form, tanpa ada daftar varian atau tombol "Tambah Varian".
     - **Jika `product_type` adalah `VARIANT`:** Halaman harus mempertahankan fungsionalitasnya saat ini, yaitu menampilkan daftar varian dan tombol untuk menambah varian baru.
   - **Prioritas:** Ini adalah perbaikan UX prioritas tinggi yang harus dikerjakan setelah fungsionalitas dasar `COMPOSITE` selesai.
