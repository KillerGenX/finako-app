-- Supabase Function: Pemicu Notifikasi Stok Rendah
-- =================================================================
--
--  Tujuan: 
--  Membuat fungsi PostgreSQL yang dapat dijadwalkan (cron job) untuk
--  secara otomatis memeriksa semua produk di semua outlet. Jika stok
--  suatu produk berada di bawah ambang batas (reorder point), fungsi
--  ini akan membuat notifikasi di tabel `user_notifications`.
--
--  Instruksi:
--  1. Jalankan skrip SQL ini di Supabase SQL Editor Anda untuk membuat
--     fungsi `check_low_stock_and_notify()`.
--  2. Setelah fungsi dibuat, jadwalkan untuk berjalan secara periodik
--     (misalnya, setiap jam) menggunakan pg_cron di Supabase Dashboard.
--
-- =================================================================

CREATE OR REPLACE FUNCTION public.check_low_stock_and_notify()
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
    low_stock_item RECORD;
    owner_id UUID;
BEGIN
    FOR low_stock_item IN
        SELECT 
            isl.product_variant_id,
            isl.outlet_id,
            isl.quantity_on_hand,
            pv.reorder_point,
            pv.name AS variant_name,
            o.name AS outlet_name,
            pv.organization_id
        FROM 
            public.inventory_stock_levels AS isl
        JOIN 
            public.product_variants AS pv ON isl.product_variant_id = pv.id
        JOIN
            public.outlets AS o ON isl.outlet_id = o.id
        WHERE 
            pv.track_stock = TRUE
            AND pv.reorder_point > 0
            AND isl.quantity_on_hand < pv.reorder_point
    LOOP
        -- Dapatkan ID pemilik organisasi untuk dikirimi notifikasi
        SELECT o.owner_id INTO owner_id
        FROM public.organizations o
        WHERE o.id = low_stock_item.organization_id;

        -- Buat notifikasi jika pemilik ditemukan
        IF owner_id IS NOT NULL THEN
            INSERT INTO public.user_notifications (user_id, message, link)
            VALUES (
                owner_id,
                'Stok rendah untuk "' || low_stock_item.variant_name || '" di outlet "' || low_stock_item.outlet_name || '". Sisa: ' || low_stock_item.quantity_on_hand,
                '/dashboard/inventory/' || low_stock_item.product_variant_id
            );
        END IF;
    END LOOP;
END;
$$;
