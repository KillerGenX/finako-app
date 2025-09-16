-- Supabase RPC Function: create_stock_transfer_draft
-- =================================================================
--
--  Tujuan: 
--  Membuat dokumen transfer stok (Surat Jalan) baru dalam status 'draft'.
--  Fungsi ini menangani pembuatan nomor transfer unik dan menyimpan
--  header serta item-item transfer.
--
--  Fitur Utama:
--  1.  Nomor Unik: Menghasilkan nomor transfer berurutan (misal: ST-2405-0001).
--  2.  Transaksi Aman: Menyimpan header dan item dalam satu operasi.
--  3.  Input JSON: Menerima daftar item sebagai JSON untuk efisiensi.
--
--  Instruksi: Jalankan skrip ini di SQL Editor Supabase Anda.
--
-- =================================================================

-- 1. Buat Tipe data custom untuk item yang akan ditransfer
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'transfer_item_type') THEN
        CREATE TYPE public.transfer_item_type AS (
            variant_id UUID,
            quantity NUMERIC
        );
    END IF;
END$$;


-- 2. Buat Sequence untuk nomor transfer unik
CREATE SEQUENCE IF NOT EXISTS stock_transfer_seq;


-- 3. Buat Fungsi RPC utama
CREATE OR REPLACE FUNCTION public.create_stock_transfer_draft(
    p_organization_id UUID,
    p_outlet_from_id UUID,
    p_outlet_to_id UUID,
    p_created_by UUID,
    p_notes TEXT,
    p_items public.transfer_item_type[]
)
RETURNS UUID -- Mengembalikan ID transfer yang baru dibuat
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_new_transfer_id UUID;
    v_transfer_number TEXT;
    v_item public.transfer_item_type;
BEGIN
    -- Hasilkan nomor transfer baru
    v_transfer_number := 'ST-' || to_char(now(), 'YYMM') || '-' || LPAD(nextval('stock_transfer_seq')::TEXT, 4, '0');

    -- Buat entri di tabel header `stock_transfers`
    INSERT INTO public.stock_transfers (
        organization_id, 
        transfer_number, 
        outlet_from_id, 
        outlet_to_id, 
        created_by, 
        notes, 
        status
    ) VALUES (
        p_organization_id,
        v_transfer_number,
        p_outlet_from_id,
        p_outlet_to_id,
        p_created_by,
        p_notes,
        'draft'
    ) RETURNING id INTO v_new_transfer_id;

    -- Masukkan setiap item ke dalam tabel `stock_transfer_items`
    FOREACH v_item IN ARRAY p_items
    LOOP
        INSERT INTO public.stock_transfer_items (
            stock_transfer_id, 
            product_variant_id, 
            quantity
        ) VALUES (
            v_new_transfer_id,
            v_item.variant_id,
            v_item.quantity
        );
    END LOOP;

    RETURN v_new_transfer_id;
END;
$$;
