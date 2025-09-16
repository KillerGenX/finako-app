-- Supabase RPC Function: get_stock_transfer_details
-- =================================================================
--
--  Tujuan: 
--  Mengambil semua data yang diperlukan untuk halaman detail Surat Jalan.
--
--  Fitur Utama:
--  1.  Data Komprehensif: Menggabungkan data dari 5 tabel (stock_transfers,
--      outlets, profiles, stock_transfer_items, product_variants, products).
--  2.  Format JSON: Mengembalikan satu objek JSON yang siap digunakan.
--
--  Instruksi: Jalankan skrip ini di SQL Editor Supabase Anda.
--
-- =================================================================

CREATE OR REPLACE FUNCTION public.get_stock_transfer_details(
    p_transfer_id UUID,
    p_organization_id UUID
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
            'id', st.id,
            'transfer_number', st.transfer_number,
            'status', st.status,
            'notes', st.notes,
            'created_at', st.created_at,
            'sent_at', st.sent_at,
            'received_at', st.received_at,
            'outlet_from', jsonb_build_object('id', o_from.id, 'name', o_from.name),
            'outlet_to', jsonb_build_object('id', o_to.id, 'name', o_to.name),
            'created_by', p.full_name,
            'items', (
                SELECT jsonb_agg(
                    jsonb_build_object(
                        'id', sti.id,
                        'quantity', sti.quantity,
                        'variant_id', pv.id,
                        'name', CASE
                            WHEN pr.product_type = 'VARIANT' THEN pr.name || ' - ' || pv.name
                            ELSE pv.name
                        END,
                        'sku', pv.sku
                    )
                )
                FROM public.stock_transfer_items sti
                JOIN public.product_variants pv ON sti.product_variant_id = pv.id
                JOIN public.products pr ON pv.product_id = pr.id
                WHERE sti.stock_transfer_id = st.id
            )
        )
    INTO result
    FROM
        public.stock_transfers st
    JOIN
        public.outlets o_from ON st.outlet_from_id = o_from.id
    JOIN
        public.outlets o_to ON st.outlet_to_id = o_to.id
    LEFT JOIN
        public.profiles p ON st.created_by = p.id
    WHERE
        st.id = p_transfer_id AND st.organization_id = p_organization_id;

    RETURN result;
END;
$$;
