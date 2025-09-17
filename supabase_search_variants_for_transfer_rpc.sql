-- Supabase RPC Function: search_variants_for_transfer
-- =================================================================
--
--  Tujuan: 
--  Secara efisien mencari produk varian DAN mengambil stoknya di 
--  outlet asal yang spesifik. Dibuat khusus untuk form Transfer Stok.
--
--  Fitur Utama:
--  1.  Filtered Left Join: Menggunakan LEFT JOIN pada inventory_stock_levels
--      dengan filter outlet_id DI DALAM klausa JOIN. Ini memastikan semua
--      produk yang cocok akan muncul, bahkan jika stoknya 0.
--  2.  Performa: Menggunakan JOIN dan filter di level database.
--
--  Instruksi: Jalankan skrip ini di SQL Editor Supabase Anda.
--
-- =================================================================

CREATE OR REPLACE FUNCTION public.search_variants_for_transfer(
    p_organization_id UUID,
    p_outlet_id UUID,
    p_search_query TEXT
)
RETURNS TABLE (
    id UUID,
    name TEXT,
    sku TEXT,
    stock_on_hand NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT
        pv.id,
        CASE
            WHEN p.product_type = 'VARIANT' THEN p.name || ' - ' || pv.name
            ELSE p.name
        END as name,
        pv.sku,
        COALESCE(isl.quantity_on_hand, 0) as stock_on_hand
    FROM
        public.product_variants pv
    JOIN
        public.products p ON pv.product_id = p.id
    LEFT JOIN
        public.inventory_stock_levels isl ON pv.id = isl.product_variant_id AND isl.outlet_id = p_outlet_id
    WHERE
        pv.organization_id = p_organization_id
        AND (
            p.name ILIKE '%' || p_search_query || '%' OR
            pv.name ILIKE '%' || p_search_query || '%' OR
            pv.sku ILIKE '%' || p_search_query || '%'
        )
    LIMIT 10;
END;
$$;
