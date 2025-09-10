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
Tahap ini merombak modul produk untuk mendukung produk yang memiliki beberapa variasi.
**Pencapaian Utama:**
- **Struktur Data Fleksibel:** Penggunaan tabel `products` sebagai template dan `product_variants` untuk SKU yang dapat dijual.
- **Peningkatan UX:** Fungsionalitas pencarian, filter, dan navigasi yang intuitif di halaman daftar produk.
- **Tampilan Kontekstual:** Nama produk ditampilkan secara cerdas menggunakan fungsi RPC `get_products_with_stock` untuk membedakan format nama produk `SINGLE` dan `VARIANT`.

---

#### **Fase 4: Produk Tunggal - Selesai**
Tahap ini memperkenalkan dukungan untuk produk tipe `SINGLE`, menyederhanakan proses pembuatan produk dalam satu langkah melalui UI dan *server action* yang dinamis.

---

#### **Fase 5: Produk Komposit (Manajemen Resep) - Selesai**
Tahap ini mengimplementasikan fungsionalitas inti untuk produk `COMPOSITE`, yang memungkinkan pengguna membuat produk yang terdiri dari produk lain (resep/BOM).

**Pencapaian Utama:**
1.  **Alur Pembuatan Produk Komposit:** Pengguna kini dapat membuat "wadah" untuk produk komposit dari halaman "Buat Produk Baru".
2.  **Manajemen Komponen Penuh:** Halaman detail produk komposit kini menjadi manajer resep yang fungsional, memungkinkan pengguna untuk:
    - **Mencari & Menambah Komponen:** Antarmuka pencarian *real-time* untuk mencari dan menambahkan produk `SINGLE` atau `VARIANT` ke dalam resep.
    - **Mengedit Kuantitas:** Fungsionalitas "auto-save" yang mulus saat pengguna mengubah kuantitas komponen, memberikan UX yang modern.
    - **Menghapus Komponen:** Kemampuan untuk menghapus komponen dari resep.
3.  **Arsitektur Data yang Efisien:** Transisi dari beberapa *query* di sisi klien ke **satu panggilan fungsi RPC (`get_product_details`)** yang komprehensif di sisi server. Ini secara signifikan meningkatkan kinerja dan menyederhanakan kode pengambilan data.
4.  **Debugging & Peningkatan Stabilitas:** Mengidentifikasi dan memperbaiki serangkaian *bug* kritis yang saling terkait:
    - Memperbaiki inisialisasi Supabase SSR Client di semua *server action* dan komponen server untuk mengatasi masalah otentikasi.
    - Memperbaiki *bug* constraint `NOT NULL` pada `unit_of_measure_id` yang menyebabkan kegagalan penambahan komponen.
    - Menyinkronkan struktur data antara RPC dan komponen *front-end* untuk mengatasi *error* render.

---

### **Peta Jalan & Panduan untuk AI (Sesi Berikutnya)**

Pengembangan modul produk hampir selesai. Fokus selanjutnya adalah menyelesaikan dua fitur kunci terakhir dan melakukan perbaikan UX yang penting. Logika transaksi akan diintegrasikan nanti saat membangun modul POS.

**1. Prioritas #1: Harga Pokok (HPP) Otomatis untuk Produk Komposit**
   - **Tujuan:** Memberikan data keuntungan yang akurat kepada pengguna dengan menghitung HPP produk komposit secara otomatis.
   - **Tugas:**
     - Buat atau modifikasi fungsi RPC di database untuk menghitung total HPP dari sebuah produk komposit dengan menjumlahkan `(kuantitas * HPP)` dari setiap komponennya.
     - Tampilkan HPP yang dihitung secara dinamis ini di halaman detail produk komposit sebagai *field* yang tidak bisa diedit.
     - Tampilkan juga perhitungan laba kotor (`Harga Jual - HPP Otomatis`) untuk memberikan wawasan bisnis langsung kepada pengguna.

**2. Prioritas #2: Perbaikan UX - Halaman Detail Produk Dinamis**
   - **Masalah Saat Ini:** Halaman detail produk (`/templates/[templateId]`) masih menampilkan antarmuka manajemen varian saat melihat produk tipe `SINGLE`, yang membingungkan.
   - **Tugas:**
     - Modifikasi komponen `ProductDetailClient` agar dapat merender tampilan yang berbeda untuk produk `SINGLE`.
     - **Tampilan untuk `SINGLE`:** Halaman harus menampilkan detail dari satu-satunya varian yang ada dalam bentuk form yang bisa diedit (mirip modal `AddEditVariantModal` tetapi terintegrasi langsung di halaman), tanpa ada daftar varian atau tombol "Tambah Varian".
     - **Tampilan untuk `VARIANT` & `COMPOSITE`:** Pertahankan fungsionalitas saat ini.

**3. Tugas yang Ditunda (Hingga Pengerjaan Modul POS/Transaksi):**
   - **Logika Pengurangan Stok:** Implementasi logika di mana penjualan satu produk komposit akan secara otomatis mengurangi stok dari setiap produk komponennya sesuai dengan resep.
