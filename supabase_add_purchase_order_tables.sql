-- Supabase Schema: Menambahkan Tabel untuk Fitur Purchase Order (PO)
-- =================================================================
--
--  Tujuan: 
--  Membangun fondasi database untuk fitur Pesanan Pembelian (PO).
--
--  Fitur Utama:
--  1.  Tabel Header (`purchase_orders`): Mencatat info umum PO seperti
--      pemasok, outlet tujuan, tanggal, dan status.
--  2.  Tabel Detail (`purchase_order_items`): Mencatat setiap item produk
--      yang dipesan, termasuk harga beli saat itu.
--  3.  ENUM Status: Mendefinisikan siklus hidup PO.
--
--  Instruksi: Jalankan skrip ini di SQL Editor Supabase Anda.
--
-- =================================================================

-- 1. Buat Tipe ENUM baru untuk status PO
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'purchase_order_status') THEN
        CREATE TYPE public.purchase_order_status AS ENUM ('draft', 'ordered', 'partially_received', 'completed', 'cancelled');
    END IF;
END$$;


-- 2. Buat Tabel Header (purchase_orders)
CREATE TABLE IF NOT EXISTS public.purchase_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    po_number TEXT NOT NULL UNIQUE,
    supplier_id UUID NOT NULL REFERENCES public.suppliers(id),
    outlet_id UUID NOT NULL REFERENCES public.outlets(id), -- Outlet tujuan penerimaan barang
    status public.purchase_order_status NOT NULL DEFAULT 'draft',
    order_date DATE NOT NULL DEFAULT CURRENT_DATE,
    expected_delivery_date DATE,
    notes TEXT,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.purchase_orders IS 'Dokumen header untuk Pesanan Pembelian (PO) ke pemasok.';


-- 3. Buat Tabel Detail (purchase_order_items)
CREATE TABLE IF NOT EXISTS public.purchase_order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    purchase_order_id UUID NOT NULL REFERENCES public.purchase_orders(id) ON DELETE CASCADE,
    product_variant_id UUID NOT NULL REFERENCES public.product_variants(id),
    quantity NUMERIC(10, 4) NOT NULL,
    unit_cost NUMERIC(12, 2) NOT NULL, -- Harga beli per unit saat pemesanan
    received_quantity NUMERIC(10, 4) NOT NULL DEFAULT 0
);
COMMENT ON TABLE public.purchase_order_items IS 'Item-item produk yang termasuk dalam satu PO.';
COMMENT ON COLUMN public.purchase_order_items.unit_cost IS 'Harga beli di-freeze saat PO dibuat.';
COMMENT ON COLUMN public.purchase_order_items.received_quantity IS 'Melacak jumlah yang sudah diterima untuk pengiriman parsial.';


-- 4. Tambahkan Indeks untuk Performa
CREATE INDEX IF NOT EXISTS idx_purchase_orders_organization_id ON public.purchase_orders(organization_id);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_supplier_id ON public.purchase_orders(supplier_id);
CREATE INDEX IF NOT EXISTS idx_purchase_order_items_purchase_order_id ON public.purchase_order_items(purchase_order_id);
