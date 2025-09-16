-- Supabase RPC Function: process_stock_transfer_reception
-- =================================================================
--
--  Tujuan: 
--  Memproses penerimaan sebuah transfer stok. Ini adalah langkah akhir
--  yang mengubah status transfer menjadi 'received' dan menambahkan
--  stok ke inventaris outlet tujuan.
--
--  Fitur Utama:
--  1.  Transaksi Aman: Semua operasi terjadi dalam satu transaksi.
--  2.  Idempotent: Jika stok sudah ada, fungsi ini akan menambahkannya
--      (upsert), membuatnya aman dijalankan.
--  3.  Pencatatan Jelas: Membuat entri 'transfer_in' di
--      inventory_stock_movements.
--
--  Instruksi: Jalankan skrip ini di SQL Editor Supabase Anda.
--
-- =================================================================

CREATE OR REPLACE FUNCTION public.process_stock_transfer_reception(
    p_transfer_id UUID,
    p_organization_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_transfer RECORD;
    v_item RECORD;
BEGIN
    -- 1. Kunci baris transfer dan ambil datanya
    SELECT * INTO v_transfer
    FROM public.stock_transfers
    WHERE id = p_transfer_id AND organization_id = p_organization_id
    FOR UPDATE;

    -- 2. Validasi status
    IF v_transfer IS NULL THEN
        RAISE EXCEPTION 'Transfer tidak ditemukan atau Anda tidak memiliki izin.';
    END IF;
    
    IF v_transfer.status <> 'sent' THEN
        RAISE EXCEPTION 'Hanya transfer dengan status "sent" yang dapat diterima.';
    END IF;

    -- 3. Loop melalui setiap item untuk menambah stok dan mencatat pergerakan
    FOR v_item IN
        SELECT sti.product_variant_id, sti.quantity
        FROM public.stock_transfer_items sti
        WHERE sti.stock_transfer_id = p_transfer_id
    LOOP
        -- Tambah/update stok di inventory_stock_levels (UPSERT)
        INSERT INTO public.inventory_stock_levels (organization_id, product_variant_id, outlet_id, quantity_on_hand, updated_at)
        VALUES (p_organization_id, v_item.product_variant_id, v_transfer.outlet_to_id, v_item.quantity, now())
        ON CONFLICT (product_variant_id, outlet_id)
        DO UPDATE SET
            quantity_on_hand = inventory_stock_levels.quantity_on_hand + v_item.quantity,
            updated_at = now();

        -- Catat pergerakan stok 'transfer_in'
        INSERT INTO public.inventory_stock_movements (organization_id, product_variant_id, outlet_id, quantity_change, movement_type, reference_id)
        VALUES (p_organization_id, v_item.product_variant_id, v_transfer.outlet_to_id, v_item.quantity, 'transfer_in', p_transfer_id);
    END LOOP;

    -- 4. Update status dan tanggal terima pada transfer
    UPDATE public.stock_transfers
    SET status = 'received', received_at = now()
    WHERE id = p_transfer_id;

END;
$$;
