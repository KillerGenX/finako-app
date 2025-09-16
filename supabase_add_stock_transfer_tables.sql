-- Supabase Schema: Menambahkan Tabel untuk Fitur Transfer Stok (Surat Jalan)
-- =================================================================
--
--  Tujuan: 
--  Membangun fondasi database untuk fitur transfer stok antar-outlet.
--  Tabel ini akan berfungsi sebagai catatan formal (Surat Jalan) untuk
--  setiap perpindahan inventaris.
--
--  Fitur Utama:
--  1.  Tabel Header (`stock_transfers`): Mencatat informasi umum transfer
--      seperti nomor dokumen, outlet asal/tujuan, tanggal, dan status.
--  2.  Tabel Detail (`stock_transfer_items`): Mencatat setiap item produk
--      yang ditransfer dalam satu dokumen.
--  3.  ENUM Status: Mendefinisikan siklus hidup transfer (Dikirim, Diterima).
--
--  Instruksi: Jalankan skrip ini di SQL Editor Supabase Anda.
--
-- =================================================================

-- 1. Buat Tipe ENUM baru untuk status transfer
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'stock_transfer_status') THEN
        CREATE TYPE public.stock_transfer_status AS ENUM ('draft', 'sent', 'received', 'cancelled');
    END IF;
END$$;


-- 2. Buat Tabel Header (stock_transfers)
CREATE TABLE IF NOT EXISTS public.stock_transfers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    transfer_number TEXT NOT NULL UNIQUE,
    outlet_from_id UUID NOT NULL REFERENCES public.outlets(id),
    outlet_to_id UUID NOT NULL REFERENCES public.outlets(id),
    status public.stock_transfer_status NOT NULL DEFAULT 'draft',
    notes TEXT,
    created_by UUID REFERENCES auth.users(id),
    sent_at TIMESTAMPTZ,
    received_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT outlets_must_be_different CHECK (outlet_from_id <> outlet_to_id)
);
COMMENT ON TABLE public.stock_transfers IS 'Dokumen header untuk transfer stok antar-outlet (Surat Jalan).';
COMMENT ON COLUMN public.stock_transfers.transfer_number IS 'Nomor unik untuk Surat Jalan, bisa dibuat dengan sequence.';


-- 3. Buat Tabel Detail (stock_transfer_items)
CREATE TABLE IF NOT EXISTS public.stock_transfer_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    stock_transfer_id UUID NOT NULL REFERENCES public.stock_transfers(id) ON DELETE CASCADE,
    product_variant_id UUID NOT NULL REFERENCES public.product_variants(id),
    quantity NUMERIC(10, 4) NOT NULL
);
COMMENT ON TABLE public.stock_transfer_items IS 'Item-item produk yang termasuk dalam satu Surat Jalan.';


-- 4. Tambahkan Indeks untuk Performa
CREATE INDEX IF NOT EXISTS idx_stock_transfers_organization_id ON public.stock_transfers(organization_id);
CREATE INDEX IF NOT EXISTS idx_stock_transfers_status ON public.stock_transfers(status);
CREATE INDEX IF NOT EXISTS idx_stock_transfer_items_stock_transfer_id ON public.stock_transfer_items(stock_transfer_id);
