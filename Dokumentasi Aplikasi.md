# Dokumentasi Aplikasi Finako

Versi: 2.1
Tanggal Pembaruan: [Tanggal Hari Ini]

---

### **Visi & Tujuan Proyek**

Finako adalah aplikasi Point of Sale (POS) berbasis SaaS (Software as a Service) yang dirancang untuk UMKM. Visi utamanya adalah menyediakan solusi manajemen bisnis yang terintegrasi, mulai dari manajemen produk dan inventaris, transaksi penjualan, hingga akuntansi dan SDM, dalam satu platform yang mudah digunakan.

---

### **Fase Pengembangan**

#### **Fase 1-12: Fondasi, POS, CRM, & Outlet - Selesai**
Fase-fase awal berfokus pada penyiapan proyek, otentikasi, modul produk, penyempurnaan POS, arsitektur struk modular, implementasi modul CRM, dan mengubah modul Outlet menjadi dashboard operasional.

---

#### **Fase 13: Sistem Transfer Stok (Surat Jalan) - Selesai**
Fase ini membangun sistem logistik internal yang lengkap dan andal, mencakup alur kerja `draft` -> `sent` -> `received`, logika backend yang aman, dan dokumen Surat Jalan yang bisa dicetak.

---

#### **Fase 14: Dasbor & Peningkatan UX Inventaris - Selesai**
Fase ini fokus pada memberikan visibilitas data dan meningkatkan pengalaman pengguna.
**Pencapaian Utama:**
- **Halaman Laporan Stok (Kartu Stok):** Membuat dasbor terpusat untuk melihat jumlah stok semua produk di semua outlet secara bersamaan.
- **Peningkatan UX Formulir Transfer:** Menampilkan jumlah stok yang tersedia di outlet asal saat mencari produk, mencegah error dan frustrasi pengguna.

---

### **Peta Jalan & Rencana Pengembangan**

#### **Fase 15: Modul Pembelian (Purchase Order) - Selanjutnya**
Setelah logistik internal (transfer) selesai, fase ini akan membangun alur kerja untuk stok masuk dari pihak eksternal (pemasok).
**Rencana Aksi:**
- **Manajemen Pemasok (Suppliers):**
    - Membuat halaman CRUD penuh untuk mengelola data pemasok.
- **Sistem Purchase Order (PO):**
    - Membuat halaman untuk membuat dan melacak PO.
    - PO akan memiliki siklus hidup (status): `Draft` -> `Ordered` -> `Partially Received` -> `Completed`.
    - PO akan bisa dicetak untuk dikirim ke pemasok.
- **Integrasi Penerimaan Barang:**
    - Di dalam detail PO, akan ada fitur "Terima Barang" yang akan secara otomatis menambah stok ke outlet yang dipilih menggunakan tipe pergerakan `purchase_received`.

---

### **Catatan Arsitektur & Ide Masa Depan**

#### **Peran Fitur Manajemen Stok**
Seiring dengan semakin canggihnya modul Inventaris, peran setiap fitur menjadi lebih jelas:
- **Purchase Order (PO):** Mengelola stok **MASUK** dari pemasok.
- **Stock Transfer (Surat Jalan):** Mengelola stok **PINDAH** antar lokasi internal.
- **Point of Sale (POS):** Mengelola stok **KELUAR** melalui penjualan.
- **Halaman Atur Stok (`/inventory/[variantId]`):** Akan tetap dipertahankan sebagai **alat audit & penyesuaian manual**. Peran utamanya adalah untuk kasus-kasus di luar alur kerja normal, seperti:
    - **Stok Opname:** Menyesuaikan jumlah stok setelah perhitungan fisik.
    - **Barang Rusak/Hilang:** Mengurangi stok karena penyusutan.
    - **Penerimaan Non-PO:** Mencatat penerimaan barang sederhana yang tidak memerlukan PO formal.
    
Oleh karena itu, **Halaman Atur Stok tidak akan dihapus**, tetapi perannya menjadi lebih terspesialisasi sebagai alat "utilitas" inventaris, bukan alat operasional utama.

#### **Ide Lainnya**
1.  **Segmentasi Pelanggan:** Menambahkan fitur grup dan label (misal: VIP, Reseller).
2.  **Modul Skala Lebih Besar:** Laporan Penjualan Lanjutan, Akuntansi.
