# Blueprint Aplikasi Finako

Dokumen ini berfungsi sebagai sumber kebenaran tunggal untuk rencana pengembangan, fitur, dan arsitektur aplikasi Finako.

## Ikhtisar & Tujuan Aplikasi

Finako adalah aplikasi Point of Sale (POS) dan manajemen inventaris berbasis cloud yang dirancang untuk UMKM. Tujuannya adalah untuk menyediakan alat yang mudah digunakan namun kuat untuk mengelola penjualan, stok, pelanggan, dan laporan keuangan, yang pada akhirnya membantu pemilik bisnis membuat keputusan yang lebih baik.

---

## Status & Rencana Aksi Saat Ini

### **[SELESAI]** Fase 18 - Dasbor Analisis Penjualan Komprehensif

Fase ini telah selesai. Dasbor laporan penjualan yang ada saat ini merupakan alat analisis yang canggih dan interaktif, mencakup analisis produk, pelanggan, dan ringkasan pajak.

---

## Rencana Aksi Berikutnya

Berdasarkan analisis kebutuhan, pengembangan akan difokuskan pada dua modul laporan baru yang krusial.

### **Prioritas Utama: Modul Laporan Pajak (Kebutuhan Operasional & Kepatuhan)**

Modul ini akan menjadi sumber data utama bagi tim keuangan untuk keperluan pelaporan pajak (seperti PPN) dan audit. Fokusnya adalah pada akurasi, rincian, dan kemudahan ekspor.

*   **Visi & Fitur Utama:**
    *   **Filter Lengkap:** Pengguna dapat memfilter data berdasarkan rentang tanggal, outlet, dan tarif pajak spesifik.
    *   **Metrik Kunci:** Menampilkan kartu ringkasan untuk *Dasar Pengenaan Pajak (DPP)*, *Total Pajak Terkumpul*, dan *Jumlah Transaksi Kena Pajak*.
    *   **Tabel Rinci:** Menyajikan tabel detail dari **setiap baris item** yang dikenai pajak, bukan hanya per transaksi, untuk akurasi maksimal.
    *   **Ekspor ke Excel:** Fitur wajib untuk memungkinkan tim keuangan mengolah data lebih lanjut dan menyimpannya sebagai arsip audit.

### **Prioritas Berikutnya: Modul Laporan Inventaris (Kebutuhan Strategis & Operasional)**

Modul ini akan mengkonsolidasikan semua laporan terkait inventaris ke dalam satu dasbor yang komprehensif, memberikan wawasan mendalam tentang kesehatan stok.

*   **Visi & Fitur Utama (Berbasis Tab):**
    *   **Tab Ringkasan:** Menampilkan valuasi stok saat ini dan metrik kunci lainnya.
    *   **Tab Barang Rusak (Write-Offs):** Rincian semua stok yang dihapusbukukan beserta alasannya.
    *   **Tab Transfer Stok:** Riwayat lengkap semua transfer antar-outlet.
    *   **Tab Stok Opname:** Analisis hasil dan selisih dari semua sesi stok opname.
    *   **Tab Kartu Stok (Ledger):** Kemampuan untuk melacak semua pergerakan masuk/keluar untuk satu item produk spesifik.

### **Rencana Jangka Panjang (Setelah Laporan Selesai):**

*   **Modul Laporan Keuangan Dasar:** Mengembangkan laporan Laba Rugi dan Neraca.
*   **Peningkatan Modul POS:** Menambahkan fitur-fitur baru seperti manajemen meja atau pesanan terpisah/gabung.
*   **Manajemen Peran & Hak Akses (Roles & Permissions):** Menyempurnakan kontrol akses untuk berbagai peran pengguna.
