-- Supabase Schema: Menambahkan Tabel untuk Fitur Stok Opname
-- =================================================================
--
--  Tujuan: 
--  Membangun fondasi database untuk alur kerja Stok Opname.
--
--  Fitur Utama:
--  1.  Tabel Header (`stock_opnames`): Mencatat sesi opname, outlet,
--      tanggal, dan statusnya.
--  2.  Tabel Detail (`stock_opname_items`): Mencatat setiap item produk
--      yang dihitung dalam satu sesi opname.
--  3.  ENUM Status: Mendefinisikan siklus hidup opname (Menghitung, Selesai).
--
--  Instruksi: Jalankan skrip ini di SQL Editor Supabase Anda.
--
-- =================================================================

-- 1. Buat Tipe ENUM baru untuk status opname
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'stock_opname_status') THEN
        CREATE TYPE public.stock_opname_status AS ENUM ('counting', 'completed', 'cancelled');
    END IF;
END$$;


-- 2. Buat Tabel Header (stock_opnames)
CREATE TABLE IF NOT EXISTS public.stock_opnames (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    opname_number TEXT NOT NULL UNIQUE,
    outlet_id UUID NOT NULL REFERENCES public.outlets(id),
    status public.stock_opname_status NOT NULL DEFAULT 'counting',
    notes TEXT,
    created_by UUID REFERENCES auth.users(id),
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.stock_opnames IS 'Dokumen header untuk sesi Stok Opname.';


-- 3. Buat Tabel Detail (stock_opname_items)
CREATE TABLE IF NOT EXISTS public.stock_opname_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    stock_opname_id UUID NOT NULL REFERENCES public.stock_opnames(id) ON DELETE CASCADE,
    product_variant_id UUID NOT NULL REFERENCES public.product_variants(id),
    system_quantity NUMERIC(10, 4) NOT NULL, -- Stok menurut sistem saat opname dimulai
    physical_quantity NUMERIC(10, 4), -- Stok hasil hitungan fisik (bisa null saat proses hitung)
    difference NUMERIC(10, 4) GENERATED ALWAYS AS (physical_quantity - system_quantity) STORED
);
COMMENT ON TABLE public.stock_opname_items IS 'Item-item produk yang dihitung dalam satu sesi Stok Opname.';
COMMENT ON COLUMN public.stock_opname_items.difference IS 'Selisih antara stok fisik dan stok sistem.';


-- 4. Tambahkan Indeks untuk Performa
CREATE INDEX IF NOT EXISTS idx_stock_opnames_organization_id ON public.stock_opnames(organization_id);
CREATE INDEX IF NOT EXISTS idx_stock_opname_items_stock_opname_id ON public.stock_opname_items(stock_opname_id);
