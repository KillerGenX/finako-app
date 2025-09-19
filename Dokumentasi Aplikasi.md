# Dokumentasi Aplikasi Finako

Versi: 3.0
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
    - Sistem kini secara otomatis menghitung `cost_price` (harga pokok) menggunakan metode rata-rata tertimbang (*weighted average*) setiap kali barang diterima melalui PO, memastikan valuasi inventaris selalu akurat dan dapat diaudit.
- **Integrasi Riwayat Harga Beli di PO:**
    - Saat membuat PO baru, kolom harga beli terisi otomatis dengan harga terakhir.
    - Ikon **riwayat harga** di setiap baris item menampilkan modal canggih dengan **grafik tren harga** dan **tabel riwayat pembelian**, berfungsi sebagai alat bantu keputusan strategis.
- **Sistem Peringatan Stok Rendah Proaktif:**
    - Pengguna kini dapat mengatur **batas stok minimum** (`reorder_point`) untuk setiap produk.
    - Sebuah **"Notification Center"** canggih telah dibangun di header, menampilkan riwayat notifikasi.
    - Sebuah tugas terjadwal (cron job) di backend secara otomatis memeriksa stok dan **mengirimkan notifikasi** ke *Notification Center* ketika stok produk jatuh di bawah batas minimum yang ditentukan.

---

#### **Ide Masa Depan (Fase 18 dan Selanjutnya)**
1.  **Segmentasi Pelanggan & Marketing.**
2.  **Modul Skala Lebih Besar:** Laporan Penjualan Lanjutan, Akuntansi.
3.  **Dasbor Analitik yang Lebih Kaya.**
