-- Supabase RPC Function for Inventory Ledger FOR REPORTING (v2 - Grouped by Outlet)
-- =================================================================
--
--  Tujuan: 
--  Membuat fungsi `get_report_inventory_ledger` yang didedikasikan
--  untuk mengambil data Kartu Stok di halaman Laporan Inventaris.
--
--  Revisi v2:
--  - Mengubah struktur output JSON. Sekarang mengembalikan sebuah array,
--    di mana setiap elemen adalah objek yang mewakili satu outlet.
--  - Setiap objek outlet berisi ringkasan stoknya sendiri DAN
--    array riwayat pergerakan yang spesifik untuk outlet tersebut.
--  - Ini membuat data jauh lebih mudah ditampilkan di frontend.
--
-- =================================================================

CREATE OR REPLACE FUNCTION get_report_inventory_ledger(
    p_organization_id UUID,
    p_variant_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
AS $$
DECLARE
    result JSON;
BEGIN
    WITH 
    -- 1. Dapatkan semua pergerakan untuk varian ini
    movements AS (
        SELECT
            ism.created_at,
            ism.outlet_id,
            ism.movement_type,
            ism.quantity_change,
            ism.notes,
            CASE 
                WHEN ism.movement_type = 'sale' THEN (SELECT t.transaction_number FROM public.transactions t WHERE t.id = ism.reference_id)
                WHEN ism.movement_type = 'purchase_received' THEN (SELECT po.po_number FROM public.purchase_orders po WHERE po.id = ism.reference_id)
                WHEN ism.movement_type IN ('transfer_out', 'transfer_in') THEN (SELECT st.transfer_number FROM public.stock_transfers st WHERE st.id = ism.reference_id)
                WHEN ism.movement_type = 'adjustment' THEN (SELECT so.opname_number FROM public.stock_opnames so WHERE so.id = ism.reference_id)
                ELSE ism.reference_id::text
            END as reference_number,
            SUM(ism.quantity_change) OVER (PARTITION BY ism.outlet_id ORDER BY ism.created_at, ism.id) as balance
        FROM 
            public.inventory_stock_movements ism
        WHERE
            ism.organization_id = p_organization_id
            AND ism.product_variant_id = p_variant_id
    ),
    -- 2. Agregasi pergerakan ke dalam JSON array untuk setiap outlet
    movements_agg AS (
        SELECT
            m.outlet_id,
            json_agg(
                json_build_object(
                    'created_at', m.created_at,
                    'movement_type', m.movement_type,
                    'reference_number', m.reference_number,
                    'quantity_change', m.quantity_change,
                    'balance', m.balance,
                    'notes', m.notes
                ) ORDER BY m.created_at DESC
            ) as movements
        FROM movements m
        GROUP BY m.outlet_id
    ),
    -- 3. Dapatkan ringkasan stok saat ini per outlet dan gabungkan dengan pergerakan
    outlet_data AS (
        SELECT 
            isl.outlet_id,
            o.name as outlet_name,
            isl.quantity_on_hand,
            (isl.quantity_on_hand * pv.cost_price) as total_value,
            COALESCE(ma.movements, '[]'::json) as movements
        FROM 
            public.inventory_stock_levels isl
        JOIN 
            public.product_variants pv ON isl.product_variant_id = pv.id
        JOIN
            public.outlets o ON isl.outlet_id = o.id
        LEFT JOIN
            movements_agg ma ON isl.outlet_id = ma.outlet_id
        WHERE
            isl.organization_id = p_organization_id
            AND isl.product_variant_id = p_variant_id
            AND isl.quantity_on_hand > 0 -- Hanya tampilkan outlet yang ada stoknya
    )
    -- 4. Gabungkan semua data outlet menjadi satu JSON array
    SELECT COALESCE(json_agg(od), '[]')
    INTO result
    FROM outlet_data od;

    RETURN result;
END;
$$;
