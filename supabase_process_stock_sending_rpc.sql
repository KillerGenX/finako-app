-- Supabase RPC Function: process_stock_transfer_sending
-- =================================================================
--
--  Tujuan: 
--  Memproses pengiriman sebuah transfer stok. Ini adalah aksi krusial
--  yang mengubah status transfer menjadi 'sent' dan secara fisik
--  mengurangi stok dari inventaris outlet asal.
--
--  Fitur Utama:
--  1.  Transaksi Aman: Semua operasi (update status, cek stok, update stok,
--      dan pencatatan pergerakan) terjadi dalam satu transaksi.
--  2.  Validasi Stok: Memastikan stok di outlet asal mencukupi SEBELUM
--      melakukan pengurangan.
--  3.  Pencatatan Jelas: Membuat entri 'transfer_out' di tabel
--      inventory_stock_movements untuk setiap item.
--
--  Instruksi: Jalankan skrip ini di SQL Editor Supabase Anda.
--
-- =================================================================

CREATE OR REPLACE FUNCTION public.process_stock_transfer_sending(
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
    v_current_stock NUMERIC;
BEGIN
    -- 1. Kunci baris transfer untuk mencegah race conditions dan ambil datanya
    SELECT * INTO v_transfer
    FROM public.stock_transfers
    WHERE id = p_transfer_id AND organization_id = p_organization_id
    FOR UPDATE;

    -- 2. Validasi status
    IF v_transfer IS NULL THEN
        RAISE EXCEPTION 'Transfer tidak ditemukan atau Anda tidak memiliki izin.';
    END IF;
    
    IF v_transfer.status <> 'draft' THEN
        RAISE EXCEPTION 'Hanya transfer dengan status "draft" yang dapat dikirim.';
    END IF;

    -- 3. Loop melalui setiap item untuk memvalidasi stok
    FOR v_item IN
        SELECT sti.product_variant_id, sti.quantity
        FROM public.stock_transfer_items sti
        WHERE sti.stock_transfer_id = p_transfer_id
    LOOP
        -- Cek stok saat ini di outlet asal
        SELECT quantity_on_hand INTO v_current_stock
        FROM public.inventory_stock_levels
        WHERE product_variant_id = v_item.product_variant_id AND outlet_id = v_transfer.outlet_from_id;

        IF v_current_stock IS NULL OR v_current_stock < v_item.quantity THEN
            RAISE EXCEPTION 'Stok tidak mencukupi untuk produk varian ID % di outlet asal.', v_item.product_variant_id;
        END IF;
    END LOOP;

    -- 4. Jika semua stok valid, loop lagi untuk mengurangi stok dan mencatat pergerakan
    FOR v_item IN
        SELECT sti.product_variant_id, sti.quantity
        FROM public.stock_transfer_items sti
        WHERE sti.stock_transfer_id = p_transfer_id
    LOOP
        -- Kurangi stok di inventory_stock_levels
        UPDATE public.inventory_stock_levels
        SET quantity_on_hand = quantity_on_hand - v_item.quantity
        WHERE product_variant_id = v_item.product_variant_id AND outlet_id = v_transfer.outlet_from_id;

        -- Catat pergerakan stok 'transfer_out'
        INSERT INTO public.inventory_stock_movements (organization_id, product_variant_id, outlet_id, quantity_change, movement_type, reference_id)
        VALUES (p_organization_id, v_item.product_variant_id, v_transfer.outlet_from_id, -v_item.quantity, 'transfer_out', p_transfer_id);
    END LOOP;

    -- 5. Update status dan tanggal kirim pada transfer
    UPDATE public.stock_transfers
    SET status = 'sent', sent_at = now()
    WHERE id = p_transfer_id;

END;
$$;
