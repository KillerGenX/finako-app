# Dokumentasi Aplikasi Finako

Versi: 3.2
Tanggal Pembaruan: [Tanggal Hari Ini]

---

### **Visi & Tujuan Proyek**

Finako adalah aplikasi Point of Sale (POS) berbasis SaaS (Software as a Service) yang dirancang untuk UMKM. Visi utamanya adalah menyediakan solusi manajemen bisnis yang terintegrasi, mulai dari manajemen produk dan inventaris, transaksi penjualan, hingga akuntansi dan SDM, dalam satu platform yang mudah digunakan.

---

### **Peta Jalan & Rencana Pengembangan**

#### **Fase 17: Otomatisasi Inventaris & Peningkatan Lanjutan - Selesai**
Fase ini berfokus untuk membuat sistem menjadi lebih "pintar", otomatis, dan proaktif. Pencapaian utama termasuk HPP otomatis, riwayat harga beli di PO, dan sistem notifikasi stok rendah yang terintegrasi.

---

#### **Fase 18: Laporan & Analitik Bisnis - Dalam Pengerjaan**
Fase ini berfokus pada transformasi data operasional menjadi wawasan bisnis yang dapat ditindaklanjuti.

**Pencapaian Utama (Fase 18):**
- **Dashboard Laporan:** Halaman utama `/dashboard/reports` telah dibuat dengan tata letak kartu yang konsisten dan placeholder untuk laporan di masa depan.
- **Laporan Penjualan & Laba Komprehensif:**
    - **Backend:** Sebuah RPC canggih telah dibangun untuk menghitung metrik penjualan secara akurat, termasuk pendapatan bersih (setelah semua diskon), HPP, laba kotor, margin, dan pajak terkumpul.
    - **Frontend:** Halaman laporan kini menampilkan data melalui filter rentang tanggal dan outlet, kartu ringkasan, grafik tren harian, dan tabel produk paling menguntungkan.
    - **Ekspor ke Excel Profesional:** Fitur ekspor ke `.xlsx` telah diimplementasikan, menghasilkan laporan multi-lembar yang diformat secara profesional dengan header, border, dan pemformatan angka yang benar.

---

#### **Fase Selanjutnya: Perbaikan & Penyempurnaan Alur Kerja Inti**
Sebelum melanjutkan ke laporan baru, prioritas utama adalah memastikan integritas data dari alur kerja yang paling krusial.

**Rencana Aksi Selanjutnya:**
- **Perbaikan Alur Kerja Transaksi POS:**
    - **Masalah:** Ditemukan bahwa detail metode pembayaran dari transaksi POS tidak tersimpan ke tabel `payments`. Hal ini menyebabkan Laporan Penutupan Kasir tidak akurat.
    - **Solusi:**
        1.  Menyempurnakan modal pembayaran di antarmuka POS untuk memungkinkan pemilihan metode pembayaran (Tunai, QRIS, Kartu).
        2.  Memperbarui *server action* terkait untuk menangani data pembayaran baru.
        3.  Membuat RPC `create_new_sale` versi baru yang akan menyimpan data ke tabel `transactions`, `transaction_items`, dan `payments` dalam satu operasi atomik untuk menjamin integritas data.
