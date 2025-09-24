# Blueprint Aplikasi Finako

Dokumen ini berfungsi sebagai sumber kebenaran tunggal untuk rencana pengembangan, fitur, dan arsitektur aplikasi Finako.

## Ikhtisar & Tujuan Aplikasi

Finako adalah aplikasi Point of Sale (POS) dan manajemen inventaris berbasis cloud yang dirancang untuk UMKM. Tujuannya adalah untuk menyediakan alat yang mudah digunakan namun kuat untuk mengelola penjualan, stok, pelanggan, dan laporan keuangan, yang pada akhirnya membantu pemilik bisnis membuat keputusan yang lebih baik.

---

## Status & Rencana Aksi Saat Ini

### **[SELESAI]** Fase 18 - Dasbor Analisis Penjualan Komprehensif

Fase ini telah selesai. Dasbor laporan penjualan yang ada saat ini merupakan alat analisis yang canggih dan interaktif, mencakup analisis produk, pelanggan, dan ringkasan pajak.

### **[SELESAI]** Fase 20 - Modul Laporan Pajak

Modul ini telah selesai diimplementasikan untuk menyediakan alat bantu krusial bagi tim keuangan untuk kebutuhan pelaporan PPN dan audit.

*   **Pencapaian Utama:**
    *   **Backend (RPC):** Fungsi `get_tax_report_data` telah dibuat, menyediakan agregasi data pajak yang efisien dan akurat.
    *   **Frontend (UI/UX):** Antarmuka pengguna yang interaktif telah dibangun, lengkap dengan filter, kartu metrik, dan tabel rincian per item.
    *   **Fitur Ekspor:** Kemampuan untuk mengekspor laporan ke format Excel telah disediakan.
    *   **Penyempurnaan Logika:**
        - **Resiliensi Data:** Query telah disempurnakan menggunakan `LEFT JOIN` untuk memastikan data historis tetap utuh.
        - **Penamaan Varian Akurat:** Logika penamaan item kini menampilkan nama produk secara lengkap (misal: "Baju Polos - XL").

---

## Rencana Aksi Berikutnya

### **Prioritas Utama: Modul Laporan Inventaris (Kebutuhan Strategis & Operasional)**

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
