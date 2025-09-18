-- Supabase Schema: Menambahkan Tabel untuk Fitur Barang Rusak/Hilang
-- =================================================================
--
--  Tujuan: 
--  Membangun fondasi database untuk alur kerja pencatatan stok yang
--  rusak, hilang, atau kedaluwarsa (Stock Write-Off).
--
--  Fitur Utama:
--  1.  Tabel Header (`stock_write_offs`): Mencatat dokumen "Berita Acara"
--      untuk setiap kejadian.
--  2.  Tabel Detail (`stock_write_off_items`): Mencatat setiap item produk
--      yang dihapus dari stok, lengkap dengan alasannya.
--
--  Instruksi: Jalankan skrip ini di SQL Editor Supabase Anda.
--
-- =================================================================

-- 1. Buat Tabel Header (stock_write_offs)
CREATE TABLE IF NOT EXISTS public.stock_write_offs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    write_off_number TEXT NOT NULL UNIQUE,
    outlet_id UUID NOT NULL REFERENCES public.outlets(id),
    notes TEXT,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.stock_write_offs IS 'Dokumen header untuk pencatatan barang rusak/hilang (Berita Acara).';


-- 2. Buat Tabel Detail (stock_write_off_items)
CREATE TABLE IF NOT EXISTS public.stock_write_off_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    stock_write_off_id UUID NOT NULL REFERENCES public.stock_write_offs(id) ON DELETE CASCADE,
    product_variant_id UUID NOT NULL REFERENCES public.product_variants(id),
    quantity NUMERIC(10, 4) NOT NULL,
    reason TEXT -- Alasan spesifik untuk item ini, misal: "Pecah", "Kedaluwarsa"
);
COMMENT ON TABLE public.stock_write_off_items IS 'Item-item produk yang dihapus dari stok dalam satu Berita Acara.';


-- 3. Tambahkan Indeks untuk Performa
CREATE INDEX IF NOT EXISTS idx_stock_write_offs_organization_id ON public.stock_write_offs(organization_id);
CREATE INDEX IF NOT EXISTS idx_stock_write_off_items_stock_write_off_id ON public.stock_write_off_items(stock_write_off_id);
