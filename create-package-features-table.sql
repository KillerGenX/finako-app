-- =====================================================
-- FINAKO POS: Package Features Table Creation Script
-- =====================================================
-- This script creates the package_features table and populates it with
-- the 3-tier SaaS pricing features (Basic/Pro/Enterprise)
-- 
-- PLAN SUMMARY:
-- - Basic Plan (Rp 49.000/bulan): 12 features
-- - Pro Plan (Rp 99.000/bulan): 26 features (includes all Basic)
-- - Enterprise Plan (Rp 249.000/bulan): 41 features (includes all Pro)
-- =====================================================

-- Create package_features table
CREATE TABLE IF NOT EXISTS package_features (
    id BIGSERIAL PRIMARY KEY,
    feature_id VARCHAR(50) NOT NULL UNIQUE,
    feature_name VARCHAR(100) NOT NULL,
    feature_description TEXT,
    feature_category VARCHAR(50) NOT NULL,
    basic_plan BOOLEAN DEFAULT FALSE,
    pro_plan BOOLEAN DEFAULT FALSE,
    enterprise_plan BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_package_features_feature_id ON package_features(feature_id);
CREATE INDEX IF NOT EXISTS idx_package_features_plans ON package_features(basic_plan, pro_plan, enterprise_plan);
CREATE INDEX IF NOT EXISTS idx_package_features_category ON package_features(feature_category);

-- Enable RLS (Row Level Security)
ALTER TABLE package_features ENABLE ROW LEVEL SECURITY;

-- Create RLS policy (readable by all authenticated users)
CREATE POLICY "Allow read access to package features" ON package_features
    FOR SELECT USING (auth.role() = 'authenticated');

-- Create RLS policy for service role (full access)
CREATE POLICY "Allow full access for service role" ON package_features
    FOR ALL USING (auth.role() = 'service_role');

-- =====================================================
-- INSERT PACKAGE FEATURES DATA
-- =====================================================

-- Clear existing data (if any)
TRUNCATE TABLE package_features;

-- =====================================================
-- BASIC PLAN FEATURES (12 features)
-- Available in: Basic, Pro, Enterprise
-- =====================================================

INSERT INTO package_features (feature_id, feature_name, feature_description, feature_category, basic_plan, pro_plan, enterprise_plan) VALUES
('pos', 'Kasir (Point of Sale)', 'Sistem kasir utama untuk transaksi penjualan', 'core', true, true, true),
('customer_data', 'Data Pelanggan', 'Manajemen data pelanggan basic', 'customer', true, true, true),
('expenses', 'Biaya Operasional', 'Pencatatan pengeluaran bisnis', 'finance', true, true, true),
('kategori_biaya', 'Kategori Biaya', 'Pengelompokan jenis pengeluaran', 'finance', true, true, true),
('stock_management', 'Manajemen Stok', 'Pengelolaan inventory dasar', 'inventory', true, true, true),
('product_category', 'Kategori Produk', 'Pengelompokan produk', 'inventory', true, true, true),
('employee_attendance', 'Absensi Pegawai', 'Pencatatan kehadiran karyawan', 'hr', true, true, true),
('multi_payment', 'Multi-Metode Bayar', 'Pembayaran dengan berbagai metode', 'payment', true, true, true),
('service_charge', 'Biaya Layanan', 'Pengelolaan biaya layanan tambahan', 'payment', true, true, true),
('tax_ppn', 'Pajak PPN', 'Pengelolaan pajak pertambahan nilai', 'finance', true, true, true),
('custom_receipt', 'Custom Receipt', 'Kustomisasi struk pembayaran', 'receipt', true, true, true),
('sales_history', 'Riwayat Penjualan', 'History transaksi penjualan', 'sales', true, true, true);

-- =====================================================
-- PRO PLAN ADDITIONAL FEATURES (14 new features)
-- Available in: Pro, Enterprise
-- =====================================================

INSERT INTO package_features (feature_id, feature_name, feature_description, feature_category, basic_plan, pro_plan, enterprise_plan) VALUES
-- Marketing & Promotions
('discount_per_item', 'Diskon per Item', 'Diskon khusus untuk item tertentu', 'marketing', false, true, true),
('discount_per_trx', 'Diskon per Transaksi', 'Diskon untuk total transaksi', 'marketing', false, true, true),
('promo_management', 'Manajemen Promosi', 'Pengelolaan kampanye marketing', 'marketing', false, true, true),
('customer_loyalty', 'Program Loyalitas', 'Program loyalitas pelanggan basic', 'customer', false, true, true),

-- Inventory & Operations
('stock_adjustment', 'Penyesuaian Stok', 'Adjust stock manual oleh admin', 'inventory', false, true, true),
('stock_alert', 'Alert Stok', 'Notifikasi stok menipis', 'inventory', false, true, true),
('inventory_audit', 'Audit Inventory', 'Audit trail pergerakan stok', 'inventory', false, true, true),
('product_variant', 'Varian Produk', 'Manajemen varian produk', 'inventory', false, true, true),
('return_refund', 'Return & Refund', 'Pengembalian dan refund', 'sales', false, true, true),

-- Staff Management
('employee_management', 'Kelola Pegawai', 'Manajemen karyawan lanjutan', 'hr', false, true, true),
('shift_management', 'Manajemen Shift', 'Pengaturan shift kerja', 'hr', false, true, true),
('cash_drawer', 'Cash Drawer Management', 'Pengelolaan kas', 'finance', false, true, true),

-- Suppliers & Purchasing
('supplier_management', 'Manajemen Supplier', 'Pengelolaan vendor/supplier', 'procurement', false, true, true),
('purchase_orders', 'Purchase Orders', 'Workflow pembelian barang', 'procurement', false, true, true);

-- =====================================================
-- ENTERPRISE PLAN ADDITIONAL FEATURES (15 new features)
-- Available in: Enterprise only
-- =====================================================

INSERT INTO package_features (feature_id, feature_name, feature_description, feature_category, basic_plan, pro_plan, enterprise_plan) VALUES
-- Advanced Analytics & BI
('advanced_dashboard', 'Dashboard Lanjutan', 'Dashboard dengan metrics advanced', 'analytics', false, false, true),
('reports', 'Laporan Lanjutan', 'Laporan bisnis komprehensif', 'analytics', false, false, true),
('bep', 'Analisis BEP', 'Break-even Point analysis', 'analytics', false, false, true),
('sales_target', 'Target Penjualan', 'Goal tracking dan KPI', 'analytics', false, false, true),
('export_data', 'Export Data', 'Export data ke berbagai format', 'analytics', false, false, true),

-- Multi-location & Scale
('multi_outlet', 'Multi Outlet', 'Manajemen multi cabang', 'operations', false, false, true),
('outlet_report', 'Laporan Outlet', 'Laporan per cabang', 'operations', false, false, true),
('outlet_switching', 'Switching Outlet', 'Berpindah antar cabang', 'operations', false, false, true),
('multi_user', 'Multi User', 'Manajemen user lanjutan', 'operations', false, false, true),
('role_management', 'Role Management', 'Pengaturan role granular', 'operations', false, false, true),

-- Advanced Features
('loyalty_points', 'Program Poin Loyalitas', 'Sistem poin reward advanced', 'customer', false, false, true),
('customer_segment', 'Segmentasi Pelanggan', 'Analisis segmen customer', 'customer', false, false, true),
('recurring_expenses', 'Biaya Berulang', 'Manajemen biaya otomatis', 'finance', false, false, true),

-- Enterprise Services
('api_access', 'API Access', 'Akses API untuk integrasi', 'integration', false, false, true),
('cloud_backup', 'Cloud Backup', 'Backup otomatis advanced', 'service', false, false, true);

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Verify feature counts per plan
SELECT 
    'Basic Plan' as plan_name,
    COUNT(*) as feature_count
FROM package_features 
WHERE basic_plan = true

UNION ALL

SELECT 
    'Pro Plan' as plan_name,
    COUNT(*) as feature_count
FROM package_features 
WHERE pro_plan = true

UNION ALL

SELECT 
    'Enterprise Plan' as plan_name,
    COUNT(*) as feature_count
FROM package_features 
WHERE enterprise_plan = true;

-- View features by category and plan
SELECT 
    feature_category,
    COUNT(CASE WHEN basic_plan THEN 1 END) as basic_features,
    COUNT(CASE WHEN pro_plan THEN 1 END) as pro_features,
    COUNT(CASE WHEN enterprise_plan THEN 1 END) as enterprise_features
FROM package_features 
GROUP BY feature_category
ORDER BY feature_category;

-- List all features with their availability
SELECT 
    feature_id,
    feature_name,
    feature_category,
    CASE 
        WHEN basic_plan THEN 'Basic+'
        WHEN pro_plan THEN 'Pro+'
        WHEN enterprise_plan THEN 'Enterprise'
    END as available_from
FROM package_features 
ORDER BY 
    CASE 
        WHEN basic_plan THEN 1
        WHEN pro_plan THEN 2
        WHEN enterprise_plan THEN 3
    END,
    feature_category,
    feature_name;

-- =====================================================
-- HELPFUL QUERIES FOR APPLICATION USE
-- =====================================================

-- Get features for specific plan
/*
-- Basic Plan Features
SELECT feature_id, feature_name, feature_description 
FROM package_features 
WHERE basic_plan = true
ORDER BY feature_category, feature_name;

-- Pro Plan Features  
SELECT feature_id, feature_name, feature_description 
FROM package_features 
WHERE pro_plan = true
ORDER BY feature_category, feature_name;

-- Enterprise Plan Features
SELECT feature_id, feature_name, feature_description 
FROM package_features 
WHERE enterprise_plan = true
ORDER BY feature_category, feature_name;

-- Check if specific feature is available in plan
SELECT EXISTS(
    SELECT 1 FROM package_features 
    WHERE feature_id = 'supplier_management' 
    AND pro_plan = true
) as is_available;
*/

-- =====================================================
-- UPDATE TIMESTAMP TRIGGER
-- =====================================================

-- Create trigger function for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger
CREATE TRIGGER update_package_features_updated_at 
    BEFORE UPDATE ON package_features 
    FOR EACH ROW 
    EXECUTE PROCEDURE update_updated_at_column();

-- =====================================================
-- COMPLETION MESSAGE
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '✅ Package Features table created successfully!';
    RAISE NOTICE '📊 Features Summary:';
    RAISE NOTICE '   • Basic Plan: 12 features';
    RAISE NOTICE '   • Pro Plan: 26 features (includes all Basic)';
    RAISE NOTICE '   • Enterprise Plan: 41 features (includes all Pro)';
    RAISE NOTICE '🚀 Ready for Finako POS SaaS implementation!';
END $$;
