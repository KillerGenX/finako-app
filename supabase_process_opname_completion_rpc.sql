-- Supabase RPC Function: process_stock_opname_completion
-- =================================================================
--
--  Tujuan: 
--  Menyelesaikan sesi Stok Opname. Fungsi ini menghitung selisih
--  dan membuat penyesuaian stok yang sesuai di buku besar inventaris.
--
--  Fitur Utama:
--  1.  Transaksi Aman: Semua penyesuaian stok terjadi dalam satu transaksi.
--  2.  Perhitungan Selisih: Secara otomatis menghitung perbedaan antara
--      stok sistem dan stok fisik yang diinput.
--  3.  Pencatatan Jelas: Membuat entri 'adjustment' di
--      inventory_stock_movements untuk setiap item yang memiliki selisih.
--
--  Instruksi: Jalankan skrip ini di SQL Editor Supabase Anda.
--
-- =================================================================

CREATE OR REPLACE FUNCTION public.process_stock_opname_completion(
    p_opname_id UUID,
    p_organization_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_opname RECORD;
    v_item RECORD;
BEGIN
    -- 1. Kunci baris opname dan validasi
    SELECT * INTO v_opname
    FROM public.stock_opnames
    WHERE id = p_opname_id AND organization_id = p_organization_id
    FOR UPDATE;

    IF v_opname IS NULL THEN RAISE EXCEPTION 'Stok opname tidak ditemukan.'; END IF;
    IF v_opname.status <> 'counting' THEN RAISE EXCEPTION 'Hanya opname dengan status "counting" yang dapat diselesaikan.'; END IF;

    -- 2. Loop melalui setiap item opname yang memiliki selisih
    FOR v_item IN
        SELECT *
        FROM public.stock_opname_items
        WHERE stock_opname_id = p_opname_id AND difference <> 0 AND physical_quantity IS NOT NULL
    LOOP
        -- Buat penyesuaian di inventory_stock_levels
        -- Menggunakan UPSERT untuk menangani kasus jika produk belum pernah ada di outlet itu
        INSERT INTO public.inventory_stock_levels (organization_id, product_variant_id, outlet_id, quantity_on_hand, updated_at)
        VALUES (p_organization_id, v_item.product_variant_id, v_opname.outlet_id, v_item.difference, now())
        ON CONFLICT (product_variant_id, outlet_id)
        DO UPDATE SET
            quantity_on_hand = inventory_stock_levels.quantity_on_hand + v_item.difference,
            updated_at = now();

        -- Catat pergerakan stok
        INSERT INTO public.inventory_stock_movements (organization_id, product_variant_id, outlet_id, quantity_change, movement_type, reference_id, notes)
        VALUES (p_organization_id, v_item.product_variant_id, v_opname.outlet_id, v_item.difference, 'adjustment', p_opname_id, 'Stok Opname #' || v_opname.opname_number);
    END LOOP;

    -- 3. Update status dan tanggal selesai pada opname
    UPDATE public.stock_opnames
    SET status = 'completed', completed_at = now()
    WHERE id = p_opname_id;

END;
$$;
