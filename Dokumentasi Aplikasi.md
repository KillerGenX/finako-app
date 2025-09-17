# Dokumentasi Aplikasi Finako

Versi: 2.2
Tanggal Pembaruan: [Tanggal Hari Ini]

---

### **Visi & Tujuan Proyek**

Finako adalah aplikasi Point of Sale (POS) berbasis SaaS (Software as a Service) yang dirancang untuk UMKM. Visi utamanya adalah menyediakan solusi manajemen bisnis yang terintegrasi, mulai dari manajemen produk dan inventaris, transaksi penjualan, hingga akuntansi dan SDM, dalam satu platform yang mudah digunakan.

---

### **Fase Pengembangan**

#### **Fase 1-15: Fondasi & Modul Inti Operasional - Selesai**
Fase-fase awal hingga menengah berfokus pada pembangunan semua modul inti aplikasi, termasuk POS, CRM, Outlet, Transfer Stok (Surat Jalan), dan Pesanan Pembelian (PO).

---

### **Peta Jalan & Rencana Pengembangan**

#### **Fase 16: Formalisasi Alur Kerja Penyesuaian Stok - Selanjutnya**
Setelah alur kerja utama (Masuk, Pindah, Keluar) selesai, fase ini akan menggantikan fitur "Atur Stok" yang ambigu dengan alur kerja formal yang didedikasikan untuk setiap jenis penyesuaian manual.
**Rencana Aksi:**
- **Membuat Tiga Modul Penyesuaian Baru:**
    - **Stok Opname:** Antarmuka untuk memasukkan hasil perhitungan stok fisik. Sistem akan secara otomatis menghitung selisih dan membuat penyesuaian.
    - **Barang Rusak/Hilang:** Formulir untuk mencatat dan mengurangi stok untuk item yang rusak, kedaluwarsa, atau hilang.
    - **Penerimaan Non-PO:** Formulir untuk mencatat penerimaan barang sederhana yang tidak memerlukan PO formal (misalnya, sampel dari pemasok).
- **Menambahkan Kartu Navigasi:** Menempatkan ketiga fitur baru ini sebagai kartu di halaman utama Dashboard Inventaris.
- **Menghapus Fitur Lama:** Setelah fitur-fitur baru ini berfungsi, **hapus halaman "Atur Stok"** (`/inventory/[variantId]`) dan tombol-tombol terkait untuk menciptakan alur kerja yang bersih dan tidak ambigu.

---

### **Catatan Arsitektur & Ide Masa Depan**

#### **Peran Fitur Manajemen Stok (Revisi)**
- **Purchase Order (PO):** Mengelola stok **MASUK** dari pemasok (alur kerja formal).
- **Stock Transfer (Surat Jalan):** Mengelola stok **PINDAH** antar lokasi internal (alur kerja formal).
- **Point of Sale (POS):** Mengelola stok **KELUAR** melalui penjualan.
- **Tiga Modul Penyesuaian:** Mengelola semua kasus stok masuk/keluar lainnya (Opname, Rusak, Penerimaan Lainnya) secara formal dan terdokumentasi.
    
Dengan arsitektur ini, halaman "Atur Stok" yang lama menjadi usang dan akan **dihapus**.

#### **Ide Lainnya**
1.  **Otomatisasi Inventaris:** Harga Pokok Penjualan (HPP) Otomatis, Peringatan Stok Rendah.
2.  **Segmentasi Pelanggan & Marketing.**
3.  **Modul Skala Lebih Besar:** Laporan Penjualan Lanjutan, Akuntansi.
