-- Supabase Schema: Menambahkan Tabel untuk Fitur Penerimaan Lainnya (Non-PO)
-- =================================================================
--
--  Tujuan: 
--  Membangun fondasi database untuk alur kerja pencatatan stok masuk
--  yang tidak berasal dari Purchase Order.
--
--  Instruksi: Jalankan skrip ini di SQL Editor Supabase Anda.
--
-- =================================================================

-- 1. Buat Tabel Header (other_receivings)
CREATE TABLE IF NOT EXISTS public.other_receivings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    receiving_number TEXT NOT NULL UNIQUE,
    outlet_id UUID NOT NULL REFERENCES public.outlets(id),
    notes TEXT,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.other_receivings IS 'Dokumen header untuk pencatatan penerimaan barang di luar PO.';


-- 2. Buat Tabel Detail (other_receiving_items)
CREATE TABLE IF NOT EXISTS public.other_receiving_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    other_receiving_id UUID NOT NULL REFERENCES public.other_receivings(id) ON DELETE CASCADE,
    product_variant_id UUID NOT NULL REFERENCES public.product_variants(id),
    quantity NUMERIC(10, 4) NOT NULL,
    notes TEXT -- Catatan spesifik per item, misal: "Sampel gratis"
);
COMMENT ON TABLE public.other_receiving_items IS 'Item-item produk yang diterima dalam satu dokumen.';


-- 3. Tambahkan Indeks untuk Performa
CREATE INDEX IF NOT EXISTS idx_other_receivings_organization_id ON public.other_receivings(organization_id);
CREATE INDEX IF NOT EXISTS idx_other_receiving_items_receiving_id ON public.other_receiving_items(other_receiving_id);
