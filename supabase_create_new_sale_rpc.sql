-- Supabase RPC Function: create_new_sale
-- =================================================================
--
--  Tujuan: 
--  Membuat satu fungsi `create_new_sale` yang bisa dipanggil dari server-side
--  untuk menangani seluruh proses transaksi penjualan secara ATOMIK.
--  Ini berarti semua langkah (membuat transaksi, mengurangi stok, mencatat pergerakan)
--  akan berhasil bersama-sama, atau gagal bersama-sama, menjaga integritas data.
--
--  Fitur Utama:
--  1.  Keamanan: Dijalankan sebagai `SECURITY DEFINER` untuk menangani RLS.
--  2.  Atomisitas: Menggunakan satu blok transaksi. Jika stok tidak cukup, semua dibatalkan.
--  3.  Pengecekan Stok: Memastikan produk yang dilacak stoknya tidak bisa dijual jika stok habis.
--  4.  Penanganan Produk Komposit: Secara otomatis mengurangi stok komponen saat produk komposit terjual.
--  5.  Logging: Mencatat setiap pergerakan stok di tabel `inventory_stock_movements`.
--
--  Instruksi: Jalankan skrip ini di SQL Editor Supabase Anda.
--
-- =================================================================

-- Definisikan tipe data untuk item keranjang agar mudah digunakan di dalam fungsi
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'cart_item_type') THEN
        CREATE TYPE public.cart_item_type AS (
            variant_id UUID,
            quantity NUMERIC,
            unit_price NUMERIC
        );
    END IF;
END$$;


-- =================================================================
--  FUNGSI UTAMA: create_new_sale
-- =================================================================
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
    v_subtotal NUMERIC := 0;
    v_grand_total NUMERIC := 0;
    v_cart_item public.cart_item_type;
    v_product_variant RECORD;
    v_current_stock NUMERIC;

    -- Variabel untuk perulangan komponen produk komposit
    v_component RECORD;
BEGIN
    -- Langkah 1: Hitung subtotal dari keranjang belanja
    FOREACH v_cart_item IN ARRAY p_cart_items
    LOOP
        v_subtotal := v_subtotal + (v_cart_item.quantity * v_cart_item.unit_price);
    END LOOP;
    
    -- Untuk saat ini, grand total sama dengan subtotal (belum ada pajak/diskon)
    v_grand_total := v_subtotal;

    -- Langkah 2: Buat entri di tabel `transactions` (header)
    INSERT INTO public.transactions (organization_id, outlet_id, member_id, transaction_number, status, subtotal, grand_total)
    VALUES (p_organization_id, p_outlet_id, p_member_id, 'INV-' || to_char(now(), 'YYYYMMDDHH24MISS'), 'completed', v_subtotal, v_grand_total)
    RETURNING id INTO v_new_transaction_id;

    -- Langkah 3: Proses setiap item di keranjang
    FOREACH v_cart_item IN ARRAY p_cart_items
    LOOP
        -- Dapatkan detail varian, termasuk apakah stoknya dilacak
        SELECT pv.id, p.product_type, pv.track_stock
        INTO v_product_variant
        FROM public.product_variants pv
        JOIN public.products p ON pv.product_id = p.id
        WHERE pv.id = v_cart_item.variant_id;
        
        -- Langkah 3a: Pengecekan dan pengurangan stok HANYA jika `track_stock` adalah true
        IF v_product_variant.track_stock THEN
            -- Cek stok saat ini
            SELECT quantity_on_hand INTO v_current_stock
            FROM public.inventory_stock_levels
            WHERE product_variant_id = v_cart_item.variant_id AND outlet_id = p_outlet_id;

            -- Jika stok tidak ada (NULL) atau tidak cukup, batalkan transaksi
            IF v_current_stock IS NULL OR v_current_stock < v_cart_item.quantity THEN
                RAISE EXCEPTION 'Stok tidak mencukupi untuk varian ID %', v_cart_item.variant_id;
            END IF;

            -- Kurangi stok di `inventory_stock_levels`
            UPDATE public.inventory_stock_levels
            SET quantity_on_hand = quantity_on_hand - v_cart_item.quantity,
                updated_at = now()
            WHERE product_variant_id = v_cart_item.variant_id AND outlet_id = p_outlet_id;

            -- Catat pergerakan stok
            INSERT INTO public.inventory_stock_movements (organization_id, product_variant_id, outlet_id, quantity_change, movement_type, reference_id)
            VALUES (p_organization_id, v_cart_item.variant_id, p_outlet_id, -v_cart_item.quantity, 'sale', v_new_transaction_id);
        END IF;

        -- Langkah 3b: Buat entri di `transaction_items` (detail)
        INSERT INTO public.transaction_items (transaction_id, product_variant_id, quantity, unit_price, line_total)
        VALUES (v_new_transaction_id, v_cart_item.variant_id, v_cart_item.quantity, v_cart_item.unit_price, v_cart_item.quantity * v_cart_item.unit_price);
        
        -- Langkah 3c: Jika produk yang terjual adalah TIPE COMPOSITE, kurangi stok komponennya
        IF v_product_variant.product_type = 'COMPOSITE' THEN
            FOR v_component IN 
                SELECT pc.component_variant_id, pc.quantity
                FROM public.product_composites pc
                WHERE pc.parent_variant_id = v_cart_item.variant_id
            LOOP
                -- Hitung total kuantitas komponen yang harus dikurangi
                DECLARE
                    v_total_component_qty_to_reduce NUMERIC;
                BEGIN
                    v_total_component_qty_to_reduce := v_component.quantity * v_cart_item.quantity;

                    -- Cek stok komponen
                     SELECT quantity_on_hand INTO v_current_stock
                     FROM public.inventory_stock_levels
                     WHERE product_variant_id = v_component.component_variant_id AND outlet_id = p_outlet_id;

                    IF v_current_stock IS NULL OR v_current_stock < v_total_component_qty_to_reduce THEN
                        RAISE EXCEPTION 'Stok komponen (ID: %) tidak mencukupi untuk membuat produk komposit', v_component.component_variant_id;
                    END IF;
                    
                    -- Kurangi stok komponen di `inventory_stock_levels`
                    UPDATE public.inventory_stock_levels
                    SET quantity_on_hand = quantity_on_hand - v_total_component_qty_to_reduce
                    WHERE product_variant_id = v_component.component_variant_id AND outlet_id = p_outlet_id;

                    -- Catat pergerakan stok untuk komponen
                    INSERT INTO public.inventory_stock_movements (organization_id, product_variant_id, outlet_id, quantity_change, movement_type, reference_id)
                    VALUES (p_organization_id, v_component.component_variant_id, p_outlet_id, -v_total_component_qty_to_reduce, 'composite_consumption', v_new_transaction_id);
                END;
            END LOOP;
        END IF;

    END LOOP;

    -- Langkah 4: Kembalikan ID transaksi baru jika semua berhasil
    RETURN v_new_transaction_id;

END;
$$;
