-- Supabase Index: Menambahkan Indeks untuk Performa Halaman Riwayat
-- =================================================================
--
--  Tujuan: 
--  Mempercepat query pada halaman riwayat transaksi dengan menambahkan
--  indeks komposit pada kolom yang paling sering digunakan untuk filter.
--
--  Pembaruan:
--  -   Menambahkan indeks komposit pada (organization_id, transaction_date).
--      Ini akan secara dramatis mempercepat filter berdasarkan rentang tanggal.
--
--  Instruksi: Jalankan skrip ini di SQL Editor Supabase Anda.
--  Ini adalah operasi yang aman dan tidak akan menghapus data.
--
-- =================================================================

-- Membuat indeks komposit. Menggunakan CREATE INDEX IF NOT EXISTS agar aman dijalankan berkali-kali.
CREATE INDEX IF NOT EXISTS idx_transactions_org_date ON public.transactions (organization_id, transaction_date DESC);
