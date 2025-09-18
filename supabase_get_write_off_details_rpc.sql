-- Supabase RPC Function: get_write_off_details
-- =================================================================
--
--  Tujuan: 
--  Mengambil semua data yang diperlukan untuk halaman detail Berita Acara
--  Barang Rusak/Hilang.
--
--  Instruksi: Jalankan skrip ini di SQL Editor Supabase Anda.
--
-- =================================================================

CREATE OR REPLACE FUNCTION public.get_write_off_details(
    p_write_off_id UUID,
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
            'id', swo.id,
            'write_off_number', swo.write_off_number,
            'notes', swo.notes,
            'created_at', swo.created_at,
            'outlet', jsonb_build_object('id', o.id, 'name', o.name),
            'created_by', p.full_name,
            'items', (
                SELECT jsonb_agg(
                    jsonb_build_object(
                        'id', swoi.id,
                        'quantity', swoi.quantity,
                        'reason', swoi.reason,
                        'variant_id', pv.id,
                        'name', CASE
                            WHEN pr.product_type = 'VARIANT' THEN pr.name || ' - ' || pv.name
                            ELSE pv.name
                        END,
                        'sku', pv.sku
                    )
                )
                FROM public.stock_write_off_items swoi
                JOIN public.product_variants pv ON swoi.product_variant_id = pv.id
                JOIN public.products pr ON pv.product_id = pr.id
                WHERE swoi.stock_write_off_id = swo.id
            )
        )
    INTO result
    FROM
        public.stock_write_offs swo
    JOIN
        public.outlets o ON swo.outlet_id = o.id
    LEFT JOIN
        public.profiles p ON swo.created_by = p.id
    WHERE
        swo.id = p_write_off_id AND swo.organization_id = p_organization_id;

    RETURN result;
END;
$$;
