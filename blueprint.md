# Rencana Pengembangan Aplikasi Finako

## Ikhtisar Proyek
Dokumen ini berfungsi sebagai sumber kebenaran tunggal untuk semua upaya pengembangan yang sedang berlangsung pada aplikasi Finako. Ini mencatat status proyek saat ini, fitur yang ada, dan rencana terperinci untuk implementasi di masa mendatang.

---

## Status & Fitur Saat Ini (Per Akhir Fase 18)

### Kemampuan Aplikasi
*   Manajemen Produk (termasuk produk standar & komposit)
*   Manajemen Inventaris Multi-Outlet (Stok Masuk, Stok Keluar, Transfer, Opname)
*   Manajemen Pesanan Pembelian (Purchase Orders)
*   Point of Sale (POS) dengan manajemen keranjang, diskon, dan integrasi pelanggan (CRM).
*   Laporan Penjualan komprehensif dengan ekspor ke Excel.
*   Manajemen dasar untuk Pelanggan, Pemasok, Merek, Kategori, dan Pajak.

### Kondisi Modul POS
*   **Alur Kerja:** Pengguna dapat memilih produk, menambahkannya ke keranjang, memberikan diskon (per item atau per transaksi), dan menautkan transaksi ke pelanggan yang sudah ada atau baru.
*   **Keterbatasan:** Proses pembayaran saat ini tidak mencatat metode pembayaran. Modal pembayaran hanya menerima input "uang tunai diterima" dan menghitung kembalian. Semua transaksi secara implisit dianggap tunai, dan tidak ada data yang disimpan ke tabel `payments`.

---

## Rencana Aksi: Fase 19 - Perbaikan Alur Kerja Transaksi POS

Tujuan utama dari fase ini adalah untuk memastikan integritas data transaksi dengan mencatat detail metode pembayaran secara akurat.

### Langkah-langkah Implementasi:

1.  **Buat Tipe Data & RPC Baru di Database:**
    *   Buat tipe data SQL baru bernama `payment_input_type` yang akan berisi `payment_method VARCHAR(50)` dan `amount NUMERIC`.
    *   Buat fungsi RPC Supabase baru, `create_new_sale_v6`, yang merupakan duplikat dari `v5` tetapi dengan parameter tambahan: `p_payments public.payment_input_type[]`.
    *   Di dalam RPC baru, tambahkan logika untuk:
        *   Memvalidasi bahwa total dari `p_payments` sama dengan `grand_total` transaksi.
        *   Melakukan iterasi melalui array `p_payments` dan menyisipkan setiap entri ke dalam tabel `public.payments`, yang ditautkan dengan ID transaksi yang baru dibuat.
        *   Pastikan semua operasi (penjualan, item, stok, dan pembayaran) tetap dalam satu transaksi atomik.

2.  **Rombak Modal Pembayaran (`PaymentModal.tsx`):**
    *   Ubah state internal untuk mengelola daftar metode pembayaran yang digunakan (misalnya, `[{ method: 'Tunai', amount: 50000 }]`).
    *   Implementasikan UI yang memungkinkan kasir untuk:
        *   Menambahkan beberapa metode pembayaran ke satu transaksi.
        *   Memilih jenis metode (misalnya, Tunai, QRIS, Kartu Debit/Kredit).
        *   Memasukkan jumlah yang dibayarkan untuk setiap metode.
    *   Tampilkan sisa tagihan yang harus dibayar secara dinamis.
    *   Ubah fungsi `onSubmit` untuk mengembalikan array data pembayaran yang telah diinput.

3.  **Perbarui Klien POS (`POSClient.tsx`):**
    *   Ubah penanganan untuk `PaymentModal`. Fungsi `handleConfirmPayment` sekarang akan menerima array data pembayaran dari modal.
    *   Teruskan data pembayaran ini saat memanggil server action `createTransaction`.

4.  **Perbarui Server Action (`actions.ts`):**
    *   Modifikasi fungsi `createTransaction` untuk menerima parameter array pembayaran baru.
    *   Ubah panggilan RPC di dalam fungsi ini dari `create_new_sale` menjadi `create_new_sale_v6` yang baru, dengan meneruskan data pembayaran yang diformat dengan benar.
