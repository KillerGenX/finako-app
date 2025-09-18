-- Supabase RPC Function: create_other_receiving
-- =================================================================
--
--  Tujuan: 
--  Membuat dokumen Penerimaan Lainnya dan menyesuaikan stok inventaris.
--
--  Instruksi: Jalankan skrip ini di SQL Editor Supabase Anda.
--
-- =================================================================

-- 1. Buat Tipe data custom untuk item
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'other_receiving_item_type') THEN
        CREATE TYPE public.other_receiving_item_type AS (
            variant_id UUID,
            quantity NUMERIC,
            notes TEXT
        );
    END IF;
END$$;

-- 2. Buat Sequence untuk nomor unik
CREATE SEQUENCE IF NOT EXISTS other_receiving_seq;

-- 3. Buat Fungsi RPC utama
CREATE OR REPLACE FUNCTION public.create_other_receiving(
    p_organization_id UUID,
    p_outlet_id UUID,
    p_created_by UUID,
    p_notes TEXT,
    p_items public.other_receiving_item_type[]
)
RETURNS UUID -- Mengembalikan ID Dokumen yang baru dibuat
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_new_receiving_id UUID;
    v_receiving_number TEXT;
    v_item public.other_receiving_item_type;
BEGIN
    -- Hasilkan nomor baru
    v_receiving_number := 'OR-' || to_char(now(), 'YYMM') || '-' || LPAD(nextval('other_receiving_seq')::TEXT, 4, '0');

    -- Buat entri di tabel header
    INSERT INTO public.other_receivings (organization_id, receiving_number, outlet_id, created_by, notes)
    VALUES (p_organization_id, v_receiving_number, p_outlet_id, p_created_by, p_notes)
    RETURNING id INTO v_new_receiving_id;

    -- Proses setiap item
    FOREACH v_item IN ARRAY p_items
    LOOP
        -- Masukkan item ke tabel detail
        INSERT INTO public.other_receiving_items (other_receiving_id, product_variant_id, quantity, notes)
        VALUES (v_new_receiving_id, v_item.variant_id, v_item.quantity, v_item.notes);

        -- Tambah/update stok di inventory_stock_levels (UPSERT)
        INSERT INTO public.inventory_stock_levels (organization_id, product_variant_id, outlet_id, quantity_on_hand, updated_at)
        VALUES (p_organization_id, v_item.variant_id, p_outlet_id, v_item.quantity, now())
        ON CONFLICT (product_variant_id, outlet_id)
        DO UPDATE SET
            quantity_on_hand = inventory_stock_levels.quantity_on_hand + v_item.quantity,
            updated_at = now();

        -- Catat pergerakan stok
        INSERT INTO public.inventory_stock_movements (organization_id, product_variant_id, outlet_id, quantity_change, movement_type, reference_id, notes)
        VALUES (p_organization_id, v_item.variant_id, p_outlet_id, v_item.quantity, 'purchase_received', v_new_receiving_id, 'Penerimaan Lainnya: ' || v_item.notes);
    END LOOP;

    RETURN v_new_receiving_id;
END;
$$;
