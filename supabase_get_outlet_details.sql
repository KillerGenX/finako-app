-- Supabase RPC Function: get_outlet_details
-- =================================================================
--
--  Tujuan: 
--  Menjadi satu-satunya sumber data untuk halaman detail outlet.
--  Fungsi ini secara efisien mengambil profil outlet, daftar stok
--  inventaris, dan riwayat transaksinya dalam satu panggilan.
--
--  Fitur Utama:
--  1.  Data Komprehensif: Menggabungkan profil, stok, dan transaksi.
--  2.  Manajemen Stok: Secara spesifik mengambil level stok untuk outlet
--      yang dipilih.
--  3.  Paginasi & Pencarian: Mendukung paginasi dan pencarian untuk
--      daftar transaksi yang panjang.
--
--  Instruksi: Jalankan skrip ini di SQL Editor Supabase Anda.
--
-- =================================================================

CREATE OR REPLACE FUNCTION public.get_outlet_details(
    p_outlet_id UUID,
    p_organization_id UUID,
    p_tx_page_number INT DEFAULT 1,
    p_tx_page_size INT DEFAULT 10
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_outlet_profile JSONB;
    v_inventory_stock JSONB;
    v_transactions_data JSONB;
    v_tx_offset INT;
BEGIN
    -- 1. Ambil Profil Outlet
    SELECT jsonb_build_object(
        'id', o.id,
        'name', o.name,
        'address', o.address,
        'phone_number', o.phone_number,
        'location_types', o.location_types
    )
    INTO v_outlet_profile
    FROM public.outlets o
    WHERE o.id = p_outlet_id AND o.organization_id = p_organization_id;

    -- Jika outlet tidak ditemukan, kembalikan null
    IF v_outlet_profile IS NULL THEN
        RETURN NULL;
    END IF;

    -- 2. Ambil Daftar Stok Inventaris di Outlet Ini
    SELECT COALESCE(jsonb_agg(sub.* ORDER BY sub.product_name), '[]'::jsonb)
    INTO v_inventory_stock
    FROM (
        SELECT 
            pv.id as variant_id,
            CASE
                WHEN p.product_type = 'VARIANT' THEN p.name || ' - ' || pv.name
                ELSE p.name
            END as product_name,
            pv.sku,
            isl.quantity_on_hand
        FROM public.inventory_stock_levels isl
        JOIN public.product_variants pv ON isl.product_variant_id = pv.id
        JOIN public.products p ON pv.product_id = p.id
        WHERE isl.outlet_id = p_outlet_id AND isl.quantity_on_hand > 0
    ) as sub;

    -- 3. Ambil Riwayat Transaksi di Outlet Ini
    v_tx_offset := (p_tx_page_number - 1) * p_tx_page_size;

    WITH filtered_transactions AS (
        SELECT
            t.id,
            t.transaction_date,
            t.transaction_number,
            t.grand_total,
            COALESCE(cust.name, 'Pelanggan Umum') as customer_name
        FROM public.transactions t
        LEFT JOIN public.customers cust ON t.customer_id = cust.id
        WHERE t.outlet_id = p_outlet_id
    )
    SELECT jsonb_build_object(
        'total_count', (SELECT COUNT(*) FROM filtered_transactions),
        'data', COALESCE((
            SELECT jsonb_agg(ft.* ORDER BY ft.transaction_date DESC)
            FROM (
                SELECT * FROM filtered_transactions
                ORDER BY transaction_date DESC
                LIMIT p_tx_page_size
                OFFSET v_tx_offset
            ) ft
        ), '[]'::jsonb)
    )
    INTO v_transactions_data;

    -- 4. Gabungkan semua hasil
    RETURN jsonb_build_object(
        'profile', v_outlet_profile,
        'inventory', v_inventory_stock,
        'transactions', v_transactions_data
    );
END;
$$;
