-- Supabase RPC Function: get_stock_opname_details
-- =================================================================
--
--  Tujuan: 
--  Mengambil semua data yang diperlukan untuk halaman detail Stok Opname.
--
--  Instruksi: Jalankan skrip ini di SQL Editor Supabase Anda.
--
-- =================================================================

CREATE OR REPLACE FUNCTION public.get_stock_opname_details(
    p_opname_id UUID,
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
            'id', so.id,
            'opname_number', so.opname_number,
            'status', so.status,
            'notes', so.notes,
            'created_at', so.created_at,
            'completed_at', so.completed_at,
            'outlet', jsonb_build_object('id', o.id, 'name', o.name),
            'created_by', p.full_name,
            'items', (
                SELECT COALESCE(jsonb_agg(
                    jsonb_build_object(
                        'id', soi.id,
                        'system_quantity', soi.system_quantity,
                        'physical_quantity', soi.physical_quantity,
                        'difference', soi.difference,
                        'variant_id', pv.id,
                        'name', CASE
                            WHEN pr.product_type = 'VARIANT' THEN pr.name || ' - ' || pv.name
                            ELSE pv.name
                        END,
                        'sku', pv.sku
                    ) ORDER BY (CASE WHEN pr.product_type = 'VARIANT' THEN pr.name || ' - ' || pv.name ELSE pv.name END)
                ), '[]'::jsonb)
                FROM public.stock_opname_items soi
                JOIN public.product_variants pv ON soi.product_variant_id = pv.id
                JOIN public.products pr ON pv.product_id = pr.id
                WHERE soi.stock_opname_id = so.id
            )
        )
    INTO result
    FROM
        public.stock_opnames so
    JOIN
        public.outlets o ON so.outlet_id = o.id
    LEFT JOIN
        public.profiles p ON so.created_by = p.id
    WHERE
        so.id = p_opname_id AND so.organization_id = p_organization_id;

    RETURN result;
END;
$$;
