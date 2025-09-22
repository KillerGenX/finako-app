-- Supabase RPC Function: get_transaction_details (Pembaruan v2 - Lengkap)
-- =================================================================
--
--  Tujuan: 
--  Memperbarui fungsi untuk menyertakan `tendered_amount` dari
--  tabel `payments` dalam output JSON.
--
--  Pembaruan:
--  -   Subquery 'payments' sekarang juga mengambil `tendered_amount`.
--
--  Instruksi: Jalankan skrip ini untuk MENGGANTI fungsi yang ada.
--
-- =================================================================

CREATE OR REPLACE FUNCTION public.get_transaction_details(
    p_transaction_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result JSONB;
BEGIN
    SELECT
        jsonb_build_object(
            'transaction_number', t.transaction_number,
            'transaction_date', t.transaction_date,
            'subtotal', t.subtotal,
            'total_discount', t.total_discount,
            'total_tax', t.total_tax,
            'grand_total', t.grand_total,
            'notes', t.notes,
            'outlet_name', o.name,
            'cashier_name', prof.full_name,
            'customer_name', cust.name,
            'items', (
                SELECT jsonb_agg(
                    jsonb_build_object(
                        'product_name', CASE
                            WHEN p.product_type = 'VARIANT' THEN p.name || ' - ' || pv.name
                            ELSE pv.name
                        END,
                        'quantity', ti.quantity,
                        'unit_price', ti.unit_price,
                        'line_total', ti.line_total,
                        'discount_amount', ti.discount_amount
                    )
                )
                FROM public.transaction_items ti
                JOIN public.product_variants pv ON ti.product_variant_id = pv.id
                JOIN public.products p ON pv.product_id = p.id
                WHERE ti.transaction_id = t.id
            ),
            'payments', (
                SELECT jsonb_agg(
                    jsonb_build_object(
                        'payment_method', pay.payment_method,
                        'amount', pay.amount,
                        'tendered_amount', pay.tendered_amount
                    )
                )
                FROM public.payments pay
                WHERE pay.transaction_id = t.id
            )
        )
    INTO result
    FROM
        public.transactions t
    JOIN
        public.outlets o ON t.outlet_id = o.id
    JOIN
        public.organization_members om ON t.member_id = om.id
    JOIN
        public.profiles prof ON om.user_id = prof.id
    LEFT JOIN
        public.customers cust ON t.customer_id = cust.id
    WHERE
        t.id = p_transaction_id;

    RETURN result;
END;
$$;
