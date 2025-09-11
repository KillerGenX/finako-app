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

#### **Fase 1-4: Fondasi & Tipe Produk Dasar - Selesai**
Fase awal berfokus pada penyiapan proyek, otentikasi, dan implementasi tipe produk `VARIANT` dan `SINGLE`, termasuk perbaikan awal pada fungsi RPC `get_products_with_stock` untuk menangani penamaan produk `SINGLE`.

---

#### **Fase 5: Produk Komposit (Manajemen Resep) - Selesai**
Tahap ini mengimplementasikan fungsionalitas inti untuk produk `COMPOSITE`, yang memungkinkan pengguna membuat produk yang terdiri dari produk lain (resep/BOM).
**Pencapaian Utama:**
- Alur pembuatan produk komposit.
- Manajemen komponen penuh (tambah, edit kuantitas, hapus).
- Transisi ke fungsi RPC `get_product_details` yang efisien untuk halaman detail.

---

#### **Fase 6: Perbaikan UX Halaman Detail Produk - Selesai**
Tahap ini berfokus pada pemolesan dan penyempurnaan pengalaman pengguna di halaman detail produk untuk menciptakan alur kerja yang kohesif, intuitif, dan cerdas untuk semua tipe produk.

**Pencapaian Utama:**
1.  **Implementasi "Kartu Info Cerdas":** Kartu informasi produk di sisi kiri kini sepenuhnya adaptif, menampilkan data yang paling relevan dan ringkasan bisnis (seperti laba kotor & margin untuk produk `SINGLE`) sesuai dengan tipe produk yang dilihat.
2.  **Alur Kerja Spesifik Tipe Produk:**
    - **Untuk `SINGLE`:** Tampilan daftar varian diganti dengan **form edit yang terintegrasi langsung di halaman**, menghilangkan alur kerja yang membingungkan.
    - **Untuk `COMPOSITE`:** Alur edit harga/SKU yang hilang telah ditambahkan melalui tombol **"Edit Harga/SKU"** di kartu info, memastikan semua data dapat dikelola tanpa mengacaukan UI manajer resep.
    - **Untuk `VARIANT`:** Alur kerja yang sudah baik dipertahankan.
3.  **Perbaikan Bug Kritis:**
    - Mengatasi masalah `z-index` pada modal konfirmasi hapus, membuatnya sepenuhnya interaktif.
    - Memperbaiki konsistensi visual pada latar belakang modal.
    - Menyelesaikan *bug* nama ganda untuk produk `COMPOSITE` di halaman daftar produk dengan memperbarui fungsi RPC `get_products_with_stock`.

---

### **Peta Jalan & Panduan untuk AI (Sesi Berikutnya)**

Dengan selesainya perbaikan UX, modul produk kini sangat solid. Fokus selanjutnya adalah menambahkan kecerdasan bisnis pada fitur yang ada.

**1. Prioritas #1: Harga Pokok (HPP) Otomatis untuk Produk Komposit**
   - **Tujuan:** Memberikan data keuntungan yang akurat kepada pengguna dengan menghitung HPP produk komposit secara otomatis.
   - **Tugas:**
     - Buat atau modifikasi fungsi RPC di database untuk menghitung total HPP dari sebuah produk komposit dengan menjumlahkan `(kuantitas * HPP)` dari setiap komponennya.
     - Gantikan nilai "Menunggu..." di "Kartu Info Cerdas" dengan HPP yang dihitung secara dinamis.
     - Tampilkan juga perhitungan laba kotor (`Harga Jual - HPP Otomatis`) untuk memberikan wawasan bisnis langsung kepada pengguna.

**2. Tugas yang Ditunda (Hingga Pengerjaan Modul POS/Transaksi):**
   - **Logika Pengurangan Stok:** Implementasi logika di mana penjualan satu produk komposit akan secara otomatis mengurangi stok dari setiap produk komponennya sesuai dengan resep.
