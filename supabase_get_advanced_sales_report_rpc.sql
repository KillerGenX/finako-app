-- Supabase RPC Function: get_advanced_sales_and_profit_report (Versi 3)
-- =================================================================
--
--  Tujuan: 
--  Menghitung metrik penjualan dan keuntungan secara komprehensif.
--
--  Pembaruan:
--  -   Menambahkan output `daily_trend` yang berisi agregat harian
--      dari pendapatan bersih dan laba kotor untuk digunakan dalam
--      grafik visualisasi.
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
        SELECT *
        FROM public.transactions t
        WHERE t.organization_id = p_organization_id
          AND t.status = 'completed'
          AND t.transaction_date BETWEEN p_start_date AND p_end_date
          AND (p_outlet_id IS NULL OR t.outlet_id = p_outlet_id)
    ),
    item_calculations AS (
        SELECT 
            ti.product_variant_id,
            t.transaction_date,
            (ti.quantity * ti.unit_price) AS gross_revenue_item,
            ti.discount_amount AS item_level_discount,
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
        SELECT
            COALESCE(SUM(gross_revenue_item), 0) AS gross_revenue,
            COALESCE(SUM(item_level_discount + transaction_level_discount_allocated), 0) AS total_discounts,
            COALESCE(SUM(gross_revenue_item - (item_level_discount + transaction_level_discount_allocated)), 0) AS net_revenue,
            COALESCE(SUM(cogs_item), 0) AS total_cogs,
            COALESCE(SUM(tax_amount), 0) AS total_tax_collected
        FROM item_calculations
    ),
    top_products AS (
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
    ),
    daily_trend AS (
        -- << BLOK BARU: Agregat data per hari untuk grafik >>
        SELECT
            jsonb_agg(
                jsonb_build_object(
                    'date', daily_summary.day,
                    'net_revenue', daily_summary.net_revenue,
                    'gross_profit', daily_summary.gross_profit
                ) ORDER BY daily_summary.day
            )
        FROM (
            SELECT
                DATE_TRUNC('day', transaction_date)::DATE AS day,
                SUM(gross_revenue_item - (item_level_discount + transaction_level_discount_allocated)) AS net_revenue,
                SUM(gross_revenue_item - (item_level_discount + transaction_level_discount_allocated) - cogs_item) AS gross_profit
            FROM item_calculations
            GROUP BY day
        ) AS daily_summary
    )
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
        'top_products', COALESCE((SELECT * FROM top_products), '[]'::jsonb),
        'daily_trend', COALESCE((SELECT * FROM daily_trend), '[]'::jsonb) -- Tambahkan data tren ke output
    )
    INTO v_report
    FROM summary s;

    RETURN v_report;
END;
$$;
