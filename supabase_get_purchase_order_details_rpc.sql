-- Supabase RPC Function: get_purchase_order_details
-- =================================================================
--
--  Tujuan: 
--  Mengambil semua data yang diperlukan untuk halaman detail Purchase Order.
--
--  Instruksi: Jalankan skrip ini di SQL Editor Supabase Anda.
--
-- =================================================================

CREATE OR REPLACE FUNCTION public.get_purchase_order_details(
    p_po_id UUID,
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
            'id', po.id,
            'po_number', po.po_number,
            'status', po.status,
            'notes', po.notes,
            'order_date', po.order_date,
            'expected_delivery_date', po.expected_delivery_date,
            'created_at', po.created_at,
            'supplier', jsonb_build_object('id', s.id, 'name', s.name),
            'outlet', jsonb_build_object('id', o.id, 'name', o.name),
            'created_by', p.full_name,
            'items', (
                SELECT jsonb_agg(
                    jsonb_build_object(
                        'id', poi.id,
                        'quantity', poi.quantity,
                        'unit_cost', poi.unit_cost,
                        'received_quantity', poi.received_quantity,
                        'variant_id', pv.id,
                        'name', CASE
                            WHEN pr.product_type = 'VARIANT' THEN pr.name || ' - ' || pv.name
                            ELSE pv.name
                        END,
                        'sku', pv.sku
                    )
                )
                FROM public.purchase_order_items poi
                JOIN public.product_variants pv ON poi.product_variant_id = pv.id
                JOIN public.products pr ON pv.product_id = pr.id
                WHERE poi.purchase_order_id = po.id
            )
        )
    INTO result
    FROM
        public.purchase_orders po
    JOIN
        public.suppliers s ON po.supplier_id = s.id
    JOIN
        public.outlets o ON po.outlet_id = o.id
    LEFT JOIN
        public.profiles p ON po.created_by = p.id
    WHERE
        po.id = p_po_id AND po.organization_id = p_organization_id;

    RETURN result;
END;
$$;
