# Dokumentasi Aplikasi Finako

Versi: 1.7
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
**Pendekatan**: Mobile-First dan PWA

---

### **Fase Pengembangan**

#### **Fase 1-8: Fondasi, Produk, & Inventaris - Selesai**
Fase-fase awal berfokus pada penyiapan proyek, otentikasi, implementasi modul produk yang komprehensif (termasuk tipe `SINGLE`, `VARIANT`, `COMPOSITE`, `SERVICE`), dan fungsionalitas inti manajemen stok (penyesuaian, transfer, dll.). Sistem juga diperkuat dengan perhitungan HPP otomatis dan keamanan multi-tenancy.

---

#### **Fase 9: Penyempurnaan & Kelengkapan Modul POS - Selesai**
Fase ini mengubah halaman POS dasar menjadi alat kasir yang matang dan profesional dengan logika bisnis yang kompleks dan akurat.
**Pencapaian Utama:**
- **Arsitektur Data Cerdas:** Membuat RPC `get_pos_data` untuk memuat produk yang relevan dengan stok outlet.
- **Kalkulasi Keranjang yang Akurat:** Mengimplementasikan logika pajak inklusif/eksklusif dan diskon per-item/per-transaksi.
- **Alur Pembayaran Profesional:** Membangun Modal Pembayaran yang fungsional.
- **Penyimpanan Data Transaksi yang Lengkap:** Memperbarui RPC `create_new_sale` untuk menyimpan semua detail transaksi.
- **Perbaikan UX & Bug Kritis:** Memperbaiki penamaan produk varian, menambahkan filter, dan mengatasi berbagai bug.

---

#### **Fase 10: Arsitektur Struk Modular & Fondasi CRM - Selesai**
Fase ini berfokus pada pengalaman pasca-transaksi dan membangun fondasi yang kokoh dan dapat digunakan kembali untuk fitur-fitur masa depan.
**Pencapaian Utama:**
- **Refactor Arsitektur Struk:**
    - Memisahkan komponen struk menjadi komponen "pintar" (`ReceiptManager`) untuk logika dan komponen "bodoh" (`TransactionReceipt`, `InvoiceView`) untuk tampilan.
    - Arsitektur ini memungkinkan satu sumber kebenaran untuk desain struk, sehingga mudah dirawat dan diperbarui.
- **Implementasi Multi-Template:**
    - Membuat dua template visual: struk thermal standar dan invoice/faktur formal.
    - Pengguna dapat beralih antara dua tampilan ini secara *real-time*.
- **Fungsionalitas Cetak yang Andal:**
    - Mengimplementasikan metode cetak berbasis CSS `@media print` yang terenkapsulasi di dalam komponen.
    - Memastikan hasil cetak (termasuk warna) identik dengan yang ditampilkan di layar (WYSIWYG).
- **Fondasi CRM di POS:**
    - Menambahkan UI `CustomerSelector` di halaman kasir.
    - Memperbarui alur transaksi dari frontend hingga backend (RPC `create_new_sale_v5`) untuk dapat menautkan transaksi ke seorang pelanggan.
- **Peningkatan Konsistensi UI:** Memperbaiki tampilan nama kasir di halaman POS agar konsisten menggunakan nama lengkap dari profil, bukan email.

---

### **Peta Jalan & Rencana Pengembangan**

#### **Fase 11: Interaktivitas & Ekspor Digital - Selanjutnya**
Membangun di atas fondasi struk modular yang telah dibuat, fase ini akan fokus pada interaksi pelanggan dan menyediakan cara mudah untuk berbagi struk secara digital.
**Rencana Aksi:**
- **Fitur Kirim Struk/Invoice ke WhatsApp:**
    - **Pilihan 1 (Teks):** Membuat fungsi yang menghasilkan ringkasan transaksi dalam format teks yang rapi dan terstruktur, lalu membukanya di aplikasi WhatsApp pengguna melalui tautan `wa.me`.
    - **Pilihan 2 (Gambar):** Mengimplementasikan library di sisi klien (seperti `html-to-image`) untuk mengubah komponen JSX struk/invoice menjadi gambar (PNG/JPEG). Gambar ini kemudian dapat dibagikan atau diunduh.
    - Menambahkan tombol "Kirim via WA" di `ReceiptManager` yang akan memicu fungsionalitas ini.
- **Melengkapi Fungsionalitas CRM di POS:**
    - Membangun logika penuh untuk modal `CustomerSelector` yang saat ini masih placeholder.
    - Membuat Server Action untuk mencari pelanggan berdasarkan nama/nomor telepon.
    - Membuat Server Action untuk menambah pelanggan baru dengan cepat melalui form di dalam modal.

---

#### **Ide untuk Masa Depan**

1.  **Fitur Inventaris Cerdas:** Alur Kerja Stok Opname Terpandu & Laporan Inventaris Lanjutan.
2.  **Modul Skala Lebih Besar:** Manajemen Pemasok & Pesanan Pembelian, Laporan Penjualan Lanjutan & CRM Penuh.
3.  **Halaman Riwayat Transaksi:** Halaman khusus untuk melihat daftar semua transaksi, dengan kemampuan untuk membuka kembali dan mencetak ulang struk/invoice menggunakan `ReceiptManager`.
