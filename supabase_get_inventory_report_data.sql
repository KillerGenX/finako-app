-- Supabase RPC Function for Comprehensive Inventory Reporting
-- =================================================================
--
--  Tujuan: 
--  Membuat fungsi `get_inventory_report_data` yang mengagregasi data kunci
--  inventaris untuk beberapa tab di Laporan Inventaris.
--
--  Data yang Disediakan:
--  1. Ringkasan: Nilai total inventaris, jumlah SKU, total kerugian, item stok rendah.
--  2. Valuasi per Kategori: Agregat nilai inventaris per kategori produk.
--  3. Daftar Transfer Stok: Riwayat surat jalan.
--  4. Daftar Stok Opname: Riwayat sesi opname.
--  5. Daftar Barang Rusak: Riwayat dokumen write-off.
--
-- =================================================================

CREATE OR REPLACE FUNCTION get_inventory_report_data(
    p_organization_id UUID,
    p_start_date TIMESTAMPTZ,
    p_end_date TIMESTAMPTZ,
    p_outlet_id UUID DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
AS $$
DECLARE
    result JSON;
BEGIN
    WITH 
    -- Agregasi Nilai Inventaris
    inventory_valuation AS (
        SELECT
            pc.name AS category_name,
            SUM(isl.quantity_on_hand * pv.cost_price) AS total_value,
            COUNT(DISTINCT pv.id) FILTER (WHERE isl.quantity_on_hand > 0) AS sku_count
        FROM public.inventory_stock_levels isl
        JOIN public.product_variants pv ON isl.product_variant_id = pv.id
        LEFT JOIN public.products p ON pv.product_id = p.id
        LEFT JOIN public.product_categories pc ON p.category_id = pc.id
        WHERE
            isl.organization_id = p_organization_id
            AND (p_outlet_id IS NULL OR isl.outlet_id = p_outlet_id)
        GROUP BY pc.name
    ),
    -- Agregasi Kerugian dari Barang Rusak
    write_off_losses AS (
        SELECT
            SUM(swi.quantity * pv.cost_price) AS total_loss
        FROM public.stock_write_offs swo
        JOIN public.stock_write_off_items swi ON swo.id = swi.stock_write_off_id
        JOIN public.product_variants pv ON swi.product_variant_id = pv.id
        WHERE
            swo.organization_id = p_organization_id
            AND swo.created_at BETWEEN p_start_date AND p_end_date
            AND (p_outlet_id IS NULL OR swo.outlet_id = p_outlet_id)
    ),
    -- Hitung Item Stok Rendah
    low_stock_items AS (
        SELECT
            COUNT(DISTINCT isl.product_variant_id) AS low_stock_count
        FROM public.inventory_stock_levels isl
        JOIN public.product_variants pv ON isl.product_variant_id = pv.id
        WHERE
            isl.organization_id = p_organization_id
            AND pv.track_stock = true
            AND pv.reorder_point > 0
            AND isl.quantity_on_hand < pv.reorder_point
            AND (p_outlet_id IS NULL OR isl.outlet_id = p_outlet_id)
    )
    -- Bangun Objek JSON
    SELECT json_build_object(
        'summary', (
            SELECT json_build_object(
                'total_inventory_value', COALESCE((SELECT SUM(total_value) FROM inventory_valuation), 0),
                'active_sku_count', COALESCE((SELECT SUM(sku_count) FROM inventory_valuation), 0),
                'potential_loss', COALESCE((SELECT total_loss FROM write_off_losses), 0),
                'low_stock_item_count', COALESCE((SELECT low_stock_count FROM low_stock_items), 0)
            )
        ),
        'valuation_by_category', (
            SELECT COALESCE(json_agg(
                json_build_object(
                    'category_name', COALESCE(category_name, 'Tanpa Kategori'),
                    'total_value', total_value
                )
            ), '[]')
            FROM inventory_valuation
        ),
        'transfers', (
            SELECT COALESCE(json_agg(
                json_build_object(
                    'id', st.id,
                    'sent_at', st.sent_at,
                    'transfer_number', st.transfer_number,
                    'outlet_from', ofrom.name,
                    'outlet_to', oto.name,
                    'status', st.status
                ) ORDER BY st.created_at DESC
            ), '[]')
            FROM public.stock_transfers st
            JOIN public.outlets ofrom ON st.outlet_from_id = ofrom.id
            JOIN public.outlets oto ON st.outlet_to_id = oto.id
            WHERE st.organization_id = p_organization_id
            AND st.created_at BETWEEN p_start_date AND p_end_date
            AND (p_outlet_id IS NULL OR (st.outlet_from_id = p_outlet_id OR st.outlet_to_id = p_outlet_id))
        ),
        'opnames', (
             SELECT COALESCE(json_agg(
                json_build_object(
                    'id', so.id,
                    'completed_at', so.completed_at,
                    'opname_number', so.opname_number,
                    'outlet_name', o.name,
                    'status', so.status
                ) ORDER BY so.created_at DESC
            ), '[]')
            FROM public.stock_opnames so
            JOIN public.outlets o ON so.outlet_id = o.id
            WHERE so.organization_id = p_organization_id
            AND so.created_at BETWEEN p_start_date AND p_end_date
            AND (p_outlet_id IS NULL OR so.outlet_id = p_outlet_id)
        ),
        'write_offs', (
            SELECT COALESCE(json_agg(
                json_build_object(
                    'id', swo.id,
                    'created_at', swo.created_at,
                    'write_off_number', swo.write_off_number,
                    'outlet_name', o.name,
                    'notes', swo.notes
                ) ORDER BY swo.created_at DESC
            ), '[]')
            FROM public.stock_write_offs swo
            JOIN public.outlets o ON swo.outlet_id = o.id
            WHERE swo.organization_id = p_organization_id
            AND swo.created_at BETWEEN p_start_date AND p_end_date
            AND (p_outlet_id IS NULL OR swo.outlet_id = p_outlet_id)
        )
    ) INTO result;

    RETURN result;
END;
$$;
