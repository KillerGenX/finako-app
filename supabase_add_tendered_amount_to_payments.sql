-- Supabase Schema: Menambahkan Kolom Tendered Amount ke Tabel Payments
-- =================================================================
--
--  Tujuan: 
--  Memperbaiki kelemahan desain fundamental dengan menambahkan kolom
--  untuk mencatat jumlah uang yang diterima dari pelanggan (tendered).
--  Ini memungkinkan perhitungan kembalian yang akurat.
--
--  Pembaruan:
--  -   Menambahkan kolom `tendered_amount` ke tabel `public.payments`.
--      Kolom ini akan sama dengan `amount` untuk pembayaran non-tunai,
--      tetapi bisa lebih besar untuk pembayaran tunai.
--
--  Instruksi: Jalankan skrip ini di SQL Editor Supabase Anda.
--
-- =================================================================

ALTER TABLE public.payments
ADD COLUMN IF NOT EXISTS tendered_amount NUMERIC(15, 2);

COMMENT ON COLUMN public.payments.tendered_amount IS 'Jumlah uang yang sebenarnya diterima dari pelanggan (misal: uang tunai yang diberikan). Penting untuk menghitung kembalian.';

-- Mengisi nilai default untuk data yang sudah ada agar tidak null
UPDATE public.payments
SET tendered_amount = amount
WHERE tendered_amount IS NULL;
