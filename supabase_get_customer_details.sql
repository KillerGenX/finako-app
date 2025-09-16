-- Supabase RPC Function: get_customer_details
-- =================================================================
--
--  Tujuan: 
--  Menjadi satu-satunya sumber data untuk halaman detail pelanggan.
--  Fungsi ini secara efisien mengambil profil pelanggan, statistik kunci,
--  dan riwayat transaksinya dalam satu panggilan.
--
--  Fitur Utama:
--  1.  Data Komprehensif: Menggabungkan profil, statistik, dan transaksi.
--  2.  Statistik Agregat: Menghitung total belanja, jumlah transaksi,
--      dan tanggal kunjungan terakhir.
--  3.  Pencarian & Paginasi: Mendukung pencarian dalam riwayat transaksi
--      pelanggan dan paginasi untuk daftar tersebut.
--
--  Instruksi: Jalankan skrip ini di SQL Editor Supabase Anda.
--
-- =================================================================

CREATE OR REPLACE FUNCTION public.get_customer_details(
    p_customer_id UUID,
    p_organization_id UUID,
    p_search_query TEXT DEFAULT NULL,
    p_page_number INT DEFAULT 1,
    p_page_size INT DEFAULT 10
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_customer_profile JSONB;
    v_customer_stats JSONB;
    v_transactions_data JSONB;
    v_offset INT;
BEGIN
    -- 1. Ambil Profil Pelanggan
    SELECT jsonb_build_object(
        'id', c.id,
        'name', c.name,
        'phone_number', c.phone_number,
        'email', c.email,
        'address', c.address,
        'created_at', c.created_at
    )
    INTO v_customer_profile
    FROM public.customers c
    WHERE c.id = p_customer_id AND c.organization_id = p_organization_id;

    -- Jika pelanggan tidak ditemukan, kembalikan null
    IF v_customer_profile IS NULL THEN
        RETURN NULL;
    END IF;

    -- 2. Hitung Statistik Kunci
    SELECT jsonb_build_object(
        'total_spend', COALESCE(SUM(t.grand_total), 0),
        'total_transactions', COUNT(t.id),
        'last_visit', MAX(t.transaction_date)
    )
    INTO v_customer_stats
    FROM public.transactions t
    WHERE t.customer_id = p_customer_id;

    -- 3. Ambil Riwayat Transaksi dengan Paginasi dan Pencarian
    v_offset := (p_page_number - 1) * p_page_size;

    WITH filtered_transactions AS (
        SELECT
            t.id,
            t.transaction_date,
            t.transaction_number,
            t.grand_total,
            p.full_name as cashier_name
        FROM public.transactions t
        JOIN public.organization_members om ON t.member_id = om.id
        JOIN public.profiles p ON om.user_id = p.id
        WHERE t.customer_id = p_customer_id
        AND (
            p_search_query IS NULL OR p_search_query = '' OR
            t.transaction_number ILIKE '%' || p_search_query || '%'
        )
    )
    SELECT jsonb_build_object(
        'total_count', (SELECT COUNT(*) FROM filtered_transactions),
        'data', COALESCE((
            SELECT jsonb_agg(ft.* ORDER BY ft.transaction_date DESC)
            FROM (
                SELECT * FROM filtered_transactions
                ORDER BY transaction_date DESC
                LIMIT p_page_size
                OFFSET v_offset
            ) ft
        ), '[]'::jsonb)
    )
    INTO v_transactions_data;

    -- 4. Gabungkan semua hasil menjadi satu objek JSON
    RETURN jsonb_build_object(
        'profile', v_customer_profile,
        'stats', v_customer_stats,
        'transactions', v_transactions_data
    );
END;
$$;
