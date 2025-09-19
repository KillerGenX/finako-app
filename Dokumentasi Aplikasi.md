# Dokumentasi Aplikasi Finako

Versi: 3.1
Tanggal Pembaruan: [Tanggal Hari Ini]

---

### **Visi & Tujuan Proyek**

Finako adalah aplikasi Point of Sale (POS) berbasis SaaS (Software as a Service) yang dirancang untuk UMKM. Visi utamanya adalah menyediakan solusi manajemen bisnis yang terintegrasi, mulai dari manajemen produk dan inventaris, transaksi penjualan, hingga akuntansi dan SDM, dalam satu platform yang mudah digunakan.

---

### **Fase Pengembangan**

#### **Fase 1-16: Fondasi & Modul Inti Operasional - Selesai**
(Detail tidak berubah)

---

### **Peta Jalan & Rencana Pengembangan**

#### **Fase 17: Otomatisasi Inventaris & Peningkatan Lanjutan - Selesai**
Fase ini berfokus untuk membuat sistem menjadi lebih "pintar", otomatis, dan proaktif.

**Pencapaian Utama (Fase 17):**
- **Harga Pokok Penjualan (HPP) Otomatis:**
    - Sistem kini secara otomatis menghitung `cost_price` (harga pokok) menggunakan metode rata-rata tertimbang (*weighted average*) setiap kali barang diterima melalui PO.
- **Integrasi Riwayat Harga Beli di PO:**
    - Saat membuat PO baru, kolom harga beli terisi otomatis dan sebuah ikon riwayat menampilkan modal canggih dengan grafik tren harga serta tabel riwayat pembelian.
- **Sistem Peringatan Stok Rendah Proaktif:**
    - Pengguna kini dapat mengatur **batas stok minimum** (`reorder_point`) untuk setiap produk.
    - Sebuah **"Notification Center"** canggih telah dibangun di header, yang terhubung ke halaman "inbox" notifikasi dengan pagination.
    - Sebuah tugas terjadwal (cron job) di backend secara otomatis memeriksa dan mengirimkan notifikasi stok rendah.
- **Penyempurnaan & Perbaikan Bug:**
    - Memperbaiki format angka desimal pada pesan notifikasi stok rendah.
    - Mengaktifkan link referensi yang hilang pada buku besar stok untuk modul "Barang Rusak" dan "Penerimaan Lainnya", memastikan konsistensi UI.

---

#### **Fase 18: Laporan & Analitik Bisnis - Selanjutnya**
Fase ini akan berfokus pada transformasi data operasional yang akurat (seperti HPP) menjadi wawasan bisnis yang dapat ditindaklanjuti.

**Rencana Aksi:**
- **Laporan Penjualan Lanjutan:**
    - **Tujuan:** Membuat halaman laporan baru di mana pengguna dapat memilih rentang tanggal dan melihat metrik keuangan penting.
    - **Fitur Utama:** Laporan akan mencakup Total Pendapatan (omzet), Total HPP (modal), Laba Kotor (Profit), dan Margin Laba (%). Juga akan menampilkan daftar produk terlaris berdasarkan profitabilitas.
    - **Implementasi:** Akan dibuat RPC backend baru untuk kalkulasi dan halaman frontend baru dengan filter tanggal serta visualisasi data.
