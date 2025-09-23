-- comprehensive_sales_analysis_function.sql

-- Drop the function if it already exists to ensure a clean setup
DROP FUNCTION IF EXISTS get_comprehensive_sales_analysis(UUID, TIMESTAMPTZ, TIMESTAMPTZ, UUID);

-- Create the function
CREATE OR REPLACE FUNCTION get_comprehensive_sales_analysis(
    p_organization_id UUID,
    p_start_date TIMESTAMPTZ,
    p_end_date TIMESTAMPTZ,
    p_outlet_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
    result JSONB;
BEGIN
    WITH TimeFilteredTransactions AS (
        SELECT *
        FROM transactions
        WHERE
            organization_id = p_organization_id
            AND transaction_date BETWEEN p_start_date AND p_end_date
            AND (p_outlet_id IS NULL OR outlet_id = p_outlet_id)
            AND status = 'completed'
    ),
    TransactionDetails AS (
        SELECT 
            tft.id AS transaction_id,
            tft.transaction_date,
            tft.member_id,
            tft.customer_id,
            ti.product_variant_id,
            ti.quantity,
            ti.line_total,
            ti.tax_amount,
            (pv.cost_price * ti.quantity) AS cogs
        FROM TimeFilteredTransactions tft
        JOIN transaction_items ti ON tft.id = ti.transaction_id
        LEFT JOIN product_variants pv ON ti.product_variant_id = pv.id
    )
    SELECT jsonb_build_object(
        'summary', (
            SELECT jsonb_build_object(
                'net_revenue', COALESCE(SUM(grand_total - total_tax), 0),
                'gross_profit', COALESCE(SUM(grand_total - total_tax) - SUM(td.cogs), 0),
                'total_tax_collected', COALESCE(SUM(total_tax), 0),
                'transaction_count', COUNT(id)
            )
            FROM TimeFilteredTransactions
            LEFT JOIN (SELECT transaction_id, SUM(cogs) as cogs FROM TransactionDetails GROUP BY transaction_id) td
            ON TimeFilteredTransactions.id = td.transaction_id
        ),
        'daily_trend', (
            SELECT COALESCE(jsonb_agg(
                jsonb_build_object(
                    'date', to_char(date_series, 'YYYY-MM-DD'),
                    'net_revenue', COALESCE(daily_data.net_revenue, 0),
                    'gross_profit', COALESCE(daily_data.gross_profit, 0)
                ) ORDER BY date_series
            ), '[]'::jsonb)
            FROM generate_series(p_start_date::date, p_end_date::date, '1 day') AS date_series
            LEFT JOIN (
                SELECT 
                    transaction_date::date AS date,
                    SUM(grand_total - total_tax) AS net_revenue,
                    SUM(grand_total - total_tax) - SUM(td.cogs) AS gross_profit
                FROM TimeFilteredTransactions
                JOIN (SELECT transaction_id, SUM(cogs) as cogs FROM TransactionDetails GROUP BY transaction_id) td
                ON TimeFilteredTransactions.id = td.transaction_id
                GROUP BY transaction_date::date
            ) AS daily_data ON date_series = daily_data.date
        ),
        'top_products', (
            SELECT COALESCE(jsonb_agg(p.* ORDER BY p.gross_profit DESC), '[]'::jsonb)
            FROM (
                SELECT 
                    pv.name AS product_name,
                    p.name AS template_name,
                    SUM(td.quantity) AS total_quantity_sold,
                    SUM(td.line_total) AS net_revenue,
                    SUM(td.line_total) - SUM(td.cogs) AS gross_profit
                FROM TransactionDetails td
                JOIN product_variants pv ON td.product_variant_id = pv.id
                JOIN products p ON pv.product_id = p.id
                GROUP BY pv.name, p.name
                ORDER BY gross_profit DESC
                LIMIT 10
            ) p
        ),
        'category_performance', (
            SELECT COALESCE(jsonb_agg(cp.* ORDER BY cp.net_revenue DESC), '[]'::jsonb)
            FROM (
                SELECT 
                    pc.name AS category_name,
                    SUM(td.line_total) AS net_revenue
                FROM TransactionDetails td
                JOIN product_variants pv ON td.product_variant_id = pv.id
                JOIN products p ON pv.product_id = p.id
                LEFT JOIN product_categories pc ON p.category_id = pc.id
                GROUP BY pc.name
            ) cp
        ),
        'cashier_performance', (
             SELECT COALESCE(jsonb_agg(cashier.* ORDER BY cashier.net_revenue DESC), '[]'::jsonb)
             FROM (
                SELECT
                    prof.full_name AS cashier_name,
                    COUNT(tft.id) AS transaction_count,
                    SUM(tft.grand_total - tft.total_tax) AS net_revenue,
                    AVG(tft.grand_total - tft.total_tax) AS avg_transaction_value
                FROM TimeFilteredTransactions tft
                JOIN organization_members om ON tft.member_id = om.id
                LEFT JOIN profiles prof ON om.user_id = prof.id
                GROUP BY prof.full_name
             ) cashier
        ),
        'payment_method_summary', (
            SELECT COALESCE(jsonb_agg(pm.*), '[]'::jsonb)
            FROM (
                SELECT 
                    p.payment_method,
                    SUM(p.amount) AS total_amount
                FROM TimeFilteredTransactions tft
                JOIN payments p ON tft.id = p.transaction_id
                GROUP BY p.payment_method
            ) pm
        ),
        'top_customers', (
            SELECT COALESCE(jsonb_agg(cust.* ORDER BY cust.total_spent DESC), '[]'::jsonb)
            FROM (
                SELECT
                    c.name AS customer_name,
                    COUNT(tft.id) AS transaction_count,
                    SUM(tft.grand_total - tft.total_tax) AS total_spent
                FROM TimeFilteredTransactions tft
                JOIN customers c ON tft.customer_id = c.id
                WHERE tft.customer_id IS NOT NULL
                GROUP BY c.name
                ORDER BY total_spent DESC
                LIMIT 10
            ) cust
        ),
        'hourly_sales_trend', (
            SELECT COALESCE(jsonb_agg(hourly.* ORDER BY hourly.hour), '[]'::jsonb)
            FROM (
                 SELECT 
                    EXTRACT(HOUR FROM transaction_date) AS hour,
                    COUNT(*) AS transaction_count
                 FROM TimeFilteredTransactions
                 GROUP BY EXTRACT(HOUR FROM transaction_date)
            ) hourly
        ),
        'transaction_history', (
            SELECT COALESCE(jsonb_agg(th.* ORDER BY th.transaction_date DESC), '[]'::jsonb)
            FROM (
                SELECT
                    tft.id,
                    tft.transaction_number,
                    tft.transaction_date,
                    prof.full_name AS cashier_name,
                    cust.name AS customer_name,
                    tft.grand_total,
                    tft.status,
                    (
                        SELECT COALESCE(jsonb_agg(items.*), '[]'::jsonb)
                        FROM (
                            SELECT 
                                p.name AS product_name,
                                pv.name AS variant_name,
                                ti.quantity,
                                ti.unit_price,
                                ti.discount_amount,
                                ti.tax_amount,
                                ti.line_total
                            FROM transaction_items ti
                            JOIN product_variants pv ON ti.product_variant_id = pv.id
                            JOIN products p ON pv.product_id = p.id
                            WHERE ti.transaction_id = tft.id
                        ) items
                    ) AS items
                FROM TimeFilteredTransactions tft
                LEFT JOIN organization_members om ON tft.member_id = om.id
                LEFT JOIN profiles prof ON om.user_id = prof.id
                LEFT JOIN customers cust ON tft.customer_id = cust.id
            ) th
        )
    ) INTO result;

    RETURN result;
END;
$$;
