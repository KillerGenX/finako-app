-- Supabase RPC Function: get_other_receiving_details
-- =================================================================
--
--  Tujuan: 
--  Mengambil semua data yang diperlukan untuk halaman detail Penerimaan Lainnya.
--
--  Instruksi: Jalankan skrip ini di SQL Editor Supabase Anda.
--
-- =================================================================

CREATE OR REPLACE FUNCTION public.get_other_receiving_details(
    p_receiving_id UUID,
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
            'id', orec.id,
            'receiving_number', orec.receiving_number,
            'notes', orec.notes,
            'created_at', orec.created_at,
            'outlet', jsonb_build_object('id', o.id, 'name', o.name),
            'created_by', p.full_name,
            'items', (
                SELECT jsonb_agg(
                    jsonb_build_object(
                        'id', ori.id,
                        'quantity', ori.quantity,
                        'notes', ori.notes,
                        'variant_id', pv.id,
                        'name', CASE
                            WHEN pr.product_type = 'VARIANT' THEN pr.name || ' - ' || pv.name
                            ELSE pv.name
                        END,
                        'sku', pv.sku
                    )
                )
                FROM public.other_receiving_items ori
                JOIN public.product_variants pv ON ori.product_variant_id = pv.id
                JOIN public.products pr ON pv.product_id = pr.id
                WHERE ori.other_receiving_id = orec.id
            )
        )
    INTO result
    FROM
        public.other_receivings orec
    JOIN
        public.outlets o ON orec.outlet_id = o.id
    LEFT JOIN
        public.profiles p ON orec.created_by = p.id
    WHERE
        orec.id = p_receiving_id AND orec.organization_id = p_organization_id;

    RETURN result;
END;
$$;
