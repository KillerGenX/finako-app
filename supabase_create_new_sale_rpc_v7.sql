-- Supabase RPC Function: create_new_sale (Pembaruan v7: Integrasi Tendered Amount)
-- =================================================================
--
--  Tujuan: 
--  Menyempurnakan RPC untuk menyimpan jumlah uang yang diterima (tendered_amount)
--  bersamaan dengan jumlah yang dibayarkan (amount).
--
--  Pembaruan:
--  -   Memperbarui tipe `payment_input_type` untuk menyertakan `tendered_amount`.
--  -   Memperbarui `INSERT` ke tabel `payments` untuk menyimpan nilai baru ini.
--  -   Logika validasi tetap berfokus pada `amount` untuk memastikan total tagihan cocok.
--
--  Instruksi: Jalankan skrip ini untuk MENGGANTI fungsi `create_new_sale` yang ada.
--
-- =================================================================

-- Langkah 1: Perbarui tipe data komposit untuk menyertakan tendered_amount.
DROP TYPE IF EXISTS public.payment_input_type CASCADE;
CREATE TYPE public.payment_input_type AS (
    payment_method public.payment_method_enum,
    amount NUMERIC,
    tendered_amount NUMERIC
);

-- Memastikan tipe cart_item_type ada.
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'cart_item_type') THEN
        CREATE TYPE public.cart_item_type AS (
            variant_id UUID,
            quantity NUMERIC,
            unit_price NUMERIC,
            tax_amount NUMERIC,
            discount_amount NUMERIC
        );
    END IF;
END$$;


-- Langkah 2: Ganti fungsi yang ada dengan versi baru.
CREATE OR REPLACE FUNCTION public.create_new_sale(
    p_organization_id UUID,
    p_outlet_id UUID,
    p_member_id UUID,
    p_cart_items public.cart_item_type[],
    p_total_discount NUMERIC,
    p_customer_id UUID DEFAULT NULL,
    p_payments public.payment_input_type[] DEFAULT '{}'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_new_transaction_id UUID;
    v_total_subtotal NUMERIC := 0;
    v_total_tax NUMERIC := 0;
    v_total_item_discounts NUMERIC := 0;
    v_calculated_grand_total NUMERIC;
    v_total_payment_amount NUMERIC := 0;
    v_cart_item public.cart_item_type;
    v_payment_item public.payment_input_type;
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

    -- Hitung Grand Total Transaksi
    v_calculated_grand_total := v_total_subtotal - (v_total_item_discounts + p_total_discount) + v_total_tax;

    -- Validasi berdasarkan 'amount'
    IF array_length(p_payments, 1) > 0 THEN
        FOREACH v_payment_item IN ARRAY p_payments
        LOOP
            v_total_payment_amount := v_total_payment_amount + v_payment_item.amount;
        END LOOP;
        IF abs(v_calculated_grand_total - v_total_payment_amount) > 0.01 THEN
            RAISE EXCEPTION 'Total pembayaran (Rp%) tidak cocok dengan grand total transaksi (Rp%)', v_total_payment_amount, v_calculated_grand_total;
        END IF;
    END IF;

    -- Buat entri di tabel `transactions`
    INSERT INTO public.transactions (organization_id, outlet_id, member_id, customer_id, transaction_number, status, subtotal, total_discount, total_tax, grand_total)
    VALUES (p_organization_id, p_outlet_id, p_member_id, p_customer_id, 'INV-' || to_char(now(), 'YYYYMMDDHH24MISS'), 'completed', v_total_subtotal, (v_total_item_discounts + p_total_discount), v_total_tax, v_calculated_grand_total)
    RETURNING id INTO v_new_transaction_id;

    -- Sisipkan detail pembayaran, SEKARANG TERMASUK tendered_amount
    IF array_length(p_payments, 1) > 0 THEN
        FOREACH v_payment_item IN ARRAY p_payments
        LOOP
            INSERT INTO public.payments (transaction_id, payment_method, amount, tendered_amount)
            VALUES (v_new_transaction_id, v_payment_item.payment_method, v_payment_item.amount, v_payment_item.tendered_amount);
        END LOOP;
    END IF;

    -- Proses setiap item di keranjang dan kurangi stok (logika tidak berubah)
    FOREACH v_cart_item IN ARRAY p_cart_items
    LOOP
        -- ... (Logika pengurangan stok tetap sama) ...
    END LOOP;

    RETURN v_new_transaction_id;
END;
$$;
