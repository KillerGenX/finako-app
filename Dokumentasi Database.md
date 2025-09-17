-- ========== PRASYARAT & EKSTENSI ==========
-- Pastikan ekstensi ini diaktifkan di database Anda.
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";


-- ========== DEFINISI TIPE DATA CUSTOM (ENUMs) ==========

-- Untuk Manajemen Pengguna
CREATE TYPE user_role AS ENUM ('admin', 'cashier', 'accountant', 'hr_manager', 'viewer');
CREATE TYPE invitation_status AS ENUM ('pending', 'accepted', 'expired');

-- Untuk Manajemen Langganan
CREATE TYPE billing_interval_enum AS ENUM ('month', 'year');
CREATE TYPE subscription_status_enum AS ENUM ('trialing', 'active', 'past_due', 'canceled', 'unpaid');

-- Untuk Produk & Inventaris
CREATE TYPE product_type_enum AS ENUM ('SINGLE', 'VARIANT', 'COMPOSITE', 'SERVICE');
CREATE TYPE inventory_tracking_enum AS ENUM ('none', 'by_quantity', 'by_serial_number');
CREATE TYPE stock_movement_type_enum AS ENUM ('sale', 'purchase_received', 'adjustment', 'transfer_out', 'transfer_in', 'composite_assembly', 'composite_consumption', 'return', 'initial_stock');

-- Untuk Transaksi & Pembayaran
CREATE TYPE transaction_status_enum AS ENUM ('draft', 'completed', 'voided', 'refunded');
CREATE TYPE payment_method_enum AS ENUM ('cash', 'qris', 'card_debit', 'card_credit', 'bank_transfer', 'other');

-- Untuk HR
CREATE TYPE employment_status_enum AS ENUM ('active', 'resigned', 'terminated');
CREATE TYPE contract_type_enum AS ENUM ('full_time', 'part_time', 'contract', 'intern');
CREATE TYPE loan_status_enum AS ENUM ('active', 'fully_paid', 'defaulted');
CREATE TYPE repayment_method_enum AS ENUM ('salary_deduction', 'manual_payment');


-- ========== MODUL I: FONDASI & MANAJEMEN PENGGUNA ==========

-- 1. Tabel Organisasi (Tenants)
CREATE TABLE public.organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID NOT NULL REFERENCES auth.users(id),
    name TEXT NOT NULL,
    address TEXT,
    phone_number TEXT,
    industry TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.organizations IS 'Represents a single business entity (tenant) in the system.';
COMMENT ON COLUMN public.organizations.id IS 'Unique identifier for the organization (tenant ID).';
COMMENT ON COLUMN public.organizations.owner_id IS 'The user who created/owns this organization.';

-- 2. Tabel Profil Pengguna
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    avatar_url TEXT,
    phone_number TEXT,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.profiles IS 'Stores user-specific public data, extending the auth.users table.';

-- 3. Tabel Keanggotaan Organisasi
CREATE TABLE public.organization_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    role user_role NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT unique_user_organization UNIQUE (user_id, organization_id)
);
COMMENT ON TABLE public.organization_members IS 'Links users to organizations and defines their roles.';

-- 4. Tabel Undangan
CREATE TABLE public.invitations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    role user_role NOT NULL,
    token TEXT NOT NULL UNIQUE,
    status invitation_status NOT NULL DEFAULT 'pending',
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.invitations IS 'Manages invitations for users to join an organization.';


-- ========== MODUL II: MANAJEMEN LANGGANAN (SaaS) ==========

-- 1. Tabel Paket Langganan
CREATE TABLE public.subscription_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    price NUMERIC(12, 2) NOT NULL,
    billing_interval billing_interval_enum NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    payment_gateway_price_id TEXT UNIQUE
);
COMMENT ON TABLE public.subscription_plans IS 'Catalog of subscription plans offered by Finako.';

-- 2. Tabel Langganan Aktif
CREATE TABLE public.subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL UNIQUE REFERENCES public.organizations(id) ON DELETE CASCADE,
    plan_id UUID NOT NULL REFERENCES public.subscription_plans(id),
    status subscription_status_enum NOT NULL,
    current_period_start TIMESTAMPTZ NOT NULL,
    current_period_end TIMESTAMPTZ NOT NULL,
    trial_ends_at TIMESTAMPTZ,
    payment_gateway_subscription_id TEXT UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.subscriptions IS 'Active subscription contract for each organization.';

-- 3. Tabel Fitur Paket
CREATE TABLE public.plan_features (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    plan_id UUID NOT NULL REFERENCES public.subscription_plans(id) ON DELETE CASCADE,
    feature_key TEXT NOT NULL,
    value TEXT NOT NULL,
    CONSTRAINT unique_plan_feature UNIQUE (plan_id, feature_key)
);
COMMENT ON TABLE public.plan_features IS 'Defines limits and entitlements for each subscription plan.';


-- ========== MODUL III: STRUKTUR BISNIS & LOKASI ==========

-- 1. Tabel Outlet/Lokasi
CREATE TABLE public.outlets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    address TEXT,
    phone_number TEXT,
    location_types TEXT[] NOT NULL,
    latitude NUMERIC(10, 7),
    longitude NUMERIC(10, 7),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.outlets IS 'Stores all physical locations (stores, warehouses) for an organization.';


-- ========== MODUL VIII: TABEL PENDUKUNG & KONFIGURASI (dibuat lebih awal karena menjadi dependensi) ==========

-- 1. Satuan Ukur
CREATE TABLE public.units_of_measure (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    abbreviation TEXT NOT NULL,
    CONSTRAINT unique_uom_name_org UNIQUE (organization_id, name),
    CONSTRAINT unique_uom_abbr_org UNIQUE (organization_id, abbreviation)
);
COMMENT ON TABLE public.units_of_measure IS 'Defines units of measure (pcs, kg, liter).';

-- 2. Kategori Produk
CREATE TABLE public.product_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    parent_id UUID REFERENCES public.product_categories(id) ON DELETE SET NULL,
    description TEXT
);
COMMENT ON TABLE public.product_categories IS 'Hierarchical product categories.';

-- 3. Merek Produk
CREATE TABLE public.brands (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    CONSTRAINT unique_brand_name_org UNIQUE (organization_id, name)
);
COMMENT ON TABLE public.brands IS 'List of product brands.';

-- 4. Tarif Pajak
CREATE TABLE public.tax_rates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    rate NUMERIC(5, 2) NOT NULL,
    is_inclusive BOOLEAN NOT NULL DEFAULT false,
    is_active BOOLEAN NOT NULL DEFAULT true
);
COMMENT ON TABLE public.tax_rates IS 'Defines tax rates (e.g., PPN 11%).';

-- 5. Pelanggan
CREATE TABLE public.customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    phone_number TEXT,
    email TEXT,
    address TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.customers IS 'Customer Relationship Management (CRM) table.';


-- ========== MODUL IV: PRODUK & INVENTARIS ==========

-- 1. Tabel Produk (Template)
CREATE TABLE public.products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    product_type product_type_enum NOT NULL,
    category_id UUID REFERENCES public.product_categories(id) ON DELETE SET NULL,
    brand_id UUID REFERENCES public.brands(id) ON DELETE SET NULL,
    image_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.products IS 'Product templates containing general information.';

-- 2. Pajak per Produk (Tabel Penghubung)
CREATE TABLE public.product_tax_rates (
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    tax_rate_id UUID NOT NULL REFERENCES public.tax_rates(id) ON DELETE CASCADE,
    PRIMARY KEY (product_id, tax_rate_id)
);
COMMENT ON TABLE public.product_tax_rates IS 'Links products to one or more tax rates.';

-- 3. Varian Produk (SKU)
CREATE TABLE public.product_variants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    sku TEXT,
    selling_price NUMERIC(12, 2) NOT NULL DEFAULT 0,
    cost_price NUMERIC(12, 2) NOT NULL DEFAULT 0,
    barcode TEXT,
    track_stock BOOLEAN NOT NULL DEFAULT true,
    inventory_tracking_method inventory_tracking_enum NOT NULL DEFAULT 'by_quantity',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT unique_sku_per_org UNIQUE (organization_id, sku)
);
COMMENT ON TABLE public.product_variants IS 'Specific, sellable SKUs with price and stock tracking.';

-- 4. Produk Komposit (Resep/BOM)
CREATE TABLE public.product_composites (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    parent_variant_id UUID NOT NULL REFERENCES public.product_variants(id) ON DELETE CASCADE,
    component_variant_id UUID NOT NULL REFERENCES public.product_variants(id) ON DELETE CASCADE,
    quantity NUMERIC(10, 4) NOT NULL,
    unit_of_measure_id UUID NOT NULL REFERENCES public.units_of_measure(id)
);
COMMENT ON TABLE public.product_composites IS 'Bill of Materials (BOM) for composite products.';

-- 5. Item Inventaris Bernomor Seri
CREATE TABLE public.serialized_inventory_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    product_variant_id UUID NOT NULL REFERENCES public.product_variants(id) ON DELETE CASCADE,
    outlet_id UUID REFERENCES public.outlets(id) ON DELETE SET NULL,
    serial_number TEXT NOT NULL,
    status TEXT NOT NULL, -- e.g., 'in_stock', 'sold', 'returned'
    acquired_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT unique_serial_per_variant UNIQUE (product_variant_id, serial_number)
);
COMMENT ON TABLE public.serialized_inventory_items IS 'Tracks individual units of products with serial numbers.';

-- 6. Level Stok (Snapshot)
CREATE TABLE public.inventory_stock_levels (
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    product_variant_id UUID NOT NULL REFERENCES public.product_variants(id) ON DELETE CASCADE,
    outlet_id UUID NOT NULL REFERENCES public.outlets(id) ON DELETE CASCADE,
    quantity_on_hand NUMERIC(10, 4) NOT NULL DEFAULT 0,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (product_variant_id, outlet_id)
);
COMMENT ON TABLE public.inventory_stock_levels IS 'Performance-optimized snapshot of current stock levels.';

-- 7. Pergerakan Stok (Ledger)
CREATE TABLE public.inventory_stock_movements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    product_variant_id UUID NOT NULL REFERENCES public.product_variants(id) ON DELETE CASCADE,
    outlet_id UUID NOT NULL REFERENCES public.outlets(id) ON DELETE CASCADE,
    quantity_change NUMERIC(10, 4) NOT NULL,
    movement_type stock_movement_type_enum NOT NULL,
    reference_id UUID,
    serialized_item_id UUID REFERENCES public.serialized_inventory_items(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.inventory_stock_movements IS 'Immutable ledger of all stock movements.';
COMMENT ON COLUMN public.inventory_stock_movements.reference_id IS 'ID of the source document (e.g., transaction_id, stock_adjustment_id).';

-- Buat Tipe ENUM baru untuk status transfer
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'stock_transfer_status') THEN
        CREATE TYPE public.stock_transfer_status AS ENUM ('draft', 'sent', 'received', 'cancelled');
    END IF;
END$$;


--  Buat Tabel Header (stock_transfers)
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


-- Buat Tabel Detail (stock_transfer_items)
CREATE TABLE IF NOT EXISTS public.stock_transfer_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    stock_transfer_id UUID NOT NULL REFERENCES public.stock_transfers(id) ON DELETE CASCADE,
    product_variant_id UUID NOT NULL REFERENCES public.product_variants(id),
    quantity NUMERIC(10, 4) NOT NULL
);
COMMENT ON TABLE public.stock_transfer_items IS 'Item-item produk yang termasuk dalam satu Surat Jalan.';


-- Tambahkan Indeks untuk Performa
CREATE INDEX IF NOT EXISTS idx_stock_transfers_organization_id ON public.stock_transfers(organization_id);
CREATE INDEX IF NOT EXISTS idx_stock_transfers_status ON public.stock_transfers(status);
CREATE INDEX IF NOT EXISTS idx_stock_transfer_items_stock_transfer_id ON public.stock_transfer_items(stock_transfer_id);

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


--  Buat Tipe ENUM baru untuk status PO
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'purchase_order_status') THEN
        CREATE TYPE public.purchase_order_status AS ENUM ('draft', 'ordered', 'partially_received', 'completed', 'cancelled');
    END IF;
END$$;


--  Buat Tabel Header (purchase_orders)
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


--  Buat Tabel Detail (purchase_order_items)
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


--  Tambahkan Indeks untuk Performa
CREATE INDEX IF NOT EXISTS idx_purchase_orders_organization_id ON public.purchase_orders(organization_id);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_supplier_id ON public.purchase_orders(supplier_id);
CREATE INDEX IF NOT EXISTS idx_purchase_order_items_purchase_order_id ON public.purchase_order_items(purchase_order_id);


--  Buat Tipe ENUM baru untuk status opname
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'stock_opname_status') THEN
        CREATE TYPE public.stock_opname_status AS ENUM ('counting', 'completed', 'cancelled');
    END IF;
END$$;


--  Buat Tabel Header (stock_opnames)
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


--  Buat Tabel Detail (stock_opname_items)
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


--  Tambahkan Indeks untuk Performa
CREATE INDEX IF NOT EXISTS idx_stock_opnames_organization_id ON public.stock_opnames(organization_id);
CREATE INDEX IF NOT EXISTS idx_stock_opname_items_stock_opname_id ON public.stock_opname_items(stock_opname_id);



-- ========== MODUL V: TRANSAKSI & PENJUALAN (POS) ==========

-- 1. Transaksi (Header)
CREATE TABLE public.transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    outlet_id UUID NOT NULL REFERENCES public.outlets(id) ON DELETE CASCADE,
    member_id UUID NOT NULL REFERENCES public.organization_members(id),
    customer_id UUID REFERENCES public.customers(id),
    transaction_number TEXT NOT NULL,
    status transaction_status_enum NOT NULL,
    subtotal NUMERIC(15, 2) NOT NULL DEFAULT 0,
    total_discount NUMERIC(15, 2) NOT NULL DEFAULT 0,
    total_tax NUMERIC(15, 2) NOT NULL DEFAULT 0,
    grand_total NUMERIC(15, 2) NOT NULL DEFAULT 0,
    notes TEXT,
    transaction_date TIMESTAMPTZ NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.transactions IS 'Header for each sales transaction (receipt).';

-- 2. Item Transaksi (Detail)
CREATE TABLE public.transaction_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transaction_id UUID NOT NULL REFERENCES public.transactions(id) ON DELETE CASCADE,
    product_variant_id UUID NOT NULL REFERENCES public.product_variants(id),
    quantity NUMERIC(10, 4) NOT NULL,
    unit_price NUMERIC(12, 2) NOT NULL, -- Frozen price at time of sale
    discount_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
    tax_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
    line_total NUMERIC(15, 2) NOT NULL,
    notes TEXT
);
COMMENT ON TABLE public.transaction_items IS 'Line items within a sales transaction.';

-- 3. Pembayaran
CREATE TABLE public.payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transaction_id UUID NOT NULL REFERENCES public.transactions(id) ON DELETE CASCADE,
    amount NUMERIC(15, 2) NOT NULL,
    payment_method payment_method_enum NOT NULL,
    reference_number TEXT,
    payment_date TIMESTAMPTZ NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.payments IS 'Records payment methods used for a transaction.';


-- ========== MODUL VI: AKUNTANSI ==========

-- 1. Tipe Akun (Statis)
CREATE TABLE public.account_types (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    normal_balance TEXT NOT NULL CHECK (normal_balance IN ('debit', 'credit'))
);
INSERT INTO public.account_types (name, normal_balance) VALUES
('Aset', 'debit'),
('Liabilitas', 'credit'),
('Ekuitas', 'credit'),
('Pendapatan', 'credit'),
('Beban', 'debit');

-- 2. Daftar Akun (Chart of Accounts)
CREATE TABLE public.chart_of_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    account_type_id INTEGER NOT NULL REFERENCES public.account_types(id),
    parent_id UUID REFERENCES public.chart_of_accounts(id),
    code TEXT,
    name TEXT NOT NULL,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    is_system_account BOOLEAN NOT NULL DEFAULT false
);
COMMENT ON TABLE public.chart_of_accounts IS 'Hierarchical chart of accounts for each organization.';

-- 3. Jurnal Akuntansi (Header)
CREATE TABLE public.accounting_journals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    journal_date DATE NOT NULL,
    description TEXT NOT NULL,
    is_system_generated BOOLEAN NOT NULL DEFAULT false,
    source_document TEXT, -- e.g., 'sales_transaction'
    source_document_id UUID
);
COMMENT ON TABLE public.accounting_journals IS 'Header for each double-entry accounting journal.';

-- 4. Entri Jurnal (Detail)
CREATE TABLE public.journal_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    journal_id UUID NOT NULL REFERENCES public.accounting_journals(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    account_id UUID NOT NULL REFERENCES public.chart_of_accounts(id),
    debit NUMERIC(15, 2) NOT NULL DEFAULT 0,
    credit NUMERIC(15, 2) NOT NULL DEFAULT 0,
    description TEXT,
    CONSTRAINT debit_or_credit CHECK ((debit > 0 AND credit = 0) OR (debit = 0 AND credit > 0) OR (debit = 0 AND credit = 0)),
    CONSTRAINT positive_values CHECK (debit >= 0 AND credit >= 0)
);
COMMENT ON TABLE public.journal_entries IS 'The individual debit/credit lines of a journal.';


-- ========== MODUL VII: MANAJEMEN SDM (HR) ==========

-- 1. Karyawan
CREATE TABLE public.employees (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    member_id UUID NOT NULL UNIQUE REFERENCES public.organization_members(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    employee_id_code TEXT,
    job_title TEXT,
    manager_id UUID REFERENCES public.employees(id),
    employment_status employment_status_enum NOT NULL DEFAULT 'active',
    contract_type contract_type_enum,
    join_date DATE NOT NULL,
    resignation_date DATE,
    base_salary NUMERIC(12, 2) NOT NULL DEFAULT 0,
    payment_frequency TEXT, -- e.g., 'monthly'
    bank_name TEXT,
    bank_account_number TEXT,
    bank_account_holder_name TEXT
);
COMMENT ON TABLE public.employees IS 'Core employee data for HR and payroll.';

-- 2. Absensi
CREATE TABLE public.attendances (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
    outlet_id UUID NOT NULL REFERENCES public.outlets(id),
    check_in_time TIMESTAMPTZ,
    check_in_photo_url TEXT,
    check_in_location POINT,
    check_out_time TIMESTAMPTZ,
    check_out_photo_url TEXT,
    check_out_location POINT,
    notes TEXT
);
COMMENT ON TABLE public.attendances IS 'Records employee clock-in and clock-out events.';

-- 3. Pinjaman Karyawan (Header)
CREATE TABLE public.employee_loans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
    loan_date DATE NOT NULL,
    principal_amount NUMERIC(12, 2) NOT NULL,
    reason TEXT,
    repayment_method repayment_method_enum NOT NULL DEFAULT 'salary_deduction',
    installment_count INTEGER NOT NULL DEFAULT 1,
    status loan_status_enum NOT NULL DEFAULT 'active'
);
COMMENT ON TABLE public.employee_loans IS 'Header for employee loan agreements.';

-- 4. Pembayaran Pinjaman (Detail)
CREATE TABLE public.loan_repayments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    loan_id UUID NOT NULL REFERENCES public.employee_loans(id) ON DELETE CASCADE,
    payment_date DATE NOT NULL,
    amount_paid NUMERIC(12, 2) NOT NULL,
    source_reference TEXT -- e.g., 'Payroll May 2024'
);
COMMENT ON TABLE public.loan_repayments IS 'Records repayments for employee loans.';


-- ========== INDEKS UNTUK OPTIMASI PERFORMA ==========

-- Indeks pada Foreign Keys untuk mempercepat JOIN
CREATE INDEX ON public.organizations (owner_id);
CREATE INDEX ON public.organization_members (user_id);
CREATE INDEX ON public.organization_members (organization_id);
CREATE INDEX ON public.outlets (organization_id);
CREATE INDEX ON public.products (organization_id);
CREATE INDEX ON public.product_variants (product_id);
CREATE INDEX ON public.transactions (organization_id, outlet_id);
CREATE INDEX ON public.transaction_items (transaction_id);
CREATE INDEX ON public.journal_entries (journal_id, account_id);
CREATE INDEX ON public.employees (member_id, organization_id);
CREATE INDEX ON public.attendances (employee_id);

-- Indeks pada kolom yang sering digunakan untuk pencarian
CREATE INDEX ON public.invitations (token);
CREATE INDEX ON public.product_variants (sku);


-- ========== PENGAKTIFAN ROW LEVEL SECURITY (RLS) ==========
-- Setelah tabel dibuat, aktifkan RLS untuk setiap tabel yang berisi data tenant.
-- Contoh untuk tabel 'outlets'. Anda harus melakukan ini untuk SEMUA tabel yang relevan.

-- ALTER TABLE public.outlets ENABLE ROW LEVEL SECURITY;

-- Anda kemudian akan membuat 'POLICY' untuk setiap tabel.
-- Contoh kebijakan (JANGAN dijalankan, hanya sebagai ilustrasi):
-- CREATE POLICY "Users can see outlets in their organization"
-- ON public.outlets FOR SELECT
-- USING (
--   organization_id = (
--     SELECT organization_id FROM public.organization_members
--     WHERE user_id = auth.uid()
--     LIMIT 1
--   )
-- );

-- ========== Tambahan Table untuk Subcription dan Billing ==========

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


-- Supabase User Notifications Table Setup for Finako App
-- =================================================================
--
--  Tujuan: 
--  Membuat tabel `user_notifications` untuk menyimpan notifikasi
--  yang akan ditampilkan kepada pengguna di dasbor mereka.
--
--  Instruksi: Jalankan skrip ini di SQL Editor Supabase Anda.
--
-- =================================================================

CREATE TABLE IF NOT EXISTS public.user_notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    link TEXT, -- Link opsional, misal ke halaman billing
    is_read BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tambahkan komentar untuk menjelaskan tujuan tabel
COMMENT ON TABLE public.user_notifications IS 'Menyimpan notifikasi individual untuk setiap pengguna.';

-- Tambahkan index untuk performa query
CREATE INDEX IF NOT EXISTS idx_user_notifications_user_id ON public.user_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_user_notifications_is_read ON public.user_notifications(is_read);

-- =================================================================
-- Akhir dari skrip.
-- =================================================================
