-- =================================================================
--  Fungsi RPC untuk Menghitung Harga Pokok Penjualan (HPP) 
--  dari sebuah Produk Komposit (Resep/BOM)
-- =================================================================
--
--  Tujuan: 
--  Fungsi ini akan menghitung total biaya dari semua komponen yang 
--  menyusun sebuah produk komposit. Perhitungan ini penting untuk 
--  menentukan laba kotor secara akurat.
--
--  Parameter:
--  - p_variant_id (UUID): ID dari varian produk (di tabel product_variants)
--                         yang merupakan produk komposit.
--
--  Mengembalikan:
--  - NUMERIC: Total HPP dari produk komposit. Akan mengembalikan 0
--             jika tidak ada komponen atau jika produk bukan komposit.
--
--  Contoh Penggunaan (di dalam Supabase):
--  SELECT * FROM calculate_composite_hpp('uuid-produk-komposit-anda');
--
-- =================================================================

CREATE OR REPLACE FUNCTION public.calculate_composite_hpp(p_variant_id UUID)
RETURNS NUMERIC AS $$
DECLARE
    total_hpp NUMERIC;
BEGIN
    SELECT 
        COALESCE(SUM(pc.quantity * pv.cost_price), 0)
    INTO 
        total_hpp
    FROM 
        public.product_composites pc
    JOIN 
        public.product_variants pv ON pc.component_variant_id = pv.id
    WHERE 
        pc.parent_variant_id = p_variant_id;

    RETURN total_hpp;
END;
$$ LANGUAGE plpgsql;

-- =================================================================
-- Akhir dari skrip.
-- =================================================================
