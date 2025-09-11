# Dokumentasi Aplikasi Finako

Versi: 1.6
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

#### **Fase 1-8: Fondasi, Produk, & Inventaris - Selesai**
Fase-fase awal berfokus pada penyiapan proyek, otentikasi, implementasi modul produk yang komprehensif (termasuk tipe `SINGLE`, `VARIANT`, `COMPOSITE`, `SERVICE`), dan fungsionalitas inti manajemen stok (penyesuaian, transfer, dll.). Sistem juga diperkuat dengan perhitungan HPP otomatis dan keamanan multi-tenancy.

---

#### **Fase 9: Penyempurnaan & Kelengkapan Modul POS - Selesai**
Fase ini mengubah halaman POS dasar menjadi alat kasir yang matang dan profesional dengan logika bisnis yang kompleks dan akurat.
**Pencapaian Utama:**
- **Arsitektur Data Cerdas:**
    - Membuat RPC `get_pos_data` khusus yang secara efisien memuat produk berdasarkan **stok yang relevan di outlet terpilih**.
    - Memperbaiki bug di mana semua produk tampil tanpa memperdulikan stok outlet.
- **Kalkulasi Keranjang yang Akurat:**
    - Mengimplementasikan logika perhitungan yang benar untuk **pajak inklusif dan eksklusif**.
    - Mengintegrasikan sistem **diskon per-item dan per-transaksi** (nominal & persentase).
    - Memastikan semua kalkulasi (subtotal, diskon, pajak, grand total) mengikuti urutan operasi matematika yang benar dan konsisten.
- **Alur Pembayaran Profesional:**
    - Membangun **Modal Pembayaran** untuk transaksi tunai.
    - Fitur meliputi input terformat Rupiah, tombol uang cepat, dan kalkulator kembalian otomatis.
- **Penyimpanan Data Transaksi yang Lengkap:**
    - Memperbarui RPC `create_new_sale` secara iteratif untuk menyimpan semua detail transaksi, termasuk **pajak dan diskon** per item dan per transaksi, ke dalam database dengan benar.
- **Perbaikan UX & Bug Kritis:**
    - Memperbaiki penamaan produk varian menjadi format "Produk - Varian".
    - Menambahkan filter kategori di halaman POS.
    - Mengatasi berbagai bug terkait format angka dan state management (misal: diskon transaksi yang tidak ter-reset).

---

### **Peta Jalan & Rencana Pengembangan**

#### **Fase 10: Pengalaman Pasca-Transaksi & CRM Dasar - Selanjutnya**
Setelah alur transaksi dari pemilihan produk hingga pembayaran selesai, fokus selanjutnya adalah pada apa yang terjadi **setelah** transaksi berhasil dan mulai menghubungkannya dengan entitas bisnis lain.
**Rencana Aksi:**
- **Struk Digital / Layar Pasca-Transaksi:**
    - Mendesain dan membangun komponen modal atau halaman baru yang muncul setelah pembayaran berhasil.
    - Menampilkan ringkasan transaksi (struk digital) yang jelas.
    - Menyediakan tombol aksi seperti "Transaksi Baru" atau "Cetak Struk" (fungsionalitas cetak akan diimplementasikan nanti).
- **Integrasi Pelanggan (CRM) di POS:**
    - Menambahkan UI di halaman kasir untuk **memilih pelanggan** yang sudah ada atau **menambahkan pelanggan baru** dengan cepat.
    - Memperbarui `create_new_sale` untuk menerima `customer_id` opsional dan menautkan transaksi ke pelanggan.

---

#### **Ide untuk Masa Depan**

1.  **Fitur Inventaris Cerdas:**
    - Alur Kerja Stok Opname Terpandu & Laporan Inventaris Lanjutan.
2.  **Modul Skala Lebih Besar:**
    - Manajemen Pemasok & Pesanan Pembelian.
    - Laporan Penjualan Lanjutan & Manajemen Pelanggan (CRM) Penuh.
