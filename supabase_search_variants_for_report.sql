-- Supabase RPC Function for a robust variant search
-- =================================================================
--
--  Tujuan: 
--  Membuat fungsi `search_variants_for_report` untuk menyediakan
--  pencarian produk/varian yang cepat dan andal untuk Laporan Inventaris.
--
--  Fitur:
--  - Menggunakan SQL murni untuk menghindari limitasi parser client library.
--  - Mencari berdasarkan Nama Varian, SKU, dan Nama Produk Induk.
--  - Mengembalikan nama yang sudah diformat dengan benar.
--
-- =================================================================

CREATE OR REPLACE FUNCTION search_variants_for_report(
    p_organization_id UUID,
    p_search_term TEXT
)
RETURNS TABLE (
    id UUID,
    name TEXT,
    sku TEXT
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        pv.id,
        -- Menggabungkan nama produk dan varian jika tipenya 'VARIANT'
        CASE
            WHEN p.product_type = 'VARIANT' THEN p.name || ' - ' || pv.name
            ELSE pv.name
        END AS name,
        pv.sku
    FROM
        public.product_variants pv
    LEFT JOIN
        public.products p ON pv.product_id = p.id
    WHERE
        pv.organization_id = p_organization_id AND
        (
            pv.name ILIKE '%' || p_search_term || '%' OR
            pv.sku ILIKE '%' || p_search_term || '%' OR
            p.name ILIKE '%' || p_search_term || '%'
        )
    LIMIT 10;
END;
$$;
