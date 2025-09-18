# Dokumentasi Aplikasi Finako

Versi: 2.6
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

#### **Fase 17: Otomatisasi Inventaris & Peningkatan Lanjutan - Dalam Pengerjaan**
Fase ini fokus untuk membuat sistem menjadi lebih "pintar", otomatis, dan proaktif.

**Pencapaian Utama (Fase 17):**
- **Harga Pokok Penjualan (HPP) Otomatis - Selesai:**
    - Saat menerima barang dari PO, sistem kini secara otomatis menghitung `cost_price` (harga pokok) menggunakan metode rata-rata tertimbang (*weighted average*).
    - Ini memastikan valuasi inventaris selalu akurat dan dapat diaudit.
- **Integrasi Riwayat Harga Beli di PO - Selesai:**
    - Saat membuat PO baru, kolom harga beli kini terisi otomatis dengan harga terakhir.
    - Sebuah ikon **riwayat harga** tersedia di setiap baris item, yang saat diklik akan menampilkan modal dengan **grafik tren harga** dan **tabel riwayat pembelian** (termasuk pemasok dan tanggal) untuk item tersebut. Fitur ini berfungsi sebagai alat bantu keputusan strategis.

**Rencana Aksi Selanjutnya:**
- **Peringatan Stok Rendah (Low Stock Alert) - Selanjutnya:**
    - **Tujuan:** Membuat halaman atau widget dasbor baru yang secara proaktif menampilkan daftar produk yang stoknya di bawah ambang batas minimum yang ditentukan.

---

#### **Ide Masa Depan**
1.  **Segmentasi Pelanggan & Marketing.**
2.  **Modul Skala Lebih Besar:** Laporan Penjualan Lanjutan, Akuntansi.
