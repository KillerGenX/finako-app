-- Supabase RPC Function: process_purchase_order_reception
-- =================================================================
--
--  Tujuan: 
--  Memproses penerimaan barang dari sebuah Purchase Order. Ini adalah
--  aksi utama yang secara fisik menambah stok ke dalam inventaris.
--
--  Pembaruan (Fase 17):
--  -   Menambahkan perhitungan HPP Otomatis (Weighted Average Cost) setiap
--      kali barang diterima, untuk memastikan valuasi inventaris akurat.
--
--  Fitur Utama:
--  1.  Transaksi Aman: Semua operasi terjadi dalam satu transaksi atomik.
--  2.  HPP Otomatis: Menghitung ulang dan memperbarui `cost_price` produk.
--  3.  Penerimaan Parsial: Mendukung penerimaan barang sebagian.
--  4.  Pembaruan Status Otomatis: Mengubah status PO menjadi 'partially_received'
--      atau 'completed'.
--  5.  Pencatatan Jelas: Membuat entri 'purchase_received' di buku besar stok.
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
    v_po_item_details RECORD;
    v_total_ordered NUMERIC;
    v_total_previously_received NUMERIC;
    v_total_now_received NUMERIC := 0;
    
    -- Variabel untuk perhitungan HPP
    v_current_stock NUMERIC;
    v_current_cost_price NUMERIC;
    v_new_cost_price NUMERIC;
    
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
        -- Dapatkan detail item PO, termasuk product_variant_id dan harga beli (unit_cost)
        SELECT product_variant_id, unit_cost 
        INTO v_po_item_details
        FROM public.purchase_order_items 
        WHERE id = v_item.po_item_id;

        -- === PERHITUNGAN HPP (Weighted Average) START ===
        
        -- Dapatkan stok dan HPP saat ini untuk varian produk, kunci baris untuk update
        SELECT COALESCE(isl.quantity_on_hand, 0), pv.cost_price 
        INTO v_current_stock, v_current_cost_price
        FROM public.product_variants pv
        LEFT JOIN public.inventory_stock_levels isl 
            ON pv.id = isl.product_variant_id AND isl.outlet_id = v_po.outlet_id
        WHERE pv.id = v_po_item_details.product_variant_id
        FOR UPDATE OF pv;

        -- Hitung HPP baru
        IF (v_current_stock + v_item.quantity_received) > 0 THEN
            v_new_cost_price := 
                ((v_current_stock * v_current_cost_price) + (v_item.quantity_received * v_po_item_details.unit_cost)) 
                / (v_current_stock + v_item.quantity_received);
        ELSE
            -- Jika total stok menjadi 0 atau negatif (kasus aneh), HPP baru sama dengan harga beli terakhir
            v_new_cost_price := v_po_item_details.unit_cost;
        END IF;

        -- Update HPP di tabel product_variants
        UPDATE public.product_variants
        SET cost_price = v_new_cost_price, updated_at = now()
        WHERE id = v_po_item_details.product_variant_id;
        
        -- === PERHITUNGAN HPP (Weighted Average) END ===

        -- Update kuantitas diterima pada item PO
        UPDATE public.purchase_order_items
        SET received_quantity = received_quantity + v_item.quantity_received
        WHERE id = v_item.po_item_id AND purchase_order_id = p_po_id;
            
        -- Tambah/update stok di inventory_stock_levels (UPSERT)
        INSERT INTO public.inventory_stock_levels (organization_id, product_variant_id, outlet_id, quantity_on_hand, updated_at)
        VALUES (p_organization_id, v_po_item_details.product_variant_id, v_po.outlet_id, v_item.quantity_received, now())
        ON CONFLICT (product_variant_id, outlet_id)
        DO UPDATE SET
            quantity_on_hand = inventory_stock_levels.quantity_on_hand + v_item.quantity_received,
            updated_at = now();

        -- Catat pergerakan stok
        INSERT INTO public.inventory_stock_movements (organization_id, product_variant_id, outlet_id, quantity_change, movement_type, reference_id, notes)
        VALUES (p_organization_id, v_po_item_details.product_variant_id, v_po.outlet_id, v_item.quantity_received, 'purchase_received', p_po_id, 'Penerimaan dari PO #' || v_po.po_number);

    END LOOP;

    -- 3. Hitung total kuantitas untuk menentukan status PO baru
    SELECT SUM(quantity), SUM(received_quantity)
    INTO v_total_ordered, v_total_previously_received
    FROM public.purchase_order_items
    WHERE purchase_order_id = p_po_id;
    
    v_total_now_received := v_total_previously_received; -- received_quantity sudah diupdate di atas

    -- 4. Update status PO
    IF v_total_now_received >= v_total_ordered THEN
        UPDATE public.purchase_orders SET status = 'completed' WHERE id = p_po_id;
    ELSE
        UPDATE public.purchase_orders SET status = 'partially_received' WHERE id = p_po_id;
    END IF;

END;
$$;
