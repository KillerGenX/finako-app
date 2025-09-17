-- Supabase Schema: Menambahkan Tabel untuk Fitur Manajemen Pemasok
-- =================================================================
--
--  Tujuan: 
--  Membangun fondasi database untuk fitur manajemen pemasok (suppliers).
--  Tabel ini akan menyimpan data master untuk semua pemasok.
--
--  Instruksi: Jalankan skrip ini di SQL Editor Supabase Anda.
--
-- =================================================================

CREATE TABLE IF NOT EXISTS public.suppliers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    contact_person TEXT,
    email TEXT,
    phone_number TEXT,
    address TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT unique_supplier_name_org UNIQUE (organization_id, name)
);

COMMENT ON TABLE public.suppliers IS 'Menyimpan data master untuk pemasok (vendors).';

-- Tambahkan Indeks untuk Performa
CREATE INDEX IF NOT EXISTS idx_suppliers_organization_id ON public.suppliers(organization_id);
