-- Supabase RPC Function: get_pos_data (Versi 3)
-- =================================================================
--
--  Tujuan: 
--  Menjadi satu-satunya sumber data untuk halaman Point of Sale (POS).
--  Fungsi ini efisien dan aman, hanya mengembalikan produk yang relevan
--  untuk outlet yang dipilih.
--
--  Pembaruan (Versi 3):
--  -   Memperbaiki penamaan untuk produk tipe 'VARIANT'. Sekarang nama
--      yang dikembalikan akan berformat "Nama Produk - Nama Varian"
--      (contoh: "Kaos Polos - XL").
--
--  Fitur Utama:
--  1.  Penamaan Produk yang Benar: Menampilkan nama lengkap untuk produk varian.
--  2.  Filter Stok Cerdas: Hanya menampilkan produk yang bisa dijual.
--  3.  Data Pajak Terintegrasi: Langsung menyertakan data pajak.
--  4.  Data Kategori Terintegrasi: Menyertakan ID dan Nama Kategori.
--  5.  Performa: Memindahkan logika filter yang berat ke database.
--
--  Instruksi: Jalankan skrip ini di SQL Editor Supabase Anda.
--
-- =================================================================

CREATE OR REPLACE FUNCTION public.get_pos_data(
    p_organization_id UUID,
    p_outlet_id UUID
)
RETURNS TABLE (
    -- Dari product_variants
    id UUID,
    name TEXT,
    selling_price NUMERIC,
    track_stock BOOLEAN,
    
    -- Dari products
    image_url TEXT,
    category_id UUID,
    category_name TEXT,
    
    -- Dari inventory_stock_levels
    stock_on_hand NUMERIC,
    
    -- Data pajak yang digabungkan
    taxes JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT
        pv.id,
        -- Logika CASE untuk penamaan produk yang benar
        CASE
            WHEN p.product_type = 'VARIANT' THEN p.name || ' - ' || pv.name
            ELSE pv.name
        END as name,
        pv.selling_price,
        pv.track_stock,
        p.image_url,
        pc.id as category_id,
        pc.name as category_name,
        COALESCE(isl.quantity_on_hand, 0) as stock_on_hand,
        (
            SELECT jsonb_agg(
                jsonb_build_object(
                    'id', tr.id,
                    'name', tr.name,
                    'rate', tr.rate,
                    'is_inclusive', tr.is_inclusive
                )
            )
            FROM public.product_tax_rates ptr
            JOIN public.tax_rates tr ON ptr.tax_rate_id = tr.id
            WHERE ptr.product_id = pv.product_id AND tr.is_active = true
        ) as taxes
    FROM
        public.product_variants pv
    JOIN
        public.products p ON pv.product_id = p.id
    LEFT JOIN
        public.inventory_stock_levels isl ON pv.id = isl.product_variant_id AND isl.outlet_id = p_outlet_id
    LEFT JOIN
        public.product_categories pc ON p.category_id = pc.id
    WHERE
        pv.organization_id = p_organization_id
        AND (pv.track_stock = false OR COALESCE(isl.quantity_on_hand, 0) > 0);
END;
$$;
