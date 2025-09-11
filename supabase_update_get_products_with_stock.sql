-- =================================================================
--  Pembaruan Fungsi RPC: get_products_with_stock
-- =================================================================
--
--  Tujuan: 
--  Memperbaiki logika penamaan untuk menyertakan produk tipe 'SERVICE',
--  sehingga tidak ada lagi nama ganda (e.g., "Nama Jasa - Nama Jasa")
--  di daftar produk utama.
--
--  Perubahan:
--  - Menambahkan `OR p.product_type = 'SERVICE'` ke dalam `CASE` statement
--    untuk memastikan hanya produk 'VARIANT' yang namanya digabung.
--
--  Instruksi: 
--  Jalankan seluruh skrip ini di SQL Editor Supabase Anda untuk 
--  menggantikan fungsi yang lama dengan versi yang sudah diperbarui.
--
-- =================================================================

-- Hapus fungsi yang lama terlebih dahulu
DROP FUNCTION IF EXISTS public.get_products_with_stock(uuid);

-- Buat ulang fungsi dengan logika penamaan yang diperbaiki
CREATE OR REPLACE FUNCTION public.get_products_with_stock(
    p_organization_id uuid
)
RETURNS TABLE (
    id uuid,
    product_id uuid,
    name text,
    sku text,
    selling_price numeric,
    track_stock boolean,
    created_at timestamptz,
    image_url text,
    total_stock numeric,
    category_id uuid,
    product_type product_type_enum
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        pv.id,
        pv.product_id,
        -- INI BAGIAN YANG DIPERBAIKI --
        CASE
            WHEN p.product_type = 'SINGLE' OR p.product_type = 'COMPOSITE' OR p.product_type = 'SERVICE' THEN p.name
            ELSE p.name || ' - ' || pv.name
        END AS name,
        pv.sku,
        pv.selling_price,
        pv.track_stock,
        pv.created_at,
        p.image_url,
        COALESCE(SUM(isl.quantity_on_hand), 0) AS total_stock,
        p.category_id,
        p.product_type
    FROM
        public.product_variants AS pv
    JOIN
        public.products AS p ON pv.product_id = p.id
    LEFT JOIN
        public.inventory_stock_levels AS isl ON pv.id = isl.product_variant_id
    WHERE
        pv.organization_id = p_organization_id
    GROUP BY
        pv.id, p.id
    ORDER BY
        p.name ASC, pv.created_at ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
