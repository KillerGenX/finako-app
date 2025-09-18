-- Supabase RPC Functions: Peningkatan untuk Buku Besar Inventaris
-- =================================================================
--
--  Tujuan: 
--  Menyediakan semua fungsi backend yang diperlukan untuk halaman
--  detail inventaris ("Buku Besar Stok") yang baru dan canggih.
--
--  Berisi 2 RPC:
--  1. set_initial_stock: Untuk mengatur saldo stok awal.
--  2. get_inventory_ledger_details: Untuk mengambil riwayat pergerakan
--     lengkap, data grafik, dan ringkasan stok.
--
--  Instruksi: Jalankan skrip ini di SQL Editor Supabase Anda.
--
-- =================================================================

-- 1. RPC untuk Mengatur Stok Awal
-- =================================================================

-- Tipe data untuk input stok awal
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'initial_stock_input') THEN
        CREATE TYPE public.initial_stock_input AS (
            outlet_id UUID,
            quantity NUMERIC
        );
    END IF;
END$$;

CREATE OR REPLACE FUNCTION public.set_initial_stock(
    p_organization_id UUID,
    p_variant_id UUID,
    p_initial_stocks public.initial_stock_input[]
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_input public.initial_stock_input;
    v_existing_stock_count INT;
BEGIN
    -- Validasi: Pastikan belum ada stok sama sekali untuk varian ini
    SELECT count(*) INTO v_existing_stock_count
    FROM public.inventory_stock_levels
    WHERE product_variant_id = p_variant_id AND organization_id = p_organization_id;

    IF v_existing_stock_count > 0 THEN
        RAISE EXCEPTION 'Stok awal hanya dapat diatur jika produk belum memiliki catatan stok sama sekali.';
    END IF;

    -- Loop melalui input dan buat catatan stok awal
    FOREACH v_input IN ARRAY p_initial_stocks
    LOOP
        IF v_input.quantity > 0 THEN
            -- Buat level stok
            INSERT INTO public.inventory_stock_levels (organization_id, product_variant_id, outlet_id, quantity_on_hand, updated_at)
            VALUES (p_organization_id, p_variant_id, v_input.outlet_id, v_input.quantity, now());

            -- Catat pergerakan
            INSERT INTO public.inventory_stock_movements (organization_id, product_variant_id, outlet_id, quantity_change, movement_type, notes)
            VALUES (p_organization_id, p_variant_id, v_input.outlet_id, v_input.quantity, 'initial_stock', 'Saldo Stok Awal');
        END IF;
    END LOOP;
END;
$$;


-- 2. RPC untuk Mengambil Detail Buku Besar Stok
-- =================================================================
CREATE OR REPLACE FUNCTION public.get_inventory_ledger_details(
    p_variant_id UUID,
    p_organization_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_summary JSONB;
    v_chart_data JSONB;
    v_ledger_data JSONB;
BEGIN
    -- 1. Ambil Ringkasan Stok Saat Ini
    SELECT jsonb_build_object(
        'total_stock', COALESCE(SUM(quantity_on_hand), 0),
        'stock_by_outlet', COALESCE(jsonb_agg(
            jsonb_build_object('outlet_name', o.name, 'quantity', isl.quantity_on_hand)
        ), '[]'::jsonb)
    )
    INTO v_summary
    FROM public.inventory_stock_levels isl
    JOIN public.outlets o ON isl.outlet_id = o.id
    WHERE isl.product_variant_id = p_variant_id AND isl.organization_id = p_organization_id;

    -- 2. Ambil Data untuk Grafik (saldo stok harian selama 30 hari terakhir)
    WITH date_series AS (
        SELECT generate_series(
            (now() - interval '29 days')::date,
            now()::date,
            '1 day'::interval
        )::date AS day
    ), daily_changes AS (
        SELECT 
            created_at::date as day,
            SUM(quantity_change) as change
        FROM public.inventory_stock_movements
        WHERE product_variant_id = p_variant_id AND created_at >= (now() - interval '29 days')
        GROUP BY 1
    ), daily_balances AS (
        SELECT
            d.day,
            SUM(dc.change) OVER (ORDER BY d.day) AS running_total
        FROM date_series d
        LEFT JOIN daily_changes dc ON d.day = dc.day
    )
    SELECT jsonb_agg(
        jsonb_build_object('date', day, 'stock', running_total) ORDER BY day
    )
    INTO v_chart_data
    FROM daily_balances;

    -- 3. Ambil Riwayat Pergerakan Stok (Buku Besar)
    SELECT COALESCE(jsonb_agg(sub.* ORDER BY sub.created_at DESC), '[]'::jsonb)
    INTO v_ledger_data
    FROM (
        SELECT
            ism.created_at,
            o.name as outlet_name,
            ism.movement_type,
            ism.quantity_change,
            -- Dapatkan nomor referensi dari berbagai sumber
            COALESCE(
                t.transaction_number,
                st.transfer_number,
                po.po_number,
                so.opname_number,
                swo.write_off_number,
                orec.receiving_number
            ) as reference_number,
            ism.reference_id,
            ism.notes
        FROM public.inventory_stock_movements ism
        JOIN public.outlets o ON ism.outlet_id = o.id
        LEFT JOIN public.transactions t ON ism.reference_id = t.id AND ism.movement_type = 'sale'
        LEFT JOIN public.stock_transfers st ON ism.reference_id = st.id AND ism.movement_type IN ('transfer_in', 'transfer_out')
        LEFT JOIN public.purchase_orders po ON ism.reference_id = po.id AND ism.movement_type = 'purchase_received'
        LEFT JOIN public.stock_opnames so ON ism.reference_id = so.id AND ism.movement_type = 'adjustment'
        LEFT JOIN public.stock_write_offs swo ON ism.reference_id = swo.id AND ism.movement_type = 'adjustment'
        LEFT JOIN public.other_receivings orec ON ism.reference_id = orec.id AND ism.movement_type = 'purchase_received'
        WHERE ism.product_variant_id = p_variant_id
    ) as sub;

    -- 4. Gabungkan semua hasil
    RETURN jsonb_build_object(
        'summary', v_summary,
        'chart_data', v_chart_data,
        'ledger', v_ledger_data
    );
END;
$$;
