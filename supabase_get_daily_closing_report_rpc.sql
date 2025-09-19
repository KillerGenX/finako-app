-- Supabase RPC Function: get_daily_closing_report (Versi 2)
-- =================================================================
--
--  Tujuan: 
--  Menghasilkan data komprehensif untuk Laporan Penutupan Harian.
--
--  Pembaruan:
--  -   Menambahkan `id` transaksi ke dalam `transaction_list` untuk
--      mendukung fungsionalitas pratinjau struk (view receipt) di frontend.
--
-- =================================================================

CREATE OR REPLACE FUNCTION public.get_daily_closing_report(
    p_organization_id UUID,
    p_start_date TIMESTAMPTZ,
    p_end_date TIMESTAMPTZ,
    p_outlet_id UUID,
    p_member_id UUID DEFAULT NULL -- Opsional: NULL untuk semua kasir
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
    v_report JSONB;
BEGIN
    WITH relevant_transactions AS (
        -- Filter transaksi berdasarkan parameter yang diberikan
        SELECT *
        FROM public.transactions t
        WHERE t.organization_id = p_organization_id
          AND t.outlet_id = p_outlet_id
          AND t.status = 'completed'
          AND t.transaction_date BETWEEN p_start_date AND p_end_date
          AND (p_member_id IS NULL OR t.member_id = p_member_id)
    ),
    payment_summary AS (
        -- Ringkasan berdasarkan metode pembayaran
        SELECT 
            p.payment_method,
            SUM(p.amount) as total_amount,
            COUNT(DISTINCT p.transaction_id) as transaction_count
        FROM public.payments p
        WHERE p.transaction_id IN (SELECT id FROM relevant_transactions)
        GROUP BY p.payment_method
    ),
    cashier_summary_calc AS (
        -- Ringkasan berdasarkan kasir
        SELECT 
            rt.member_id,
            prof.full_name as member_name,
            SUM(rt.grand_total - rt.total_tax) as net_sales,
            COUNT(rt.id) as transaction_count
        FROM relevant_transactions rt
        JOIN public.organization_members om ON rt.member_id = om.id
        JOIN public.profiles prof ON om.user_id = prof.id
        GROUP BY rt.member_id, prof.full_name
    ),
    transaction_list AS (
        -- Daftar transaksi rinci
        SELECT 
            rt.id, -- << PERUBAHAN: Menambahkan ID transaksi
            rt.transaction_number,
            rt.transaction_date,
            rt.grand_total,
            prof.full_name as member_name
        FROM relevant_transactions rt
        JOIN public.organization_members om ON rt.member_id = om.id
        JOIN public.profiles prof ON om.user_id = prof.id
        ORDER BY rt.transaction_date DESC
    )
    -- Gabungkan semua data menjadi satu objek JSON
    SELECT jsonb_build_object(
        'report_details', jsonb_build_object(
            'outlet_name', (SELECT name FROM public.outlets WHERE id = p_outlet_id),
            'period_start', p_start_date,
            'period_end', p_end_date,
            'generated_at', now()
        ),
        'summary', (
            SELECT jsonb_build_object(
                'total_transactions', COUNT(id),
                'gross_sales', COALESCE(SUM(subtotal), 0),
                'total_discounts', COALESCE(SUM(total_discount), 0),
                'net_sales', COALESCE(SUM(subtotal - total_discount), 0),
                'total_tax_collected', COALESCE(SUM(total_tax), 0),
                'total_collected', COALESCE(SUM(grand_total), 0),
                'payment_methods', COALESCE((SELECT jsonb_agg(ps) FROM payment_summary ps), '[]'::jsonb)
            )
            FROM relevant_transactions
        ),
        'cashier_summary', COALESCE((SELECT jsonb_agg(cs) FROM cashier_summary_calc cs), '[]'::jsonb),
        'transactions', COALESCE((SELECT jsonb_agg(tl) FROM transaction_list tl), '[]'::jsonb)
    )
    INTO v_report;

    RETURN v_report;
END;
$$;
