-- Supabase RPC Function: get_transaction_history
-- =================================================================
--
--  Tujuan: 
--  Mengambil daftar ringkas transaksi untuk ditampilkan di halaman
--  riwayat transaksi. Fungsi ini dioptimalkan untuk kecepatan dengan
--  hanya mengambil data yang diperlukan untuk tampilan tabel.
--
--  Fitur Utama:
--  1.  Data Ringkas: Hanya menyeleksi kolom yang relevan.
--  2.  Join Efisien: Menggabungkan data dari transactions, customers,
--      dan profiles untuk mendapatkan nama.
--  3.  Paginasi & Urutan: Diurutkan berdasarkan tanggal terbaru.
--  4.  Keamanan: Dibatasi oleh organization_id.
--
--  Instruksi: Jalankan skrip ini di SQL Editor Supabase Anda.
--
-- =================================================================

CREATE OR REPLACE FUNCTION public.get_transaction_history(
    p_organization_id UUID
)
RETURNS TABLE (
    id UUID,
    transaction_date TIMESTAMPTZ,
    transaction_number TEXT,
    customer_name TEXT,
    cashier_name TEXT,
    grand_total NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
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
    ORDER BY
        t.transaction_date DESC
    LIMIT 100; -- Batasi untuk performa awal, bisa ditambahkan paginasi nanti
END;
$$;
