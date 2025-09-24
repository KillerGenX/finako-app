-- Supabase RPC Function for Comprehensive Tax Reporting (v4 - Improved Naming)
-- =================================================================
--
--  Tujuan: 
--  Membuat fungsi `get_tax_report_data` yang mengagregasi semua data
--  pajak yang relevan dalam satu panggilan database yang efisien.
--
--  Revisi v4:
--  - Memperbaiki penamaan item untuk produk tipe VARIAN.
--  - Nama item kini akan digabung (Nama Produk Induk - Nama Varian) 
--    untuk memberikan deskripsi yang lengkap dan menghindari ambiguitas.
--
-- =================================================================

CREATE OR REPLACE FUNCTION get_tax_report_data(
    p_organization_id UUID,
    p_start_date TIMESTAMPTZ,
    p_end_date TIMESTAMPTZ,
    p_outlet_id UUID DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
AS $$
DECLARE
    result JSON;
BEGIN
    WITH base_data AS (
        -- Langkah 1: Kumpulkan semua item transaksi yang memiliki nilai pajak > 0
        SELECT
            t.id AS transaction_id,
            t.transaction_number,
            t.transaction_date,
            COALESCE(o.name, 'Outlet Dihapus') AS outlet_name,
            ti.product_variant_id,
            -- (REVISI) Logika penamaan item yang disempurnakan
            CASE
                WHEN p.product_type = 'VARIANT' THEN p.name || ' - ' || pv.name
                ELSE COALESCE(pv.name, 'Varian Dihapus')
            END AS variant_name,
            p.product_type, -- Ambil tipe produk untuk logika
            ti.quantity,
            ti.unit_price,
            (ti.unit_price * ti.quantity) AS dpp,
            ti.tax_amount
        FROM public.transactions t
        JOIN public.transaction_items ti ON t.id = ti.transaction_id
        LEFT JOIN public.product_variants pv ON ti.product_variant_id = pv.id
        LEFT JOIN public.products p ON pv.product_id = p.id -- Join ke tabel products
        LEFT JOIN public.outlets o ON t.outlet_id = o.id
        WHERE
            t.organization_id = p_organization_id
            AND t.status = 'completed'
            AND ti.tax_amount > 0
            AND t.transaction_date BETWEEN p_start_date AND p_end_date
            AND (p_outlet_id IS NULL OR t.outlet_id = p_outlet_id)
    ),
    tax_details AS (
        -- Langkah 2: Mencari nama tarif pajak terkait.
        SELECT
            bd.*,
            (SELECT tr.name FROM public.tax_rates tr
             JOIN public.product_tax_rates ptr ON tr.id = ptr.tax_rate_id
             JOIN public.products p_join ON ptr.product_id = p_join.id
             JOIN public.product_variants pv_join ON p_join.id = pv_join.product_id
             WHERE pv_join.id = bd.product_variant_id
             LIMIT 1) AS tax_rate_name
        FROM base_data bd
    ),
    composition_agg AS (
        -- Langkah 2.5: Lakukan pra-agregasi untuk data komposisi
        SELECT
            COALESCE(tax_rate_name, 'Pajak Lainnya') as name,
            SUM(tax_amount) as amount
        FROM tax_details
        GROUP BY COALESCE(tax_rate_name, 'Pajak Lainnya')
    )
    -- Langkah 3: Agregasi semua data ke dalam format JSON tunggal
    SELECT json_build_object(
        'summary', (
            SELECT json_build_object(
                'total_dpp', COALESCE(SUM(dpp), 0),
                'total_tax', COALESCE(SUM(tax_amount), 0),
                'transaction_count', COUNT(DISTINCT transaction_id)
            )
            FROM tax_details
        ),
        'composition', (
            SELECT COALESCE(json_agg(
                json_build_object('name', name, 'amount', amount)
            ), '[]')
            FROM composition_agg
        ),
        'details', (
            SELECT COALESCE(json_agg(
                json_build_object(
                    'transaction_date', transaction_date,
                    'transaction_number', transaction_number,
                    'outlet_name', outlet_name,
                    'variant_name', variant_name, -- Nama ini sudah diperbaiki
                    'unit_price', unit_price,
                    'quantity', quantity,
                    'dpp', dpp,
                    'tax_rate_name', COALESCE(tax_rate_name, 'N/A'),
                    'tax_amount', tax_amount
                ) ORDER BY transaction_date DESC
            ), '[]')
            FROM tax_details
        )
    ) INTO result;

    RETURN result;
END;
$$;
