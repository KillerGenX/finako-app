-- Supabase RPC Function: process_purchase_order_reception
-- =================================================================
--
--  Tujuan: 
--  Memproses penerimaan barang dari sebuah Purchase Order. Ini adalah
--  aksi utama yang secara fisik menambah stok ke dalam inventaris.
--
--  Fitur Utama:
--  1.  Transaksi Aman: Semua operasi terjadi dalam satu transaksi atomik.
--  2.  Penerimaan Parsial: Mendukung penerimaan barang sebagian.
--  3.  Pembaruan Status Otomatis: Secara otomatis mengubah status PO menjadi
--      'partially_received' atau 'completed'.
--  4.  Pencatatan Jelas: Membuat entri 'purchase_received' di buku besar stok.
--
--  Instruksi: Jalankan skrip ini di SQL Editor Supabase Anda.
--
-- =================================================================

-- 1. Buat Tipe data custom untuk item yang diterima
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'po_received_item_type') THEN
        CREATE TYPE public.po_received_item_type AS (
            po_item_id UUID,
            quantity_received NUMERIC
        );
    END IF;
END$$;


-- 2. Buat Fungsi RPC utama
CREATE OR REPLACE FUNCTION public.process_purchase_order_reception(
    p_po_id UUID,
    p_organization_id UUID,
    p_received_items public.po_received_item_type[]
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_po RECORD;
    v_item RECORD;
    v_total_ordered NUMERIC;
    v_total_previously_received NUMERIC;
    v_total_now_received NUMERIC := 0;
BEGIN
    -- 1. Kunci baris PO dan validasi
    SELECT * INTO v_po
    FROM public.purchase_orders
    WHERE id = p_po_id AND organization_id = p_organization_id
    FOR UPDATE;

    IF v_po IS NULL THEN RAISE EXCEPTION 'PO tidak ditemukan.'; END IF;
    IF v_po.status NOT IN ('ordered', 'partially_received') THEN RAISE EXCEPTION 'Hanya PO dengan status "ordered" atau "partially_received" yang bisa diterima.'; END IF;

    -- 2. Loop melalui item yang diterima untuk validasi dan update
    FOR v_item IN SELECT * FROM UNNEST(p_received_items)
    LOOP
        -- Update kuantitas diterima pada item PO
        UPDATE public.purchase_order_items
        SET received_quantity = received_quantity + v_item.quantity_received
        WHERE id = v_item.po_item_id AND purchase_order_id = p_po_id;

        -- Dapatkan product_variant_id untuk item ini
        DECLARE
            v_variant_id UUID;
        BEGIN
            SELECT product_variant_id INTO v_variant_id FROM public.purchase_order_items WHERE id = v_item.po_item_id;
            
            -- Tambah/update stok di inventory_stock_levels (UPSERT)
            INSERT INTO public.inventory_stock_levels (organization_id, product_variant_id, outlet_id, quantity_on_hand, updated_at)
            VALUES (p_organization_id, v_variant_id, v_po.outlet_id, v_item.quantity_received, now())
            ON CONFLICT (product_variant_id, outlet_id)
            DO UPDATE SET
                quantity_on_hand = inventory_stock_levels.quantity_on_hand + v_item.quantity_received,
                updated_at = now();

            -- Catat pergerakan stok
            INSERT INTO public.inventory_stock_movements (organization_id, product_variant_id, outlet_id, quantity_change, movement_type, reference_id)
            VALUES (p_organization_id, v_variant_id, v_po.outlet_id, v_item.quantity_received, 'purchase_received', p_po_id);
        END;
    END LOOP;

    -- 3. Hitung total kuantitas untuk menentukan status PO baru
    SELECT SUM(quantity), SUM(received_quantity)
    INTO v_total_ordered, v_total_previously_received
    FROM public.purchase_order_items
    WHERE purchase_order_id = p_po_id;
    
    FOR v_item IN SELECT * FROM UNNEST(p_received_items) LOOP
        v_total_now_received := v_total_now_received + v_item.quantity_received;
    END LOOP;

    -- 4. Update status PO
    IF (v_total_previously_received + v_total_now_received) >= v_total_ordered THEN
        UPDATE public.purchase_orders SET status = 'completed' WHERE id = p_po_id;
    ELSE
        UPDATE public.purchase_orders SET status = 'partially_received' WHERE id = p_po_id;
    END IF;

END;
$$;
