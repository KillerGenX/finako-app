# Dokumentasi Aplikasi Finako

Versi: 2.0
Tanggal Pembaruan: [Tanggal Hari Ini]

---

### **Visi & Tujuan Proyek**

Finako adalah aplikasi Point of Sale (POS) berbasis SaaS (Software as a Service) yang dirancang untuk UMKM. Visi utamanya adalah menyediakan solusi manajemen bisnis yang terintegrasi, mulai dari manajemen produk dan inventaris, transaksi penjualan, hingga akuntansi dan SDM, dalam satu platform yang mudah digunakan.

---

### **Fase Pengembangan**

#### **Fase 1-11: Fondasi, POS, & Modul CRM - Selesai**
Fase-fase awal berfokus pada penyiapan proyek, otentikasi, modul produk, penyempurnaan POS, arsitektur struk modular, dan implementasi modul CRM yang lengkap dengan halaman detail pelanggan dan integrasi WhatsApp.

---

#### **Fase 12: Dashboard Outlet & Integrasi Inventaris - Selesai**
Fase ini mengubah modul Outlet menjadi dashboard operasional dengan menampilkan detail, riwayat transaksi, dan daftar stok. Modul ini juga diintegrasikan dengan modul inventaris yang ada.

---

#### **Fase 13: Sistem Transfer Stok (Surat Jalan) - Selesai**
Fase ini membangun sistem logistik internal yang lengkap dan andal.
**Pencapaian Utama:**
- **Struktur Database Formal:** Membuat tabel `stock_transfers` dan `stock_transfer_items` untuk mendokumentasikan setiap perpindahan.
- **Siklus Hidup Transfer:** Mengimplementasikan alur kerja penuh dari `draft` -> `sent` -> `received` / `cancelled`.
- **Logika Backend Aman:** Membangun RPC di database untuk memproses pengiriman (pengurangan stok) dan penerimaan (penambahan stok) secara transaksional dan aman.
- **Antarmuka Pengguna (UI) Lengkap:** Membuat halaman untuk:
    - Menampilkan daftar semua Surat Jalan.
    - Membuat Surat Jalan baru dengan kemampuan mencari dan menambahkan beberapa produk sekaligus (transfer massal).
    - Melihat detail setiap Surat Jalan dan melakukan aksi (kirim, terima, batal).

---

### **Peta Jalan & Rencana Pengembangan**

#### **Fase 14: Dasbor & Peningkatan UX Inventaris - Selanjutnya**
Setelah alur kerja transfer stok selesai, fase ini akan fokus pada memberikan visibilitas data yang lebih baik dan meningkatkan pengalaman pengguna saat berinteraksi dengan sistem inventaris.
**Rencana Aksi:**
- **Halaman Laporan Stok (Kartu Stok):**
    - Membuat halaman baru di dalam modul Inventaris yang berfungsi sebagai "Kartu Stok" atau laporan stok utama.
    - Halaman ini akan menampilkan tabel **semua produk** dan jumlah stoknya di **setiap outlet**, memberikan gambaran global tentang inventaris.
- **Peningkatan UX Formulir Transfer:**
    - Memodifikasi komponen pencarian produk di halaman "Buat Transfer Baru".
    - Saat produk dicari, hasilnya akan **menampilkan jumlah stok yang tersedia** di outlet asal yang telah dipilih, sehingga pengguna tahu batas maksimal yang bisa ditransfer.

---

#### **Ide untuk Masa Depan**

1.  **Manajemen Dokumen Inventaris:**
    - **Cetak Surat Jalan:** Mengimplementasikan fungsionalitas cetak pada halaman detail transfer.
    - **Pesanan Pembelian (Purchase Order):** Membuat alur kerja untuk membuat PO ke pemasok.
2.  **Segmentasi Pelanggan:** Menambahkan fitur grup dan label (misal: VIP, Reseller).
3.  **Modul Skala Lebih Besar:** Manajemen Pemasok, Laporan Penjualan Lanjutan.
