-- Supabase RPC Function: get_transaction_history (Versi 2 - Fitur Lengkap)
-- =================================================================
--
--  Tujuan: 
--  Meningkatkan RPC untuk mendukung fungsionalitas pencarian, filter tanggal,
--  dan paginasi yang lengkap untuk halaman riwayat transaksi.
--
--  Pembaruan (Versi 2):
--  -   Parameter baru ditambahkan: p_search_query, p_start_date, p_end_date, 
--      p_page_number, p_page_size.
--  -   Logika WHERE diperbarui untuk menangani filter opsional.
--  -   Paginasi diimplementasikan menggunakan LIMIT dan OFFSET.
--  -   Return type diubah menjadi JSONB untuk mengembalikan data transaksi
--      DAN total hitungan (total_count) dalam satu panggilan.
--
--  Instruksi: Hapus fungsi lama dan jalankan skrip ini di SQL Editor Anda.
--
-- =================================================================

CREATE OR REPLACE FUNCTION public.get_transaction_history(
    p_organization_id UUID,
    p_search_query TEXT DEFAULT NULL,
    p_start_date TIMESTAMPTZ DEFAULT NULL,
    p_end_date TIMESTAMPTZ DEFAULT NULL,
    p_page_number INT DEFAULT 1,
    p_page_size INT DEFAULT 25
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_offset INT;
    v_total_count INT;
    v_data JSONB;
BEGIN
    -- Hitung offset untuk paginasi
    v_offset := (p_page_number - 1) * p_page_size;

    -- Query utama untuk mengambil data dengan filter dan paginasi
    WITH filtered_transactions AS (
        SELECT
            t.id,
            t.transaction_date,
            t.transaction_number,
            COALESCE(cust.name, 'Pelanggan Umum') as customer_name,
            prof.full_name as cashier_name,
            t.grand_total
        FROM
            public.transactions t
        LEFT JOIN
            public.customers cust ON t.customer_id = cust.id
        JOIN
            public.organization_members om ON t.member_id = om.id
        JOIN
            public.profiles prof ON om.user_id = prof.id
        WHERE
            t.organization_id = p_organization_id
            -- Filter tanggal (opsional)
            AND (p_start_date IS NULL OR t.transaction_date >= p_start_date)
            AND (p_end_date IS NULL OR t.transaction_date <= p_end_date)
            -- Filter pencarian (opsional)
            AND (
                p_search_query IS NULL OR p_search_query = '' OR
                t.transaction_number ILIKE '%' || p_search_query || '%' OR
                cust.name ILIKE '%' || p_search_query || '%' OR
                prof.full_name ILIKE '%' || p_search_query || '%'
            )
    )
    -- Hitung total baris yang cocok SEBELUM paginasi
    SELECT count(*) INTO v_total_count FROM filtered_transactions;

    -- Ambil data untuk halaman saat ini
    SELECT jsonb_agg(ft.*)
    INTO v_data
    FROM (
        SELECT * 
        FROM filtered_transactions
        ORDER BY transaction_date DESC
        LIMIT p_page_size
        OFFSET v_offset
    ) ft;

    -- Kembalikan hasil dalam format JSON
    RETURN jsonb_build_object(
        'total_count', v_total_count,
        'data', COALESCE(v_data, '[]'::jsonb)
    );
END;
$$;
