-- Supabase RPC Function: get_purchase_history
-- =================================================================
--
--  Tujuan: 
--  Mengambil riwayat pembelian lengkap untuk suatu product_variant,
--  termasuk tanggal, nomor PO, harga beli, dan nama pemasok.
--
--  Penggunaan:
--  Digunakan di modal 'Riwayat Harga' pada form pembuatan PO baru
--  untuk memberikan konteks dan membantu pengambilan keputusan harga.
--
--  Catatan:
--  - Mengembalikan array JSON, di mana setiap objek berisi detail
--    satu transaksi pembelian.
--  - Mengembalikan array kosong '[]' jika tidak ada riwayat.
--
-- =================================================================

CREATE OR REPLACE FUNCTION public.get_purchase_history(
    p_variant_id UUID,
    p_organization_id UUID
)
RETURNS JSONB
LANGUAGE sql
STABLE
AS $$
    SELECT 
        COALESCE(
            jsonb_agg(
                jsonb_build_object(
                    'order_date', po.order_date,
                    'po_number', po.po_number,
                    'unit_cost', poi.unit_cost,
                    'supplier_name', s.name
                ) ORDER BY po.order_date DESC
            ),
            '[]'::jsonb
        )
    FROM 
        public.purchase_order_items AS poi
    JOIN 
        public.purchase_orders AS po ON poi.purchase_order_id = po.id
    JOIN
        public.suppliers AS s ON po.supplier_id = s.id
    WHERE 
        poi.product_variant_id = p_variant_id
      AND 
        po.organization_id = p_organization_id
      AND 
        po.status IN ('ordered', 'partially_received', 'completed'); -- Hanya PO yang valid
$$;
