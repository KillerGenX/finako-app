-- Supabase Invoices Table Setup for Finako App
-- =================================================================
--
--  Tujuan: 
--  1. Membuat tipe data (ENUMs) baru untuk status invoice dan metode pembayaran.
--  2. Membuat tabel `invoices` baru untuk melacak semua transaksi pembayaran langganan.
--
--  Instruksi: Salin dan jalankan seluruh skrip ini di SQL Editor Supabase Anda.
--
-- =================================================================

-- =================================================================
--  1. BUAT TIPE DATA (ENUMs) BARU
-- =================================================================
-- 'CREATE TYPE ... IF NOT EXISTS' tidak didukung secara native, jadi kita cek manual.
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'invoice_status') THEN
        CREATE TYPE public.invoice_status AS ENUM ('pending', 'paid', 'failed', 'awaiting_confirmation', 'expired');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_method_details') THEN
        CREATE TYPE public.payment_method_details AS ENUM ('gateway', 'manual_transfer');
    END IF;
END$$;


-- =================================================================
--  2. BUAT TABEL `invoices`
-- =================================================================
-- Tabel ini akan menjadi catatan untuk setiap upaya transaksi pembayaran langganan.
--
CREATE TABLE IF NOT EXISTS public.invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    plan_id UUID NOT NULL REFERENCES public.subscription_plans(id),
    user_id UUID NOT NULL REFERENCES auth.users(id),
    status public.invoice_status NOT NULL DEFAULT 'pending',
    amount NUMERIC(12, 2) NOT NULL,
    billing_duration_months INT NOT NULL DEFAULT 1,
    payment_method public.payment_method_details,
    payment_proof_url TEXT,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tambahkan komentar untuk menjelaskan tujuan tabel dan kolom
COMMENT ON TABLE public.invoices IS 'Melacak semua upaya transaksi pembayaran untuk langganan SaaS.';
COMMENT ON COLUMN public.invoices.organization_id IS 'Organisasi yang melakukan pembayaran.';
COMMENT ON COLUMN public.invoices.plan_id IS 'Paket yang coba dibeli.';
COMMENT ON COLUMN public.invoices.user_id IS 'Pengguna yang memulai proses checkout.';
COMMENT ON COLUMN public.invoices.status IS 'Status pembayaran saat ini.';
COMMENT ON COLUMN public.invoices.billing_duration_months IS 'Durasi langganan yang dibeli (misal: 1, 3, 6, 12 bulan).';
COMMENT ON COLUMN public.invoices.payment_proof_url IS 'URL ke bukti transfer untuk verifikasi manual.';
COMMENT ON COLUMN public.invoices.expires_at IS 'Waktu kedaluwarsa untuk invoice yang belum dibayar.';


-- =================================================================
--  3. TAMBAHKAN INDEX UNTUK PERFORMA
-- =================================================================
-- Index pada foreign keys dan kolom yang sering dicari.
CREATE INDEX IF NOT EXISTS idx_invoices_organization_id ON public.invoices(organization_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON public.invoices(status);


-- =================================================================
-- Akhir dari skrip.
-- =================================================================
