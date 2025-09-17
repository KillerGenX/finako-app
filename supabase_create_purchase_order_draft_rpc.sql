-- Supabase RPC Function: create_purchase_order_draft
-- =================================================================
--
--  Tujuan: 
--  Membuat dokumen Purchase Order (PO) baru dalam status 'draft'.
--
--  Fitur Utama:
--  1.  Nomor Unik: Menghasilkan nomor PO berurutan (misal: PO-2405-0001).
--  2.  Transaksi Aman: Menyimpan header dan item dalam satu operasi.
--
--  Instruksi: Jalankan skrip ini di SQL Editor Supabase Anda.
--
-- =================================================================

-- 1. Buat Tipe data custom untuk item yang akan dipesan
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'po_item_type') THEN
        CREATE TYPE public.po_item_type AS (
            variant_id UUID,
            quantity NUMERIC,
            unit_cost NUMERIC
        );
    END IF;
END$$;


-- 2. Buat Sequence untuk nomor PO unik
CREATE SEQUENCE IF NOT EXISTS purchase_order_seq;


-- 3. Buat Fungsi RPC utama
CREATE OR REPLACE FUNCTION public.create_purchase_order_draft(
    p_organization_id UUID,
    p_supplier_id UUID,
    p_outlet_id UUID,
    p_created_by UUID,
    p_notes TEXT,
    p_items public.po_item_type[]
)
RETURNS UUID -- Mengembalikan ID PO yang baru dibuat
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_new_po_id UUID;
    v_po_number TEXT;
    v_item public.po_item_type;
BEGIN
    -- Hasilkan nomor PO baru
    v_po_number := 'PO-' || to_char(now(), 'YYMM') || '-' || LPAD(nextval('purchase_order_seq')::TEXT, 4, '0');

    -- Buat entri di tabel header `purchase_orders`
    INSERT INTO public.purchase_orders (
        organization_id, 
        po_number, 
        supplier_id, 
        outlet_id, 
        created_by, 
        notes, 
        status
    ) VALUES (
        p_organization_id,
        v_po_number,
        p_supplier_id,
        p_outlet_id,
        p_created_by,
        p_notes,
        'draft'
    ) RETURNING id INTO v_new_po_id;

    -- Masukkan setiap item ke dalam tabel `purchase_order_items`
    FOREACH v_item IN ARRAY p_items
    LOOP
        INSERT INTO public.purchase_order_items (
            purchase_order_id, 
            product_variant_id, 
            quantity,
            unit_cost
        ) VALUES (
            v_new_po_id,
            v_item.variant_id,
            v_item.quantity,
            v_item.unit_cost
        );
    END LOOP;

    RETURN v_new_po_id;
END;
$$;
