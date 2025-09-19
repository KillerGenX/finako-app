-- Supabase RPC Function: get_advanced_sales_and_profit_report
-- =================================================================
--
--  Tujuan: 
--  Menghitung metrik penjualan dan keuntungan secara komprehensif,
--  memperhitungkan diskon item, diskon transaksi, pajak, dan HPP.
--  Mendukung filter berdasarkan rentang tanggal dan outlet.
--
--  Parameter:
--  - p_organization_id: UUID organisasi
--  - p_start_date: Tanggal mulai (TIMESTAMPTZ)
--  - p_end_date: Tanggal akhir (TIMESTAMPTZ)
--  - p_outlet_id: UUID outlet (opsional, NULL untuk semua outlet)
--
-- =================================================================

CREATE OR REPLACE FUNCTION public.get_advanced_sales_and_profit_report(
    p_organization_id UUID,
    p_start_date TIMESTAMPTZ,
    p_end_date TIMESTAMPTZ,
    p_outlet_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
    v_report JSONB;
BEGIN
    WITH relevant_transactions AS (
        -- Langkah 1: Pra-filter transaksi yang relevan
        SELECT *
        FROM public.transactions t
        WHERE t.organization_id = p_organization_id
          AND t.status = 'completed'
          AND t.transaction_date BETWEEN p_start_date AND p_end_date
          AND (p_outlet_id IS NULL OR t.outlet_id = p_outlet_id)
    ),
    item_calculations AS (
        -- Langkah 2: Hitung metrik dasar untuk setiap item transaksi
        SELECT 
            ti.product_variant_id,
            (ti.quantity * ti.unit_price) AS gross_revenue_item,
            ti.discount_amount AS item_level_discount,
            -- Alokasikan diskon transaksi secara proporsional
            CASE 
                WHEN t.subtotal > 0 THEN (ti.quantity * ti.unit_price / t.subtotal) * t.total_discount
                ELSE 0 
            END AS transaction_level_discount_allocated,
            ti.tax_amount,
            (ti.quantity * pv.cost_price) AS cogs_item
        FROM public.transaction_items ti
        JOIN relevant_transactions t ON ti.transaction_id = t.id
        JOIN public.product_variants pv ON ti.product_variant_id = pv.id
    ),
    summary AS (
        -- Langkah 3: Agregasi semua perhitungan untuk ringkasan total
        SELECT
            COALESCE(SUM(gross_revenue_item), 0) AS gross_revenue,
            COALESCE(SUM(item_level_discount + transaction_level_discount_allocated), 0) AS total_discounts,
            COALESCE(SUM(gross_revenue_item - (item_level_discount + transaction_level_discount_allocated)), 0) AS net_revenue,
            COALESCE(SUM(cogs_item), 0) AS total_cogs,
            COALESCE(SUM(tax_amount), 0) AS total_tax_collected
        FROM item_calculations
    ),
    top_products AS (
        -- Langkah 4: Hitung profit per produk dan ambil 10 teratas
        SELECT
            jsonb_agg(product_data)
        FROM (
            SELECT
                pv.name AS product_name,
                pv.sku,
                SUM(ti.quantity) AS total_quantity_sold,
                SUM(ti.quantity * ti.unit_price - ti.discount_amount - CASE WHEN t.subtotal > 0 THEN (ti.quantity * ti.unit_price / t.subtotal) * t.total_discount ELSE 0 END) AS net_revenue,
                SUM(ti.quantity * (ti.unit_price - pv.cost_price) - ti.discount_amount - CASE WHEN t.subtotal > 0 THEN (ti.quantity * ti.unit_price / t.subtotal) * t.total_discount ELSE 0 END) AS gross_profit
            FROM public.transaction_items ti
            JOIN relevant_transactions t ON ti.transaction_id = t.id
            JOIN public.product_variants pv ON ti.product_variant_id = pv.id
            GROUP BY pv.id, pv.name, pv.sku
            ORDER BY gross_profit DESC
            LIMIT 10
        ) AS product_data
    )
    -- Langkah 5: Gabungkan semua hasil ke dalam satu JSON
    SELECT jsonb_build_object(
        'summary', jsonb_build_object(
            'gross_revenue', s.gross_revenue,
            'total_discounts', s.total_discounts,
            'net_revenue', s.net_revenue,
            'total_cogs', s.total_cogs,
            'gross_profit', s.net_revenue - s.total_cogs,
            'gross_margin', CASE WHEN s.net_revenue > 0 THEN ((s.net_revenue - s.total_cogs) / s.net_revenue) * 100 ELSE 0 END,
            'total_tax_collected', s.total_tax_collected
        ),
        'top_products', COALESCE((SELECT * FROM top_products), '[]'::jsonb)
    )
    INTO v_report
    FROM summary s;

    RETURN v_report;
END;
$$;
