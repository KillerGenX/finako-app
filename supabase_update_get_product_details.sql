-- =================================================================
--  Pembaruan Fungsi RPC: get_product_details
-- =================================================================
--
--  Tujuan: 
--  Memperbarui fungsi `get_product_details` agar secara otomatis 
--  menyertakan perhitungan Harga Pokok Penjualan (HPP) untuk produk 
--  bertipe 'COMPOSITE'.
--
--  Perubahan:
--  1.  Menambahkan deklarasi variabel `composite_hpp` dan `composite_variant_id`.
--  2.  Di dalam blok `IF product_type_enum = 'COMPOSITE'`, fungsi ini akan:
--      a. Mengekstrak ID dari varian pertama produk komposit.
--      b. Memanggil fungsi `public.calculate_composite_hpp` dengan ID tersebut.
--      c. Menyimpan hasilnya di variabel `composite_hpp`.
--  3.  Menambahkan field `composite_hpp` ke dalam objek JSON yang dikembalikan
--      untuk produk komposit.
--
--  Instruksi: 
--  Jalankan seluruh skrip ini di SQL Editor Supabase Anda untuk 
--  menggantikan fungsi yang lama dengan versi yang sudah diperbarui.
--
-- =================================================================

-- Hapus fungsi yang lama terlebih dahulu untuk memastikan definisi baru diterapkan
DROP FUNCTION IF EXISTS public.get_product_details(uuid, uuid);

-- Buat ulang fungsi dengan logika HPP Otomatis
CREATE OR REPLACE FUNCTION public.get_product_details(p_product_id uuid, p_organization_id uuid)
RETURNS jsonb AS $$
DECLARE
    product_details jsonb;
    product_type_enum product_type_enum;
    variants_data jsonb;
    components_data jsonb;
    composite_hpp NUMERIC; -- << BARU: Variabel untuk menyimpan HPP
    composite_variant_id UUID; -- << BARU: Variabel untuk menyimpan ID Varian Komposit
BEGIN
    -- Langkah 1: Ambil detail produk dasar termasuk data pajak
    SELECT
        jsonb_build_object(
            'id', p.id, 'name', p.name, 'description', p.description,
            'image_url', p.image_url, 'category_id', p.category_id, 'brand_id', p.brand_id,
            'product_type', p.product_type, 'created_at', p.created_at, 'updated_at', p.updated_at,
            'organization_id', p.organization_id,
            'product_tax_rates', COALESCE(tax_agg.taxes, '[]'::jsonb)
        ),
        p.product_type
    INTO product_details, product_type_enum
    FROM products p
    LEFT JOIN (
        SELECT product_id, jsonb_agg(jsonb_build_object('tax_rate_id', tax_rate_id)) as taxes
        FROM product_tax_rates GROUP BY product_id
    ) tax_agg ON tax_agg.product_id = p.id
    WHERE p.id = p_product_id AND p.organization_id = p_organization_id;

    IF product_details IS NULL THEN RETURN NULL; END IF;

    -- Langkah 2: Ambil data varian (berlaku untuk SEMUA tipe yang memiliki varian)
    SELECT COALESCE(jsonb_agg(to_jsonb(v) || jsonb_build_object('total_stock', COALESCE(sl.total, 0))), '[]'::jsonb)
    INTO variants_data
    FROM product_variants v
    LEFT JOIN (
        SELECT product_variant_id, sum(quantity_on_hand) as total
        FROM inventory_stock_levels GROUP BY product_variant_id
    ) sl ON sl.product_variant_id = v.id
    WHERE v.product_id = p_product_id;

    -- Tambahkan data varian ke hasil
    product_details := product_details || jsonb_build_object('variants', variants_data);

    -- Langkah 3: JIKA produknya komposit, ambil data komponen DAN hitung HPP
    IF product_type_enum = 'COMPOSITE' THEN
        -- Ambil data komponen
        SELECT COALESCE(jsonb_agg(
            jsonb_build_object(
                'id', pc.id,
                'quantity', pc.quantity,
                'component_details', jsonb_build_object(
                    'id', cv.id, 'name', cv.name, 'sku', cv.sku,
                    'product_name', p_comp.name, 'image_url', p_comp.image_url
                )
            )
        ), '[]'::jsonb)
        INTO components_data
        FROM product_variants pv
        JOIN product_composites pc ON pc.parent_variant_id = pv.id
        JOIN product_variants cv ON pc.component_variant_id = cv.id
        JOIN products p_comp ON cv.product_id = p_comp.id
        WHERE pv.product_id = p_product_id;
        
        -- << LOGIKA BARU: Hitung HPP Otomatis >>
        -- Ekstrak ID dari varian pertama (produk komposit hanya punya satu varian)
        composite_variant_id := (SELECT (variants_data->0->>'id')::UUID);

        IF composite_variant_id IS NOT NULL THEN
            -- Panggil fungsi kalkulasi HPP yang sudah kita buat
            SELECT public.calculate_composite_hpp(composite_variant_id) INTO composite_hpp;
        ELSE
            composite_hpp := 0;
        END IF;
        
        -- Tambahkan data komponen dan HPP ke hasil akhir
        product_details := product_details || jsonb_build_object(
            'components', components_data,
            'composite_hpp', COALESCE(composite_hpp, 0) -- Pastikan tidak null
        );
    END IF;

    RETURN product_details;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
