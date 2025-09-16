-- Supabase RPC Function: get_transaction_history (Versi 3 - Perbaikan Bug)
-- =================================================================
--
--  Tujuan: 
--  Memperbaiki bug "relation does not exist" dari v2 dengan merestrukturisasi
--  query agar CTE (WITH clause) dapat diakses oleh kedua sub-proses
--  (penghitungan total dan pengambilan data paginasi) dalam satu statement.
--
--  Pembaruan (Versi 3):
--  -   Menggunakan satu statement `SELECT INTO` dengan dua subquery untuk
--      menghindari masalah scope pada CTE.
--
--  Instruksi: Hapus fungsi lama (v1 atau v2) dan jalankan skrip ini.
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

    -- Definisikan CTE untuk transaksi yang difilter
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
            AND (p_start_date IS NULL OR t.transaction_date >= p_start_date)
            AND (p_end_date IS NULL OR t.transaction_date <= p_end_date)
            AND (
                p_search_query IS NULL OR p_search_query = '' OR
                t.transaction_number ILIKE '%' || p_search_query || '%' OR
                cust.name ILIKE '%' || p_search_query || '%' OR
                prof.full_name ILIKE '%' || p_search_query || '%'
            )
    )
    -- Gunakan SATU statement SELECT INTO dengan DUA subquery
    SELECT
        (SELECT count(*) FROM filtered_transactions), -- Subquery 1: Hitung total
        (SELECT jsonb_agg(sub) FROM (                 -- Subquery 2: Ambil data paginasi
            SELECT * 
            FROM filtered_transactions 
            ORDER BY transaction_date DESC 
            LIMIT p_page_size 
            OFFSET v_offset
        ) AS sub)
    INTO
        v_total_count, v_data; -- Masukkan hasilnya ke variabel

    -- Kembalikan hasil dalam format JSON
    RETURN jsonb_build_object(
        'total_count', COALESCE(v_total_count, 0),
        'data', COALESCE(v_data, '[]'::jsonb)
    );
END;
$$;
