# Blueprint Aplikasi Finako

Dokumen ini berfungsi sebagai sumber kebenaran tunggal untuk rencana pengembangan, fitur, dan arsitektur aplikasi Finako.

## Ikhtisar & Tujuan Aplikasi

Finako adalah aplikasi Point of Sale (POS) dan manajemen inventaris berbasis cloud yang dirancang untuk UMKM. Tujuannya adalah untuk menyediakan alat yang mudah digunakan namun kuat untuk mengelola penjualan, stok, pelanggan, dan laporan keuangan, yang pada akhirnya membantu pemilik bisnis membuat keputusan yang lebih baik.

---

## Status & Rencana Aksi Saat Ini

### Kondisi Modul POS
*   **Alur Kerja:** Pengguna dapat memilih produk, menambahkannya ke keranjang, memberikan diskon, menautkan transaksi ke pelanggan, dan menerima berbagai metode pembayaran.
*   **Keterbatasan:** Laporan penjualan yang ada saat ini masih sangat dasar dan belum memanfaatkan kekayaan data yang tersimpan di database.

---

## Rencana Aksi: Fase 20 - Dasbor Analisis Penjualan Komprehensif

Tujuan dari fase ini adalah untuk merombak total halaman laporan penjualan menjadi sebuah dasbor analitik interaktif yang memberikan wawasan bisnis mendalam dan dapat ditindaklanjuti.

### 1. Visi & Fitur Utama

Dasbor baru akan diorganisir ke dalam beberapa **Tab** untuk menjaga antarmuka tetap bersih dan intuitif, memungkinkan pengguna beralih antara data ringkasan (agregat) dan data detail (transaksional).

*   **Tab 1: Ringkasan & Tren Utama (Visual)**
    *   **Kartu Metrik Keuangan:** Menampilkan data kunci seperti Pendapatan Bersih, HPP, Laba Kotor, Margin, dan Pajak.
    *   **Grafik Tren Harian:** Visualisasi pendapatan dan laba dari hari ke hari.
    *   **Analisis Jam Sibuk:** Grafik baru untuk mengidentifikasi volume transaksi per jam, membantu dalam penjadwalan staf dan manajemen operasional.

*   **Tab 2: Analisis Produk (Visual)**
    *   **Tabel Produk Paling Menguntungkan:** Tabel yang sudah ada, diperkaya dengan data yang lebih relevan.
    *   **Analisis Kategori & Merek:** Visualisasi (Pie/Bar Chart) baru untuk menunjukkan kontribusi pendapatan dan laba dari setiap kategori dan merek produk.

*   **Tab 3: Analisis Staf & Pelanggan (Tabel)**
    *   **Tabel Kinerja Kasir:** Fitur baru untuk melacak total penjualan, jumlah transaksi, dan nilai transaksi rata-rata per anggota staf.
    *   **Tabel Pelanggan Teratas:** Fitur baru untuk mengidentifikasi pelanggan paling loyal berdasarkan total pembelanjaan.

*   **Tab 4: Analisis Metode Pembayaran (Visual)**
    *   **Rincian Metode Pembayaran:** Pie chart baru yang memecah total pendapatan berdasarkan metode pembayaran (Tunai, QRIS, Kartu, dll.).

*   **Tab 5: Riwayat Transaksi (Detail & Drill-Down)**
    *   **Tabel Transaksi Individual:** Tabel lengkap yang menampilkan setiap transaksi dalam rentang tanggal yang dipilih.
    *   **Fitur Pencarian & Filter:** Kemampuan untuk mencari berdasarkan nomor transaksi atau memfilter berdasarkan kasir/pelanggan.
    *   **Aksi "Lihat Detail":** Tombol di setiap baris untuk membuka modal (pop-up) yang menampilkan detail struk/invoice lengkap, termasuk semua item, harga, diskon, dan pajak.

### 2. Rencana Implementasi Teknis

*   **Backend (Database):**
    1.  **RPC Function:** Membuat satu fungsi RPC Supabase yang sangat efisien bernama `get_comprehensive_sales_analysis`. Fungsi ini akan mengagregasi semua data yang dibutuhkan dari berbagai tabel dalam satu panggilan database untuk meminimalkan latensi.
    2.  **Optimasi & Indexing:** **Ini adalah prioritas utama.** Sebelum fungsi dibuat, akan dilakukan analisis untuk memastikan semua *foreign key* dan kolom yang sering digunakan dalam klausa `WHERE`, `JOIN`, dan `ORDER BY` (seperti `organization_id`, `outlet_id`, `transaction_date`, `customer_id`, `member_id`) memiliki **indeks (index)** yang tepat. Ini krusial untuk memastikan dasbor dapat memuat data dalam jumlah besar dengan cepat tanpa membebani database.

*   **Backend (Next.js Server Actions):**
    1.  Membuat atau memodifikasi *server action* di `actions.ts` untuk memanggil fungsi RPC baru.
    2.  Mendefinisikan tipe data TypeScript (`ComprehensiveReportData`) yang kuat untuk mencocokkan output JSON dari database, memastikan keamanan tipe dari backend hingga frontend.

*   **Frontend (UI/UX):**
    1.  Merombak `SalesReportClient.tsx` untuk mengimplementasikan tata letak berbasis Tab.
    2.  Menggunakan `recharts` untuk membuat komponen visualisasi data yang informatif dan dapat digunakan kembali.
    3.  Mengelola state dan transisi dengan `useTransition` untuk memastikan pengalaman pengguna yang mulus saat memfilter atau beralih tab.

*   **Ekspor Excel:**
    1.  Meningkatkan fungsi ekspor Excel yang ada. Laporan yang dihasilkan akan memiliki **beberapa lembar kerja (sheets)**, masing-masing didedikasikan untuk satu jenis analisis (Ringkasan, Top Produk, Kinerja Kasir, dll.), menjadikannya sangat profesional dan mudah dianalisis.
