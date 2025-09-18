-- Supabase RPC Function: create_stock_write_off
-- =================================================================
--
--  Tujuan: 
--  Membuat dokumen Berita Acara Barang Rusak/Hilang dan menyesuaikan
--  stok inventaris secara atomik.
--
--  Fitur Utama:
--  1.  Nomor Unik: Menghasilkan nomor dokumen berurutan.
--  2.  Transaksi Aman: Menyimpan header, item, dan mengurangi stok
--      dalam satu operasi yang aman.
--
--  Instruksi: Jalankan skrip ini di SQL Editor Supabase Anda.
--
-- =================================================================

-- 1. Buat Tipe data custom untuk item
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'write_off_item_type') THEN
        CREATE TYPE public.write_off_item_type AS (
            variant_id UUID,
            quantity NUMERIC,
            reason TEXT
        );
    END IF;
END$$;

-- 2. Buat Sequence untuk nomor unik
CREATE SEQUENCE IF NOT EXISTS stock_write_off_seq;

-- 3. Buat Fungsi RPC utama
CREATE OR REPLACE FUNCTION public.create_stock_write_off(
    p_organization_id UUID,
    p_outlet_id UUID,
    p_created_by UUID,
    p_notes TEXT,
    p_items public.write_off_item_type[]
)
RETURNS UUID -- Mengembalikan ID Berita Acara yang baru dibuat
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_new_write_off_id UUID;
    v_write_off_number TEXT;
    v_item public.write_off_item_type;
    v_current_stock NUMERIC;
BEGIN
    -- Hasilkan nomor baru
    v_write_off_number := 'WO-' || to_char(now(), 'YYMM') || '-' || LPAD(nextval('stock_write_off_seq')::TEXT, 4, '0');

    -- Buat entri di tabel header
    INSERT INTO public.stock_write_offs (organization_id, write_off_number, outlet_id, created_by, notes)
    VALUES (p_organization_id, v_write_off_number, p_outlet_id, p_created_by, p_notes)
    RETURNING id INTO v_new_write_off_id;

    -- Proses setiap item
    FOREACH v_item IN ARRAY p_items
    LOOP
        -- Validasi stok
        SELECT quantity_on_hand INTO v_current_stock FROM public.inventory_stock_levels
        WHERE product_variant_id = v_item.variant_id AND outlet_id = p_outlet_id;
        IF v_current_stock IS NULL OR v_current_stock < v_item.quantity THEN
            RAISE EXCEPTION 'Stok tidak mencukupi untuk produk (ID: %)', v_item.variant_id;
        END IF;

        -- Masukkan item ke tabel detail
        INSERT INTO public.stock_write_off_items (stock_write_off_id, product_variant_id, quantity, reason)
        VALUES (v_new_write_off_id, v_item.variant_id, v_item.quantity, v_item.reason);

        -- Kurangi stok di inventory_stock_levels
        UPDATE public.inventory_stock_levels SET quantity_on_hand = quantity_on_hand - v_item.quantity
        WHERE product_variant_id = v_item.variant_id AND outlet_id = p_outlet_id;

        -- Catat pergerakan stok
        INSERT INTO public.inventory_stock_movements (organization_id, product_variant_id, outlet_id, quantity_change, movement_type, reference_id, notes)
        VALUES (p_organization_id, v_item.variant_id, p_outlet_id, -v_item.quantity, 'adjustment', v_new_write_off_id, 'Barang Rusak/Hilang: ' || v_item.reason);
    END LOOP;

    RETURN v_new_write_off_id;
END;
$$;
