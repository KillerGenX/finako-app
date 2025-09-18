# Dokumentasi Aplikasi Finako

Versi: 2.4
Tanggal Pembaruan: [Tanggal Hari Ini]

---

### **Visi & Tujuan Proyek**

Finako adalah aplikasi Point of Sale (POS) berbasis SaaS (Software as a Service) yang dirancang untuk UMKM. Visi utamanya adalah menyediakan solusi manajemen bisnis yang terintegrasi, mulai dari manajemen produk dan inventaris, transaksi penjualan, hingga akuntansi dan SDM, dalam satu platform yang mudah digunakan.

---

### **Fase Pengembangan**

#### **Fase 1-15: Fondasi & Modul Inti Operasional - Selesai**
Fase-fase awal hingga menengah berfokus pada pembangunan semua modul inti aplikasi, termasuk POS, CRM, Outlet, Transfer Stok (Surat Jalan), dan Pesanan Pembelian (PO).

---

#### **Fase 16: Formalisasi Alur Kerja Inventaris & Transformasi Buku Besar - Selesai**
Fase ini secara fundamental merombak cara penyesuaian stok dikelola, menggantikan fitur "Atur Stok" yang ambigu dengan alur kerja formal dan terdokumentasi.
**Pencapaian Utama:**
- **Membangun Tiga Modul Penyesuaian Formal:**
    - **Stok Opname:** Alur kerja penuh dari pembuatan sesi, cetak "Lembar Hitung", input hasil, hingga penyelesaian yang menyesuaikan stok dan menghasilkan "Laporan Hasil" tercetak.
    - **Barang Rusak/Hilang:** Alur kerja untuk mencatat dan mengurangi stok, lengkap dengan "Berita Acara" yang bisa dicetak.
    - **Penerimaan Lainnya (Non-PO):** Alur kerja untuk mencatat stok masuk di luar PO, lengkap dengan dokumen penerimaan tercetak.
- **Transformasi Halaman Detail Inventaris:**
    - Halaman `/inventory/[variantId]` diubah menjadi **"Pusat Komando & Buku Besar Stok"**.
    - Menampilkan **grafik tren stok**, ringkasan stok, dan **buku besar interaktif** di mana setiap nomor referensi dapat diklik untuk melihat detail dokumennya (modal atau link).
    - Menambahkan fitur **"Atur Stok Awal"** yang hanya muncul untuk produk baru.
    - Fitur "Atur Stok" yang lama **telah dihapus**, menciptakan alur kerja yang bersih dan tidak ambigu.

---

### **Peta Jalan & Rencana Pengembangan**

#### **Fase 17: Otomatisasi Inventaris & Peningkatan Lanjutan - Selanjutnya**
Setelah semua alur kerja inventaris lengkap, fase ini fokus untuk membuat sistem menjadi lebih "pintar", otomatis, dan proaktif.
**Rencana Aksi:**
- **Harga Pokok Penjualan (HPP) Otomatis:**
    - Saat menerima barang dari PO, sistem akan secara otomatis menghitung dan memperbarui `cost_price` (harga pokok) di tabel `product_variants`. Ini bisa menggunakan metode rata-rata tertimbang (weighted average) untuk akurasi.
- **Integrasi Harga Beli Terakhir:**
    - Saat menambahkan produk ke PO baru, formulir akan secara otomatis menampilkan harga beli terakhir dari PO sebelumnya untuk produk tersebut, mempercepat entri data.
- **Peringatan Stok Rendah (Low Stock Alert):**
    - Membuat halaman atau widget dasbor baru yang secara proaktif menampilkan daftar produk yang stoknya di bawah ambang batas minimum.

---

#### **Ide Masa Depan**
1.  **Segmentasi Pelanggan & Marketing.**
2.  **Modul Skala Lebih Besar:** Laporan Penjualan Lanjutan, Akuntansi.
