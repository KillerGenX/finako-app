-- Supabase RPC Function: get_stock_report
-- =================================================================
--
--  Tujuan: 
--  Menyediakan data komprehensif untuk halaman Laporan Stok (Kartu Stok).
--  Fungsi ini mengambil semua level stok untuk semua produk di semua outlet.
--
--  Fitur Utama:
--  1.  Data Lengkap: Menggabungkan data dari produk, varian, outlet, dan
--      level stok.
--  2.  Penamaan Varian: Sudah menyertakan logika untuk format nama
--      produk varian yang benar ("Produk - Varian").
--  3.  Filter Pencarian: Mendukung pencarian berdasarkan nama produk atau SKU.
--
--  Instruksi: Jalankan skrip ini di SQL Editor Supabase Anda.
--
-- =================================================================

CREATE OR REPLACE FUNCTION public.get_stock_report(
    p_organization_id UUID,
    p_search_query TEXT DEFAULT NULL
)
RETURNS TABLE (
    variant_id UUID,
    product_name TEXT,
    sku TEXT,
    outlet_name TEXT,
    quantity_on_hand NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT
        pv.id as variant_id,
        CASE
            WHEN p.product_type = 'VARIANT' THEN p.name || ' - ' || pv.name
            ELSE p.name
        END as product_name,
        pv.sku,
        o.name as outlet_name,
        isl.quantity_on_hand
    FROM
        public.inventory_stock_levels isl
    JOIN
        public.product_variants pv ON isl.product_variant_id = pv.id
    JOIN
        public.products p ON pv.product_id = p.id
    JOIN
        public.outlets o ON isl.outlet_id = o.id
    WHERE
        isl.organization_id = p_organization_id
        AND (
            p_search_query IS NULL OR p_search_query = '' OR
            p.name ILIKE '%' || p_search_query || '%' OR
            pv.name ILIKE '%' || p_search_query || '%' OR
            pv.sku ILIKE '%' || p_search_query || '%'
        )
    ORDER BY
        product_name, outlet_name;
END;
$$;
