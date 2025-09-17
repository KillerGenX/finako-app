-- Supabase Schema: Menambahkan Kolom Catatan pada Pergerakan Stok
-- =================================================================
--
--  Tujuan: 
--  Meningkatkan tabel `inventory_stock_movements` dengan menambahkan
--  kolom `notes` (opsional). Ini akan memungkinkan kita untuk menambahkan
--  konteks pada setiap pergerakan stok, seperti alasan penyesuaian.
--
--  Instruksi: Jalankan skrip ini di SQL Editor Supabase Anda.
--
-- =================================================================

ALTER TABLE public.inventory_stock_movements
ADD COLUMN IF NOT EXISTS notes TEXT;

COMMENT ON COLUMN public.inventory_stock_movements.notes IS 'Catatan kontekstual untuk pergerakan stok, misal "Hasil Stok Opname" atau "Barang Rusak".';
