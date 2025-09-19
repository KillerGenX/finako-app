-- Supabase Migration: Menambahkan Fungsionalitas Peringatan Stok Rendah
-- =================================================================
--
--  Tujuan: 
--  Menambahkan kolom baru ke tabel `product_variants` untuk memungkinkan
--  pengaturan ambang batas stok minimum (reorder point) dan jumlah
--  pemesanan ulang yang disarankan.
--
--  Instruksi: 
--  Jalankan skrip ini di SQL Editor Supabase Anda. Ini adalah operasi 
--  ALTER TABLE yang aman dan tidak akan menghapus data.
--
-- =================================================================

ALTER TABLE public.product_variants
ADD COLUMN IF NOT EXISTS reorder_point NUMERIC(10, 4) NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS reorder_quantity NUMERIC(10, 4) NOT NULL DEFAULT 0;

COMMENT ON COLUMN public.product_variants.reorder_point IS 'Ambang batas stok minimum. Jika stok aktual di bawah nilai ini, sistem akan memicu peringatan.';
COMMENT ON COLUMN public.product_variants.reorder_quantity IS 'Jumlah yang disarankan untuk dipesan ulang saat stok mencapai reorder point.';
