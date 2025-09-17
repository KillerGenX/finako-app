-- Supabase RPC Function: create_purchase_order_draft (v2)
-- =================================================================
--
--  Tujuan: 
--  Memperbarui RPC untuk dapat menerima tanggal perkiraan tiba (opsional).
--
--  Pembaruan:
--  -   Menambahkan parameter opsional `p_expected_delivery_date`.
--  -   Memperbarui statement INSERT untuk menyimpan tanggal tersebut.
--
--  Instruksi: Jalankan skrip ini di SQL Editor Supabase Anda.
--
-- =================================================================

-- Tipe dan Sequence tidak perlu dibuat ulang jika sudah ada dari v1

CREATE OR REPLACE FUNCTION public.create_purchase_order_draft(
    p_organization_id UUID,
    p_supplier_id UUID,
    p_outlet_id UUID,
    p_created_by UUID,
    p_notes TEXT,
    p_items public.po_item_type[],
    p_expected_delivery_date DATE DEFAULT NULL -- Parameter baru
)
RETURNS UUID
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
        status,
        expected_delivery_date -- Tambahkan kolom baru
    ) VALUES (
        p_organization_id,
        v_po_number,
        p_supplier_id,
        p_outlet_id,
        p_created_by,
        p_notes,
        'draft',
        p_expected_delivery_date -- Simpan nilai dari parameter
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
