-- Supabase RPC Function: create_new_sale (Versi 2)
-- =================================================================
--
--  Tujuan: 
--  Memperbaiki bug di mana informasi pajak tidak disimpan ke database.
--  Fungsi ini sekarang menerima jumlah pajak per item dari frontend
--  dan menyimpannya dengan benar.
--
--  Pembaruan (Versi 2):
--  -   Tipe `cart_item_type` diperbarui untuk menyertakan `tax_amount`.
--  -   Fungsi utama sekarang membaca `tax_amount` dari setiap item keranjang.
--  -   `INSERT` ke `transaction_items` kini menyertakan `tax_amount`.
--  -   Kalkulasi untuk header `transactions` (subtotal, total_tax, grand_total)
--      sekarang akurat berdasarkan data yang dikirim dari frontend.
--
--  Instruksi: Jalankan skrip ini di SQL Editor Supabase Anda.
--
-- =================================================================

-- Langkah 1: Hapus tipe lama jika ada, lalu buat tipe baru yang sudah benar
-- Menggunakan DROP...CREATE memastikan skema selalu bersih dan up-to-date.
DROP TYPE IF EXISTS public.cart_item_type;
CREATE TYPE public.cart_item_type AS (
    variant_id UUID,
    quantity NUMERIC,
    unit_price NUMERIC, -- Harga dasar sebelum pajak
    tax_amount NUMERIC   -- Total pajak untuk satu baris item (sudah dikali kuantitas)
);


-- Langkah 2: Buat ulang fungsi utama dengan logika yang sudah diperbaiki
CREATE OR REPLACE FUNCTION public.create_new_sale(
    p_organization_id UUID,
    p_outlet_id UUID,
    p_member_id UUID,
    p_cart_items public.cart_item_type[]
)
RETURNS UUID -- Mengembalikan ID transaksi yang baru dibuat
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_new_transaction_id UUID;
    v_total_subtotal NUMERIC := 0;
    v_total_tax NUMERIC := 0;
    v_cart_item public.cart_item_type;
    v_product_variant RECORD;
    v_current_stock NUMERIC;
    v_component RECORD;
BEGIN
    -- Langkah 1: Hitung total dari keranjang belanja
    FOREACH v_cart_item IN ARRAY p_cart_items
    LOOP
        v_total_subtotal := v_total_subtotal + (v_cart_item.quantity * v_cart_item.unit_price);
        v_total_tax := v_total_tax + v_cart_item.tax_amount;
    END LOOP;

    -- Langkah 2: Buat entri di tabel `transactions` (header) dengan nilai yang akurat
    INSERT INTO public.transactions (organization_id, outlet_id, member_id, transaction_number, status, subtotal, total_tax, grand_total)
    VALUES (p_organization_id, p_outlet_id, p_member_id, 'INV-' || to_char(now(), 'YYYYMMDDHH24MISS'), 'completed', v_total_subtotal, v_total_tax, (v_total_subtotal + v_total_tax))
    RETURNING id INTO v_new_transaction_id;

    -- Langkah 3: Proses setiap item di keranjang
    FOREACH v_cart_item IN ARRAY p_cart_items
    LOOP
        SELECT pv.id, p.product_type, pv.track_stock INTO v_product_variant
        FROM public.product_variants pv JOIN public.products p ON pv.product_id = p.id
        WHERE pv.id = v_cart_item.variant_id;
        
        -- Pengecekan dan pengurangan stok (logika tetap sama)
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

        -- Langkah 3a (DIPERBARUI): Buat entri di `transaction_items` dengan data pajak
        INSERT INTO public.transaction_items (transaction_id, product_variant_id, quantity, unit_price, tax_amount, line_total)
        VALUES (
            v_new_transaction_id, 
            v_cart_item.variant_id, 
            v_cart_item.quantity, 
            v_cart_item.unit_price, -- Harga dasar
            (v_cart_item.tax_amount / v_cart_item.quantity), -- Pajak per unit
            (v_cart_item.unit_price * v_cart_item.quantity) + v_cart_item.tax_amount -- Total baris
        );
        
        -- Pengurangan stok komponen untuk produk komposit (logika tetap sama)
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
