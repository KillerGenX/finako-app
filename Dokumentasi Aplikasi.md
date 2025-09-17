# Dokumentasi Aplikasi Finako

Versi: 2.3
Tanggal Pembaruan: [Tanggal Hari Ini]

---

### **Visi & Tujuan Proyek**

Finako adalah aplikasi Point of Sale (POS) berbasis SaaS (Software as a Service) yang dirancang untuk UMKM. Visi utamanya adalah menyediakan solusi manajemen bisnis yang terintegrasi, mulai dari manajemen produk dan inventaris, transaksi penjualan, hingga akuntansi dan SDM, dalam satu platform yang mudah digunakan.

---

### **Fase Pengembangan**

#### **Fase 1-15: Fondasi & Modul Inti Operasional - Selesai**
Fase-fase awal hingga menengah berfokus pada pembangunan semua modul inti aplikasi, termasuk POS, CRM, Outlet, Transfer Stok (Surat Jalan), dan Pesanan Pembelian (PO).

---

#### **Fase 16: Formalisasi Alur Kerja Penyesuaian Stok - Sedang Berlangsung**
Setelah alur kerja utama (Masuk, Pindah, Keluar) selesai, fase ini akan menggantikan fitur "Atur Stok" yang ambigu dengan alur kerja formal yang didedikasikan untuk setiap jenis penyesuaian manual.
**Status & Rencana Aksi:**
- **[SELESAI] Stok Opname:**
    - Membuat alur kerja penuh dari pembuatan sesi, input hasil, hingga penyelesaian yang menyesuaikan stok.
    - Mengimplementasikan fitur cetak dua tahap: "Lembar Hitung" dan "Laporan Hasil".
- **[SELANJUTNYA] Barang Rusak/Hilang:**
    - Membuat formulir untuk mencatat dan mengurangi stok untuk item yang rusak, kedaluwarsa, atau hilang, lengkap dengan dokumen yang bisa dicetak.
- **[SELANJUTNYA] Penerimaan Non-PO:**
    - Membuat formulir untuk mencatat penerimaan barang sederhana yang tidak memerlukan PO formal, lengkap dengan dokumen yang bisa dicetak.
- **[FINAL] Menghapus Fitur Lama:**
    - Setelah dua fitur di atas selesai, hapus tombol  "Atur Stok" dihalaman produk (`/inventory/[variantId]`) dan buat tombol aksi cepat menuju halaman inventaris sesuai dengan kebutuhan nya,seperti po,transfer,dll.

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
