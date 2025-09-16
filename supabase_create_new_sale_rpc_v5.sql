-- Supabase RPC Function: create_new_sale (Versi 5 - Integrasi Pelanggan)
-- =================================================================
--
--  Tujuan: 
--  Menambahkan kemampuan untuk menautkan sebuah transaksi ke pelanggan (CRM).
--
--  Pembaruan (Versi 5):
--  -   Fungsi utama `create_new_sale` kini menerima parameter baru: `p_customer_id UUID`.
--      Parameter ini bersifat opsional (default NULL).
--  -   Logika `INSERT` ke `transactions` telah diperbarui untuk menyimpan
--      `customer_id` jika disediakan.
--  -   Tidak ada perubahan pada logika kalkulasi atau manajemen stok dari v4.
--
--  Instruksi: Jalankan skrip ini di SQL Editor Supabase Anda.
--
-- =================================================================

-- Tipe data cart_item_type tidak berubah dari v4, jadi kita tidak perlu DROP.
-- Pastikan tipe ini sudah ada dari skrip v4.
-- CREATE TYPE public.cart_item_type AS (
--     variant_id UUID,
--     quantity NUMERIC,
--     unit_price NUMERIC,
--     tax_amount NUMERIC,
--     discount_amount NUMERIC
-- );

-- Langkah 1: Buat ulang fungsi utama dengan parameter customer_id.
CREATE OR REPLACE FUNCTION public.create_new_sale(
    p_organization_id UUID,
    p_outlet_id UUID,
    p_member_id UUID,
    p_cart_items public.cart_item_type[],
    p_total_discount NUMERIC,
    p_customer_id UUID DEFAULT NULL -- Parameter baru untuk pelanggan
)
RETURNS UUID -- Mengembalikan ID transaksi yang baru dibuat
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_new_transaction_id UUID;
    v_total_subtotal NUMERIC := 0;
    v_total_tax NUMERIC := 0;
    v_total_item_discounts NUMERIC := 0;
    v_cart_item public.cart_item_type;
    v_product_variant RECORD;
    v_current_stock NUMERIC;
    v_component RECORD;
BEGIN
    -- Hitung total dari keranjang belanja
    FOREACH v_cart_item IN ARRAY p_cart_items
    LOOP
        v_total_subtotal := v_total_subtotal + (v_cart_item.quantity * v_cart_item.unit_price);
        v_total_tax := v_total_tax + v_cart_item.tax_amount;
        v_total_item_discounts := v_total_item_discounts + v_cart_item.discount_amount;
    END LOOP;

    -- Buat entri di tabel `transactions` dengan menyertakan customer_id
    INSERT INTO public.transactions (organization_id, outlet_id, member_id, customer_id, transaction_number, status, subtotal, total_discount, total_tax, grand_total)
    VALUES (
        p_organization_id, 
        p_outlet_id, 
        p_member_id, 
        p_customer_id, -- Menyimpan ID pelanggan
        'INV-' || to_char(now(), 'YYYYMMDDHH24MISS'), 
        'completed', 
        v_total_subtotal, 
        (v_total_item_discounts + p_total_discount),
        v_total_tax, 
        (v_total_subtotal - (v_total_item_discounts + p_total_discount) + v_total_tax)
    )
    RETURNING id INTO v_new_transaction_id;

    -- Proses setiap item di keranjang (logika stok tidak berubah)
    FOREACH v_cart_item IN ARRAY p_cart_items
    LOOP
        SELECT pv.id, p.product_type, pv.track_stock INTO v_product_variant
        FROM public.product_variants pv JOIN public.products p ON pv.product_id = p.id
        WHERE pv.id = v_cart_item.variant_id;
        
        IF v_product_variant.track_stock THEN
            SELECT quantity_on_hand INTO v_current_stock FROM public.inventory_stock_levels
            WHERE product_variant_id = v_cart_item.variant_id AND outlet_id = p_outlet_id;

            IF v_current_stock IS NULL OR v_current_stock < v_cart_item.quantity THEN
                RAISE EXCEPTION 'Stok tidak mencukupi untuk varian ID %', v_cart_item.variant_id;
            END IF;

            UPDATE public.inventory_stock_levels SET quantity_on_hand = quantity_on_hand - v_cart_item.quantity, updated_at = now()
            WHERE product_variant_id = v_cart_item.variant_id AND outlet_id = p_outlet_id;

            INSERT INTO public.inventory_stock_movements (organization_id, product_variant_id, outlet_id, quantity_change, movement_type, reference_id)
            VALUES (p_organization_id, v_cart_item.variant_id, p_outlet_id, -v_cart_item.quantity, 'sale', v_new_transaction_id);
        END IF;

        INSERT INTO public.transaction_items (transaction_id, product_variant_id, quantity, unit_price, discount_amount, tax_amount, line_total)
        VALUES (
            v_new_transaction_id, 
            v_cart_item.variant_id, 
            v_cart_item.quantity, 
            v_cart_item.unit_price,
            (v_cart_item.discount_amount / v_cart_item.quantity),
            (v_cart_item.tax_amount / v_cart_item.quantity),
            (v_cart_item.unit_price * v_cart_item.quantity) - v_cart_item.discount_amount + v_cart_item.tax_amount
        );
        
        IF v_product_variant.product_type = 'COMPOSITE' THEN
            FOR v_component IN SELECT pc.component_variant_id, pc.quantity FROM public.product_composites pc WHERE pc.parent_variant_id = v_cart_item.variant_id
            LOOP
                DECLARE v_total_component_qty_to_reduce NUMERIC;
                BEGIN
                    v_total_component_qty_to_reduce := v_component.quantity * v_cart_item.quantity;
                    SELECT quantity_on_hand INTO v_current_stock FROM public.inventory_stock_levels
                    WHERE product_variant_id = v_component.component_variant_id AND outlet_id = p_outlet_id;

                    IF v_current_stock IS NULL OR v_current_stock < v_total_component_qty_to_reduce THEN
                        RAISE EXCEPTION 'Stok komponen (ID: %) tidak mencukupi', v_component.component_variant_id;
                    END IF;
                    
                    UPDATE public.inventory_stock_levels SET quantity_on_hand = quantity_on_hand - v_total_component_qty_to_reduce
                    WHERE product_variant_id = v_component.component_variant_id AND outlet_id = p_outlet_id;

                    INSERT INTO public.inventory_stock_movements (organization_id, product_variant_id, outlet_id, quantity_change, movement_type, reference_id)
                    VALUES (p_organization_id, v_component.component_variant_id, p_outlet_id, -v_total_component_qty_to_reduce, 'composite_consumption', v_new_transaction_id);
                END;
            END LOOP;
        END IF;
    END LOOP;

    RETURN v_new_transaction_id;
END;
$$;
